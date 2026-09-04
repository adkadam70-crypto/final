'use server'

import { db } from '@/lib/db'
import {
  universities,
  matches,
  programRankings,
  type MatchResult,
  type AcceptanceRateInfo,
} from '@/lib/db/schema'
import type { AcademicField } from '@/lib/academic-detail'
import { resolveAcceptanceRate, acceptanceRateForPrompt } from '@/lib/acceptance-rate'
import { inArray, and, eq, desc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { gradeTier, gradeBadge } from '@/lib/grade'
import { getUserId } from '@/lib/get-user-id'
import { getLatestProfile } from '@/app/actions/profile'
import { formatStandardizedTests, testScoreRangeComparison } from '@/lib/standardized-tests'
import { formatPriorGrades, EMPTY_PRIOR_GRADES } from '@/lib/prior-grades'
import OpenAI from 'openai'
import { zodTextFormat } from 'openai/helpers/zod'
import { BIAS_INSTRUCTION } from '@/lib/bias-instruction'
import { assertMatchRateLimit } from '@/lib/rate-limit'

// Caps how many universities go to the model per run. A single call for all
// 20 measured at ~45-65s live — real variance run to run, not a bug. This
// used to be split into 2 parallel half-size calls on the theory that two
// smaller calls beat one big one, but live A/B testing (2 timed runs at
// 46s/65s vs. a single call at 51s) showed no reliable win, just the same
// noisy range — while the single call is strictly cheaper (no duplicated
// system prompt/instructions across two requests) and simpler. 20 trades
// some breadth for real detail per school; sampling across selectivity bands
// (rather than truncating) keeps a representative spread from Safety through
// Ultra Reach regardless of size, and the UI already nudges re-running 2-3
// times to cover more of the catalog rather than shrinking this per run.
const MAX_CATALOG_FOR_AI = 20

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

// Splits the pool into selectivity bands and samples randomly from each one,
// instead of a deterministic evenly-spaced stride through the sorted list.
// A stride sample sorted ascending mathematically cannot reach the top
// handful of entries once the pool is bigger than `max` (this previously
// locked Harvard/MIT/Stanford/etc. out of every US result, since the top ~9
// most selective schools in a 183-row catalog fall past the last stride
// index) and, being fully deterministic, showed every student the exact
// same 20 schools. Banding guarantees every selectivity range — including
// the most selective one — is represented every run; shuffling within (and
// across any leftover) bands gives real variety between runs.
function stratifiedSample<T extends { baselineSelectivity: number }>(items: T[], max: number, bandCount = 4): T[] {
  if (items.length <= max) return items

  const sorted = [...items].sort((a, b) => a.baselineSelectivity - b.baselineSelectivity)

  // A wide top "band" can still span from merely-competitive to the most
  // selective handful of schools, so a plain 4-way band split only surfaces
  // an elite school (baselineSelectivity 95+) in ~2/3 of runs by luck of the
  // shuffle. Reserve 2 slots from a narrow top slice (~8% most selective) so
  // the most prestigious options are reliably in the running every run, not
  // just possible — the AI can still tier them Ultra Reach if the student
  // isn't competitive for them.
  const anchorPoolSize = Math.max(bandCount, Math.round(sorted.length * 0.08))
  const anchorPool = sorted.slice(-anchorPoolSize)
  const anchorPicks = shuffle(anchorPool).slice(0, Math.min(2, anchorPool.length, max))
  const anchorPickSet = new Set(anchorPicks)

  const rest = sorted.filter((u) => !anchorPickSet.has(u))
  const restMax = max - anchorPicks.length

  const bandSize = Math.ceil(rest.length / bandCount)
  const bands = Array.from({ length: bandCount }, (_, i) => rest.slice(i * bandSize, (i + 1) * bandSize)).filter(
    (band) => band.length > 0,
  )

  const perBand = Math.floor(restMax / bands.length)
  const remainder = restMax - perBand * bands.length

  const picked: T[] = [...anchorPicks]
  bands.forEach((band, i) => {
    const take = perBand + (i < remainder ? 1 : 0)
    picked.push(...shuffle(band).slice(0, Math.min(take, band.length)))
  })

  if (picked.length < max) {
    const pickedSet = new Set(picked)
    const leftovers = shuffle(sorted.filter((u) => !pickedSet.has(u)))
    picked.push(...leftovers.slice(0, max - picked.length))
  }

  return picked
}

// Prefers universities tagged with the student's intended field, without
// starving the pool for fields the catalog hasn't tagged well yet. Schools
// with an empty academicFields list (an older catalog batch predates this
// column — includes MIT, Harvard, Stanford) are treated as "not yet tagged",
// not "doesn't offer this field", so they stay eligible instead of being
// silently excluded from every field-filtered search.
//
// Deliberately high: a handful of famous/elite schools getting tagged for a
// field first (e.g. seeding real rankings for the 10 most selective CS
// programs) must NOT be enough to make the filter kick in on its own —
// that would collapse the candidate pool to only-reach schools for that
// field and hide every safety/target option, which is worse than the
// current no-filtering fallback. Filtering should only activate once a
// field has broad coverage across the selectivity range, not just its
// most decorated names.
const MIN_FIELD_MATCHED_POOL = 30
function preferIntendedField<T extends { academicFields: string[] }>(catalog: T[], intendedField: string): T[] {
  if (intendedField === 'No preference') return catalog
  const matched = catalog.filter((u) => u.academicFields.length === 0 || u.academicFields.includes(intendedField))
  return matched.length >= MIN_FIELD_MATCHED_POOL ? matched : catalog
}

function rankThresholdFor(preferredRank: string): number | undefined {
  return { 'Top 50': 50, 'Top 100': 100, 'Top 200': 200 }[preferredRank]
}

const resultSchema = z.object({
  summary: z
    .string()
    .describe(
      'A 1-2 sentence, encouraging but honest overview of the student list strength.',
    ),
  results: z.array(
    z.object({
      universityId: z.union([z.string(), z.number()]).describe('The id of the university from the provided list.'),
      matchTier: z.enum(['Safety', 'Good Chance', 'Reach', 'Ultra Reach']),
      acceptanceProbability: z
        .number()
        .min(1)
        .max(99)
        .describe('Estimated probability (%) this student is admitted.'),
      earlyDecisionProbability: z
        .number()
        .min(1)
        .max(99)
        .nullable()
        .describe(
          'Only set when this school has a real earlyDecisionRate on file below — this student\'s estimated chance if applying binding Early Decision to this specific school. Null if the school has no real ED rate on file; never invent one.',
        ),
      earlyActionProbability: z
        .number()
        .min(1)
        .max(99)
        .nullable()
        .describe(
          'Only set when this school has a real earlyActionRate on file below — this student\'s estimated chance if applying non-binding Early Action to this specific school. Null if no real EA rate is on file; never invent one.',
        ),
      rationale: z
        .string()
        .describe('Under 20 words explaining the tier and probability for this student.'),
      improvementTips: z
        .array(z.string())
        .max(2)
        .describe('Exactly 2 short, specific actions the student could take to strengthen their odds at this particular school.'),
    }),
  ),
})

/**
 * Calls OpenAI (gpt-5.6-terra) to generate university match assessments.
 * Queries database for student profiles and finds best-matching colleges.
 */
async function generateOpenAIMatch({
  studentProfile,
  catalog,
  targetCountries,
  contextByCountry,
}: {
  studentProfile: {
    badge: string
    tier: number
    standardizedTests: string
    priorGrades: string
    preferredClimate: string
    preferredSector: string
    preferredRank: string
    intendedField: string
    extracurriculars: string[]
  }
  catalog: Array<{
    universityId: string | number
    name: string
    country: string
    baselineSelectivity: number
    sectors: string[]
    climate: string
    academicFields: string[]
    requirements: string[]
    programRank: { rankValue: number | null; rankSource: string; programSelectivity: number; additionalRequirements: string[] } | null
    overallRank: { rankValue: number; rankSource: string } | null
    acceptanceRate: AcceptanceRateInfo
    earlyAdmission: { ed: number | null; ea: number | null; rd: number | null; source: string } | null
    testScoreFit: string
  }>
  targetCountries: string[]
  contextByCountry: Record<string, string>
}): Promise<{ object: z.infer<typeof resultSchema> }> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set')
  }

  // Diagnostic: pinpoint any character that can't go in an HTTP header
  // (valid ByteString range is 0-255), rather than let the SDK's fetch
  // call fail with only an index number and no context.
  for (let i = 0; i < apiKey.length; i++) {
    const code = apiKey.charCodeAt(i)
    if (code > 255) {
      const before = apiKey.slice(Math.max(0, i - 6), i)
      const after = apiKey.slice(i + 1, i + 7)
      throw new Error(
        `OPENAI_API_KEY has an invalid character at position ${i} (code ${code}, key length ${apiKey.length}). Context: "${before}[BAD]${after}"`,
      )
    }
  }

  const client = new OpenAI({ apiKey })

  const admissionsContextBlock = targetCountries
    .map((c) => `- ${c}: ${contextByCountry[c] ?? 'Standard competitive admissions environment.'}`)
    .join('\n')

  const userPrompt = `You are an expert college admissions analyst. Assess this student against the provided universities and assign match tiers.

${BIAS_INSTRUCTION}

ADMISSIONS CONTEXT (per country — each university below is tagged with its own country, weigh it against the matching context here):
${admissionsContextBlock}

STUDENT PROFILE:
- Normalized academics: ${studentProfile.badge} (internal academic tier ${studentProfile.tier}/4, higher is stronger)
- Standardized tests: ${studentProfile.standardizedTests}
- Earlier grades (9th-11th, optional context): ${studentProfile.priorGrades}
- Preferred climate: ${studentProfile.preferredClimate}
- Preferred industry hub: ${studentProfile.preferredSector}
- Preferred university ranking: ${studentProfile.preferredRank} (soft preference — weigh it alongside fit, don't treat it as a hard filter)
- Intended field of study: ${studentProfile.intendedField}
- Extracurriculars: ${studentProfile.extracurriculars.length ? studentProfile.extracurriculars.join('; ') : 'None provided'}

TIER DEFINITIONS:
- Safety: student clearly exceeds the bar (prob ~75-95%).
- Good Chance: student is competitive/on par (prob ~45-70%).
- Reach: student is below typical bar but plausible (prob ~15-40%).
- Ultra Reach: extremely selective, long odds (prob ~3-15%).

UNIVERSITIES TO ASSESS:
${JSON.stringify(
  catalog.map((u) => ({
    universityId: u.universityId,
    name: u.name,
    country: u.country,
    baselineSelectivity: u.baselineSelectivity,
    sectors: u.sectors,
    climate: u.climate,
    academicFields: u.academicFields.length ? u.academicFields : ['not yet tagged — assume it offers common programs'],
    admissionRequirements: u.requirements.length ? u.requirements : ['none on file'],
    programRankingForIntendedField: u.programRank
      ? `Ranked #${u.programRank.rankValue ?? '?'} nationally per ${u.programRank.rankSource} — program-specific selectivity ${u.programRank.programSelectivity}/100`
      : 'No verified program-specific ranking on file.',
    programSpecificAdditionalRequirements: u.programRank
      ? u.programRank.additionalRequirements.length
        ? u.programRank.additionalRequirements
        : 'None on file beyond admissionRequirements above.'
      : 'No verified program-specific data on file — nothing to add beyond admissionRequirements above.',
    overallAcceptanceRate: acceptanceRateForPrompt(u.acceptanceRate),
    overallRanking: u.overallRank
      ? `Ranked #${u.overallRank.rankValue} overall per ${u.overallRank.rankSource}`
      : 'No verified overall ranking on file.',
    earlyDecisionRate: u.earlyAdmission?.ed != null
      ? `${u.earlyAdmission.ed}% — a REAL published Early Decision (binding) admit rate, per ${u.earlyAdmission.source}.`
      : 'Not on file — either this school has no binding ED program, or we have no real rate for it. Never invent one.',
    earlyActionRate: u.earlyAdmission?.ea != null
      ? `${u.earlyAdmission.ea}% — a REAL published Early Action (non-binding) admit rate, per ${u.earlyAdmission.source}.`
      : 'Not on file — either this school has no EA program, or we have no real rate for it. Never invent one.',
    regularDecisionRate: u.earlyAdmission?.rd != null
      ? `${u.earlyAdmission.rd}% — a REAL published Regular-Decision-only admit rate, per ${u.earlyAdmission.source}. More precise than overallAcceptanceRate for a typical (non-early) applicant, since a blended headline rate can fold in a much easier early pool.`
      : 'Not on file.',
    testScoreFit: u.testScoreFit,
  })),
  null,
  2,
)}

