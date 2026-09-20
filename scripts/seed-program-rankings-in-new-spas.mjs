// India — NIRF 2024 Architecture category ranks for SPA Bhopal and
// Vijayawada, just added (see scripts/add-missing-spas.mjs).
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-in-new-spas.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const FIELD = 'Architecture & Design'
const SOURCE = 'NIRF 2024 — Architecture Category Ranking'
const URL = 'https://www.nirfindia.org/Rankings/2024/ArchitectureRanking.html'
const POOL = 40

const DATA = [
  ['School of Planning and Architecture, Bhopal', 12],
  ['School of Planning and Architecture, Vijayawada', 16],
]

let inserted = 0
for (const [name, rank] of DATA) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'IN'`
  if (rows.length === 0) { console.log(`Could not match: ${name}`); continue }
  const universityId = rows[0].id
  await sql`
    INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (${universityId}, ${FIELD}, ${rank}, ${SOURCE}, ${URL}, ${selectivityFromRank(rank, POOL)}, 'NIRF category-specific ranking, not the institution-wide NIRF rank.')
  `
  inserted++
}

console.log(`Inserted ${inserted} program-ranking rows.`)
