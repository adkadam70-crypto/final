// Adds two nullable columns to universities for the estimated-acceptance-rate
// feature. Same raw-SQL approach as every other migrate-*.mjs (drizzle-kit
// push hangs on introspection in this environment).
//
// - estimatedAcceptanceRate (integer, nullable): our own researched estimate
//   of the overall undergraduate acceptance rate, ONLY set where a real
//   actualAcceptanceRate is NOT available and credible data allowed an
//   estimate (>=2 independent sources within tolerance, or direct
//   applicant/admit counts, or structural signals like published Numerus
//   Clausus cutoffs / Parcoursup taux d'acces / entrance-exam seat ratios).
//   Never derived from baselineSelectivity alone. Never set alongside a
//   non-null actualAcceptanceRate. Treated exactly like actualAcceptanceRate
//   downstream: baselineSelectivity is aligned to (100 - estimate) and the
//   match/analysis AI anchors acceptanceProbability on it (flagged as an
//   estimate in the rationale, not stated as a certified figure).
//
// - acceptanceRateNote (text, nullable): the user-facing sentence explaining
//   the rate situation for this row. Either "Estimated ~X% - <basis>. A
//   research estimate, not a figure certified by the university." or "No
//   official acceptance rate - <why>." Left null on rows that carry a real
//   actualAcceptanceRate (acceptanceRateSource already covers those).
//
// Usage: node --env-file=.env.local scripts/migrate-add-estimated-acceptance-rate.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

await sql`ALTER TABLE universities ADD COLUMN IF NOT EXISTS "estimatedAcceptanceRate" integer`
await sql`ALTER TABLE universities ADD COLUMN IF NOT EXISTS "acceptanceRateNote" text`

console.log('Added estimatedAcceptanceRate, acceptanceRateNote columns to universities.')
