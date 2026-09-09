import { db } from '@/lib/db'
import { matches, universityAnalyses, aiRateLimitLog } from '@/lib/db/schema'
import { user } from '@/lib/db/auth-schema'
import { and, eq, gte, sql } from 'drizzle-orm'
import { notifyAdmin } from '@/lib/notify'

// Fires the admin alert at most once per user per action per window. The
// old approach ("count === limit") was wrong: a blocked request never
// inserts a history row, so the count stays pinned exactly at the limit and
// every subsequent blocked attempt re-triggered the email — the exact flood
// it was meant to prevent. Instead, drop a "<action>:blocked" marker into
// aiRateLimitLog on the first breach and check for it before alerting.
async function alertOnceOnBreach(
  userId: string,
  ip: string,
  action: string,
  limit: string,
  windowMinutes: number,
) {
  const marker = `${action}:blocked`
  const since = new Date(Date.now() - windowMinutes * 60_000)
  try {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(aiRateLimitLog)
      .where(and(eq(aiRateLimitLog.userId, userId), eq(aiRateLimitLog.action, marker), gte(aiRateLimitLog.createdAt, since)))
    if (Number(count) > 0) return // already alerted this window
    await db.insert(aiRateLimitLog).values({ userId, action: marker, ipAddress: ip })

    const [row] = await db.select({ name: user.name, email: user.email }).from(user).where(eq(user.id, userId))
    void notifyAdmin(
      `Rate limit hit: ${action}`,
      `<p><strong>${row?.name ?? 'Unknown user'}</strong> (${row?.email ?? userId}) hit the ${action} limit (${limit}).</p><p>IP: ${ip}</p>`,
    )
  } catch {
    // A logging/alert failure must never block the rate-limit response.
  }
}

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

const DREAM_FIELD_LIMIT = 8
const DREAM_FIELD_WINDOW_MINUTES = 15

const DREAM_ANALYSIS_LIMIT = 8
const DREAM_ANALYSIS_WINDOW_MINUTES = 15

