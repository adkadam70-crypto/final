// USA — HBCU 2026 ranks for the 6 universities just added (see
// scripts/add-missing-hbcus.mjs).
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-us-new-hbcus.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const FIELD = 'Science & Technology / Research'
const SOURCE = 'HBCU Rankings 2026'
const URL = 'https://hbculifestyle.com/hbcu-rankings-2026-the-top-25-leading-colleges/'
const POOL = 25
const NOTE = 'Overall HBCU-specific institutional ranking, not subject-specific.'

const DATA = [
  ['Florida A&M University', 5],
  ['Delaware State University', 10],
  ['Virginia State University', 11],
  ['Clark Atlanta University', 16],
  ['Lincoln University', 18],
  ['University of the District of Columbia', 18],
]

let inserted = 0
for (const [name, rank] of DATA) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'US'`
  if (rows.length === 0) { console.log('not found:', name); continue }
  const id = rows[0].id
  await sql`
    INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (${id}, ${FIELD}, ${rank}, ${SOURCE}, ${URL}, ${selectivityFromRank(rank, POOL)}, ${NOTE})
  `
  inserted++
}
console.log(`Inserted ${inserted} rows.`)
