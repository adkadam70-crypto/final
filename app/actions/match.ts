'use server'

import { db } from '@/lib/db'
import {
  universities,
  matches,
  programRankings,
  type MatchResult,
} from '@/lib/db/schema'
import { inArray, and, eq, desc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { gradeTier, gradeBadge } from '@/lib/grade'
import { getUserId } from '@/lib/get-user-id'
import { getLatestProfile } from '@/app/actions/profile'
import { formatStandardizedTests } from '@/lib/standardized-tests'
import { formatPriorGrades, EMPTY_PRIOR_GRADES } from '@/lib/prior-grades'
import OpenAI from 'openai'
import { zodTextFormat } from 'openai/helpers/zod'
import { BIAS_INSTRUCTION } from '@/lib/bias-instruction'

// Caps how many universities go to the model in one call. Measured: ~24s for
// 2 universities, ~50s for 30, ~62s for 60 — there's a large fixed-latency
// floor with this model/schema that doesn't shrink much with catalog size,
// so even moderate caps sit uncomfortably close to Vercel's Hobby-tier 60s
// function ceiling. 20 trades some breadth for a real safety margin.
// Sampling across selectivity bands (rather than truncating) keeps a
// representative spread from Safety through Ultra Reach regardless of size.
const MAX_CATALOG_FOR_AI = 20

// That fixed floor means one call for N schools is slower than two parallel
// calls for N/2 each (wall-clock time ≈ the slower of the two, not the sum).
// Split into interleaved halves — not first-half/second-half — so each
// batch independently spans the full selectivity range instead of one batch
// getting all the reaches and the other all the safeties.
const PARALLEL_BATCHES = 2

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

// Fills out the Top-N rank-filter pool for fields where most tagged schools
// have no real program-specific citation yet (e.g. US Business: 95 schools
// tagged, only 19 have a verified programRankings row — so a "Top 50"
// Business search was recycling the same ~34-school rank-filtered pool
// after 2-3 runs). For a school that offers the field but has neither a real
// programRankings row nor a qualifying overall rank, approximate its
// standing among *other same-field-tagged schools in the same country*
// using the best real signal already on file (verified overall rank first,
// baseline selectivity as a tiebreak/fallback) and take its ordinal position
// as an inferred rank.
//
// Deliberately never written to programRankings and never surfaced as a
// rank badge anywhere in the UI — it exists only so the Top-N *filter* can
// see past a thin slice of real citations, never to claim a sourced fact
// (same real-vs-estimate boundary as everywhere else in this file; see
// universities.rankSource being nullable). Scoped per-country, same reason
// every other rank comparison here is country-scoped — mixing selectivity
// scales across countries would make the ordinal meaningless. Only computed
// once a country+field pool is at least MIN_FIELD_MATCHED_POOL deep, the
// same "is this field tagged widely enough to filter on" bar as
// preferIntendedField, so a handful of tagged schools can't produce a
// misleadingly precise-looking "rank #2" out of a pool of 3.
function inferFieldRanks(
  catalog: Array<{ id: number; country: string; academicFields: string[]; rankValue: number | null; baselineSelectivity: number }>,
  field: string,
  excludeIds: Set<number>,
): Map<number, number> {
  const inferred = new Map<number, number>()
  const byCountry = new Map<string, typeof catalog>()
  for (const u of catalog) {
    if (excludeIds.has(u.id) || !u.academicFields.includes(field)) continue
    if (!byCountry.has(u.country)) byCountry.set(u.country, [])
    byCountry.get(u.country)!.push(u)
  }
  for (const group of byCountry.values()) {
    if (group.length < MIN_FIELD_MATCHED_POOL) continue
    const sorted = [...group].sort((a, b) => {
      if (a.rankValue != null && b.rankValue != null) return a.rankValue - b.rankValue
      if (a.rankValue != null) return -1
      if (b.rankValue != null) return 1
      return b.baselineSelectivity - a.baselineSelectivity
    })
    sorted.forEach((u, i) => inferred.set(u.id, i + 1))
  }
  return inferred
}

function rankThresholdFor(preferredRank: string): number | undefined {
  return { 'Top 50': 50, 'Top 100': 100, 'Top 200': 200 }[preferredRank]
}

function interleaveChunks<T>(items: T[], chunkCount: number): T[][] {
  const chunks: T[][] = Array.from({ length: chunkCount }, () => [])
  items.forEach((item, i) => chunks[i % chunkCount].push(item))
  return chunks.filter((c) => c.length > 0)
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
    programRank: { rankValue: number | null; rankSource: string; programSelectivity: number } | null
    overallRank: { rankValue: number; rankSource: string } | null
    actualAcceptanceRate: { rate: number; source: string } | null
    earlyAdmission: { ed: number | null; ea: number | null; rd: number | null; source: string } | null
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
    actualOverallAcceptanceRate: u.actualAcceptanceRate
      ? `${u.actualAcceptanceRate.rate}% overall admit rate, per ${u.actualAcceptanceRate.source} — a real published figure, not an estimate.`
      : 'Not on file.',
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
      ? `${u.earlyAdmission.rd}% — a REAL published Regular-Decision-only admit rate, per ${u.earlyAdmission.source}. More precise than actualOverallAcceptanceRate for a typical (non-early) applicant, since a blended headline rate can fold in a much easier early pool.`
      : 'Not on file.',
  })),
  null,
  2,
)}

