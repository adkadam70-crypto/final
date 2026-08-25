'use server'

import { db } from '@/lib/db'
import { profiles } from '@/lib/db/schema'
import { revalidatePath } from 'next/cache'
import { getUserId } from '@/lib/get-user-id'

export type SaveProfileInput = {
  targetCountry: string
  curriculum: string
  gradeValue: number
  preferredClimate: string
  preferredSector: string
  preferredRank: string
  extracurriculars: string[]
}

/**
 * Saves a student profile to the database without running AI matching.
 * This is used by the profile form to persist user data.
 */
export async function saveProfile(input: SaveProfileInput): Promise<{ success: boolean; message: string }> {
  const userId = await getUserId()

  try {
    const result = await db
      .insert(profiles)
      .values({
        userId,
        targetCountry: input.targetCountry,
        curriculum: input.curriculum,
        gradeValue: input.gradeValue,
        preferredClimate: input.preferredClimate,
        preferredSector: input.preferredSector,
        preferredRank: input.preferredRank,
        extracurriculars: input.extracurriculars,
      })
      .returning()

    revalidatePath('/profile')
    revalidatePath('/dashboard')

    return {
      success: true,
      message: `Profile saved successfully for ${input.targetCountry}.`,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to save profile'
    console.error('Profile save error:', errorMessage)
    throw new Error(`Failed to save profile: ${errorMessage}`)
  }
}
