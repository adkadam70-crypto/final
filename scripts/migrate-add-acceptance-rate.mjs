// Adds actualAcceptanceRate + acceptanceRateSource to universities (see
// lib/db/schema.ts). Same raw-SQL approach as migrate-add-program-rankings.mjs
// — drizzle-kit push hangs on introspection in this environment.
// Usage: node --env-file=.env.local scripts/migrate-add-acceptance-rate.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

await sql`ALTER TABLE universities ADD COLUMN IF NOT EXISTS "actualAcceptanceRate" integer`
await sql`ALTER TABLE universities ADD COLUMN IF NOT EXISTS "acceptanceRateSource" text`

console.log('Added actualAcceptanceRate + acceptanceRateSource columns to universities.')
