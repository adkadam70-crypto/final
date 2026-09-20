import { neon } from '@neondatabase/serverless'
const sql = neon(process.env.DATABASE_URL)
function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}
const rows = await sql`SELECT id FROM universities WHERE name = 'Pädagogische Hochschule Ludwigsburg' AND country = 'DE'`
const id = rows[0].id
const NOTE = 'EduRank.org citation-based subject ranking (research output/citation counts), not an admissions-selectivity metric — programSelectivity is our own derived scale for comparability, not itself a published figure.'
await sql`
  INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
  VALUES (${id}, 'Education', 94, 'EduRank.org Citation-Based Subject Ranking 2026 — Psychology (Germany)', 'https://edurank.org/psychology/de/', ${selectivityFromRank(94,100)}, ${NOTE})
`
console.log('inserted')
