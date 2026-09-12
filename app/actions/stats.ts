'use server'

import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { matches, profiles } from '@/lib/db/schema'

export type LiveStats = { matchesRun: number; studentsConnected: number }

// Real, live counts from the database — shown on the landing page's live
// counter. Never estimated or padded: this site's whole pitch is "real
// data, never a guess dressed up as fact," so a fake/incrementing visitor
// counter would directly contradict that. Aggregate counts only (no user
// data), safe to expose publicly and cheap enough to run on every landing
// page load without a cache.
export async function getLiveStats(): Promise<LiveStats> {
  try {
    const [matchesRow] = await db.select({ count: sql<number>`count(*)::int` }).from(matches)
    const [studentsRow] = await db.select({ count: sql<number>`count(*)::int` }).from(profiles)
    return {
      matchesRun: matchesRow?.count ?? 0,
      studentsConnected: studentsRow?.count ?? 0,
    }
  } catch (err) {
    console.error('getLiveStats failed:', err)
    return { matchesRun: 0, studentsConnected: 0 }
  }
}
