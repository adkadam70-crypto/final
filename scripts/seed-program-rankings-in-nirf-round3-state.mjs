// Continuing the India push. NIRF 2024 State Public University category
// rows for 6 more zero-coverage matches, fetched directly from
// nirfindia.org.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-in-nirf-round3-state.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize = 50) {
  return Math.max(30, Math.min(97, Math.round(97 - (rank - 1) * (67 / poolSize))))
}

const SOURCE = 'NIRF (National Institutional Ranking Framework) 2024 — State Public University category'
const URL = 'https://www.nirfindia.org/Rankings/2024/StatePublicUniversityRanking.html'
const NOTE = 'NIRF 2024 rank, fetched directly from nirfindia.org.'

const DATA = [
  ['University of Burdwan', 'Science & Technology / Research', 36],
  ['Kurukshetra University', 'Science & Technology / Research', 41],
  ['Utkal University', 'Science & Technology / Research', 42],
  ['Devi Ahilya University of Indore', 'Science & Technology / Research', 50],
  ['University of Calicut', 'Science & Technology / Research', 43],
  ['Dr. Babasaheb Ambedkar Marathwada Universtiy', 'Science & Technology / Research', 46],
]

let inserted = 0
const skipped = []

for (const [name, field, rank] of DATA) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'IN'`
  if (rows.length === 0) {
    skipped.push(`${name} (${field})`)
    continue
  }
  const universityId = rows[0].id
  const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${universityId} AND field = ${field} AND "rankSource" = ${SOURCE}`
  if (existing.length > 0) continue

  await sql`
    INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (${universityId}, ${field}, ${rank}, ${SOURCE}, ${URL}, ${selectivityFromRank(rank)}, ${NOTE})
  `
  inserted++
}

console.log(`Inserted ${inserted} program-ranking rows.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
