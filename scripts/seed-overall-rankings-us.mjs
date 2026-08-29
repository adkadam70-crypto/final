// General/overall ranking pass — fills universities.rankSource/rankValue
// (these columns existed in the schema from the start but were 100% empty
// across all 399 rows). This is the fallback the AI is told to cite as
// "#28 overall" when no program-specific ranking row exists for a school —
// distinct from programRankings, which is specifically per-field.
//
// Source: U.S. News & World Report — 2026 Best National Universities.
// Cross-checked across three independent sources after finding a discrepancy
// on Berkeley/Rice/Vanderbilt/WashU's exact positions between two secondary
// articles — resolved via UC Berkeley's own press office and the University
// of California system's own announcement (both confirm Berkeley #15, not
// #17), then matched against a third source's complete top-25 table that
// agreed with that data point everywhere else too.
//
// Usage: node --env-file=.env.local scripts/seed-overall-rankings-us.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const RANK_SOURCE = 'U.S. News & World Report — 2026 Best National Universities'
const RANK_SOURCE_URL = 'https://www.usnews.com/best-colleges/rankings/national-universities'

const ENTRIES = [
  { name: 'Princeton University', rank: 1 },
  { name: 'Massachusetts Institute of Technology', rank: 2 },
  { name: 'Harvard University', rank: 3 },
  { name: 'Stanford University', rank: 4 },
  { name: 'Yale University', rank: 4 },
  { name: 'University of Chicago', rank: 6 },
  { name: 'Duke University', rank: 7 },
  { name: 'Johns Hopkins University', rank: 7 },
  { name: 'Northwestern University', rank: 7 },
  { name: 'University of Pennsylvania', rank: 7 },
  { name: 'California Institute of Technology', rank: 11 },
  { name: 'Cornell University', rank: 12 },
  { name: 'Brown University', rank: 13 },
  { name: 'Dartmouth College', rank: 13 },
  { name: 'Columbia University', rank: 15 },
  { name: 'University of California, Berkeley', rank: 15 },
  { name: 'Rice University', rank: 17 },
  { name: 'University of California, Los Angeles', rank: 17 },
  { name: 'Vanderbilt University', rank: 17 },
  { name: 'Carnegie Mellon University', rank: 20 },
  { name: 'University of Michigan', rank: 20 },
  { name: 'University of Notre Dame', rank: 20 },
  { name: 'Washington University in St. Louis', rank: 20 },
  { name: 'Emory University', rank: 24 },
  { name: 'Georgetown University', rank: 24 },
]

let updated = 0
let skipped = []

for (const entry of ENTRIES) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${entry.name} AND country = 'US'`
  if (rows.length === 0) {
    skipped.push(entry.name)
    continue
  }
  await sql`UPDATE universities SET "rankSource" = ${RANK_SOURCE}, "rankValue" = ${entry.rank} WHERE id = ${rows[0].id}`
  updated++
}

console.log(`Updated overall rank for ${updated} US schools.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
