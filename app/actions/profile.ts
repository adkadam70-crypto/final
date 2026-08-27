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
export async function saveProfile(input: SaveProfileInput): Promise<{ success: boolean; message: string }> {
  const userId = await getUserId()

  if (input.targetCountries.length === 0) throw new Error('Select at least one target country.')

  const validationError =
    validateAcademicDetail(input.academicDetail) ??
    validateStandardizedTests(input.standardizedTests) ??
    validatePriorGrades(input.priorGrades)
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
