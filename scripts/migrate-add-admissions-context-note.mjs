// Adds universities.admissionsContextNote / admissionsContextNoteSource — a
// narrow, curated exception field for schools whose headline acceptance rate
// is misleadingly low mainly due to applicant-volume inflation rather than a
// proportional rise in true selectivity (e.g. Northeastern, UChicago).
//
// Usage: node --env-file=.env.local scripts/migrate-add-admissions-context-note.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

await sql`
  ALTER TABLE universities
  ADD COLUMN IF NOT EXISTS "admissionsContextNote" text,
  ADD COLUMN IF NOT EXISTS "admissionsContextNoteSource" text
`

console.log('done')
