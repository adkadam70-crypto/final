import { neon } from '@neondatabase/serverless'
const sql = neon(process.env.DATABASE_URL)
function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}
const rows = await sql`SELECT id FROM universities WHERE name = 'Bucerius Law School' AND country = 'DE'`
const id = rows[0].id
const NOTE = 'EduRank.org citation-based subject ranking (research output/citation counts). Note: student-experience-based rankings (e.g. CHE-Ranking) separately place Bucerius as Germany\'s top-rated law faculty on categorical/star measures — this row reflects only the citation-based measure, not that survey result.'
await sql`
  INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
  VALUES (${id}, 'Law', 130, 'EduRank.org Citation-Based Subject Ranking 2026 — Law (Germany)', 'https://edurank.org/uni/bucerius-law-school/rankings/', ${selectivityFromRank(130,415)}, ${NOTE})
`
console.log('inserted')
