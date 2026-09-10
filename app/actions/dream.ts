'use server'

import { z } from 'zod'
import OpenAI from 'openai'
import { zodTextFormat } from 'openai/helpers/zod'
import { eq, and, asc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { dreamProfiles, dreamCountryProfiles, dreamUniversityTracks, profileSuggestedActivities, aiRateLimitLog } from '@/lib/db/schema'
import { PER_UNIVERSITY_TASK_TEMPLATE } from '@/lib/common-app-sections'
import { getUserId } from '@/lib/get-user-id'
import { getClientIp } from '@/lib/request-fingerprint'
import { getLatestProfile, appendExtracurricularToProfile } from '@/app/actions/profile'
import { gradeBadge } from '@/lib/grade'
import { formatStandardizedTests } from '@/lib/standardized-tests'
import { ACADEMIC_FIELDS, type AcademicField } from '@/lib/academic-detail'
import { APPLICATION_INFO } from '@/lib/application-info'
import { BIAS_INSTRUCTION } from '@/lib/bias-instruction'
import { ADMIN_EMAIL } from '@/lib/admin'
import { assertDreamFieldRateLimit, assertDreamAnalysisRateLimit } from '@/lib/rate-limit'
import { isGarbledStrings } from '@/lib/ai-response-guard'

// "Build Your Dream" is admin-only while it's still being tested (see
// app/dream/layout.tsx, which already blocks the page itself) — this is
// defence in depth for the actions directly, same pattern as
// app/actions/admin.ts's isAdmin(). Remove once the feature ships generally.
async function assertDreamAdmin(): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user || session.user.email !== ADMIN_EMAIL) {
    throw new Error('Unauthorized')
  }
}

export type DreamProfileRow = Awaited<ReturnType<typeof getDreamProfile>>
export type DreamCountryProfileRow = Awaited<ReturnType<typeof getDreamCountryProfile>>
export type DreamUniversityTrackRow = Awaited<ReturnType<typeof getDreamUniversityTracks>>[number]
export type SuggestedActivityRow = Awaited<ReturnType<typeof getSuggestedActivities>>[number]

// User-level row: onboarding answers + field recommendation. Done once —
// see dreamCountryProfiles for the per-country data built on top of it.
export async function getDreamProfile() {
  await assertDreamAdmin()
  const userId = await getUserId()
  const rows = await db.select().from(dreamProfiles).where(eq(dreamProfiles.userId, userId)).limit(1)
  return rows[0] ?? null
}

export async function getDreamCountryProfiles() {
  await assertDreamAdmin()
  const userId = await getUserId()
  return db.select().from(dreamCountryProfiles).where(eq(dreamCountryProfiles.userId, userId)).orderBy(asc(dreamCountryProfiles.createdAt))
}

export async function getDreamCountryProfile(country: string) {
  await assertDreamAdmin()
  const userId = await getUserId()
  const rows = await db
    .select()
    .from(dreamCountryProfiles)
    .where(and(eq(dreamCountryProfiles.userId, userId), eq(dreamCountryProfiles.country, country)))
    .limit(1)
  return rows[0] ?? null
}

const CURRENT_GRADES = ['9th', '10th', '11th', '12th'] as const

export type DreamOnboardingInput = {
  strengths: string[]
  hobbies: string
  interests: string[]
  interestsOther: string
  currentGrade: string
  applicationYear: number
}

const MAX_FIELD_LENGTH = 300
const MAX_TAGS = 12
const CURRENT_YEAR = new Date().getFullYear()

