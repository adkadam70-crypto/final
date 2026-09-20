import { neon } from '@neondatabase/serverless'
const sql = neon(process.env.DATABASE_URL)
function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}
const FIELD = 'Political Science'
const SOURCE = 'College Factual 2026 — Best Political Science & Government Schools'
const URL = 'https://www.collegefactual.com/majors/social-sciences/political-science-and-government/rankings/top-ranked/'
const POOL = 114
const NOTE = 'College Factual subject-specific ranking based on graduate outcomes and program quality metrics.'
const DATA = [
  ['San José State University', 46],
  ['Wheaton College', 102],
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
