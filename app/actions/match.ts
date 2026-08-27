'use server'

import { db } from '@/lib/db'
import {
  universities,
  matches,
  type MatchResult,
} from '@/lib/db/schema'
import { inArray } from 'drizzle-orm'
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
// Sampling evenly across selectivity (rather than truncating) keeps a
// representative spread from Safety through Ultra Reach regardless of size.
const MAX_CATALOG_FOR_AI = 20

// That fixed floor means one call for N schools is slower than two parallel
// calls for N/2 each (wall-clock time ≈ the slower of the two, not the sum).
// Split into interleaved halves — not first-half/second-half — so each
// batch independently spans the full selectivity range instead of one batch
// getting all the reaches and the other all the safeties.
const PARALLEL_BATCHES = 2

function sampleAcrossSelectivity<T extends { baselineSelectivity: number }>(items: T[], max: number): T[] {
  if (items.length <= max) return items
  const sorted = [...items].sort((a, b) => a.baselineSelectivity - b.baselineSelectivity)
  const step = sorted.length / max
  return Array.from({ length: max }, (_, i) => sorted[Math.floor(i * step)])
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
  })),
  null,
  2,
)}

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

    const catalogForAI = sampleAcrossSelectivity(catalog, MAX_CATALOG_FOR_AI)
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
          internshipProgram: u.internshipProgram,
          requirements: u.requirements,
          link: u.link,
          rationale: r.rationale,
          improvementTips: r.improvementTips,
        }
      })
      .sort((a, b) => b.acceptanceProbability - a.acceptanceProbability)

    await db.insert(matches).values({
      userId,
      targetCountries: profile.targetCountries,
      gradeBadge: badge,
      results,
      summary: object.summary,
    })

    revalidatePath('/')

    return { gradeBadge: badge, summary: object.summary, results }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('OpenAI request failed')) {
      throw err
    }
    const message = err instanceof Error ? err.message : 'Match request failed'
    throw new Error(`Match request failed: ${message}`)
  }
}
