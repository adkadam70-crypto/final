// Singapore — EduRank.org citation-based overall institutional ranking,
// matched against the existing catalog only. General/overall ranking, so
// filed under "Science & Technology / Research".
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-sg-overall.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const FIELD = 'Science & Technology / Research'
const SOURCE = 'EduRank.org Citation-Based Overall Ranking 2026 — Singapore'
const URL = 'https://edurank.org/geo/sg/'
const NOTE = 'EduRank.org citation-based overall institutional ranking (research output/citation counts, not subject-specific), not an admissions-selectivity metric.'
const POOL = 8

const DATA = [
  ['National University of Singapore', 1],
  ['Nanyang Technological University', 2],
  ['Singapore Management University', 3],
  ['Singapore University of Technology and Design', 4],
  ['Singapore University of Social Sciences', 5],
  ['Singapore Institute of Technology', 6],
]

let inserted = 0
for (const [name, rank] of DATA) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'SG'`
  if (rows.length === 0) { console.log('not found:', name); continue }
  const id = rows[0].id
  const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${id} AND field = ${FIELD} AND "rankSource" = ${SOURCE}`
  if (existing.length > 0) continue
  await sql`
    INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (${id}, ${FIELD}, ${rank}, ${SOURCE}, ${URL}, ${selectivityFromRank(rank, POOL)}, ${NOTE})
  `
  inserted++
}
console.log(`Inserted ${inserted} rows.`)
