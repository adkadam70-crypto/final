// India — NIRF 2024 Overall ranks for the 3 AIIMS campuses just added (see
// scripts/add-missing-aiims.mjs).
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-in-new-aiims.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const FIELD = 'Medicine & Health Sciences'
const SOURCE = 'NIRF 2024 — Overall Ranking'
const URL = 'https://www.nirfindia.org/Rankings/2024/OverallRanking.html'
const NOTE = 'NIRF institution-wide Overall ranking (all disciplines combined), not subject-specific.'
const POOL = 100

const DATA = [
  ['All India Institute of Medical Sciences, Rishikesh', 74],
  ['All India Institute of Medical Sciences, Jodhpur', 83],
  ['All India Institute of Medical Sciences, Patna', 99],
]

let inserted = 0
for (const [name, rank] of DATA) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'IN'`
  if (rows.length === 0) { console.log(`Could not match: ${name}`); continue }
  const universityId = rows[0].id
  await sql`
    INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (${universityId}, ${FIELD}, ${rank}, ${SOURCE}, ${URL}, ${selectivityFromRank(rank, POOL)}, ${NOTE})
  `
  inserted++
}

console.log(`Inserted ${inserted} program-ranking rows.`)
