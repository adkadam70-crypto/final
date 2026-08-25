'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  universities,
  profiles,
  matches,
  type MatchResult,
} from '@/lib/db/schema'
import { and, desc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { normalizeGrade, gradeBadge } from '@/lib/grade'
import OpenAI from 'openai'
import { zodTextFormat } from 'openai/helpers/zod'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export type StudentInput = {
  targetCountry: string
  curriculum: string
  gradeValue: number
  preferredClimate: string
  preferredSector: string
  preferredRank: string
  extracurriculars: string[]
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
      matchTier: z.enum(['Safety', 'Target', 'Reach', 'Ultra Reach']),
      acceptanceProbability: z
        .number()
        .min(1)
        .max(99)
        .describe('Estimated probability (%) this student is admitted.'),
      rationale: z
        .string()
        .describe('One concise sentence explaining the tier and probability for this student.'),
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
  targetCountry,
  contextByCountry,
}: {
  studentProfile: {
    badge: string
    tier: number
    preferredClimate: string
    preferredSector: string
    preferredRank: string
    extracurriculars: string[]
  }
  catalog: Array<{
    universityId: string | number
    name: string
    baselineSelectivity: number
    sectors: string[]
    climate: string
  }>
  targetCountry: string
  contextByCountry: Record<string, string>
}): Promise<{ object: z.infer<typeof resultSchema> }> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set')
  }

  const client = new OpenAI({ apiKey })

  const userPrompt = `You are an expert college admissions analyst. Assess this student against the provided universities and assign match tiers.

ADMISSIONS CONTEXT for ${targetCountry}: ${contextByCountry[targetCountry] ?? 'Standard competitive admissions environment.'}

STUDENT PROFILE:
- Normalized academics: ${studentProfile.badge} (internal academic tier ${studentProfile.tier}/4, higher is stronger)
- Preferred climate: ${studentProfile.preferredClimate}
- Preferred industry hub: ${studentProfile.preferredSector}
- Preferred university ranking: ${studentProfile.preferredRank} (soft preference — weigh it alongside fit, don't treat it as a hard filter)
- Extracurriculars: ${studentProfile.extracurriculars.length ? studentProfile.extracurriculars.join('; ') : 'None provided'}

TIER DEFINITIONS:
- Safety: student clearly exceeds the bar (prob ~75-95%).
- Target: student is competitive/on par (prob ~45-70%).
- Reach: student is below typical bar but plausible (prob ~15-40%).
- Ultra Reach: extremely selective, long odds (prob ~3-15%).

UNIVERSITIES TO ASSESS:
${JSON.stringify(
  catalog.map((u) => ({
    universityId: u.universityId,
    name: u.name,
    baselineSelectivity: u.baselineSelectivity,
    sectors: u.sectors,
    climate: u.climate,
  })),
  null,
  2,
)}

Assess every university in the list above and return one result per university.`

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
 * Runs AI matching: pulls the DB catalog for the target country, asks the model
 * to tier + estimate + explain each option for this specific student, persists
 * the run, and returns the enriched results.
 */
export async function runMatch(input: StudentInput): Promise<{
  gradeBadge: string
  summary: string
  results: MatchResult[]
}> {
  const userId = await getUserId()

  const catalog = await db
    .select()
    .from(universities)
    .where(eq(universities.country, input.targetCountry))

  const badge = gradeBadge(input.curriculum, input.gradeValue)
  const norm = normalizeGrade(input.curriculum, input.gradeValue)

  if (catalog.length === 0) {
    return { gradeBadge: badge, summary: 'No universities in the catalog for this country yet.', results: [] }
  }

  const contextByCountry: Record<string, string> = {
    US: 'US universities weigh academics ~50% and holistic factors (essays, leadership, passion projects) ~50%.',
    UK: 'UK universities weigh subject mastery and course-relevant depth heavily (~85%).',
    AU: 'Australia admits almost entirely on academic cutoff thresholds / ATAR equivalents (~100%). Extracurriculars barely matter.',
    SG: 'Singapore weighs strong academics first, with essays and interviews as secondary factors.',
    HK: 'Hong Kong weighs strong academics and interviews, with some holistic review.',
    IN: 'Holistic Indian universities blend board marks with essays and interviews; IITs are purely exam-driven.',
  }

  const { object } = await generateOpenAIMatch({
    studentProfile: {
      badge,
      tier: norm.tier,
      preferredClimate: input.preferredClimate,
      preferredSector: input.preferredSector,
      preferredRank: input.preferredRank,
      extracurriculars: input.extracurriculars,
    },
    catalog: catalog.map((u) => ({
      universityId: u.id,
      name: u.name,
      baselineSelectivity: u.baselineSelectivity,
      sectors: u.sectors,
      climate: u.climate,
    })),
    targetCountry: input.targetCountry,
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
      return {
        universityId: idStr,
        name: u.name,
        location: u.location,
        climate: u.climate,
        matchTier: r.matchTier,
        acceptanceProbability: r.acceptanceProbability,
        internshipProgram: u.internshipProgram,
        requirements: u.requirements,
        link: u.link,
        rationale: r.rationale,
      }
    })
    .sort((a, b) => b.acceptanceProbability - a.acceptanceProbability)

  // Persist the run (profile snapshot + match results), scoped to this user.
  await db.insert(profiles).values({
    userId,
    targetCountry: input.targetCountry,
    curriculum: input.curriculum,
    gradeValue: input.gradeValue,
    preferredClimate: input.preferredClimate,
    preferredSector: input.preferredSector,
    preferredRank: input.preferredRank,
    extracurriculars: input.extracurriculars,
  })

  await db.insert(matches).values({
    userId,
    targetCountry: input.targetCountry,
    gradeBadge: badge,
    results,
    summary: object.summary,
  })

  revalidatePath('/')

  return { gradeBadge: badge, summary: object.summary, results }
}

export type SavedMatch = {
  id: number
  targetCountry: string
  gradeBadge: string
  summary: string
  results: MatchResult[]
  createdAt: Date
}

export async function getSavedMatches(): Promise<SavedMatch[]> {
  const userId = await getUserId()
  const rows = await db
    .select()
    .from(matches)
    .where(eq(matches.userId, userId))
    .orderBy(desc(matches.createdAt))
    .limit(10)
  return rows.map((r) => ({
    id: r.id,
    targetCountry: r.targetCountry,
    gradeBadge: r.gradeBadge,
    summary: r.summary,
    results: r.results,
    createdAt: r.createdAt,
  }))
}

export async function deleteMatch(id: number) {
  const userId = await getUserId()
  await db
    .delete(matches)
    .where(and(eq(matches.id, id), eq(matches.userId, userId)))
  revalidatePath('/')
}
