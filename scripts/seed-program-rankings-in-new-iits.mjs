// India — NIRF 2024 Engineering category ranks for the new IIT campuses
// just added to the catalog (see scripts/add-missing-iits.mjs).
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-in-new-iits.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const FIELD = 'Engineering'
const SOURCE = 'NIRF 2024 — Engineering Category Ranking'
const URL = 'https://www.nirfindia.org/Rankings/2024/EngineeringRanking.html'
const NOTE = 'NIRF category-specific ranking, not the institution-wide NIRF rank.'
const POOL = 100

const DATA = [
  ['Indian Institute of Technology Mandi', 31],
  ['Indian Institute of Technology Bhubaneswar', 54],
  ['Indian Institute of Technology Tirupati', 61],
  ['Indian Institute of Technology Jammu', 62],
  ['Indian Institute of Technology Palakkad', 64],
  ['Indian Institute of Technology Bhilai', 73],
]

let inserted = 0
const skipped = []

for (const [name, rank] of DATA) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'IN'`
  if (rows.length === 0) { skipped.push(name); continue }
  const universityId = rows[0].id
  const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${universityId} AND field = ${FIELD} AND "rankSource" = ${SOURCE}`
  if (existing.length > 0) continue
  await sql`
    INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (${universityId}, ${FIELD}, ${rank}, ${SOURCE}, ${URL}, ${selectivityFromRank(rank, POOL)}, ${NOTE})
  `
  inserted++
}

console.log(`Inserted ${inserted} program-ranking rows.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
