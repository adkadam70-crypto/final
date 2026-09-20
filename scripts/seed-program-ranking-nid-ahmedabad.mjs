import { neon } from '@neondatabase/serverless'
const sql = neon(process.env.DATABASE_URL)
const rows = await sql`SELECT id FROM universities WHERE name = 'National Institute of Design, Ahmedabad' AND country = 'IN'`
const id = rows[0].id
await sql`
  INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
  VALUES (${id}, 'Architecture & Design', 1, 'India Today Best Colleges 2024/2025 — Design', 'https://www.indiatoday.in/education-today/top-colleges', 96, 'India Today annual college-ranking survey (Design category); ranked #1 in both the 2024 and 2025 editions.')
`
console.log('inserted')
