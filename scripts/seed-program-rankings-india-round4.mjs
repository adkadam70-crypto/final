// Program-specific rankings for the 2 newly-added India schools that had
// exact NIRF category numbers on file (not just a 101-150 band):
// Manipal University Jaipur and Chitkara University.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-india-round4.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank) {
  return Math.max(15, Math.min(99, Math.round(100 - (rank - 1) * 1.1)))
}

const ENTRIES = [
  { name: 'Manipal University Jaipur', field: 'Engineering', rank: 58, category: 'Engineering' },
  { name: 'Manipal University Jaipur', field: 'Business', rank: 81, category: 'Management' },
  { name: 'Manipal University Jaipur', field: 'Law', rank: 32, category: 'Law' },
  { name: 'Chitkara University', field: 'Engineering', rank: 89, category: 'Engineering' },
  { name: 'Chitkara University', field: 'Business', rank: 78, category: 'Management' },
  { name: 'Chitkara University', field: 'Architecture & Design', rank: 38, category: 'Architecture' },
]

let inserted = 0
let skipped = []

for (const entry of ENTRIES) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${entry.name} AND country = 'IN'`
  if (rows.length === 0) {
    skipped.push(`${entry.name} (${entry.field})`)
    continue
  }
  const universityId = rows[0].id
  const source = `NIRF (National Institutional Ranking Framework) 2025 — ${entry.category} category`
  const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${universityId} AND field = ${entry.field} AND "rankSource" = ${source}`
  if (existing.length > 0) continue

  await sql`
    INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (
      ${universityId}, ${entry.field}, ${entry.rank}, ${source},
      'https://www.nirfindia.org/Rankings/2025/',
      ${selectivityFromRank(entry.rank)},
      'NIRF is India''s official government ranking (Ministry of Education).'
    )
  `
  inserted++
}

console.log(`Inserted ${inserted} program-ranking rows.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
