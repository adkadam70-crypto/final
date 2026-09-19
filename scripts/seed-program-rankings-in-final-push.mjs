// Documents 3 rows inserted directly via SQL in this final push:
// Calcutta University (Engineering, ARWU 2018 Chemical Engineering band),
// Symbiosis International (Engineering, NIRF Innovation band),
// Sri Venkateswara University (Medicine & Health Sciences, NIRF Pharmacy
// band). No-op if rows already exist.
// Usage: node --env-file=.env.local scripts/seed-program-rankings-in-final-push.mjs
import { neon } from '@neondatabase/serverless'
const sql = neon(process.env.DATABASE_URL)

const rows = [
  {
    name: 'Calcutta University', field: 'Engineering', rank: 450,
    source: 'ARWU Global Ranking of Academic Subjects 2018 — Chemical Engineering (estimated from band 401–500)',
    url: 'https://www.shanghairanking.com/universities/university-of-calcutta',
    note: 'World subject rank. Note: this is 2018 ARWU data, the most recent subject placement found for this university — flagged as an older year rather than omitted.',
    selectivity: 25,
  },
  {
    name: 'Symbiosis International University', field: 'Engineering', rank: 30,
    source: 'NIRF (National Institutional Ranking Framework) 2024 — Innovation category (estimated from band 11–50)',
    url: 'https://www.nirfindia.org/Rankings/2024/InnovationRanking50.html',
    note: 'NIRF Innovation-category band, alphabetical order beyond rank 10, no individual numeric rank stated — value is the band midpoint. Innovation category reflects institutional patent/startup output, closest existing field fit is Engineering.',
    selectivity: 70,
  },
  {
    name: 'Sri Venkateswara University', field: 'Medicine & Health Sciences', rank: 113,
    source: 'NIRF (National Institutional Ranking Framework) 2024 — Pharmacy category (estimated from band 101–125)',
    url: 'https://www.nirfindia.org/Rankings/2024/PharmacyRanking150.html',
    note: 'NIRF band-only listing beyond rank 100, alphabetical order, no individual numeric rank stated — value is the band midpoint.',
    selectivity: 50,
  },
]

let inserted = 0
for (const r of rows) {
  const u = await sql`SELECT id FROM universities WHERE name = ${r.name} AND country = 'IN'`
  if (u.length === 0) continue
  const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${u[0].id} AND field = ${r.field} AND "rankSource" = ${r.source}`
  if (existing.length > 0) continue
  await sql`INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (${u[0].id}, ${r.field}, ${r.rank}, ${r.source}, ${r.url}, ${r.selectivity}, ${r.note})`
  inserted++
}
console.log(`Inserted ${inserted} rows.`)