function validateOnboarding(input: DreamOnboardingInput): string | null {
  if (input.strengths.length > MAX_TAGS) return `Select at most ${MAX_TAGS} subjects.`
  if (input.interests.length > MAX_TAGS) return `Select at most ${MAX_TAGS} interests.`
  if (input.hobbies.length > MAX_FIELD_LENGTH) return 'That answer is too long.'
  if (input.interestsOther.length > MAX_FIELD_LENGTH) return 'That answer is too long.'
  if (input.strengths.some((s) => s.length > MAX_FIELD_LENGTH) || input.interests.some((s) => s.length > MAX_FIELD_LENGTH)) {
    return 'One of your entries is too long.'
  }
  if (!CURRENT_GRADES.includes(input.currentGrade as (typeof CURRENT_GRADES)[number])) return 'Select your current grade.'
  if (!Number.isInteger(input.applicationYear) || input.applicationYear < CURRENT_YEAR || input.applicationYear > CURRENT_YEAR + 6) {
    return 'Select a valid application year.'
  }
  return null
}

// Saves the onboarding answers — upserted in place (one row per user), not
// appended, since this is a single evolving profile.
export async function saveDreamOnboarding(input: DreamOnboardingInput): Promise<{ success: boolean; message: string }> {
  let userId: string
  try {
    await assertDreamAdmin()
    userId = await getUserId()
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error && err.message === 'Unauthorized' ? 'Your session has expired — please sign in again.' : 'Something went wrong. Please refresh and try again.',
    }
  }
  const validationError = validateOnboarding(input)
  if (validationError) return { success: false, message: validationError }

  try {
    await db
      .insert(dreamProfiles)
      .values({
        userId,
        strengths: input.strengths,
        hobbies: input.hobbies,
        interests: input.interests,
        interestsOther: input.interestsOther,
        currentGrade: input.currentGrade,
        applicationYear: input.applicationYear,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: dreamProfiles.userId,
        set: {
          strengths: input.strengths,
          hobbies: input.hobbies,
          interests: input.interests,
          interestsOther: input.interestsOther,
          currentGrade: input.currentGrade,
          applicationYear: input.applicationYear,
          updatedAt: new Date(),
        },
      })
    revalidatePath('/dream')
    return { success: true, message: 'Saved.' }
  } catch (error) {
    console.error('saveDreamOnboarding error:', error)
    return { success: false, message: 'Something went wrong saving your answers. Please try again.' }
  }
}

const fieldRecommendationSchema = z.object({
  field: z.enum(ACADEMIC_FIELDS as unknown as [string, ...string[]]),
  rationale: z.string().describe('Under 30 words explaining why this field fits, referencing the actual subjects/interests/hobbies given and the master profile.'),
})

export type DreamFieldRecommendation = { field: AcademicField; rationale: string }

export type RecommendFieldOutcome =
  | { needsOnboarding: true }
  | { needsProfile: true }
  | { rateLimited: true; message: string }
  | { error: true; message: string }
  | ({ error?: false; needsOnboarding?: false; needsProfile?: false; rateLimited?: false } & DreamFieldRecommendation)

