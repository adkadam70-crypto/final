import { neon } from '@neondatabase/serverless'
const sql = neon(process.env.DATABASE_URL)
function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}
const NOTE = 'EduRank.org citation-based overall institutional ranking (research output/citation counts, not subject-specific), not an admissions-selectivity metric — programSelectivity is our own derived scale for comparability, not itself a published figure.'
const DATA = [
  ['Fachhochschule Aschaffenburg', 'Science & Technology / Research', 309, 369, 'https://edurank.org/uni/university-of-applied-sciences-aschaffenburg/'],
  ['Hochschule Coburg', 'Science & Technology / Research', 131, 369, 'https://edurank.org/uni/coburg-university-of-applied-sciences-and-arts/rankings/'],
  ['Fachhochschule Nordhausen', 'Science & Technology / Research', 164, 369, 'https://edurank.org/uni/nordhausen-university-of-applied-sciences/rankings/'],
]
let inserted = 0
for (const [name, field, rank, pool, url] of DATA) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'DE'`
  if (rows.length === 0) { console.log('not found:', name); continue }
  const id = rows[0].id
  await sql`
    INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (${id}, ${field}, ${rank}, 'EduRank.org Citation-Based Overall Ranking 2026 — Germany', ${url}, ${selectivityFromRank(rank, pool)}, ${NOTE})
  `
  inserted++
}
console.log(`Inserted ${inserted} rows.`)
