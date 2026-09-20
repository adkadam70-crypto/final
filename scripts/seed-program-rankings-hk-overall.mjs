// Hong Kong — EduRank.org citation-based ranking of Hong Kong institutions
// within Greater China's top 100, matched against the existing catalog
// only. General/overall ranking, filed under "Science & Technology /
// Research".
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-hk-overall.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const FIELD = 'Science & Technology / Research'
const SOURCE = 'EduRank.org Citation-Based Ranking 2026 — Hong Kong (within Greater China top 100)'
const URL = 'https://edurank.org/geo/hk/'
const NOTE = 'EduRank.org citation-based ranking of Hong Kong institutions within the broader Greater China top-100 pool (research output/citation counts, not subject-specific), not an admissions-selectivity metric.'
const POOL = 100

const DATA = [
  ['University of Hong Kong', 3],
  ['Chinese University of Hong Kong', 6],
  ['Hong Kong Polytechnic University', 12],
  ['City University of Hong Kong', 14],
  ['Hong Kong University of Science and Technology', 22],
  ['Hong Kong Baptist University', 36],
]

let inserted = 0
for (const [name, rank] of DATA) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'HK'`
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