// AI call #1 of 2 in this feature — see the cost estimate given before
// building this: small input (onboarding answers + master profile), small
// structured output (one enum value + a short rationale).
export async function recommendDreamField(): Promise<RecommendFieldOutcome> {
  let userId: string
  let clientIp: string
  try {
    await assertDreamAdmin()
    userId = await getUserId()
    clientIp = await getClientIp()
  } catch (err) {
    return { error: true, message: err instanceof Error && err.message === 'Unauthorized' ? 'Your session has expired — please sign in again.' : 'Something went wrong. Please refresh and try again.' }
  }
  try {
    await assertDreamFieldRateLimit(userId, clientIp)
  } catch (err) {
    return { rateLimited: true, message: err instanceof Error ? err.message : 'Rate limit exceeded — please try again later.' }
  }

  const dream = await getDreamProfile()
  if (!dream || (!dream.strengths.length && !dream.hobbies && !dream.interests.length)) return { needsOnboarding: true }

  const profile = await getLatestProfile()
  if (!profile || !profile.academicDetail) return { needsProfile: true }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return { error: true, message: 'The recommendation service is not configured right now. Please try again later.' }

  const badge = gradeBadge(profile.academicDetail)
  const client = new OpenAI({ apiKey })

  const prompt = `You are a thoughtful academic/career counselor. Recommend ONE field of study for this student from the fixed list below, based on their onboarding answers and their existing academic profile together — not the onboarding answers alone.

${BIAS_INSTRUCTION}

ALLOWED FIELDS (pick exactly one, verbatim): ${ACADEMIC_FIELDS.join(', ')}

ONBOARDING ANSWERS:
- Subjects they excel in / enjoy: ${dream.strengths.length ? dream.strengths.join('; ') : 'Not answered'}
- What they spend free time on: ${dream.hobbies || 'Not answered'}
- Real-world problems/industries that excite them: ${[...dream.interests, dream.interestsOther].filter(Boolean).join('; ') || 'Not answered'}

EXISTING ACADEMIC PROFILE:
- Academics: ${badge}
- Standardized tests: ${formatStandardizedTests(profile.standardizedTests)}
- Extracurriculars: ${profile.extracurriculars.length ? profile.extracurriculars.join('; ') : 'None provided'}
- AP courses taken: ${profile.apCourses.length ? profile.apCourses.join('; ') : 'None reported'}

Pick the single best-fit field and explain briefly why, citing specific things from both the onboarding answers and the academic profile — not just one or the other.`

  try {
    const call = () =>
      client.responses.parse({
        model: 'gpt-5.6-luna',
        input: [{ role: 'user', content: prompt }],
        text: { format: zodTextFormat(fieldRecommendationSchema, 'field_recommendation') },
      })
    let response = await call()
    if (response.output_parsed && isGarbledStrings([response.output_parsed.rationale])) {
      response = await call()
    }
    if (!response.output_parsed) throw new Error('OpenAI returned no parseable output for the field recommendation request')
    if (isGarbledStrings([response.output_parsed.rationale])) throw new Error('OpenAI returned corrupted output after retry')

    const { field, rationale } = response.output_parsed
    await db
      .update(dreamProfiles)
      .set({ recommendedField: field, recommendedFieldRationale: rationale, updatedAt: new Date() })
      .where(eq(dreamProfiles.userId, userId))
    await db.insert(aiRateLimitLog).values({ userId, action: 'dreamFieldRecommend', ipAddress: clientIp })
    revalidatePath('/dream')

    return { field: field as AcademicField, rationale }
  } catch (err) {
    console.error('recommendDreamField failed:', err)
    return { error: true, message: "We couldn't generate a recommendation right now — the AI service didn't respond. Please try again in a moment." }
  }
}

// Locks in the field the student is actually proceeding with — either the
// AI's recommendation, accepted as-is, or their own override. Everything
// past onboarding reads confirmedField, never recommendedField directly.
export async function confirmDreamField(field: string): Promise<{ success: boolean; message: string }> {
  let userId: string
  try {
    await assertDreamAdmin()
    userId = await getUserId()
  } catch {
    return { success: false, message: 'Your session has expired — please sign in again.' }
  }
  if (!ACADEMIC_FIELDS.includes(field as AcademicField)) {
    return { success: false, message: 'Not a recognized field.' }
  }
  try {
    await db.update(dreamProfiles).set({ confirmedField: field, updatedAt: new Date() }).where(eq(dreamProfiles.userId, userId))
    revalidatePath('/dream')
    return { success: true, message: 'Field confirmed.' }
  } catch (error) {
    console.error('confirmDreamField error:', error)
    return { success: false, message: 'Something went wrong. Please try again.' }
  }
}

// Adds a new country to the student's Build Your Dream dashboard — one row
// per (user, country), idempotent (picking an already-added country just
// returns the existing row rather than erroring). Requires a confirmed
// field first, since every country's analysis is grounded in it.
export async function addDreamCountry(country: string): Promise<{ success: boolean; message: string }> {
  let userId: string
  try {
    await assertDreamAdmin()
    userId = await getUserId()
  } catch {
    return { success: false, message: 'Your session has expired — please sign in again.' }
  }
  if (!APPLICATION_INFO[country]) return { success: false, message: 'Not a supported country.' }

  const dream = await getDreamProfile()
  if (!dream?.confirmedField) return { success: false, message: 'Confirm your field of study first.' }

  try {
    await db.insert(dreamCountryProfiles).values({ userId, country }).onConflictDoNothing()
    revalidatePath('/dream')
    return { success: true, message: 'Country added.' }
  } catch (error) {
    console.error('addDreamCountry error:', error)
    return { success: false, message: 'Something went wrong. Please try again.' }
  }
}

