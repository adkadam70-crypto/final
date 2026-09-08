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

// Every real universityId in this app is a numeric string (MatchResult sets
// it as String(universities.id), an integer PK). The old fallback here
// hashed a non-numeric id into an arbitrary 32-bit int — which could
// silently collide with a *different* real university's row, so a user
// would save "School A" and it would be stored pointing at school #<hash>.
// Reject a non-numeric id instead: it can only mean a bug or a crafted
// request, never a real save.
function toIntegerId(id: string | number): number | null {
  if (typeof id === 'number') return Number.isInteger(id) ? id : null
  return /^\d+$/.test(id.trim()) ? parseInt(id, 10) : null
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
  if (universityIdNum === null) return { saved: false, message: 'Invalid school.' }
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
  if (universityIdNum === null) return
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

// Returns string ids to match MatchResult.universityId (which is a string —
// see lib/db/schema.ts). The saved indicator on /matches compares against
// this set, and a Set<number> never matches a string key, so returning the
// raw integer column here silently broke that indicator for every user.
export async function getSavedSchoolIds(): Promise<string[]> {
  const userId = await getUserId()
  const rows = await db
    .select({ universityId: savedSchools.universityId })
    .from(savedSchools)
    .where(eq(savedSchools.userId, userId))
  return rows.map((r) => String(r.universityId))
}
