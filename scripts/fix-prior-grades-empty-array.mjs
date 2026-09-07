// One-off: normalize profiles.priorGrades rows that were stored as an empty
// array [] (an early-save-path artifact — the column is nullable and the
// current form writes a proper { ninthTenth, eleventh } object). 37 of 107
// rows had [], which is not the PriorGrades shape, so formatPriorGrades()
// threw on `p.ninthTenth.curriculum` and the AI actions surfaced it as
// "Something went wrong…" (and, before that fix, React #441). The code is
// now defensive too, but the data should still match the schema.
//
// Usage: node --import ./scripts/_dns-fix.mjs --env-file=.env scripts/fix-prior-grades-empty-array.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const before = (await sql`SELECT count(*)::int AS c FROM profiles WHERE jsonb_typeof("priorGrades") = 'array'`)[0].c
await sql`UPDATE profiles SET "priorGrades" = NULL WHERE jsonb_typeof("priorGrades") = 'array'`
const after = (await sql`SELECT count(*)::int AS c FROM profiles WHERE jsonb_typeof("priorGrades") = 'array'`)[0].c

console.log(`profiles.priorGrades: reset ${before} array rows to NULL (remaining arrays: ${after}).`)
