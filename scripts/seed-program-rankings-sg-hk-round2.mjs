import { neon } from '@neondatabase/serverless'
const sql = neon(process.env.DATABASE_URL)
function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}
const SOURCE = 'QS World University Rankings by Subject 2026'
const URL = 'https://www.topuniversities.com/subject-rankings'
const NOTE = 'QS World University Rankings by Subject 2026 world rank.'
const DATA = [
  ['University of Hong Kong', 'HK', 'Law', 20, 300],
  ['Singapore Management University', 'SG', 'Business', 39, 500],
]
let inserted = 0
for (const [name, country, field, rank, pool] of DATA) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${name} AND country = ${country}`
  if (rows.length === 0) { console.log('not found:', name); continue }
  const id = rows[0].id
  const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${id} AND field = ${field} AND "rankSource" = ${SOURCE}`
  if (existing.length > 0) continue
  await sql`
    INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (${id}, ${field}, ${rank}, ${SOURCE}, ${URL}, ${selectivityFromRank(rank, pool)}, ${NOTE})
  `
  inserted++
}
console.log(`Inserted ${inserted} rows.`)