When a school's academicFields includes the student's intended field of study, treat that as a genuine positive fit signal in your rationale — not just an admission-probability input. When it's "not yet tagged," don't penalize the school for it; assess it on selectivity and the other signals instead.

IMPORTANT — acceptanceProbability reflects admission to the UNIVERSITY, never to a specific program. Most schools admit students holistically to the institution as a whole (major is a soft signal, sometimes declared a year or two later); this app has no verified data on which specific schools instead admit directly by college/major with a genuinely separate, harder process (a real phenomenon at a handful of schools, but not something to assume by default). So: ground acceptanceProbability using this priority order, falling through only when the higher one is unavailable: (1) regularDecisionRate, if present — the most realistic baseline for a typical non-early applicant, since it strips out any early-round effect the blended headline can't separate; (2) actualOverallAcceptanceRate, if present and regularDecisionRate is not — a real published admit rate, cite it directly and with full confidence (e.g. "the actual acceptance rate is 12%"); (3) overallRanking, if present — a general prestige ranking, cite it plainly (e.g. "ranked #28 overall") but don't treat it as equivalent to a real acceptance rate; (4) baselineSelectivity alone — an internal estimate with no citation behind it. Never present tier 4 with the confidence of tiers 1-3 in your rationale text. Note: when actualOverallAcceptanceRate is present, baselineSelectivity was already derived from it (100 minus the rate) — they are the same fact, not two independent ones. NEVER use programRankingForIntendedField to move acceptanceProbability up or down.

