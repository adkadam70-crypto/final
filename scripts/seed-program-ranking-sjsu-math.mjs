import { neon } from '@neondatabase/serverless'
const sql = neon(process.env.DATABASE_URL)
function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}
const rows = await sql`SELECT id FROM universities WHERE name = 'San José State University' AND country = 'US'`
if (rows.length === 0) { console.log('not found'); process.exit(0) }
const id = rows[0].id
await sql`
  INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
  VALUES (${id}, 'Mathematics & Statistics', 8, 'College Factual 2026 — Best Mathematics Schools', 'https://www.collegefactual.com/majors/mathematics-and-statistics/mathematics/rankings/top-ranked/', ${selectivityFromRank(8,283)}, 'College Factual subject-specific ranking based on graduate outcomes and program quality metrics.')
`
console.log('inserted')
