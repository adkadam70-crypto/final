import { neon } from '@neondatabase/serverless'
const sql = neon(process.env.DATABASE_URL)
function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}
const FIELD = 'Economics'
const SOURCE = 'College Factual 2026 — Best Economics Schools (Far Western US Region)'
const URL = 'https://www.collegefactual.com/majors/social-sciences/economics/rankings/top-ranked/far-western-us/'
const POOL = 68
const NOTE = 'College Factual regional subject-specific ranking based on graduate outcomes and program quality metrics.'
const DATA = [
  ['California State University-Sacramento', 19],
  ['Whitman College', 22],
]
let inserted = 0
for (const [name, rank] of DATA) {
  const r = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'US'`
  if (r.length === 0) { console.log('not found:', name); continue }
  const id = r[0].id
  const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${id} AND field = ${FIELD} AND "rankSource" = ${SOURCE}`
  if (existing.length > 0) continue
  await sql`
    INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (${id}, ${FIELD}, ${rank}, ${SOURCE}, ${URL}, ${selectivityFromRank(rank, POOL)}, ${NOTE})
  `
  inserted++
}
console.log(`Inserted ${inserted} rows.`)