When regularDecisionRate is present AND meaningfully different from actualOverallAcceptanceRate (this happens at schools that lean heavily on binding Early Decision, e.g. a school publishing a ~5% blended rate that's actually ~43% ED and ~4% regular), say so plainly and specifically in the rationale — e.g. "published rate is 5%, but that blends in a large Early Decision pool; as a Regular Decision applicant, ~4% is the more realistic baseline." This is about being transparent with the student, not about penalizing the school — state it as a neutral fact.

Separately, compute earlyDecisionProbability and earlyActionProbability: these are this student's estimated personal chance if they applied through that specific binding-ED or non-binding-EA round instead, computed the same way as acceptanceProbability but grounded in earlyDecisionRate/earlyActionRate respectively. Only set a value when that real rate is present in the data above — leave it null when a school has no such program or no real rate on file, exactly like every other estimate in this app. Never infer or guess an early-round number from the regular one.

programRankingForIntendedField, when present, is a quality/fit fact only — mention it in the rationale as context on how strong that specific program is (e.g. "and its Business program is separately ranked #4 nationally"), but it must not change the probability number itself.

The student's "preferred university ranking" in their profile (e.g. "Top 50") is a real threshold to check against overallRanking's rank if present (not the program rank, for the same reason as above — the preference is about the university). If a school's verified overall rank falls outside the student's stated preference, say so plainly in the rationale (e.g. "ranked #78 overall, outside your Top 50 preference") — don't silently ignore the mismatch, but also don't use it to zero out an otherwise-good match, since it's explicitly a soft preference. When no overall rank exists for a school, there's nothing concrete to compare against the preference — don't guess whether it would qualify.

Cross-reference admissionRequirements against the student's actual profile above (standardized tests, curriculum/grades, extracurriculars) for every school. If a school lists a specific required credential, test, or exam that isn't reflected anywhere in the student's profile (e.g. a school-specific entrance exam, a portfolio, an interview, a specific test the student hasn't reported a score for), that is exactly the kind of concrete, specific improvementTip to surface — name the missing requirement directly and say plainly that it's likely holding down this student's odds at this specific school precisely because it's a stated requirement they haven't demonstrated. Don't invent requirements that aren't listed, and don't flag a requirement the student's profile already satisfies.

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
    }

    // Verified program-specific rankings for the student's intended field,
    // across the WHOLE country catalog (not just the AI batch) — needed
    // upfront now because a "Top 50" rank preference has to filter the pool
    // by real rank numbers before sampling, not just describe it to the AI
    // afterward. Absence means "not yet researched," never "unranked".
    const programRankByUniversityId = new Map<number, { rankValue: number | null; rankSource: string; programSelectivity: number }>()
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
        })
      }
    }

    // A rank preference ("Top 50") is a real, hard cutoff on the candidate
    // pool: a school qualifies if its GENERAL rank is within the threshold,
    // OR its program-specific rank for the student's intended field is
    // within the threshold — a school ranked #85 overall but #20 in
    // Business still belongs in a "Top 50" search for a Business-intent
    // student. Falls back to the softer academicFields-tag preference (the
    // pre-existing behavior) when no rank preference is set, since most of
    // the catalog has no verified rank number at all yet to filter on.

    // Basic inferred ranking (see inferFieldRanks doc comment) — only needed
    // once there's an actual rank threshold to fill out, and only for
    // schools that don't already have a real program-specific citation.
    const inferredFieldRank =
      rankThresholdFor(profile.preferredRank) && profile.intendedField !== 'No preference'
        ? inferFieldRanks(catalog, profile.intendedField, new Set(programRankByUniversityId.keys()))
        : new Map<number, number>()

    let fieldPool: typeof catalog
    let rankFilterFellBack = false
    const rankThreshold = rankThresholdFor(profile.preferredRank)
    if (rankThreshold) {
      const rankFiltered = catalog.filter((u) => {
        const generalOk = u.rankValue != null && u.rankValue <= rankThreshold
        const programRank = programRankByUniversityId.get(u.id)
        const programOk = programRank?.rankValue != null && programRank.rankValue <= rankThreshold
        const inferredOk = (inferredFieldRank.get(u.id) ?? Infinity) <= rankThreshold
        return generalOk || programOk || inferredOk
      })
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
    const batches = interleaveChunks(catalogForAI, PARALLEL_BATCHES)

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

    const batchResults = await Promise.all(
      batches.map((batch) =>
        generateOpenAIMatch({
          studentProfile,
          catalog: batch.map((u) => ({
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
            actualAcceptanceRate:
              u.actualAcceptanceRate != null && u.acceptanceRateSource
                ? { rate: u.actualAcceptanceRate, source: u.acceptanceRateSource }
                : null,
            earlyAdmission: u.earlyAdmissionSource
              ? { ed: u.earlyDecisionRate, ea: u.earlyActionRate, rd: u.regularDecisionRate, source: u.earlyAdmissionSource }
              : null,
          })),
          targetCountries: profile.targetCountries,
          contextByCountry,
        }),
      ),
    )

    const object = {
      summary: batchResults[0].object.summary,
      results: batchResults.flatMap((b) => b.object.results),
    }

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
        // One badge per school, most specific fact first: a verified
        // program-specific rank for the student's own intended field beats
        // a general rank, which beats showing nothing. Never both at once —
        // that reads as two competing "the real rank is X" claims.
        const rankBadge: MatchResult['rankBadge'] =
          programRank?.rankValue != null
            ? { type: 'program', rankValue: programRank.rankValue, field: profile.intendedField, source: programRank.rankSource }
            : u.rankValue != null && u.rankSource
              ? { type: 'general', rankValue: u.rankValue, source: u.rankSource }
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
          rankBadge,
          globalRank: u.globalRankValue != null && u.globalRankSource ? { value: u.globalRankValue, source: u.globalRankSource } : null,
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
