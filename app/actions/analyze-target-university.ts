'use server'

import { db } from '@/lib/db'
import { universities, universityAnalyses, programRankings, type MatchResult, type EarlyAdmissionInfo, type AcceptanceRateInfo } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { getUserId } from '@/lib/get-user-id'
import { getLatestProfile } from '@/app/actions/profile'
import { gradeBadge, gradeTier } from '@/lib/grade'
import { formatStandardizedTests, testScoreRangeComparison } from '@/lib/standardized-tests'
import { formatPriorGrades, EMPTY_PRIOR_GRADES } from '@/lib/prior-grades'
import { resolveAcceptanceRate, acceptanceRateForPrompt } from '@/lib/acceptance-rate'
import { BIAS_INSTRUCTION } from '@/lib/bias-instruction'
import { assertAnalysisRateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/request-fingerprint'
import { z } from 'zod'
import OpenAI from 'openai'
import { zodTextFormat } from 'openai/helpers/zod'

// Common abbreviations/short forms that don't appear as a literal substring
// in the official catalog name (e.g. "MIT" isn't a substring of
// "Massachusetts Institute of Technology"), checked before the substring
// fallback below so they resolve to the real school instead of an accidental
// substring collision (e.g. "MIT" -> "Goldsmiths, University of London",
// since "mit" is buried inside "goldsmiths").
const UNIVERSITY_ALIASES: Record<string, string> = {
  mit: 'Massachusetts Institute of Technology',
  caltech: 'California Institute of Technology',
  berkeley: 'University of California, Berkeley',
  'uc berkeley': 'University of California, Berkeley',
  cal: 'University of California, Berkeley',
  ucla: 'University of California, Los Angeles',
  ucsd: 'University of California, San Diego',
  ucsb: 'University of California, Santa Barbara',
  uci: 'University of California, Irvine',
  'uc davis': 'University of California, Davis',
  ucsc: 'University of California, Santa Cruz',
  'uc riverside': 'University of California, Riverside',
  'georgia tech': 'Georgia Institute of Technology',
  gatech: 'Georgia Institute of Technology',
  cmu: 'Carnegie Mellon University',
  upenn: 'University of Pennsylvania',
  penn: 'University of Pennsylvania',
  nyu: 'New York University',
  usc: 'University of Southern California',
  'ut austin': 'University of Texas at Austin',
  uw: 'University of Washington',
  unc: 'University of North Carolina at Chapel Hill',
  'unc chapel hill': 'University of North Carolina at Chapel Hill',
  uiuc: 'University of Illinois Urbana-Champaign',
  'uw madison': 'University of Wisconsin-Madison',
  umich: 'University of Michigan',
  'william and mary': 'College of William & Mary',
  'william & mary': 'College of William & Mary',
  'ohio state': 'Ohio State University',

  ucl: 'University College London',
  lse: 'London School of Economics',
  kcl: "King's College London",

  unsw: 'University of New South Wales',
  anu: 'Australian National University',
  uwa: 'University of Western Australia',
  uq: 'University of Queensland',

  hku: 'University of Hong Kong',
  hkust: 'Hong Kong University of Science and Technology',
  cuhk: 'Chinese University of Hong Kong',
  polyu: 'Hong Kong Polytechnic University',
  cityu: 'City University of Hong Kong',

  nus: 'National University of Singapore',
  ntu: 'Nanyang Technological University',

  'iit delhi': 'Indian Institute of Technology Delhi',
  'iit bombay': 'Indian Institute of Technology Bombay',
  'iit madras': 'Indian Institute of Technology Madras',
  'iit kanpur': 'Indian Institute of Technology Kanpur',
  'iit kharagpur': 'Indian Institute of Technology Kharagpur',
  'iit roorkee': 'Indian Institute of Technology Roorkee',
  'iit guwahati': 'Indian Institute of Technology Guwahati',
  'iit hyderabad': 'Indian Institute of Technology Hyderabad',
  'iit indore': 'Indian Institute of Technology Indore',
  'iit bhu': 'Indian Institute of Technology (BHU) Varanasi',
  'iit varanasi': 'Indian Institute of Technology (BHU) Varanasi',
  iisc: 'Indian Institute of Science',
  'bits pilani': 'Birla Institute of Technology and Science, Pilani',
  dtu: 'Delhi Technological University',
  'iim ahmedabad': 'Indian Institute of Management Ahmedabad',
  'iim bangalore': 'Indian Institute of Management Bangalore',
  'iim calcutta': 'Indian Institute of Management Calcutta',
  'aiims delhi': 'All India Institute of Medical Sciences, Delhi',
  jnu: 'Jawaharlal Nehru University',
}

/**
 * Extracts the final structured JSON payload from a Responses API call that
 * used tools (web_search) — response.output_parsed is only populated by the
 * .parse() convenience method, which doesn't support tools, so a tool-using
 * .create() call must be parsed manually from the last message-type output
 * item instead.
 */
function extractToolCallStructuredOutput<T>(response: OpenAI.Responses.Response, schema: z.ZodType<T>): T | null {
  const messageItem = [...response.output].reverse().find((item) => item.type === 'message')
  if (!messageItem || messageItem.type !== 'message') return null
  const textPart = messageItem.content.find((c) => c.type === 'output_text')
  if (!textPart || textPart.type !== 'output_text') return null
  try {
    const parsed = schema.safeParse(JSON.parse(textPart.text))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

// Catalog-grounded path — real ED/EA rounds only ever apply to schools we
// actually have on file, so this schema is exclusive to the `matched` branch.
const catalogAnalysisSchema = z.object({
  matchTier: z.enum(['Safety', 'Good Chance', 'Reach', 'Ultra Reach']),
  acceptanceProbability: z.number().min(1).max(99),
  earlyDecisionProbability: z
    .number()
    .min(1)
    .max(99)
    .nullable()
    .describe(
      'Only set when a real earlyDecisionRate is on file for this school — this student\'s estimated chance if applying binding Early Decision. Null if the school has no ED program or no real rate on file; never invent one.',
    ),
  earlyActionProbability: z
    .number()
    .min(1)
    .max(99)
    .nullable()
    .describe(
      'Only set when a real earlyActionRate is on file for this school — this student\'s estimated chance if applying non-binding Early Action. Null if no real EA rate on file; never invent one.',
    ),
  admissionChanceSummary: z.string().describe('Under 25 words summarizing the overall admission picture at this specific school.'),
  strengths: z.array(z.string()).max(3).describe('Up to 3 specific strengths in this profile relative to this school, each under 12 words. Specific, not generic.'),
  weaknesses: z.array(z.string()).max(3).describe('Up to 3 specific weaknesses or gaps relative to this school, each under 12 words. Specific, not generic.'),
  actionSteps: z.array(z.string()).max(3).describe('Up to 3 concrete actions to become more competitive for this exact school, each under 15 words.'),
})

// Non-catalog path — search + full analysis in ONE call (not two sequential
// ones). Merging them cuts real end-to-end latency roughly in half versus a
// separate research call followed by a separate analysis call (~20-25s vs
// ~11-13s in repeated live testing), since it avoids a second full
// prompt-processing round-trip.
const nonCatalogAnalysisSchema = z.object({
  foundRealAcceptanceRate: z.boolean(),
  acceptanceRatePercent: z.number().min(0).max(100).nullable().describe('Only set when foundRealAcceptanceRate is true.'),
  acceptanceRateSource: z.string().nullable().describe('Specific citation when a real rate was found. Null otherwise.'),
  matchTier: z.enum(['Safety', 'Good Chance', 'Reach', 'Ultra Reach']),
  acceptanceProbability: z.number().min(1).max(99),
  admissionChanceSummary: z.string().describe('Under 25 words summarizing the overall admission picture at this specific school.'),
  strengths: z.array(z.string()).max(3).describe('Up to 3 specific strengths in this profile relative to this school, each under 12 words. Specific, not generic.'),
  weaknesses: z.array(z.string()).max(3).describe('Up to 3 specific weaknesses or gaps relative to this school, each under 12 words. Specific, not generic.'),
  actionSteps: z.array(z.string()).max(3).describe('Up to 3 concrete actions to become more competitive for this exact school, each under 15 words.'),
})

export type TargetAnalysisResult = {
  resolvedUniversityName: string
  usedCatalogGrounding: boolean
  matchTier: MatchResult['matchTier']
  acceptanceProbability: number
  admissionChanceSummary: string
  strengths: string[]
  weaknesses: string[]
  actionSteps: string[]
  earlyAdmission: EarlyAdmissionInfo
  admissionsContext: { note: string; source: string } | null
  // Only set for schools NOT in our verified catalog, when the live web
  // search (run at request time, not from our own database) turned up a
  // real, citable published acceptance rate. Distinct from admissionsContext
  // (which is our own curated data) and from the plain "not in our catalog"
  // disclaimer (which fires when live search finds nothing usable either).
  liveResearch: { acceptanceRatePercent: number; source: string } | null
  // Our resolved acceptance-rate fact for a catalog school (official rate,
  // our estimate, or an explicit "no rate" note) — see lib/acceptance-rate.ts.
  acceptanceRate: AcceptanceRateInfo
}

const BASE_PROFILE_BLOCK = (profile: NonNullable<Awaited<ReturnType<typeof getLatestProfile>>>, badge: string, tier: number) => `
STUDENT PROFILE:
- Normalized academics: ${badge} (internal academic tier ${tier}/4, higher is stronger)
- Standardized tests: ${formatStandardizedTests(profile.standardizedTests)}
- Earlier grades (9th-11th, optional context): ${formatPriorGrades(profile.priorGrades ?? EMPTY_PRIOR_GRADES)}
- Preferred climate: ${profile.preferredClimate}
- Preferred industry hub: ${profile.preferredSector}
- Preferred university ranking: ${profile.preferredRank} (soft preference — weigh it alongside fit, don't treat it as a hard filter)
- Intended field of study: ${profile.intendedField}
- Extracurriculars: ${profile.extracurriculars.length ? profile.extracurriculars.join('; ') : 'None provided'}`

/**
 * Rigorous single-university deep-dive: strengths, weaknesses, and concrete
 * action steps for the user's latest saved profile against one named school.
 *
 * Catalog schools: grounded directly in our own verified data, single fast
 * call, no search needed.
 *
 * Non-catalog schools: a single call that both searches the web for this
 * specific school's real published acceptance rate AND produces the full
 * analysis in one shot (capped at 20s) — falls back to a fast, honest,
 * search-free estimate if that doesn't complete in time.
 */
export async function analyzeTargetUniversity(universityName: string): Promise<TargetAnalysisResult | { needsProfile: true }> {
  const userId = await getUserId()
  const clientIp = await getClientIp()
  await assertAnalysisRateLimit(userId, clientIp)
  const profile = await getLatestProfile()
  if (!profile || !profile.academicDetail) {
    return { needsProfile: true }
  }

  const trimmed = universityName.trim()
  if (!trimmed) {
    throw new Error('Enter a university name')
  }
  // No real school name is anywhere near this long — flows straight into
  // the AI prompt, so an unbounded string here is a cost vector, not a
  // real search query.
  if (trimmed.length > 200) {
    throw new Error('That university name is too long.')
  }

  try {
    const catalog = await db.select().from(universities)
    const lower = trimmed.toLowerCase()
    const aliasTarget = UNIVERSITY_ALIASES[lower]
    const matched =
      catalog.find((u) => u.name.toLowerCase() === lower) ??
      (aliasTarget ? catalog.find((u) => u.name === aliasTarget) : undefined) ??
      catalog.find((u) => u.name.toLowerCase().includes(lower) || lower.includes(u.name.toLowerCase()))

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set')
    }
    for (let i = 0; i < apiKey.length; i++) {
      if (apiKey.charCodeAt(i) > 255) {
        throw new Error(`OPENAI_API_KEY has an invalid character at position ${i} (code ${apiKey.charCodeAt(i)})`)
      }
    }
    const client = new OpenAI({ apiKey })

    const badge = gradeBadge(profile.academicDetail)
    const tier = gradeTier(profile.gradeValue)
    const profileBlock = BASE_PROFILE_BLOCK(profile, badge, tier)

    const requirementNote = `If this school lists a specific required credential, test, or exam that isn't reflected anywhere in this student's profile — a school-specific entrance exam, a portfolio, an interview, a specific test they haven't reported a score for — that is exactly the kind of concrete weakness to surface, and taking/improving it is exactly the kind of action step to recommend. Name the missing requirement directly and say plainly that it's likely a real factor holding down their odds at this specific school precisely because it's a stated requirement they haven't demonstrated. Don't invent requirements that aren't listed, and don't flag one the student's profile already satisfies.`

    let matchTier: MatchResult['matchTier']
    let acceptanceProbability: number
    let admissionChanceSummary: string
    let strengths: string[]
    let weaknesses: string[]
    let actionSteps: string[]
    let earlyDecisionProbability: number | null = null
    let earlyActionProbability: number | null = null
    let liveResearch: TargetAnalysisResult['liveResearch'] = null

    // Our resolved acceptance-rate fact for the matched catalog row (or null
    // for a non-catalog school). Returned to the UI and, for a catalog match,
    // used to ground acceptanceProbability below.
    const acc = matched
      ? resolveAcceptanceRate(matched)
      : null

    if (matched) {
      const programRank =
        profile.intendedField !== 'No preference'
          ? (await db
              .select()
              .from(programRankings)
              .where(and(eq(programRankings.universityId, matched.id), eq(programRankings.field, profile.intendedField))))[0]
          : undefined

      const admissionGrounding =
        matched.regularDecisionRate != null && matched.earlyAdmissionSource
          ? ` This school's REAL Regular-Decision-only acceptance rate is ${matched.regularDecisionRate}% per ${matched.earlyAdmissionSource} — more precise than a blended headline rate for a typical non-early applicant, since a blended figure can fold in a much easier early-round pool (e.g. a school publishing a ~5% overall rate can be ~43% for Early Decision and ~4% for everyone else). Cite this directly and with full confidence as the grounding for acceptanceProbability.${
              matched.actualAcceptanceRate != null
                ? ` If that published overall rate (${matched.actualAcceptanceRate}%) is meaningfully different from this regular-decision figure, say so plainly in admissionChanceSummary — this is about transparency with the student, not about penalizing the school.`
                : ''
            }`
          : ` For grounding acceptanceProbability: ${acceptanceRateForPrompt(acc)}${
              acc == null || acc.kind === 'unspecified'
                ? matched.rankValue != null && matched.rankSource
                  ? ` This school IS ranked #${matched.rankValue} overall per ${matched.rankSource} — use that as the main selectivity signal, cited plainly (e.g. "ranked #${matched.rankValue} overall"), but not with the confidence of a real acceptance rate.`
                  : ` No overall ranking exists either — baseline selectivity above (${matched.baselineSelectivity}/100) is an internal estimate, not a citation; don't present it as sourced.`
                : ''
            }`

      const earlyAdmissionGrounding =
        matched.earlyDecisionRate != null || matched.earlyActionRate != null
          ? ` Separately, compute earlyDecisionProbability and/or earlyActionProbability: this school has a REAL ${matched.earlyDecisionRate != null ? `Early Decision (binding) admit rate of ${matched.earlyDecisionRate}%` : ''}${matched.earlyDecisionRate != null && matched.earlyActionRate != null ? ' and a REAL ' : ''}${matched.earlyActionRate != null ? `Early Action (non-binding) admit rate of ${matched.earlyActionRate}%` : ''} per ${matched.earlyAdmissionSource}. Estimate this student's chance under each real round the same way you computed acceptanceProbability, just grounded in that round's real rate instead. Leave the other one (no real rate on file) null — never invent one.`
          : ' This school has no real Early Decision or Early Action rate on file — leave earlyDecisionProbability and earlyActionProbability both null.'

      const testScoreFit = testScoreRangeComparison(profile.standardizedTests, matched)
      const testScoreGrounding =
        testScoreFit.startsWith('Not on file') || testScoreFit.includes('not directly comparable') || testScoreFit.includes('has not reported')
          ? ` ${testScoreFit}`
          : ` Test score fit: ${testScoreFit} This is one additional input among all the others above — weigh it alongside baseline selectivity/acceptance rate/rank the way you already weigh those, never as a standalone hard cutoff. A below-25th-percentile score should pull acceptanceProbability down somewhat and an above-75th-percentile score should lift it somewhat, proportionate to how strong the other signals are — never a disqualifier or an automatic lock by itself. When the score falls WITHIN the published range, don't treat every in-range score as identical: the fact above reports the student's approximate percentile position inside that range — near the low end is a mild negative relative to the typical admit, near the high end is a mild positive, the middle is neutral. Keep these in-range adjustments small; they should never swing the tier on their own.`

      const groundingBlock = `This school IS in our verified catalog. Ground your analysis in this data: baseline selectivity ${matched.baselineSelectivity}/100, sectors: ${matched.sectors.join(', ')}, climate: ${matched.climate}, requirements: ${matched.requirements.join(', ')}.

IMPORTANT — acceptanceProbability reflects admission to the UNIVERSITY, never to a specific program. Most schools admit holistically to the institution as a whole; this app has no verified data on which schools instead admit directly by college/major with a genuinely separate process (real at a handful of schools, e.g. Carnegie Mellon's School of Computer Science or NYU Stern, but not something to assume by default here). So ground acceptanceProbability in the university-wide signal below, NEVER in a program-specific ranking:${admissionGrounding}${
        programRank
          ? ` Separately — for this student's intended field (${profile.intendedField}), this school's program is verified as ranked #${programRank.rankValue ?? '?'} nationally per ${programRank.rankSource}. This is a quality/fit fact only: mention it in the rationale as context on how strong that specific program is, but it must NOT move acceptanceProbability.${
              programRank.additionalRequirements.length
                ? ` This program also has its own additional admission requirements beyond the school-wide ones above: ${programRank.additionalRequirements.join(', ')}. Cross-reference these against the student's profile the same way you would the school-wide requirements — if one isn't reflected in their profile, name it directly as a concrete gap. This is fit/preparedness context only, never a reason to move acceptanceProbability.`
                : ''
            }`
          : ''
      }${earlyAdmissionGrounding}${testScoreGrounding}`

      const prompt = `You are an expert college admissions analyst. Give a specific, well-grounded deep-dive analysis of this student's chances at ONE named university. Prioritize being specific and scannable over being long — a reader should absorb this in seconds, not minutes. Every bullet must be concrete to this student and this school, never generic filler, but keep each one short and punchy.

${BIAS_INSTRUCTION}

TARGET UNIVERSITY: ${matched.name}
${groundingBlock}
${profileBlock}

${requirementNote}

Provide an honest tier + probability, and short, specific, scannable bullets for strengths, weaknesses/gaps, and action steps — brevity over completeness.`

      let response
      try {
        response = await client.responses.parse({
          model: 'gpt-5.6-terra',
          input: [{ role: 'user', content: prompt }],
          text: { format: zodTextFormat(catalogAnalysisSchema, 'target_analysis') },
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'OpenAI request failed'
        throw new Error(`OpenAI request failed: ${message}`)
      }
      if (!response.output_parsed) {
        throw new Error('OpenAI returned no parseable output for the analysis request')
      }
      const object = response.output_parsed
      matchTier = object.matchTier
      acceptanceProbability = object.acceptanceProbability
      admissionChanceSummary = object.admissionChanceSummary
      strengths = object.strengths
      weaknesses = object.weaknesses
      actionSteps = object.actionSteps
      earlyDecisionProbability = object.earlyDecisionProbability
      earlyActionProbability = object.earlyActionProbability
    } else {
      const mergedPrompt = `You are an expert college admissions analyst. TARGET UNIVERSITY: ${trimmed}

This school is NOT in our own verified catalog — we have no selectivity, acceptance rate, or ranking data for it in our database. Do AT MOST 1 quick, targeted web search for this school's real published undergraduate acceptance rate — check its official site or a government/education-ministry source first, and stop as soon as you have an answer either way. Report exactly what you find with a specific citation (set foundRealAcceptanceRate, acceptanceRatePercent, acceptanceRateSource accordingly). If a quick search doesn't turn up an explicitly stated real rate, don't dig further — set foundRealAcceptanceRate to false and give an honest profile-based estimate instead; never invent a precise-sounding number.

${BIAS_INSTRUCTION}
${profileBlock}

${requirementNote}

If your search happens to surface this school's real published SAT/ACT admitted-student range (a 25th-75th percentile range, commonly reported by U.S. News or the school's Common Data Set), compare the student's own SAT composite or ACT score against it and fold that comparison into admissionChanceSummary as one factor among the others — never a hard cutoff. Also check whether the school is Test-Optional, Test-Blind, or Required: if it's Test-Blind (scores never considered, e.g. the University of California system), say so plainly and don't treat the student's score as relevant to this school at all; if it's Test-Optional and you can't find a range, say scores are optional here rather than implying none exists. Don't go out of your way to search for this specifically — only use it if it surfaces naturally within your one acceptance-rate search, or you already know it reliably.

admissionChanceSummary MUST start with a brief, calm caveat before anything else — never lead with the tier or percentage as if it were a confident, grounded assessment, but don't dwell on it or apologize either; one short clause is enough. If a real rate was found, phrase the caveat positively around that (e.g. "Based on a real published rate found via research:") rather than leading with what our catalog lacks. Otherwise phrase it plainly, e.g. "Based on general research rather than a verified data point:". If you are genuinely unsure whether this is a highly selective or easily-entered school, prefer a wide middle-of-the-road tier ("Good Chance") over guessing "Reach" or "Safety" with false confidence.

Provide short, specific, scannable bullets for strengths, weaknesses/gaps, and action steps — brevity over completeness.`

      let merged: z.infer<typeof nonCatalogAnalysisSchema> | null = null
      try {
        const mergedResponse = await client.responses.create(
          {
            model: 'gpt-5.6-terra',
            input: [{ role: 'user', content: mergedPrompt }],
            tools: [{ type: 'web_search' }],
            text: { format: zodTextFormat(nonCatalogAnalysisSchema, 'non_catalog_analysis') },
          },
          // Generous-but-bounded — repeated live testing landed this merged
          // (search + analysis in one call) at ~11-13s; 20s leaves headroom
          // for a slower run without approaching the old two-call ~40s+ tail.
          { timeout: 20_000 },
        )
        merged = extractToolCallStructuredOutput(mergedResponse, nonCatalogAnalysisSchema)
      } catch {
        // Falls through to the no-search fallback below.
      }

      if (merged) {
        matchTier = merged.matchTier
        acceptanceProbability = merged.acceptanceProbability
        admissionChanceSummary = merged.admissionChanceSummary
        strengths = merged.strengths
        weaknesses = merged.weaknesses
        actionSteps = merged.actionSteps
        if (merged.foundRealAcceptanceRate && merged.acceptanceRatePercent != null && merged.acceptanceRateSource) {
          liveResearch = { acceptanceRatePercent: merged.acceptanceRatePercent, source: merged.acceptanceRateSource }
        }
      } else {
        // Search timed out or failed outright — fast, honest, search-free
        // fallback so the user still gets a result rather than an error.
        const fallbackPrompt = `You are an expert college admissions analyst. TARGET UNIVERSITY: ${trimmed}

This school is NOT in our own verified catalog, and a live web search was also attempted and found nothing usable. Rely on your general knowledge, but be honest about how thin that is — if you don't have reliable knowledge of this specific school's actual selectivity, don't invent a precise-sounding number anyway.

${BIAS_INSTRUCTION}
${profileBlock}

${requirementNote}

admissionChanceSummary MUST start with a brief, calm caveat before anything else, e.g. "Based on general research rather than a verified data point:" — one short clause, don't dwell on it. If you are genuinely unsure whether this is a highly selective or easily-entered school, prefer a wide middle-of-the-road tier ("Good Chance") over guessing "Reach" or "Safety" with false confidence.

Provide short, specific, scannable bullets for strengths, weaknesses/gaps, and action steps — brevity over completeness.`

        let response
        try {
          response = await client.responses.parse({
            model: 'gpt-5.6-terra',
            input: [{ role: 'user', content: fallbackPrompt }],
            text: { format: zodTextFormat(catalogAnalysisSchema, 'target_analysis_fallback') },
          })
        } catch (err) {
          const message = err instanceof Error ? err.message : 'OpenAI request failed'
          throw new Error(`OpenAI request failed: ${message}`)
        }
        if (!response.output_parsed) {
          throw new Error('OpenAI returned no parseable output for the analysis request')
        }
        const object = response.output_parsed
        matchTier = object.matchTier
        acceptanceProbability = object.acceptanceProbability
        admissionChanceSummary = object.admissionChanceSummary
        strengths = object.strengths
        weaknesses = object.weaknesses
        actionSteps = object.actionSteps
      }
    }

    const earlyAdmission: EarlyAdmissionInfo =
      matched && matched.earlyAdmissionSource
        ? {
            earlyDecision:
              matched.earlyDecisionRate != null && earlyDecisionProbability != null
                ? { realRate: matched.earlyDecisionRate, yourChance: earlyDecisionProbability }
                : null,
            earlyAction:
              matched.earlyActionRate != null && earlyActionProbability != null
                ? { realRate: matched.earlyActionRate, yourChance: earlyActionProbability }
                : null,
            regularDecision: matched.regularDecisionRate != null ? { realRate: matched.regularDecisionRate } : null,
            publishedOverallRate: matched.actualAcceptanceRate,
            source: matched.earlyAdmissionSource,
          }
        : null

    const admissionsContext =
      matched && matched.admissionsContextNote
        ? { note: matched.admissionsContextNote, source: matched.admissionsContextNoteSource ?? 'Curated' }
        : null

    await db.insert(universityAnalyses).values({
      userId,
      universityName: matched?.name ?? trimmed,
      universityId: matched?.id ?? null,
      usedCatalogGrounding: matched ? 1 : 0,
      acceptanceProbability,
      matchTier,
      admissionChanceSummary,
      strengths,
      weaknesses,
      actionSteps,
      ipAddress: clientIp,
    })

    return {
      resolvedUniversityName: matched?.name ?? trimmed,
      usedCatalogGrounding: !!matched,
      matchTier,
      acceptanceProbability,
      admissionChanceSummary,
      strengths,
      weaknesses,
      actionSteps,
      earlyAdmission,
      admissionsContext,
      liveResearch,
      acceptanceRate: acc,
    }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('OpenAI request failed')) {
      throw err
    }
    const message = err instanceof Error ? err.message : 'Analysis failed'
    throw new Error(`Analysis failed: ${message}`)
  }
}
