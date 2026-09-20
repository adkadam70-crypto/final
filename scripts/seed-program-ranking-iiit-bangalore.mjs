import { neon } from '@neondatabase/serverless'
const sql = neon(process.env.DATABASE_URL)
const rows = await sql`SELECT id FROM universities WHERE name = 'International Institute of Information Technology, Bangalore' AND country = 'IN'`
const id = rows[0].id
await sql`
  INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
  VALUES (${id}, 'Engineering', 74, 'NIRF 2024 — Engineering Category Ranking', 'https://www.nirfindia.org/Rankings/2024/EngineeringRanking.html', 71, 'NIRF category-specific ranking, not the institution-wide NIRF rank.')
`
console.log('inserted')
