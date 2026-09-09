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
import { getClientIp } from '@/lib/request-fingerprint'
import { isGarbledStrings } from '@/lib/ai-response-guard'

const strengthSchema = z.object({
  score: z
    .number()
    .min(1)
    .max(99)
    .describe('Realistic profile strength percentage. 100 is intentionally unreachable.'),
  headline: z.string().describe('Under 8 words summarizing the assessment, e.g. "Strong academics, thin on extracurriculars".'),
  hint: z.string().describe('Under 20 words: one specific, actionable thing that would raise the score most.'),
  strengths: z
    .array(z.string())
    .max(3)
    .describe('Up to 3 specific, concrete reasons the score is as high as it is — each under 12 words. Specific, not generic praise.'),
  weaknesses: z
    .array(z.string())
    .max(3)
    .describe('Up to 3 specific, concrete reasons the score isn\'t higher — each under 12 words. Specific gaps, not generic encouragement.'),
})

export type ProfileStrengthResult = {
  score: number
  headline: string
  hint: string
  strengths: string[]
  weaknesses: string[]
}

/**
 * AI-judged profile strength — user-triggered, not auto-computed on every
 * dashboard load. Deliberately scored so 100 is essentially unreachable and
 * a profile with no extracurriculars is capped regardless of academics,
 * since real holistic admissions weigh both.
 */
export async function analyzeProfileStrength(): Promise<
  { needsProfile: true }
  // Returned, never thrown — a thrown Error from this Server Action surfaces
  // to the user as an opaque "Minified React error #441" (see
  // analyze-target-university.ts). The real cause is console.error'd.
  | { error: true; message: string }
  | ({ needsProfile?: false } & ProfileStrengthResult)
> {
  let userId: string
  let clientIp: string
  let profile: Awaited<ReturnType<typeof getLatestProfile>>
  try {
    userId = await getUserId()
    clientIp = await getClientIp()
  } catch (err) {
    console.error('analyzeProfileStrength auth failed:', err)
    return {
      error: true,
      message:
        err instanceof Error && err.message === 'Unauthorized'
          ? 'Your session has expired — please sign in again.'
          : 'Something went wrong. Please refresh and try again.',
    }
  }
  try {
    await assertProfileStrengthRateLimit(userId, clientIp)
  } catch (err) {
    // The rate-limit message is user-facing copy — pass it straight through.
    return { error: true, message: err instanceof Error ? err.message : 'You have checked your profile strength too many times recently. Please wait a few minutes.' }
  }
  try {
    profile = await getLatestProfile()
  } catch (err) {
    console.error('analyzeProfileStrength getLatestProfile failed:', err)
    return { error: true, message: 'Something went wrong loading your profile. Please try again in a moment.' }
  }
  if (!profile || !profile.academicDetail) {
    return { needsProfile: true }
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.error('analyzeProfileStrength: OPENAI_API_KEY not set')
    return { error: true, message: 'The analysis service is not configured right now. Please try again later.' }
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
- AP courses taken: ${profile.apCourses.length ? profile.apCourses.join('; ') : 'None reported'}

Score realistically. A 100 should be practically unreachable — reserved for a flawless, internationally-decorated profile with nothing left to add. Most genuinely strong applicants land in the 55-85 range. A profile with no extracurriculars listed must be capped well below that regardless of how strong the academics are, since real holistic admissions weigh both roughly equally. Be specific in the hint about what's actually missing, not generic encouragement.

Also give the concrete reasons behind the score: up to 3 specific strengths (what's actually pulling the score up — a strong GPA band, a real standardized test score, a genuine extracurricular depth signal) and up to 3 specific weaknesses (what's actually holding it back — missing test scores, thin or generic extracurriculars, no leadership/impact shown, a curriculum-context gap). These should let the student see exactly why they got this number, not just that they did — reference the actual profile details above, never generic filler like "could be stronger."`

  try {
    const call = () =>
      client.responses.parse({
        model: 'gpt-5.6-luna',
        input: [{ role: 'user', content: prompt }],
        text: { format: zodTextFormat(strengthSchema, 'profile_strength') },
      })
    let response = await call()
    // Rare structured-output corruption (internal channel tokens leaking
    // into a field) slips past schema validation — retry once before giving
    // up.
    const garbled = (parsed: z.infer<typeof strengthSchema>) =>
      isGarbledStrings([parsed.headline, parsed.hint, ...parsed.strengths, ...parsed.weaknesses])
    if (response.output_parsed && garbled(response.output_parsed)) {
      response = await call()
    }
    if (!response.output_parsed) {
      throw new Error('OpenAI returned no parseable output for the profile strength request')
    }
    if (garbled(response.output_parsed)) {
      throw new Error('OpenAI returned corrupted output for the profile strength request after retry')
    }
    await db.insert(aiRateLimitLog).values({ userId, action: 'profileStrength', ipAddress: clientIp })
    return { ...response.output_parsed }
  } catch (err) {
    // Return, don't throw — see the note on the return type above.
    console.error('analyzeProfileStrength failed:', err)
    return {
      error: true,
      message: "We couldn't rate your profile right now — the AI service didn't respond. Please try again in a moment.",
    }
  }
}
