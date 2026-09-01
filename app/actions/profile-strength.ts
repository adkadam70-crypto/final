'use server'

import { z } from 'zod'
import OpenAI from 'openai'
import { zodTextFormat } from 'openai/helpers/zod'
import { db } from '@/lib/db'
import { aiRateLimitLog } from '@/lib/db/schema'
import { getUserId } from '@/lib/get-user-id'
import { getLatestProfile } from '@/app/actions/profile'
import { gradeBadge } from '@/lib/grade'
import { formatStandardizedTests } from '@/lib/standardized-tests'
import { formatPriorGrades, EMPTY_PRIOR_GRADES } from '@/lib/prior-grades'
import { BIAS_INSTRUCTION } from '@/lib/bias-instruction'
import { assertProfileStrengthRateLimit } from '@/lib/rate-limit'

const strengthSchema = z.object({
  score: z
    .number()
    .min(1)
    .max(99)
    .describe('Realistic profile strength percentage. 100 is intentionally unreachable.'),
  headline: z.string().describe('Under 8 words summarizing the assessment, e.g. "Strong academics, thin on extracurriculars".'),
  hint: z.string().describe('Under 20 words: one specific, actionable thing that would raise the score most.'),
})

export type ProfileStrengthResult = {
  score: number
  headline: string
  hint: string
}

/**
 * AI-judged profile strength — user-triggered, not auto-computed on every
 * dashboard load. Deliberately scored so 100 is essentially unreachable and
 * a profile with no extracurriculars is capped regardless of academics,
 * since real holistic admissions weigh both.
 */
export async function analyzeProfileStrength(): Promise<
  { needsProfile: true } | ({ needsProfile?: false } & ProfileStrengthResult)
> {
  const userId = await getUserId()
  await assertProfileStrengthRateLimit(userId)
  const profile = await getLatestProfile()
  if (!profile || !profile.academicDetail) {
    return { needsProfile: true }
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set')
  }

  const client = new OpenAI({ apiKey })
  const badge = gradeBadge(profile.academicDetail)

  const prompt = `You are an experienced, blunt college admissions counselor rating how strong and complete a student's applicant profile is for competitive admissions — not how encouraging you can be.

${BIAS_INSTRUCTION}

STUDENT PROFILE:
- Academics: ${badge}
- Standardized tests: ${formatStandardizedTests(profile.standardizedTests)}
- Earlier grades (9th-11th, optional context): ${formatPriorGrades(profile.priorGrades ?? EMPTY_PRIOR_GRADES)}
- Target countries: ${profile.targetCountries.join(', ')}
- Intended field: ${profile.intendedField}
- Extracurriculars: ${profile.extracurriculars.length ? profile.extracurriculars.join('; ') : 'None provided'}

Score realistically. A 100 should be practically unreachable — reserved for a flawless, internationally-decorated profile with nothing left to add. Most genuinely strong applicants land in the 55-85 range. A profile with no extracurriculars listed must be capped well below that regardless of how strong the academics are, since real holistic admissions weigh both roughly equally. Be specific in the hint about what's actually missing, not generic encouragement.`

  let response
  try {
    response = await client.responses.parse({
      model: 'gpt-5.6-terra',
      input: [{ role: 'user', content: prompt }],
      text: { format: zodTextFormat(strengthSchema, 'profile_strength') },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Profile strength request failed'
    throw new Error(`Profile strength request failed: ${message}`)
  }

  if (!response.output_parsed) {
    throw new Error('OpenAI returned no parseable output for the profile strength request')
  }

  await db.insert(aiRateLimitLog).values({ userId, action: 'profileStrength' })

  return { ...response.output_parsed }
}
