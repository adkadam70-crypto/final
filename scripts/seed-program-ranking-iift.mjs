import { neon } from '@neondatabase/serverless'
const sql = neon(process.env.DATABASE_URL)
const rows = await sql`SELECT id FROM universities WHERE name = 'Indian Institute of Foreign Trade' AND country = 'IN'`
const id = rows[0].id
await sql`
  INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
  VALUES (${id}, 'Business', 15, 'NIRF 2024 — Management Category Ranking', 'https://www.nirfindia.org/Rankings/2024/ManagementRanking.html', 89, 'NIRF category-specific ranking, not the institution-wide NIRF rank.')
`
console.log('inserted')
