// India — NIRF 2024 Law category ranks for the 10 NLU campuses just added
// (see scripts/add-missing-nlus.mjs).
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-in-new-nlus.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const FIELD = 'Law'
const SOURCE = 'NIRF 2024 — Law Category Ranking'
const URL = 'https://www.nirfindia.org/Rankings/2024/LawRanking.html'
const POOL = 40

const DATA = [
  ['Dr. Ram Manohar Lohiya National Law University', 20],
  ['National Law Institute University, Bhopal', 21],
  ['National University of Study and Research in Law', 22],
  ['The Rajiv Gandhi National University of Law', 24],
  ['National Law University and Judicial Academy', 27],
  ['Maharashtra National Law University Mumbai', 31],
  ['Chanakya National Law University', 31],
  ['Maharashtra National Law University, Nagpur', 34],
  ['National University of Advanced Legal Studies', 38],
  ['Damodaram Sanjivayya National Law University', 39],
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
