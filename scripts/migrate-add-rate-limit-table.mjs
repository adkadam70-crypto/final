// Better Auth's own rate-limit ledger table — needed to switch its storage
// from the default in-memory mode (useless on Vercel's serverless, since
// each cold-start gets fresh memory) to database-backed, so login/sign-up
// rate limiting actually persists across requests.
//
// Usage: node --env-file=.env.local scripts/migrate-add-rate-limit-table.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

await sql`
  CREATE TABLE IF NOT EXISTS "rateLimit" (
    id text PRIMARY KEY,
    key text,
    count integer,
    "lastRequest" bigint
  )
`

console.log('Created rateLimit table.')
