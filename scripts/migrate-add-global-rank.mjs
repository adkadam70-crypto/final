// Adds globalRankValue + globalRankSource — see lib/db/schema.ts for why
// this is deliberately separate from rankValue/rankSource (country-specific)
// and never read by the AI prompts (display-only, so it can't skew a
// country-filtered chance calculation).
// Usage: node --env-file=.env.local scripts/migrate-add-global-rank.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

await sql`ALTER TABLE universities ADD COLUMN IF NOT EXISTS "globalRankValue" integer`
await sql`ALTER TABLE universities ADD COLUMN IF NOT EXISTS "globalRankSource" text`

console.log('Added globalRankValue + globalRankSource columns to universities.')