When a school's academicFields includes the student's intended field of study, treat that as a genuine positive fit signal in your rationale — not just an admission-probability input. When it's "not yet tagged," don't penalize the school for it; assess it on selectivity and the other signals instead.

IMPORTANT — acceptanceProbability reflects admission to the UNIVERSITY, never to a specific program. Most schools admit students holistically to the institution as a whole (major is a soft signal, sometimes declared a year or two later); this app has no verified data on which specific schools instead admit directly by college/major with a genuinely separate, harder process (a real phenomenon at a handful of schools, but not something to assume by default). So: ground acceptanceProbability using this priority order, falling through only when the higher one is unavailable: (1) regularDecisionRate, if present — the most realistic baseline for a typical non-early applicant, since it strips out any early-round effect the blended headline can't separate; (2) overallAcceptanceRate when it is a REAL published figure — cite it directly and with full confidence (e.g. "the actual acceptance rate is 12%"); (3) overallAcceptanceRate when it is marked OUR RESEARCH ESTIMATE — you may use the number to place the school, but in the rationale you MUST call it an estimate (e.g. "we estimate roughly 25% — not a figure the university publishes"), never state it as fact; (4) overallRanking, if present — a general prestige ranking, cite it plainly (e.g. "ranked #28 overall") but don't treat it as equivalent to a real acceptance rate; (5) baselineSelectivity alone — an internal estimate with no citation behind it. When overallAcceptanceRate says NO published or estimable rate exists (e.g. a Numerus Clausus system or a non-selective licence), do not invent a percentage — explain selectivity through ranking, requirements and baselineSelectivity, and it is fine to tell the student plainly that this school has no published acceptance rate. Never present tiers 3-5 with the confidence of tiers 1-2 in your rationale text. Note: whenever overallAcceptanceRate is present — a real published figure OR our research estimate — baselineSelectivity was already derived from it (100 minus the rate); they are the same fact, not two independent signals to stack. NEVER use programRankingForIntendedField to move acceptanceProbability up or down.

