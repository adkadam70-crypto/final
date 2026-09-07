// One-off: clear the Target University Analysis cache.
//
// analyzeTargetUniversity() (app/actions/analyze-target-university.ts) stores
// its result per (userId, universityId, profileId) and serves repeat views
// from that row instead of re-calling the model, so a student re-opening the
// same school doesn't see the number drift. That means a prompt change (e.g.
// the SELECTIVITY_CALIBRATION block) does NOT reach anyone who already
// analyzed a school on their current profile until this cache is cleared.
//
// Safe: universityAnalyses is only a cache — every row regenerates on the
// next view (the feature is rate-limited, so no cost spike). The `matches`
// table (saved match-run history) is a separate thing and is NOT touched.
//
// Usage: node --import ./scripts/_dns-fix.mjs --env-file=.env scripts/clear-analysis-cache.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const [{ c: before }] = await sql`SELECT count(*)::int AS c FROM "universityAnalyses"`
await sql`DELETE FROM "universityAnalyses"`
const [{ c: after }] = await sql`SELECT count(*)::int AS c FROM "universityAnalyses"`

console.log(`Cleared the Target Analysis cache: ${before} rows -> ${after}.`)
console.log('Saved match-run history (matches table) was not touched.')
