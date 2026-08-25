'use server'

import { db } from '@/lib/db'
import { savedSchools, type ApplicationStatus } from '@/lib/db/schema'
import { and, desc, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getUserId } from '@/lib/get-user-id'

export async function getSavedSchools() {
  const userId = await getUserId()
  const rows = await db.select().from(savedSchools).where(eq(savedSchools.userId, userId)).orderBy(desc(savedSchools.createdAt))
  return rows.map((r) => ({
    id: r.id,
    universityId: r.universityId,
    universityName: r.universityName,
    universityLocation: r.universityLocation,
    matchTier: r.matchTier,
    acceptanceProbability: r.acceptanceProbability,
    applicationStatus: r.applicationStatus as ApplicationStatus,
    createdAt: r.createdAt,
  }))
}

/**
 * Simple hash function to convert string IDs to integers
 * Used for compatibility when university IDs are text but need to be stored as integers
 */
function hashStringToInt(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash % 2147483647) || 1 // Ensure positive non-zero number
}

/**
 * Convert universityId to integer format for database storage
 */
function toIntegerId(id: string | number): number {
  if (typeof id === 'number') return id
  const parsed = parseInt(id, 10)
  return isNaN(parsed) ? hashStringToInt(id) : parsed
}

export async function saveSchool(input: {
  universityId: string | number
  universityName: string
  universityLocation: string
  matchTier: string
  acceptanceProbability: number
}) {
  const userId = await getUserId()
  const universityIdNum = toIntegerId(input.universityId)
  const existing = await db
    .select()
    .from(savedSchools)
    .where(and(eq(savedSchools.userId, userId), eq(savedSchools.universityId, universityIdNum)))
    .limit(1)
  if (existing.length > 0) return { saved: false, message: 'Already saved' }
  await db.insert(savedSchools).values({
    userId,
    universityId: universityIdNum,
    universityName: input.universityName,
    universityLocation: input.universityLocation,
    matchTier: input.matchTier,
    acceptanceProbability: input.acceptanceProbability,
    applicationStatus: 'Researching',
  })
  revalidatePath('/saved')
  revalidatePath('/dashboard')
  return { saved: true, message: 'School saved' }
}

export async function unsaveSchool(universityId: string | number) {
  const userId = await getUserId()
  const universityIdNum = toIntegerId(universityId)
  await db
    .delete(savedSchools)
    .where(and(eq(savedSchools.userId, userId), eq(savedSchools.universityId, universityIdNum)))
  revalidatePath('/saved')
  revalidatePath('/dashboard')
}

export async function updateApplicationStatus(id: number, status: ApplicationStatus) {
  const userId = await getUserId()
  await db.update(savedSchools).set({ applicationStatus: status }).where(and(eq(savedSchools.id, id), eq(savedSchools.userId, userId)))
  revalidatePath('/saved')
  revalidatePath('/dashboard')
}

export async function getSavedSchoolIds(): Promise<(string | number)[]> {
  const userId = await getUserId()
  const rows = await db
    .select({ universityId: savedSchools.universityId })
    .from(savedSchools)
    .where(eq(savedSchools.userId, userId))
  return rows.map((r) => r.universityId)
}
