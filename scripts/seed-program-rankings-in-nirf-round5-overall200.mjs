// Final round of the India push to 218+. NIRF 2024 Overall rank-band
// 151-200 (alphabetical listing, band midpoint used, transparently
// labeled) for 4 more zero-coverage matches.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-in-nirf-round5-overall200.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const SOURCE = 'NIRF (National Institutional Ranking Framework) 2024 — Overall category (estimated from band 151–200)'
const URL = 'https://www.nirfindia.org/Rankings/2024/OverallRanking200.html'
const NOTE = 'NIRF band-only listing beyond rank 150, alphabetical order, no individual numeric rank stated — value is the band midpoint.'

const DATA = [
  ['Kalinga University', 175],
  ['Manipur University', 175],
  ['Visva-Bharati University', 175],
  ['North-Eastern Hill University', 175],
]

let inserted = 0
const skipped = []

for (const [name, rank] of DATA) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'IN'`
  if (rows.length === 0) {
    skipped.push(name)
    continue
  }
  const universityId = rows[0].id
  const field = 'Science & Technology / Research'
  const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${universityId} AND field = ${field} AND "rankSource" = ${SOURCE}`
  if (existing.length > 0) continue

  await sql`
    INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (${universityId}, ${field}, ${rank}, ${SOURCE}, ${URL}, 40, ${NOTE})
  `
  inserted++
}

console.log(`Inserted ${inserted} program-ranking rows.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
