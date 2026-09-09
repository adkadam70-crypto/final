'use server'

import { db } from '@/lib/db'
import { profiles } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getUserId } from '@/lib/get-user-id'
import { computeGradeValue, validateAcademicDetail, type AcademicDetail } from '@/lib/academic-detail'
import { validateStandardizedTests, type StandardizedTests } from '@/lib/standardized-tests'
import { validatePriorGrades, type PriorGrades } from '@/lib/prior-grades'

export type SaveProfileInput = {
  targetCountries: string[]
  curriculum: string
  academicDetail: AcademicDetail
  standardizedTests: StandardizedTests
  priorGrades: PriorGrades
  preferredClimate: string
  preferredSector: string
  preferredRank: string
  intendedField: string
  extracurriculars: string[]
  apCourses: string[]
}

/**
 * Saves a student profile to the database without running AI matching.
 * This is used by the profile form to persist user data.
 */
// Free-text fields have no natural upper bound from the client (the UI's
// character counters are cosmetic — a request built directly against this
// action, bypassing the form, could send arbitrary-length strings). Every
// one of these flows into an OpenAI prompt, so an unbounded string is a
// real cost/DoS vector, not just a cosmetic concern. Caps here are
// deliberately generous — well above anything a real user would ever type —
// so this only ever rejects abuse, never a genuine profile.
const MAX_FIELD_LENGTH = 500
const MAX_EXTRACURRICULARS = 20
const MAX_SUBJECTS = 10
// Generous headroom above the real AP catalog size (42 courses as of this
// session, see lib/ap-courses.ts) — this caps abuse, not genuine use.
const MAX_AP_COURSES = 50

function validateFreeTextLengths(input: SaveProfileInput): string | null {
  if (input.curriculum.length > MAX_FIELD_LENGTH) return 'Curriculum value is too long.'
  if (input.preferredClimate.length > MAX_FIELD_LENGTH) return 'Preferred climate value is too long.'
  if (input.preferredSector.length > MAX_FIELD_LENGTH) return 'Preferred sector value is too long.'
  if (input.preferredRank.length > MAX_FIELD_LENGTH) return 'Preferred rank value is too long.'
  if (input.intendedField.length > MAX_FIELD_LENGTH) return 'Intended field value is too long.'

  if (input.extracurriculars.length > MAX_EXTRACURRICULARS) return `Enter at most ${MAX_EXTRACURRICULARS} extracurricular entries.`
  if (input.extracurriculars.some((e) => e.length > MAX_FIELD_LENGTH)) return 'One of your extracurricular entries is too long.'

  if (input.apCourses.length > MAX_AP_COURSES) return `Enter at most ${MAX_AP_COURSES} AP courses.`
  if (input.apCourses.some((c) => c.length > MAX_FIELD_LENGTH)) return 'One of your AP course entries is too long.'

  if ('subjects' in input.academicDetail) {
    if (input.academicDetail.subjects.length > MAX_SUBJECTS) return `Enter at most ${MAX_SUBJECTS} subjects.`
    const tooLong = input.academicDetail.subjects.some((s) => ('name' in s ? s.name : s.subjectName).length > MAX_FIELD_LENGTH)
    if (tooLong) return 'One of your subject names is too long.'
  }

  for (const y of [input.priorGrades.ninthTenth.grade9, input.priorGrades.ninthTenth.grade10]) {
    if (y.note && y.note.length > MAX_FIELD_LENGTH) return 'One of your 9th/10th grade notes is too long.'
  }

  return null
}

export async function saveProfile(input: SaveProfileInput): Promise<{ success: boolean; message: string }> {
  let userId: string
  try {
    userId = await getUserId()
  } catch (err) {
    // Return, don't throw — a thrown Error from a Server Action reaches the
    // user as an opaque "Minified React error #441" (see
    // app/actions/analyze-target-university.ts).
    return {
      success: false,
      message: err instanceof Error && err.message === 'Unauthorized'
        ? 'Your session has expired — please sign in again.'
        : 'Something went wrong. Please refresh and try again.',
    }
  }

  if (input.targetCountries.length === 0) {
    return { success: false, message: 'Select at least one target country.' }
  }

  let validationError: string | null = null
  try {
    validationError =
      validateAcademicDetail(input.academicDetail) ??
      validateStandardizedTests(input.standardizedTests) ??
      validatePriorGrades(input.priorGrades) ??
      validateFreeTextLengths(input)
  } catch {
    // A malformed request body (e.g. priorGrades that isn't the expected
    // shape) should be rejected, not crash the action.
    return { success: false, message: 'Your profile data looks malformed. Please reload the page and try again.' }
  }
  if (validationError) {
    return { success: false, message: validationError }
  }

  try {
    await db
      .insert(profiles)
      .values({
        userId,
        targetCountries: input.targetCountries,
        curriculum: input.curriculum,
        gradeValue: computeGradeValue(input.academicDetail),
        academicDetail: input.academicDetail,
        standardizedTests: input.standardizedTests,
        priorGrades: input.priorGrades,
        preferredClimate: input.preferredClimate,
        preferredSector: input.preferredSector,
        preferredRank: input.preferredRank,
        intendedField: input.intendedField,
        extracurriculars: input.extracurriculars,
        apCourses: input.apCourses,
      })
      .returning()

    revalidatePath('/profile')
    revalidatePath('/dashboard')
    revalidatePath('/matches')

    return {
      success: true,
      message: `Profile saved successfully for ${input.targetCountries.join(', ')}.`,
    }
  } catch (error) {
    console.error('Profile save error:', error)
    return { success: false, message: 'Something went wrong saving your profile. Please try again in a moment.' }
  }
}

// Folds one more extracurricular into the master profile without touching
// anything else on it — used when a Build Your Dream roadmap suggestion is
// marked "completed" (see markSuggestedActivityDone in app/actions/dream.ts).
// Profiles are insert-only/versioned (see saveProfile above), so this reads
// the latest row and inserts a new one with the same fields plus the
// addition, same pattern as every other profile save.
export async function appendExtracurricularToProfile(text: string): Promise<{ success: boolean; message: string }> {
  const userId = await getUserId()
  const latest = await getLatestProfile()
  if (!latest) return { success: false, message: 'Set up your main profile first.' }
  if (latest.extracurriculars.includes(text)) return { success: true, message: 'Already on your profile.' }

  await db.insert(profiles).values({
    userId,
    targetCountries: latest.targetCountries,
    curriculum: latest.curriculum,
    gradeValue: latest.gradeValue,
    academicDetail: latest.academicDetail,
    standardizedTests: latest.standardizedTests,
    priorGrades: latest.priorGrades,
    preferredClimate: latest.preferredClimate,
    preferredSector: latest.preferredSector,
    preferredRank: latest.preferredRank,
    intendedField: latest.intendedField,
    extracurriculars: [...latest.extracurriculars, text],
    apCourses: latest.apCourses,
  })

  revalidatePath('/profile')
  revalidatePath('/dashboard')
  revalidatePath('/matches')
  return { success: true, message: 'Added to your profile.' }
}

export type ProfileRow = Awaited<ReturnType<typeof getLatestProfile>>

/**
 * Returns the user's most recently saved profile, or null for first-time
 * users who haven't saved one yet — that's an expected state, not a failure.
 */
export async function getLatestProfile() {
  const userId = await getUserId()
  try {
    const rows = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .orderBy(desc(profiles.createdAt))
      .limit(1)
    return rows[0] ?? null
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load latest profile'
    throw new Error(`Failed to load latest profile: ${message}`)
  }
}
