// India — NIRF 2024 Innovation category ranking (band 11-50), matched by
// exact normalized name against the existing catalog only.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-in-nirf-innovation.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const FIELD = 'Science & Technology / Research'
const SOURCE = 'NIRF 2024 — Innovation Category Ranking (band 11-50)'
const URL = 'https://www.nirfindia.org/Rankings/2024/InnovationRanking50.html'
const NOTE = 'NIRF category-specific ranking (band, alphabetical order within band — no precise numeric rank published), not the institution-wide NIRF rank.'
const SELECTIVITY = 55

const DATA = [
  'Sri Sai Ram Engineering College',
  'Sri Sai Ram Institute of Technology',
]

let inserted = 0
const skipped = []

for (const name of DATA) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'IN'`
  if (rows.length === 0) { skipped.push(name); continue }
  const universityId = rows[0].id
  const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${universityId} AND field = ${FIELD} AND "rankSource" = ${SOURCE}`
  if (existing.length > 0) continue
  await sql`
    INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (${universityId}, ${FIELD}, 30, ${SOURCE}, ${URL}, ${SELECTIVITY}, ${NOTE})
  `
  inserted++
}

console.log(`Inserted ${inserted} program-ranking rows.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
