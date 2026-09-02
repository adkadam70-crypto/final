// India rank backfill pass #3 — NIRF's "College" category is a parallel
// OVERALL ranking track for standalone undergraduate colleges (as
// distinct from "University"), so this fills universities.rankValue for
// the catalog's college-named entries the same way seed-overall-rankings-
// india.mjs did for universities, rather than treating it as a
// programRankings row (it isn't a subject-specific ranking).
//
// Usage: node --env-file=.env.local scripts/seed-overall-rankings-india-round3.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const RANK_SOURCE = 'NIRF (National Institutional Ranking Framework) 2025 — College category'
const RANK_SOURCE_URL = 'https://www.nirfindia.org/Rankings/2025/CollegeRanking.html'

const ENTRIES = [
  { name: 'Hindu College, Delhi', rank: 1 },
  { name: 'Miranda House, Delhi', rank: 2 },
  { name: 'Hansraj College', rank: 3 },
  { name: 'Kirori Mal College', rank: 4 },
  { name: "St. Stephen's College, Delhi", rank: 5 },
  { name: 'Loyola College, Chennai', rank: 14 },
  { name: 'Lady Shri Ram College for Women', rank: 17 },
  { name: 'Shri Ram College of Commerce', rank: 18 },
  { name: 'Fergusson College, Pune', rank: 57 },
]

let updated = 0
let skipped = []

for (const entry of ENTRIES) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${entry.name} AND country = 'IN'`
  if (rows.length === 0) {
    skipped.push(entry.name)
    continue
  }
  await sql`UPDATE universities SET "rankSource" = ${RANK_SOURCE}, "rankValue" = ${entry.rank} WHERE id = ${rows[0].id}`
  updated++
}

console.log(`Updated overall rank for ${updated} India college entries.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