const analysisSchema = z.object({
  strengths: z
    .array(z.string())
    .max(5)
    .describe('Up to 5 specific strengths for this field+country combination, each under 18 words, citing an actual profile detail (academics, tests, AP courses, extracurriculars).'),
  gaps: z
    .array(z.string())
    .max(5)
    .describe('Up to 5 specific gaps for this field+country combination, each under 18 words, citing an actual missing/thin profile detail — spread across different dimensions of the profile, not clustered on one fact.'),
})

export type DreamAnalysisResult = { strengths: string[]; gaps: string[] }

export type AnalyzeDreamOutcome =
  | { needsOnboarding: true }
  | { needsField: true }
  | { needsCountry: true }
  | { needsProfile: true }
  | { rateLimited: true; message: string }
  | { error: true; message: string }
  | ({ error?: false; needsOnboarding?: false; needsField?: false; needsCountry?: false; needsProfile?: false; rateLimited?: false } & DreamAnalysisResult)

// AI call #2 of 2 — analyzes the master profile specifically against the
// confirmed field + this country pair. Deepened per explicit feedback: up
// to 5 points each side instead of the earlier 3-4, spread across the full
// profile rather than clustered on one or two facts.
export async function analyzeDreamProfile(country: string): Promise<AnalyzeDreamOutcome> {
  let userId: string
  let clientIp: string
  try {
    await assertDreamAdmin()
    userId = await getUserId()
    clientIp = await getClientIp()
  } catch (err) {
    return { error: true, message: err instanceof Error && err.message === 'Unauthorized' ? 'Your session has expired — please sign in again.' : 'Something went wrong. Please refresh and try again.' }
  }
  try {
    await assertDreamAnalysisRateLimit(userId, clientIp)
  } catch (err) {
    return { rateLimited: true, message: err instanceof Error ? err.message : 'Rate limit exceeded — please try again later.' }
  }

  const dream = await getDreamProfile()
  if (!dream) return { needsOnboarding: true }
  if (!dream.confirmedField) return { needsField: true }

  const countryRow = await getDreamCountryProfile(country)
  if (!countryRow) return { needsCountry: true }

  const profile = await getLatestProfile()
  if (!profile || !profile.academicDetail) return { needsProfile: true }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return { error: true, message: 'The analysis service is not configured right now. Please try again later.' }

  const badge = gradeBadge(profile.academicDetail)
  const client = new OpenAI({ apiKey })
  const countryInfo = APPLICATION_INFO[country]

  const prompt = `You are an expert college admissions counselor. Give a specific, well-grounded, DEEP analysis of how well this student's existing academic profile fits their chosen field of study and target country — not generic encouragement. Go beyond the obvious: look for second-order signals too (e.g. course rigor trend across years, how a specific extracurricular actually maps to the field, whether test scores are strong enough for THIS country's norm specifically).

${BIAS_INSTRUCTION}

TARGET FIELD: ${dream.confirmedField}
TARGET COUNTRY: ${countryInfo?.name ?? country}
${countryInfo ? `WHAT THIS COUNTRY'S ADMISSIONS ACTUALLY PRIORITIZES: ${countryInfo.prioritizes}` : ''}
${countryInfo ? `HOW EXTRACURRICULARS ARE WEIGHED HERE: ${countryInfo.extracurriculars}` : ''}

STUDENT PROFILE:
- Academics: ${badge}
- Standardized tests: ${formatStandardizedTests(profile.standardizedTests)}
- Extracurriculars: ${profile.extracurriculars.length ? profile.extracurriculars.join('; ') : 'None provided'}
- AP courses taken: ${profile.apCourses.length ? profile.apCourses.join('; ') : 'None reported'}

Identify up to 5 specific strengths and up to 5 specific gaps for THIS field+country combination specifically — e.g. a student with strong grades but no leadership roles is a real gap for a US-style holistic application, but largely irrelevant for a grades-only system, so weigh each point against what this specific country's admissions process above actually prioritizes. Spread points across different dimensions of the profile (academics/rigor, tests, AP courses, extracurriculars, field-specific fit) rather than repeating the same one or two facts in different words. Cite the actual profile detail behind every point — never generic filler.`

  try {
    const call = () =>
      client.responses.parse({
        model: 'gpt-5.6-luna',
        input: [{ role: 'user', content: prompt }],
        text: { format: zodTextFormat(analysisSchema, 'dream_analysis') },
      })
    let response = await call()
    if (response.output_parsed && isGarbledStrings([...response.output_parsed.strengths, ...response.output_parsed.gaps])) {
      response = await call()
    }
    if (!response.output_parsed) throw new Error('OpenAI returned no parseable output for the dream analysis request')
    if (isGarbledStrings([...response.output_parsed.strengths, ...response.output_parsed.gaps])) {
      throw new Error('OpenAI returned corrupted output after retry')
    }

    const { strengths, gaps } = response.output_parsed
    await db
      .update(dreamCountryProfiles)
      .set({ analysisStrengths: strengths, analysisGaps: gaps, updatedAt: new Date() })
      .where(and(eq(dreamCountryProfiles.userId, userId), eq(dreamCountryProfiles.country, country)))
    await db.insert(aiRateLimitLog).values({ userId, action: 'dreamProfileAnalysis', ipAddress: clientIp })
    revalidatePath(`/dream/${country}`)

    return { strengths, gaps }
  } catch (err) {
    console.error('analyzeDreamProfile failed:', err)
    return { error: true, message: "We couldn't analyze your profile right now — the AI service didn't respond. Please try again in a moment." }
  }
}

