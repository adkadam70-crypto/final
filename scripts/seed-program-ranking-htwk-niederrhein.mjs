import { neon } from '@neondatabase/serverless'
const sql = neon(process.env.DATABASE_URL)
function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}
const NOTE = 'EduRank.org citation-based subject ranking (research output/citation counts), not an admissions-selectivity metric — programSelectivity is our own derived scale for comparability, not itself a published figure.'
const NOTE_OVERALL = 'EduRank.org citation-based overall institutional ranking (research output/citation counts, not subject-specific), not an admissions-selectivity metric — programSelectivity is our own derived scale for comparability, not itself a published figure.'

const DATA = [
  ['HTWK Leipzig', 'Mathematics & Statistics', 103, 163, 'EduRank.org Citation-Based Subject Ranking 2026 — Mathematics (Germany)', 'https://edurank.org/uni/leipzig-university-of-applied-sciences/rankings/', NOTE],
  ['Niederrhein University of Applied Sciences', 'Science & Technology / Research', 208, 369, 'EduRank.org Citation-Based Overall Ranking 2026 — Germany', 'https://edurank.org/uni/niederrhein-university-of-applied-sciences/', NOTE_OVERALL],
]

let inserted = 0
for (const [name, field, rank, pool, source, url, note] of DATA) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'DE'`
  if (rows.length === 0) { console.log('not found:', name); continue }
  const id = rows[0].id
  await sql`
    INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (${id}, ${field}, ${rank}, ${source}, ${url}, ${selectivityFromRank(rank, pool)}, ${note})
  `
  inserted++
}
console.log(`Inserted ${inserted} rows.`)
