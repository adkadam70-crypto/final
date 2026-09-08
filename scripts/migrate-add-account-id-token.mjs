// Adds the "idToken" column to the account table (better-auth's own schema,
// see lib/db/auth-schema.ts) — required for Google sign-in, which returns an
// OIDC id_token (its scope includes 'openid') that better-auth persists on
// the linked account row. Missing until now because this schema predates
// any social provider. Same raw-SQL approach as every other migrate-*.mjs —
// drizzle-kit push hangs on introspection in this environment.
//
// Usage: node --env-file=.env.local scripts/migrate-add-account-id-token.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

await sql`ALTER TABLE account ADD COLUMN IF NOT EXISTS "idToken" text`

console.log('Added idToken column to account.')