When regularDecisionRate is present AND meaningfully different from a real overallAcceptanceRate (this happens at schools that lean heavily on binding Early Decision, e.g. a school publishing a ~5% blended rate that's actually ~43% ED and ~4% regular), say so plainly and specifically in the rationale — e.g. "published rate is 5%, but that blends in a large Early Decision pool; as a Regular Decision applicant, ~4% is the more realistic baseline." This is about being transparent with the student, not about penalizing the school — state it as a neutral fact.

Separately, compute earlyDecisionProbability and earlyActionProbability: these are this student's estimated personal chance if they applied through that specific binding-ED or non-binding-EA round instead, computed the same way as acceptanceProbability but grounded in earlyDecisionRate/earlyActionRate respectively. Only set a value when that real rate is present in the data above — leave it null when a school has no such program or no real rate on file, exactly like every other estimate in this app. Never infer or guess an early-round number from the regular one.

programRankingForIntendedField, when present, is a quality/fit fact only — mention it in the rationale as context on how strong that specific program is (e.g. "and its Business program is separately ranked #4 nationally"), but it must not change the probability number itself.

testScoreFit, when it contains a real comparison (not "Not on file" or "not directly comparable"), is one additional input among all the others above — weigh it alongside baselineSelectivity/acceptance-rate/rank the way you already weigh those, never as a standalone hard cutoff. A score below the school's 25th percentile should pull acceptanceProbability down somewhat and a score above the 75th percentile should lift it somewhat, but the direction and size of that adjustment must stay proportionate to how strong the other signals are — a below-range score at a school where the student is otherwise an excellent fit is a real negative, not a disqualifier. When the score falls WITHIN the 25th-75th range, don't treat every in-range score as identical: testScoreFit reports the student's approximate percentile position inside that range (e.g. "roughly the 30th percentile position" vs "roughly the 70th") — a position near the low end of the range is a mild negative relative to the typical admit, a position near the high end is a mild positive, and the middle of the range is neutral. Keep these in-range adjustments small; they should never swing the tier on their own.

The student's "preferred university ranking" in their profile (e.g. "Top 50") is a real threshold to check against overallRanking's rank if present (not the program rank, for the same reason as above — the preference is about the university). If a school's verified overall rank falls outside the student's stated preference, say so plainly in the rationale (e.g. "ranked #78 overall, outside your Top 50 preference") — don't silently ignore the mismatch, but also don't use it to zero out an otherwise-good match, since it's explicitly a soft preference. When no overall rank exists for a school, there's nothing concrete to compare against the preference — don't guess whether it would qualify.

Cross-reference admissionRequirements against the student's actual profile above (standardized tests, curriculum/grades, extracurriculars) for every school. If a school lists a specific required credential, test, or exam that isn't reflected anywhere in the student's profile (e.g. a school-specific entrance exam, a portfolio, an interview, a specific test the student hasn't reported a score for), that is exactly the kind of concrete, specific improvementTip to surface — name the missing requirement directly and say plainly that it's likely holding down this student's odds at this specific school precisely because it's a stated requirement they haven't demonstrated. Don't invent requirements that aren't listed, and don't flag a requirement the student's profile already satisfies.

