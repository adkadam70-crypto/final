import { db } from '@/lib/db'
import { matches, universityAnalyses, aiRateLimitLog } from '@/lib/db/schema'
import { and, eq, gte, sql } from 'drizzle-orm'

// Both AI-calling actions already insert one row per call into their own
// history table (matches, universityAnalyses) with userId + createdAt — that
// existing log doubles as the rate-limit ledger, no new table needed. This
// protects against runaway OpenAI spend (a single match run or analysis is a
// real, non-trivial cost) — not meant to be a tight product-facing limit, a
// real user iterating on their profile a few times a session should never
// hit it.

const MATCH_LIMIT = 5
const MATCH_WINDOW_MINUTES = 10

const ANALYSIS_LIMIT = 10
const ANALYSIS_WINDOW_MINUTES = 10

const PROFILE_STRENGTH_LIMIT = 10
const PROFILE_STRENGTH_WINDOW_MINUTES = 10

export async function assertMatchRateLimit(userId: string) {
  const since = new Date(Date.now() - MATCH_WINDOW_MINUTES * 60_000)
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(matches)
    .where(and(eq(matches.userId, userId), gte(matches.createdAt, since)))
  if (Number(count) >= MATCH_LIMIT) {
    throw new Error(
      `You've run a match ${MATCH_LIMIT} times in the last ${MATCH_WINDOW_MINUTES} minutes — please wait a few minutes before running another.`,
    )
  }
}

export async function assertAnalysisRateLimit(userId: string) {
  const since = new Date(Date.now() - ANALYSIS_WINDOW_MINUTES * 60_000)
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(universityAnalyses)
    .where(and(eq(universityAnalyses.userId, userId), gte(universityAnalyses.createdAt, since)))
  if (Number(count) >= ANALYSIS_LIMIT) {
    throw new Error(
      `You've analyzed ${ANALYSIS_LIMIT} schools in the last ${ANALYSIS_WINDOW_MINUTES} minutes — please wait a few minutes before trying another.`,
    )
  }
}

// analyzeProfileStrength has no history table of its own to count against
// (it doesn't persist a result anywhere), so this logs a row to the generic
// aiRateLimitLog ledger on every allowed call — caller is responsible for
// that insert (see app/actions/profile-strength.ts) since a rejected call
// shouldn't count against the window it just got blocked by.
export async function assertProfileStrengthRateLimit(userId: string) {
  const since = new Date(Date.now() - PROFILE_STRENGTH_WINDOW_MINUTES * 60_000)
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(aiRateLimitLog)
    .where(and(eq(aiRateLimitLog.userId, userId), eq(aiRateLimitLog.action, 'profileStrength'), gte(aiRateLimitLog.createdAt, since)))
  if (Number(count) >= PROFILE_STRENGTH_LIMIT) {
    throw new Error(
      `You've checked your profile strength ${PROFILE_STRENGTH_LIMIT} times in the last ${PROFILE_STRENGTH_WINDOW_MINUTES} minutes — please wait a few minutes before trying again.`,
    )
  }
}