const roadmapSchema = z.object({
  timeframeSummary: z
    .string()
    .describe(
      'Under 30 words stating plainly how much runway this student has — reference their actual current grade and application year (e.g. "You\'re in 10th grade applying Fall 2028 — about 2.5 years out, still time to build depth.").',
    ),
  steps: z
    .array(
      z.object({
        title: z.string().describe('Under 10 words — a short, concrete action item, e.g. "Take on a leadership role in an existing club".'),
        detail: z
          .string()
          .describe(
            'Under 35 words explaining specifically why this fits THIS student (cite their actual hobbies/interests/strengths from onboarding, or a gap in their current profile) and roughly when to do it given their timeline.',
          ),
        howTo: z
          .array(z.string())
          .max(4)
          .describe(
            'Up to 4 concrete, sequential sub-steps for actually DOING this — real first moves (who to talk to, what to start building, what to sign up for), not restatements of the title. Shown only when the student clicks in for a deeper breakdown, so this should go beyond detail rather than repeat it.',
          ),
      }),
    )
    .max(6)
    .describe('Up to 6 concrete, personalized next steps — extracurriculars to start or deepen, grades to keep up, tests to plan for — ordered roughly by what to prioritize first given the time left.'),
})

export type DreamRoadmapResult = { timeframeSummary: string; steps: { title: string; detail: string; howTo: string[] }[] }

export type GenerateRoadmapOutcome =
  | { needsOnboarding: true }
  | { needsField: true }
  | { needsCountry: true }
  | { needsProfile: true }
  | { rateLimited: true; message: string }
  | { error: true; message: string }
  | ({ error?: false; needsOnboarding?: false; needsField?: false; needsCountry?: false; needsProfile?: false; rateLimited?: false } & DreamRoadmapResult)

