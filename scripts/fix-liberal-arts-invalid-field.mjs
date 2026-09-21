// Fixes 12 India "NIRF College Category" rows that were seeded with
// field = 'Liberal Arts' — not a value in lib/academic-detail.ts's
// ACADEMIC_FIELDS list, so app/actions/match.ts's exact-match query
// (eq(programRankings.field, profile.intendedField)) could never surface
// them to any user; they were silently dead data. Remapped to 'Arts',
// a real ACADEMIC_FIELDS value and a reasonable fit for what these
// schools are (Miranda House, Lady Shri Ram, St. Xavier's — India's
// best-known undergraduate liberal-arts colleges).
//
// Usage: node --env-file=.env.local scripts/fix-liberal-arts-invalid-field.mjs
import { neon } from '@neondatabase/serverless'
const sql = neon(process.env.DATABASE_URL)
const result = await sql`UPDATE "programRankings" SET field = 'Arts' WHERE field = 'Liberal Arts' RETURNING id`
console.log(`Updated ${result.length} rows from 'Liberal Arts' to 'Arts'.`)
