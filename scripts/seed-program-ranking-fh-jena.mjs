import { neon } from '@neondatabase/serverless'
const sql = neon(process.env.DATABASE_URL)
function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}
const rows = await sql`SELECT id FROM universities WHERE name = 'Fachhochschule Jena' AND country = 'DE'`
if (rows.length === 0) { console.log('not found'); process.exit(0) }
const id = rows[0].id
const existing = await sql`SELECT COUNT(*) FROM "programRankings" WHERE "universityId" = ${id}`
if (Number(existing[0].count) > 0) { console.log('already has refs'); process.exit(0) }
const NOTE = 'EduRank.org citation-based overall institutional ranking (research output/citation counts, not subject-specific), not an admissions-selectivity metric — programSelectivity is our own derived scale for comparability, not itself a published figure.'
await sql`
  INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
  VALUES (${id}, 'Science & Technology / Research', 238, 'EduRank.org Citation-Based Overall Ranking 2026 — Germany', 'https://edurank.org/uni/ernst-abbe-university-of-applied-sciences-jena/', ${selectivityFromRank(238,369)}, ${NOTE})
`
console.log('inserted')