// "Build your own profile" — a forward-looking plan (unlike analyzeDreamProfile,
// which grades the profile as it stands today) that reasons from how much
// time the student actually has left (currentGrade + applicationYear from
// onboarding) to pace concrete extracurricular/prep recommendations, tied to
// their own stated hobbies/interests so it reads as personalized guidance,
// not a generic checklist.
export async function generateDreamRoadmap(country: string): Promise<GenerateRoadmapOutcome> {
  let userId: string
  let clientIp: string
  try {
    await assertDreamAdmin()
    userId = await getUserId()
    clientIp = await getClientIp()
  } catch (err) {
    return { error: true, message: err instanceof Error && err.message === 'Unauthorized' ? 'Your session has expired — please sign in again.' : 'Something went wrong. Please refresh and try again.' }
  }
  try {
    await assertDreamAnalysisRateLimit(userId, clientIp)
  } catch (err) {
    return { rateLimited: true, message: err instanceof Error ? err.message : 'Rate limit exceeded — please try again later.' }
  }

  const dream = await getDreamProfile()
  if (!dream) return { needsOnboarding: true }
  if (!dream.confirmedField) return { needsField: true }

  const countryRow = await getDreamCountryProfile(country)
  if (!countryRow) return { needsCountry: true }

  const profile = await getLatestProfile()
  if (!profile || !profile.academicDetail) return { needsProfile: true }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return { error: true, message: 'The roadmap service is not configured right now. Please try again later.' }

  const badge = gradeBadge(profile.academicDetail)
  const client = new OpenAI({ apiKey })
  const countryInfo = APPLICATION_INFO[country]

  const prompt = `You are an expert college admissions counselor building a personalized, time-aware action plan. This is NOT a grading exercise — don't just list gaps. Instead, given how much time this student actually has left before applying, tell them specifically what to do next, paced to their real timeline.

${BIAS_INSTRUCTION}

STUDENT TIMELINE: currently in ${dream.currentGrade ?? 'an unspecified'} grade, planning to start college Fall ${dream.applicationYear ?? 'an unspecified year'}.
TARGET FIELD: ${dream.confirmedField}
TARGET COUNTRY: ${countryInfo?.name ?? country}
${countryInfo ? `HOW EXTRACURRICULARS ARE WEIGHED HERE: ${countryInfo.extracurriculars}` : ''}

WHAT THEY SAID ABOUT THEMSELVES (onboarding):
- Subjects they excel in / enjoy: ${dream.strengths.length ? dream.strengths.join('; ') : 'Not answered'}
- What they spend free time on: ${dream.hobbies || 'Not answered'}
- Real-world problems/industries that excite them: ${[...dream.interests, dream.interestsOther].filter(Boolean).join('; ') || 'Not answered'}

EXISTING ACADEMIC PROFILE:
- Curriculum: ${profile.curriculum}
- Academics: ${badge}
- Extracurriculars already doing: ${profile.extracurriculars.length ? profile.extracurriculars.join('; ') : 'None provided'}
- AP courses taken: ${profile.apCourses.length ? profile.apCourses.join('; ') : 'None reported'}

Give a short timeframe summary (how much runway they actually have), then up to 6 concrete steps — extracurriculars to start or deepen (grounded in their OWN stated hobbies/interests, not generic suggestions), grades/rigor to sustain or improve within their actual curriculum, tests to plan for — each one specific to this exact student and paced against how much time they have left. If they're close to applying, prioritize depth/finishing strong over starting new things; if they have years left, prioritize building genuine, sustained commitment over resume padding. For each step, also give up to 4 concrete "how to" sub-steps — real first moves to actually start doing it, not a restatement of the title.`

  try {
    const call = () =>
      client.responses.parse({
        model: 'gpt-5.6-luna',
        input: [{ role: 'user', content: prompt }],
        text: { format: zodTextFormat(roadmapSchema, 'dream_roadmap') },
      })
    const flatten = (r: z.infer<typeof roadmapSchema>) => [r.timeframeSummary, ...r.steps.flatMap((s) => [s.title, s.detail, ...s.howTo])]
    let response = await call()
    if (response.output_parsed && isGarbledStrings(flatten(response.output_parsed))) {
      response = await call()
    }
    if (!response.output_parsed) throw new Error('OpenAI returned no parseable output for the roadmap request')
    if (isGarbledStrings(flatten(response.output_parsed))) {
      throw new Error('OpenAI returned corrupted output after retry')
    }

    const { timeframeSummary, steps } = response.output_parsed
    await db
      .update(dreamCountryProfiles)
      .set({ roadmapSummary: timeframeSummary, roadmapSteps: steps, updatedAt: new Date() })
      .where(and(eq(dreamCountryProfiles.userId, userId), eq(dreamCountryProfiles.country, country)))
    await db.insert(aiRateLimitLog).values({ userId, action: 'dreamRoadmap', ipAddress: clientIp })
    revalidatePath(`/dream/${country}`)

    return { timeframeSummary, steps }
  } catch (err) {
    console.error('generateDreamRoadmap failed:', err)
    return { error: true, message: "We couldn't build your roadmap right now — the AI service didn't respond. Please try again in a moment." }
  }
}

