// India — NIRF 2024 Management category ranks for the IIM campuses just
// added to the catalog (see scripts/add-missing-iims.mjs).
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-in-iims.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const FIELD = 'Business'
const SOURCE = 'NIRF 2024 — Management Category Ranking'
const URL = 'https://www.nirfindia.org/Rankings/2024/ManagementRanking.html'
const NOTE = 'NIRF category-specific ranking, not the institution-wide NIRF rank.'
const POOL = 100

const DATA = [
  ['Indian Institute of Management Kozhikode', 3],
  ['Indian Institute of Management Lucknow', 7],
  ['Indian Institute of Management Rohtak', 12],
  ['Indian Institute of Management Raipur', 14],
  ['Indian Institute of Management Ranchi', 17],
  ['Indian Institute of Management Udaipur', 22],
  ['Indian Institute of Management Kashipur', 23],
  ['Indian Institute of Management Shillong', 24],
  ['Indian Institute of Management Visakhapatnam', 26],
  ['Indian Institute of Management Nagpur', 31],
  ['Indian Institute of Management Bodh Gaya', 33],
  ['Indian Institute of Management Jammu', 42],
  ['Indian Institute of Management Amritsar', 47],
  ['Indian Institute of Management Sambalpur', 50],
  ['Indian Institute of Management Sirmaur', 57],
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