// Per-account limits above are easy to multiply by signing up with several
// emails (the signup-fingerprint throttle in lib/auth.ts raises the cost of
// that, but doesn't make it impossible). These were a looser backstop on the
// same IP across ALL accounts using it, meant to blunt someone farming
// accounts from one connection — DISABLED for now per owner request: a
// school/office network with several real students on it is exactly the
// case this risked blocking, and the same-IP signup alert added in
// lib/auth.ts already surfaces that pattern for manual review instead. Kept
// here, unused, in case IP-level blocking is wanted again later.
const IP_MATCH_LIMIT = 20
const IP_ANALYSIS_LIMIT = 30
const IP_PROFILE_STRENGTH_LIMIT = 40
void IP_MATCH_LIMIT
void IP_ANALYSIS_LIMIT
void IP_PROFILE_STRENGTH_LIMIT

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
  try {
    ;[{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(matches)
      .where(and(eq(matches.userId, userId), gte(matches.createdAt, since)))
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Rate limit check failed'
    throw new Error(`Rate limit check failed: ${message}`)
  }
  if (Number(count) >= MATCH_LIMIT) {
    void alertOnceOnBreach(userId, ip, 'Run Match', `${MATCH_LIMIT}/${MATCH_WINDOW_MINUTES}min`, MATCH_WINDOW_MINUTES)
    throw new Error(
      `You've run a match ${MATCH_LIMIT} times in the last ${MATCH_WINDOW_MINUTES} minutes — please wait a few minutes before running another.`,
    )
  }
  // IP-level check disabled — see comment above IP_MATCH_LIMIT.
}

export async function assertAnalysisRateLimit(userId: string, ip: string) {
  const since = new Date(Date.now() - ANALYSIS_WINDOW_MINUTES * 60_000)
  let count: number
  try {
    ;[{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(universityAnalyses)
      .where(and(eq(universityAnalyses.userId, userId), gte(universityAnalyses.createdAt, since)))
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Rate limit check failed'
    throw new Error(`Rate limit check failed: ${message}`)
  }
  if (Number(count) >= ANALYSIS_LIMIT) {
    void alertOnceOnBreach(userId, ip, 'Target University Analysis', `${ANALYSIS_LIMIT}/${ANALYSIS_WINDOW_MINUTES}min`, ANALYSIS_WINDOW_MINUTES)
    throw new Error(
      `You've reached your limit of ${ANALYSIS_LIMIT} school lookups every ${ANALYSIS_WINDOW_MINUTES} minutes. Please try again after your current limit resets.`,
    )
  }
  // IP-level check disabled — see comment above IP_ANALYSIS_LIMIT.
}

// analyzeProfileStrength has no history table of its own to count against
// (it doesn't persist a result anywhere), so this logs a row to the generic
// aiRateLimitLog ledger on every allowed call — caller is responsible for
// that insert (see app/actions/profile-strength.ts) since a rejected call
// shouldn't count against the window it just got blocked by.
export async function assertProfileStrengthRateLimit(userId: string, ip: string) {
  const since = new Date(Date.now() - PROFILE_STRENGTH_WINDOW_MINUTES * 60_000)
  let count: number
  try {
    ;[{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(aiRateLimitLog)
      .where(and(eq(aiRateLimitLog.userId, userId), eq(aiRateLimitLog.action, 'profileStrength'), gte(aiRateLimitLog.createdAt, since)))
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Rate limit check failed'
    throw new Error(`Rate limit check failed: ${message}`)
  }
  if (Number(count) >= PROFILE_STRENGTH_LIMIT) {
    void alertOnceOnBreach(userId, ip, 'Profile Strength', `${PROFILE_STRENGTH_LIMIT}/${PROFILE_STRENGTH_WINDOW_MINUTES}min`, PROFILE_STRENGTH_WINDOW_MINUTES)
    throw new Error(
      `You've checked your profile strength ${PROFILE_STRENGTH_LIMIT} times in the last ${PROFILE_STRENGTH_WINDOW_MINUTES} minutes — please wait a few minutes before trying again.`,
    )
  }
  // IP-level check disabled — see comment above IP_PROFILE_STRENGTH_LIMIT.
}

// Same shape as assertProfileStrengthRateLimit — no dedicated history table
// for either "Build Your Dream" AI call, so both log to the generic
// aiRateLimitLog ledger (caller inserts on an allowed call, see
// app/actions/dream.ts).
export async function assertDreamFieldRateLimit(userId: string, ip: string) {
  const since = new Date(Date.now() - DREAM_FIELD_WINDOW_MINUTES * 60_000)
  let count: number
  try {
    ;[{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(aiRateLimitLog)
      .where(and(eq(aiRateLimitLog.userId, userId), eq(aiRateLimitLog.action, 'dreamFieldRecommend'), gte(aiRateLimitLog.createdAt, since)))
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Rate limit check failed'
    throw new Error(`Rate limit check failed: ${message}`)
  }
  if (Number(count) >= DREAM_FIELD_LIMIT) {
    void alertOnceOnBreach(userId, ip, 'Dream Field Recommendation', `${DREAM_FIELD_LIMIT}/${DREAM_FIELD_WINDOW_MINUTES}min`, DREAM_FIELD_WINDOW_MINUTES)
    throw new Error(
      `You've requested a field recommendation ${DREAM_FIELD_LIMIT} times in the last ${DREAM_FIELD_WINDOW_MINUTES} minutes — please wait a few minutes before trying again.`,
    )
  }
}

export async function assertDreamAnalysisRateLimit(userId: string, ip: string) {
  const since = new Date(Date.now() - DREAM_ANALYSIS_WINDOW_MINUTES * 60_000)
  let count: number
  try {
    ;[{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(aiRateLimitLog)
      .where(and(eq(aiRateLimitLog.userId, userId), eq(aiRateLimitLog.action, 'dreamProfileAnalysis'), gte(aiRateLimitLog.createdAt, since)))
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Rate limit check failed'
    throw new Error(`Rate limit check failed: ${message}`)
  }
  if (Number(count) >= DREAM_ANALYSIS_LIMIT) {
    void alertOnceOnBreach(userId, ip, 'Dream Profile Analysis', `${DREAM_ANALYSIS_LIMIT}/${DREAM_ANALYSIS_WINDOW_MINUTES}min`, DREAM_ANALYSIS_WINDOW_MINUTES)
    throw new Error(
      `You've re-analyzed your dream profile ${DREAM_ANALYSIS_LIMIT} times in the last ${DREAM_ANALYSIS_WINDOW_MINUTES} minutes — please wait a few minutes before trying again.`,
    )
  }
}