Do the same cross-reference for programSpecificAdditionalRequirements, when it's a real list rather than "None on file...": these are requirements for the student's own intended field/program specifically — on top of, not instead of, admissionRequirements above (e.g. a supplemental essay, a portfolio, or a specific score a particular school of engineering or business requires beyond what the university asks of everyone). If one of these isn't reflected in the student's profile, flag it the same way — name it directly, and note it's specific to this student's intended program at this school, not a school-wide requirement. Like programRankingForIntendedField, this is fit/preparedness context only — never use it to move acceptanceProbability itself.

Assess every university in the list above and return one result per university, including exactly 2 specific improvementTips per school. Keep rationale and tips terse — brevity over completeness.`

  let response
  try {
    response = await client.responses.parse({
      model: 'gpt-5.6-terra',
      input: [{ role: 'user', content: userPrompt }],
      text: {
        format: zodTextFormat(resultSchema, 'match_results'),
      },
    })
  } catch (err) {
    // Server Actions must throw plain, serializable Errors — the OpenAI SDK's
    // error classes carry extra non-serializable fields that fail silently
    // in production (surfaces as an opaque React error #441).
    const message = err instanceof Error ? err.message : 'OpenAI request failed'
    throw new Error(`OpenAI request failed: ${message}`)
  }

  if (!response.output_parsed) {
    throw new Error('OpenAI returned no parseable output for the match request')
  }

  return { object: response.output_parsed }
}

/**
 * Runs AI matching against the user's most recently saved profile — pulled
 * server-side rather than trusted from the client. Persists the run and
 * returns the enriched results.
 */
export async function runMatch(): Promise<
  | { needsProfile: true }
  | { needsProfile?: false; gradeBadge: string; summary: string; results: MatchResult[] }
> {
  const userId = await getUserId()
  await assertMatchRateLimit(userId)
  const profile = await getLatestProfile()
  if (!profile || !profile.academicDetail || profile.targetCountries.length === 0) {
    return { needsProfile: true }
  }

  try {
    const catalog = await db
      .select()
      .from(universities)
      .where(inArray(universities.country, profile.targetCountries))

    const badge = gradeBadge(profile.academicDetail)
    const tier = gradeTier(profile.gradeValue)

    if (catalog.length === 0) {
      return { gradeBadge: badge, summary: 'No universities in the catalog for these countries yet.', results: [] }
    }

    const contextByCountry: Record<string, string> = {
      US: 'US universities weigh academics ~50% and holistic factors (essays, leadership, passion projects) ~50%.',
      UK: 'UK universities weigh subject mastery and course-relevant depth heavily (~85%).',
      AU: 'Australia admits almost entirely on academic cutoff thresholds / ATAR equivalents (~100%). Extracurriculars barely matter.',
      SG: 'Singapore weighs strong academics first, with essays and interviews as secondary factors.',
      HK: 'Hong Kong weighs strong academics and interviews, with some holistic review.',
      IN: 'Holistic Indian universities blend board marks with essays and interviews; IITs are purely exam-driven.',
      DE: 'Germany admits almost purely on the final secondary-school GPA (Abitur equivalent). Numerus Clausus subjects have a GPA cutoff; open-admission subjects only require meeting the entry bar. Extracurriculars and essays carry essentially no weight (~100% academic).',
      FR: 'France has two tracks. Public-university licence programs are essentially non-selective (meeting the Baccalauréat-equivalent bar is enough, outside oversubscribed fields). Grandes écoles and selective programs (~90% academic) weigh high-school grades and concours/exam performance, with the motivation letter a secondary factor.',
    }

    // Verified program-specific rankings for the student's intended field,
    // across the WHOLE country catalog (not just the AI batch) — needed
    // upfront now because a "Top 50" rank preference has to filter the pool
    // by real rank numbers before sampling, not just describe it to the AI
    // afterward. Absence means "not yet researched," never "unranked".
    const programRankByUniversityId = new Map<number, { rankValue: number | null; rankSource: string; programSelectivity: number; additionalRequirements: string[] }>()
    if (profile.intendedField !== 'No preference') {
      const rankRows = await db
        .select()
        .from(programRankings)
        .where(
          and(
            inArray(programRankings.universityId, catalog.map((u) => u.id)),
            eq(programRankings.field, profile.intendedField),
          ),
        )
      for (const row of rankRows) {
        programRankByUniversityId.set(row.universityId, {
          rankValue: row.rankValue,
          rankSource: row.rankSource,
          programSelectivity: row.programSelectivity,
          additionalRequirements: row.additionalRequirements,
        })
      }
    }

    // A rank preference ("Top 50") is a real, hard cutoff on the candidate
    // pool, built in two tiers so the pool saturates with on-topic results
    // rather than getting padded with irrelevant ones: real program-specific
    // rank within the threshold first (a school ranked #85 overall but #20
    // in Business still belongs in a "Top 50" Business search), then a real
    // general rank within the threshold as fill — but only for schools that
    // actually offer the intended field, so a top-ranked school that
    // doesn't teach Business can't dilute a Business-intent search. Falls
    // back to the softer academicFields-tag preference (the pre-existing
    // behavior) when no rank preference is set, since most of the catalog
    // has no verified rank number at all yet to filter on.

    let fieldPool: typeof catalog
    let rankFilterFellBack = false
    const rankThreshold = rankThresholdFor(profile.preferredRank)
    const hasFieldPreference = profile.intendedField !== 'No preference'
    if (rankThreshold) {
      // Priority 1: a verified program-specific rank for the student's
      // intended field within the threshold — built from our own
      // researched program rankings (e.g. US News Business rankings),
      // the most on-topic, most saturating pool for a field+rank search.
      const programRankedIds = new Set<number>()
      const programRanked = catalog.filter((u) => {
        const programRank = programRankByUniversityId.get(u.id)
        const ok = programRank?.rankValue != null && programRank.rankValue <= rankThreshold
        if (ok) programRankedIds.add(u.id)
        return ok
      })
      // Priority 2 (fill only): no verified program rank, but a real
      // GENERAL rank within the threshold — never a synthetic/inferred
      // one, since a made-up ordinal position could satisfy the
      // threshold while the school's actual displayed rank sits well
      // outside it (this is what let a #158 school through a "Top 100"
      // search before). Still gated on the field tag when the student
      // has a field preference, so this fallback can't pad results with
      // top-ranked schools that don't even offer the intended field.
      const generalRankedInField = catalog.filter((u) => {
        if (programRankedIds.has(u.id)) return false
        if (u.rankValue == null || u.rankValue > rankThreshold) return false
        return !hasFieldPreference || u.academicFields.includes(profile.intendedField as AcademicField)
      })
      const rankFiltered = [...programRanked, ...generalRankedInField]
      // No verified rank data at all for these countries/fields yet — an
      // empty result here means "we don't know," not "nothing qualifies."
      // Fall back rather than showing the student zero schools.
      if (rankFiltered.length > 0) {
        fieldPool = rankFiltered
      } else {
        fieldPool = preferIntendedField(catalog, profile.intendedField)
        rankFilterFellBack = true
      }
    } else {
      fieldPool = preferIntendedField(catalog, profile.intendedField)
    }

    // Random banding already gives run-to-run variety by chance, but two
    // back-to-back "re-run match" clicks can still land on an overlapping
    // set. Exclude whatever this same user's most recent run showed them, so
    // a deliberate "show me something different" click reliably delivers
    // one — but only when there's still a healthy pool left afterward, so a
    // small country catalog doesn't get starved down to nothing.
    const [previousRun] = await db
      .select({ results: matches.results })
      .from(matches)
      .where(eq(matches.userId, userId))
      .orderBy(desc(matches.createdAt))
      .limit(1)
    const previouslyShownIds = new Set((previousRun?.results ?? []).map((r) => r.universityId))
    const freshPool = fieldPool.filter((u) => !previouslyShownIds.has(String(u.id)))
    const samplingPool = freshPool.length >= MAX_CATALOG_FOR_AI ? freshPool : fieldPool

    const catalogForAI = stratifiedSample(samplingPool, MAX_CATALOG_FOR_AI)

    const studentProfile = {
      badge,
      tier,
      standardizedTests: formatStandardizedTests(profile.standardizedTests),
      priorGrades: formatPriorGrades(profile.priorGrades ?? EMPTY_PRIOR_GRADES),
      preferredClimate: profile.preferredClimate,
      preferredSector: profile.preferredSector,
      preferredRank: profile.preferredRank,
      intendedField: profile.intendedField,
      extracurriculars: profile.extracurriculars,
    }

    const { object } = await generateOpenAIMatch({
      studentProfile,
      catalog: catalogForAI.map((u) => ({
        universityId: u.id,
        name: u.name,
        country: u.country,
        baselineSelectivity: u.baselineSelectivity,
        sectors: u.sectors,
        climate: u.climate,
        academicFields: u.academicFields,
        requirements: u.requirements,
        programRank: programRankByUniversityId.get(u.id) ?? null,
        overallRank: u.rankValue != null && u.rankSource ? { rankValue: u.rankValue, rankSource: u.rankSource } : null,
        acceptanceRate: resolveAcceptanceRate(u),
        earlyAdmission: u.earlyAdmissionSource
          ? { ed: u.earlyDecisionRate, ea: u.earlyActionRate, rd: u.regularDecisionRate, source: u.earlyAdmissionSource }
          : null,
        testScoreFit: testScoreRangeComparison(profile.standardizedTests, u),
      })),
      targetCountries: profile.targetCountries,
      contextByCountry,
    })

    // Merge AI output back with DB records (source of truth for display fields).
    const byId = new Map(catalog.map((u) => [String(u.id), u]))
    const results: MatchResult[] = object.results
      .filter((r) => {
        const idStr = String(r.universityId)
        return byId.has(idStr)
      })
      .map((r) => {
        const idStr = String(r.universityId)
        const u = byId.get(idStr)!
        const programRank = programRankByUniversityId.get(u.id)
        // Both shown when both exist — see the type comment on
        // MatchResult.generalRankBadge for why hiding either one reads as a
        // contradiction under a rank-filtered search.
        const generalRankBadge: MatchResult['generalRankBadge'] =
          u.rankValue != null && u.rankSource ? { rankValue: u.rankValue, source: u.rankSource } : null
        const programRankBadge: MatchResult['programRankBadge'] =
          programRank?.rankValue != null
            ? { rankValue: programRank.rankValue, field: profile.intendedField, source: programRank.rankSource }
            : null
        return {
          universityId: idStr,
          name: u.name,
          country: u.country,
          location: u.location,
          climate: u.climate,
          imageUrl: u.imageUrl,
          matchTier: r.matchTier,
          acceptanceProbability: r.acceptanceProbability,
          baselineSelectivity: u.baselineSelectivity,
          generalRankBadge,
          programRankBadge,
          globalRank: u.globalRankValue != null && u.globalRankSource ? { value: u.globalRankValue, source: u.globalRankSource } : null,
          acceptanceRate: resolveAcceptanceRate(u),
          internshipProgram: u.internshipProgram,
          requirements: u.requirements,
          link: u.link,
          rationale: r.rationale,
          improvementTips: r.improvementTips,
          earlyAdmission: u.earlyAdmissionSource
            ? {
                earlyDecision:
                  u.earlyDecisionRate != null && r.earlyDecisionProbability != null
                    ? { realRate: u.earlyDecisionRate, yourChance: r.earlyDecisionProbability }
                    : null,
                earlyAction:
                  u.earlyActionRate != null && r.earlyActionProbability != null
                    ? { realRate: u.earlyActionRate, yourChance: r.earlyActionProbability }
                    : null,
                regularDecision: u.regularDecisionRate != null ? { realRate: u.regularDecisionRate } : null,
                publishedOverallRate: u.actualAcceptanceRate,
                source: u.earlyAdmissionSource,
              }
            : null,
          admissionsContext: u.admissionsContextNote
            ? { note: u.admissionsContextNote, source: u.admissionsContextNoteSource ?? 'Curated' }
            : null,
        }
      })
      .sort((a, b) => b.acceptanceProbability - a.acceptanceProbability)

    const summary = rankFilterFellBack
      ? `${object.summary} (Note: we don't have verified rankings yet to strictly filter to your "${profile.preferredRank}" preference for this country/field, so this list isn't rank-filtered this time.)`
      : object.summary

    await db.insert(matches).values({
      userId,
      targetCountries: profile.targetCountries,
      gradeBadge: badge,
      results,
      summary,
    })

    revalidatePath('/')

    return { gradeBadge: badge, summary, results }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('OpenAI request failed')) {
      throw err
    }
    const message = err instanceof Error ? err.message : 'Match request failed'
    throw new Error(`Match request failed: ${message}`)
  }
}
