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

const ANALYSIS_LIMIT = 5
const ANALYSIS_WINDOW_MINUTES = 15

const PROFILE_STRENGTH_LIMIT = 10
const PROFILE_STRENGTH_WINDOW_MINUTES = 10

// Per-account limits above are easy to multiply by signing up with several
// emails (the signup-fingerprint throttle in lib/auth.ts raises the cost of
// that, but doesn't make it impossible). These are a much looser backstop on
// the same IP across ALL accounts using it — set high enough that a school
// or office network full of legitimate simultaneous users won't hit it, but
// low enough to blunt someone farming accounts from one connection.
const IP_MATCH_LIMIT = 20
const IP_ANALYSIS_LIMIT = 30
const IP_PROFILE_STRENGTH_LIMIT = 40

async function countByIp(table: typeof matches | typeof universityAnalyses | typeof aiRateLimitLog, ip: string, since: Date, extra?: ReturnType<typeof eq>) {
  if (ip === 'unknown') return 0
  const conditions = [eq(table.ipAddress, ip), gte(table.createdAt, since)]
  if (extra) conditions.push(extra)
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(table)
    .where(and(...conditions))
  return Number(count)
}

// Neon's Drizzle adapter throws a non-serializable error class that fails to
// cross the Server Action boundary in production (surfaces as an opaque
// "Minified React error #441") — same issue documented in get-user-id.ts.
// Normalize to a plain Error in all three rate-limit checks below.
export async function assertMatchRateLimit(userId: string, ip: string) {
  const since = new Date(Date.now() - MATCH_WINDOW_MINUTES * 60_000)
  let count: number
  let ipCount: number
  try {
    ;[{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(matches)
      .where(and(eq(matches.userId, userId), gte(matches.createdAt, since)))
    ipCount = await countByIp(matches, ip, since)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Rate limit check failed'
    throw new Error(`Rate limit check failed: ${message}`)
  }
  if (Number(count) >= MATCH_LIMIT) {
    throw new Error(
      `You've run a match ${MATCH_LIMIT} times in the last ${MATCH_WINDOW_MINUTES} minutes — please wait a few minutes before running another.`,
    )
  }
  if (ipCount >= IP_MATCH_LIMIT) {
    throw new Error(`Too many matches have been run from this network recently — please wait a few minutes before trying again.`)
  }
}

export async function assertAnalysisRateLimit(userId: string, ip: string) {
  const since = new Date(Date.now() - ANALYSIS_WINDOW_MINUTES * 60_000)
  let count: number
  let ipCount: number
  try {
    ;[{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(universityAnalyses)
      .where(and(eq(universityAnalyses.userId, userId), gte(universityAnalyses.createdAt, since)))
    ipCount = await countByIp(universityAnalyses, ip, since)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Rate limit check failed'
    throw new Error(`Rate limit check failed: ${message}`)
  }
  if (Number(count) >= ANALYSIS_LIMIT) {
    throw new Error(
      `You've analyzed ${ANALYSIS_LIMIT} schools in the last ${ANALYSIS_WINDOW_MINUTES} minutes — please wait a few minutes before trying another.`,
    )
  }
  if (ipCount >= IP_ANALYSIS_LIMIT) {
    throw new Error(`Too many analyses have been run from this network recently — please wait a few minutes before trying again.`)
  }
}

// analyzeProfileStrength has no history table of its own to count against
// (it doesn't persist a result anywhere), so this logs a row to the generic
// aiRateLimitLog ledger on every allowed call — caller is responsible for
// that insert (see app/actions/profile-strength.ts) since a rejected call
// shouldn't count against the window it just got blocked by.
export async function assertProfileStrengthRateLimit(userId: string, ip: string) {
  const since = new Date(Date.now() - PROFILE_STRENGTH_WINDOW_MINUTES * 60_000)
  let count: number
  let ipCount: number
  try {
    ;[{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(aiRateLimitLog)
      .where(and(eq(aiRateLimitLog.userId, userId), eq(aiRateLimitLog.action, 'profileStrength'), gte(aiRateLimitLog.createdAt, since)))
    ipCount = await countByIp(aiRateLimitLog, ip, since, eq(aiRateLimitLog.action, 'profileStrength'))
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Rate limit check failed'
    throw new Error(`Rate limit check failed: ${message}`)
  }
  if (Number(count) >= PROFILE_STRENGTH_LIMIT) {
    throw new Error(
      `You've checked your profile strength ${PROFILE_STRENGTH_LIMIT} times in the last ${PROFILE_STRENGTH_WINDOW_MINUTES} minutes — please wait a few minutes before trying again.`,
    )
  }
  if (ipCount >= IP_PROFILE_STRENGTH_LIMIT) {
    throw new Error(`Too many profile-strength checks have been run from this network recently — please wait a few minutes before trying again.`)
  }
}
