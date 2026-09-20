// USA — College Factual 2026 Biblical Studies program ranking, matched by
// exact name against the existing catalog only.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-us-biblical-studies.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const FIELD = 'Humanities'
const SOURCE = 'College Factual 2026 — Best Biblical Studies Schools'
const URL = 'https://www.collegefactual.com/majors/theology-and-religious-vocations/biblical-studies/rankings/top-ranked/'
const POOL = 50
const NOTE = 'College Factual subject-specific ranking based on graduate outcomes and program quality metrics.'

const DATA = [
    ["Harding University", 1],
    ["Abilene Christian University", 2],
    ["Dallas Baptist University", 3],
    ["Lipscomb University", 4],
    ["Cedarville University", 5],
    ["California Baptist University", 7],
    ["Biola University", 8],
    ["Liberty University", 26],
    ["Southwestern Assemblies of God University", 31],
    ["Colorado Christian University", 33],
    ["Oral Roberts University", 35],
    ["Campbellsville University", 39],
    ["Regent University", 41],
    ["Belhaven University", 42],
    ["Davis College", 44],
    ["Bob Jones University", 46],
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
