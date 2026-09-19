import { neon } from '@neondatabase/serverless'
const sql = neon(process.env.DATABASE_URL)
const rows = await sql`SELECT id FROM universities WHERE name = 'Indian Institute of Science Education and Research Bhopal' AND country = 'IN'`
const id = rows[0].id
await sql`
  INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
  VALUES (${id}, 'Science & Technology / Research', 78, 'NIRF 2024 — Overall Ranking', 'https://www.nirfindia.org/Rankings/2024/OverallRanking.html', 42, 'NIRF institution-wide Overall ranking (all disciplines combined), not subject-specific.')
`
console.log('inserted')