// Bulk-persists the MANUAL checklist overrides in one write — the student
// toggles freely in the UI (local state only, see components/dream-country-
// workspace.tsx) and this is only called once they press "Save changes",
// deliberately not auto-saved per click. Only ever meaningful for items
// computeAutoChecklistProgress (lib/dream-checklist.ts) can't auto-detect
// from the master profile; auto-detected items ignore this entirely and are
// recomputed fresh on every read.
export async function saveDreamChecklist(country: string, checklist: Record<string, number>): Promise<{ success: boolean; message: string }> {
  let userId: string
  try {
    await assertDreamAdmin()
    userId = await getUserId()
  } catch {
    return { success: false, message: 'Your session has expired — please sign in again.' }
  }
  try {
    await db
      .update(dreamCountryProfiles)
      .set({ checklist, updatedAt: new Date() })
      .where(and(eq(dreamCountryProfiles.userId, userId), eq(dreamCountryProfiles.country, country)))
    revalidatePath(`/dream/${country}`)
    return { success: true, message: 'Saved.' }
  } catch (error) {
    console.error('saveDreamChecklist error:', error)
    return { success: false, message: 'Something went wrong saving your checklist. Please try again.' }
  }
}

export async function getDreamUniversityTracks(country: string) {
  await assertDreamAdmin()
  const userId = await getUserId()
  return db
    .select()
    .from(dreamUniversityTracks)
    .where(and(eq(dreamUniversityTracks.userId, userId), eq(dreamUniversityTracks.country, country)))
    .orderBy(asc(dreamUniversityTracks.createdAt))
}

// Adds a school to this country's "My Universities" list from a Target
// University Analysis result — snapshots the strengths/weaknesses that were
// showing at the time, and seeds its task list with the real generic
// per-college Common App tasks (lib/common-app-sections.ts) plus whatever
// school-specific gaps the analysis surfaced (actionSteps), deduplicated.
// Idempotent: adding an already-added school just returns success.
export async function addUniversityToDreamList(
  country: string,
  universityId: number,
  universityName: string,
  strengths: string[],
  weaknesses: string[],
  schoolSpecificTasks: string[],
): Promise<{ success: boolean; message: string }> {
  let userId: string
  try {
    await assertDreamAdmin()
    userId = await getUserId()
  } catch {
    return { success: false, message: 'Your session has expired — please sign in again.' }
  }
  try {
    const tasks = [...PER_UNIVERSITY_TASK_TEMPLATE, ...schoolSpecificTasks].filter((t, i, arr) => arr.indexOf(t) === i)
    await db
      .insert(dreamUniversityTracks)
      .values({ userId, country, universityId, universityName, strengths, weaknesses, tasks })
      .onConflictDoNothing()
    revalidatePath(`/dream/${country}`)
    return { success: true, message: 'Added to your list.' }
  } catch (error) {
    console.error('addUniversityToDreamList error:', error)
    return { success: false, message: 'Something went wrong. Please try again.' }
  }
}

