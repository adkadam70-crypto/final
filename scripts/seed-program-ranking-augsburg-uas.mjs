import { neon } from '@neondatabase/serverless'
const sql = neon(process.env.DATABASE_URL)
function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}
const rows = await sql`SELECT id FROM universities WHERE name = 'Augsburg University of Applied Sciences' AND country = 'DE'`
if (rows.length === 0) { console.log('not found'); process.exit(0) }
const id = rows[0].id
const NOTE = 'EduRank.org citation-based subject ranking (research output/citation counts), not an admissions-selectivity metric — programSelectivity is our own derived scale for comparability, not itself a published figure.'
await sql`
  INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
  VALUES (${id}, 'Economics', 118, 'EduRank.org Citation-Based Subject Ranking 2026 — Economics (Germany)', 'https://edurank.org/uni/augsburg-university-of-applied-sciences/rankings/', ${selectivityFromRank(118,162)}, ${NOTE})
`
console.log('inserted')
