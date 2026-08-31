// Adds Early Decision / Early Action / Regular-Decision-only rate columns to
// universities. Same raw-SQL approach as every other migrate-*.mjs — drizzle-kit
// push hangs on introspection in this environment.
//
// These are distinct from actualAcceptanceRate (the blended overall rate):
// a school like Northeastern publishes ~43% ED vs ~3.83% everyone else,
// blended into one ~5% headline. All nullable — null means "not yet
// researched or doesn't offer this round," never zero.
//
// Usage: node --env-file=.env.local scripts/migrate-add-early-admission.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

await sql`ALTER TABLE universities ADD COLUMN IF NOT EXISTS "earlyDecisionRate" integer`
await sql`ALTER TABLE universities ADD COLUMN IF NOT EXISTS "earlyActionRate" integer`
await sql`ALTER TABLE universities ADD COLUMN IF NOT EXISTS "regularDecisionRate" integer`
await sql`ALTER TABLE universities ADD COLUMN IF NOT EXISTS "earlyAdmissionSource" text`

console.log('Added earlyDecisionRate, earlyActionRate, regularDecisionRate, earlyAdmissionSource columns to universities.')