// Activities suggested by the roadmap above (or typed in by the student
// themselves) — tracked as "shortlisted" until the student actually marks
// them done. See markSuggestedActivityDone below for what "done" triggers.
export async function getSuggestedActivities() {
  await assertDreamAdmin()
  const userId = await getUserId()
  return db.select().from(profileSuggestedActivities).where(eq(profileSuggestedActivities.userId, userId)).orderBy(asc(profileSuggestedActivities.createdAt))
}

const MAX_ACTIVITY_LENGTH = 200

export async function addSuggestedActivity(text: string): Promise<{ success: boolean; message: string }> {
  let userId: string
  try {
    await assertDreamAdmin()
    userId = await getUserId()
  } catch {
    return { success: false, message: 'Your session has expired — please sign in again.' }
  }
  const trimmed = text.trim()
  if (!trimmed) return { success: false, message: 'Enter an activity.' }
  if (trimmed.length > MAX_ACTIVITY_LENGTH) return { success: false, message: 'That activity is too long.' }
  try {
    await db.insert(profileSuggestedActivities).values({ userId, text: trimmed })
    revalidatePath('/dream')
    revalidatePath('/profile')
    return { success: true, message: 'Added.' }
  } catch (error) {
    console.error('addSuggestedActivity error:', error)
    return { success: false, message: 'Something went wrong. Please try again.' }
  }
}

// Marking an activity "completed" is the one point where Build Your Dream is
// allowed to write into the actual master profile (see
// appendExtracurricularToProfile in app/actions/profile.ts) — everything the
// student hasn't confirmed doing stays "shortlisted" and never reaches the
// real extracurriculars array the rest of the app's AI prompts read from.
export async function markSuggestedActivityDone(id: number): Promise<{ success: boolean; message: string }> {
  let userId: string
  try {
    await assertDreamAdmin()
    userId = await getUserId()
  } catch {
    return { success: false, message: 'Your session has expired — please sign in again.' }
  }
  try {
    const rows = await db
      .select()
      .from(profileSuggestedActivities)
      .where(and(eq(profileSuggestedActivities.id, id), eq(profileSuggestedActivities.userId, userId)))
      .limit(1)
    const row = rows[0]
    if (!row) return { success: false, message: 'Activity not found.' }
    await db.update(profileSuggestedActivities).set({ status: 'completed' }).where(eq(profileSuggestedActivities.id, id))
    await appendExtracurricularToProfile(row.text)
    revalidatePath('/dream')
    revalidatePath('/profile')
    revalidatePath('/dashboard')
    revalidatePath('/matches')
    return { success: true, message: 'Marked complete and added to your profile.' }
  } catch (error) {
    console.error('markSuggestedActivityDone error:', error)
    return { success: false, message: 'Something went wrong. Please try again.' }
  }
}

export async function toggleDreamUniversityTask(country: string, universityId: number, task: string, done: boolean): Promise<{ success: boolean }> {
  let userId: string
  try {
    await assertDreamAdmin()
    userId = await getUserId()
  } catch {
    return { success: false }
  }
  try {
    const rows = await db
      .select()
      .from(dreamUniversityTracks)
      .where(and(eq(dreamUniversityTracks.userId, userId), eq(dreamUniversityTracks.country, country), eq(dreamUniversityTracks.universityId, universityId)))
      .limit(1)
    const nextProgress = { ...(rows[0]?.taskProgress ?? {}), [task]: done ? 100 : 0 }
    await db
      .update(dreamUniversityTracks)
      .set({ taskProgress: nextProgress, updatedAt: new Date() })
      .where(and(eq(dreamUniversityTracks.userId, userId), eq(dreamUniversityTracks.country, country), eq(dreamUniversityTracks.universityId, universityId)))
    revalidatePath(`/dream/${country}`)
    return { success: true }
  } catch (error) {
    console.error('toggleDreamUniversityTask error:', error)
    return { success: false }
  }
}
