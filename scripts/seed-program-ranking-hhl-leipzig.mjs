import { neon } from '@neondatabase/serverless'
const sql = neon(process.env.DATABASE_URL)
function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}
const rows = await sql`SELECT id FROM universities WHERE name = 'Handelshochschule Leipzig' AND country = 'DE'`
const id = rows[0].id
const NOTE = 'EduRank.org citation-based subject ranking (research output/citation counts), not an admissions-selectivity metric — programSelectivity is our own derived scale for comparability, not itself a published figure.'
const DATA = [
  ['Business', 84, 'EduRank.org Citation-Based Subject Ranking 2026 — Economics (Germany)', 'https://edurank.org/economics/de/'],
  ['Law', 98, 'EduRank.org Citation-Based Subject Ranking 2026 — Law (Germany)', 'https://edurank.org/liberal-arts/law/de/'],
]
let inserted = 0
for (const [field, rank, source, url] of DATA) {
  const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${id} AND field = ${field} AND "rankSource" = ${source}`
  if (existing.length > 0) continue
  await sql`
    INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (${id}, ${field}, ${rank}, ${source}, ${url}, ${selectivityFromRank(rank, 100)}, ${NOTE})
  `
  inserted++
}
console.log(`Inserted ${inserted} program-ranking rows.`)
