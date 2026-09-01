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

function validateFreeTextLengths(input: SaveProfileInput): string | null {
  if (input.curriculum.length > MAX_FIELD_LENGTH) return 'Curriculum value is too long.'
  if (input.preferredClimate.length > MAX_FIELD_LENGTH) return 'Preferred climate value is too long.'
  if (input.preferredSector.length > MAX_FIELD_LENGTH) return 'Preferred sector value is too long.'
  if (input.preferredRank.length > MAX_FIELD_LENGTH) return 'Preferred rank value is too long.'
  if (input.intendedField.length > MAX_FIELD_LENGTH) return 'Intended field value is too long.'

  if (input.extracurriculars.length > MAX_EXTRACURRICULARS) return `Enter at most ${MAX_EXTRACURRICULARS} extracurricular entries.`
  if (input.extracurriculars.some((e) => e.length > MAX_FIELD_LENGTH)) return 'One of your extracurricular entries is too long.'

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
  const userId = await getUserId()

  if (input.targetCountries.length === 0) throw new Error('Select at least one target country.')

  const validationError =
    validateAcademicDetail(input.academicDetail) ??
    validateStandardizedTests(input.standardizedTests) ??
    validatePriorGrades(input.priorGrades) ??
    validateFreeTextLengths(input)
  if (validationError) throw new Error(validationError)

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
    const errorMessage = error instanceof Error ? error.message : 'Failed to save profile'
    console.error('Profile save error:', errorMessage)
    throw new Error(`Failed to save profile: ${errorMessage}`)
  }
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
