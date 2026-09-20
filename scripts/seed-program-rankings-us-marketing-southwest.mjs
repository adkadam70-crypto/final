// USA — College Factual 2026 Marketing Southwest regional ranking,
// matched by exact name against the existing catalog only.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-us-marketing-southwest.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const FIELD = 'Marketing'
const SOURCE = 'College Factual 2026 — Best Marketing Schools (Southwest Region)'
const URL = 'https://www.collegefactual.com/majors/business-management-marketing-sales/marketing/rankings/top-ranked/southwest/'
const POOL = 50
const NOTE = 'College Factual regional subject-specific ranking based on graduate outcomes and program quality metrics.'

const DATA = [
    ["Texas Christian University", 1],
    ["Southern Methodist University", 2],
    ["Arizona State University", 5],
    ["Baylor University", 6],
    ["University of Arizona", 8],
    ["Texas Tech University", 11],
    ["University of Houston", 13],
    ["Trinity University", 16],
    ["University of North Texas", 17],
    ["The University of Texas at Tyler", 24],
    ["Schreiner University", 25],
    ["Dallas Baptist University", 27],
    ["Southern Nazarene University", 30],
    ["Tarleton State University", 31],
    ["Abilene Christian University", 34],
    ["University of the Incarnate Word", 35],
    ["Stephen F Austin State University", 37],
    ["Grand Canyon University", 42],
    ["Oral Roberts University", 46],
    ["Phoenix College", 47],
    ["Angelo State University", 49],
]

let inserted = 0
for (const [name, rank] of DATA) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'US'`
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
