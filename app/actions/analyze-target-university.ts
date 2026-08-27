'use server'

import { db } from '@/lib/db'
import { universities, universityAnalyses, type MatchResult } from '@/lib/db/schema'
import { getUserId } from '@/lib/get-user-id'
import { getLatestProfile } from '@/app/actions/profile'
import { gradeBadge, gradeTier } from '@/lib/grade'
import { BIAS_INSTRUCTION } from '@/lib/bias-instruction'
import { z } from 'zod'
import OpenAI from 'openai'
import { zodTextFormat } from 'openai/helpers/zod'

const analysisSchema = z.object({
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
}

/**
 * Rigorous single-university deep-dive: strengths, weaknesses, and concrete
 * action steps for the user's latest saved profile against one named school.
 * Grounded against the catalog when the name resolves to a known row;
 * otherwise falls back to the model's general knowledge with a disclaimer.
 */
export async function analyzeTargetUniversity(universityName: string): Promise<TargetAnalysisResult | { needsProfile: true }> {
  const userId = await getUserId()
  const profile = await getLatestProfile()
  if (!profile || !profile.academicDetail) {
    return { needsProfile: true }
  }

  const trimmed = universityName.trim()
  if (!trimmed) {
    throw new Error('Enter a university name')
  }

  try {
    const catalog = await db.select().from(universities)
    const lower = trimmed.toLowerCase()
    const matched =
      catalog.find((u) => u.name.toLowerCase() === lower) ??
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

    const groundingBlock = matched
      ? `This school IS in our verified catalog. Ground your analysis in this data: baseline selectivity ${matched.baselineSelectivity}/100, sectors: ${matched.sectors.join(', ')}, climate: ${matched.climate}, requirements: ${matched.requirements.join(', ')}.`
      : `This school is NOT in our verified catalog — rely on your general knowledge of it, and explicitly note in admissionChanceSummary that this analysis isn't grounded in verified selectivity data.`

    const prompt = `You are an expert college admissions analyst. Give a specific, well-grounded deep-dive analysis of this student's chances at ONE named university. Prioritize being specific and scannable over being long — a reader should absorb this in seconds, not minutes. Every bullet must be concrete to this student and this school, never generic filler, but keep each one short and punchy.

${BIAS_INSTRUCTION}

TARGET UNIVERSITY: ${matched?.name ?? trimmed}
${groundingBlock}

STUDENT PROFILE:
- Normalized academics: ${badge} (internal academic tier ${tier}/4, higher is stronger)
- Preferred climate: ${profile.preferredClimate}
- Preferred industry hub: ${profile.preferredSector}
- Intended field of study: ${profile.intendedField}
- Extracurriculars: ${profile.extracurriculars.length ? profile.extracurriculars.join('; ') : 'None provided'}

Provide an honest tier + probability, and short, specific, scannable bullets for strengths, weaknesses/gaps, and action steps — brevity over completeness.`

    let response
    try {
      response = await client.responses.parse({
        model: 'gpt-5.6-terra',
        input: [{ role: 'user', content: prompt }],
        text: { format: zodTextFormat(analysisSchema, 'target_analysis') },
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'OpenAI request failed'
      throw new Error(`OpenAI request failed: ${message}`)
    }
    if (!response.output_parsed) {
      throw new Error('OpenAI returned no parseable output for the analysis request')
    }
    const object = response.output_parsed

    await db.insert(universityAnalyses).values({
      userId,
      universityName: matched?.name ?? trimmed,
      universityId: matched?.id ?? null,
      usedCatalogGrounding: matched ? 1 : 0,
      acceptanceProbability: object.acceptanceProbability,
      matchTier: object.matchTier,
      admissionChanceSummary: object.admissionChanceSummary,
      strengths: object.strengths,
      weaknesses: object.weaknesses,
      actionSteps: object.actionSteps,
    })

    return {
      resolvedUniversityName: matched?.name ?? trimmed,
      usedCatalogGrounding: !!matched,
      matchTier: object.matchTier,
      acceptanceProbability: object.acceptanceProbability,
      admissionChanceSummary: object.admissionChanceSummary,
      strengths: object.strengths,
      weaknesses: object.weaknesses,
      actionSteps: object.actionSteps,
    }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('OpenAI request failed')) {
      throw err
    }
    const message = err instanceof Error ? err.message : 'Analysis failed'
    throw new Error(`Analysis failed: ${message}`)
  }
}
