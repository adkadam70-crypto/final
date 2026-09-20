import { neon } from '@neondatabase/serverless'
const sql = neon(process.env.DATABASE_URL)
function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}
const NOTE = 'College Factual subject-specific ranking based on graduate outcomes and program quality metrics.'
const DATA = [
  ['San José State University', 'Data Science & Analytics', 8, 248, 'College Factual 2026 — Best Data Science Schools', 'https://www.collegefactual.com/majors/multi-interdisciplinary-studies/data-science/rankings/top-ranked/'],
  ['Rutgers University-Camden', 'Finance', 90, 400, 'College Factual 2026 — Best Finance Schools', 'https://www.collegefactual.com/majors/business-management-marketing-sales/finance-financial-management/finance/rankings/top-ranked/'],
]
let inserted = 0
for (const [name, field, rank, pool, source, url] of DATA) {
  const r = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'US'`
  if (r.length === 0) { console.log('not found:', name); continue }
  const id = r[0].id
  await sql`
    INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (${id}, ${field}, ${rank}, ${source}, ${url}, ${selectivityFromRank(rank, pool)}, ${NOTE})
  `
  inserted++
}
console.log(`Inserted ${inserted} rows.`)
