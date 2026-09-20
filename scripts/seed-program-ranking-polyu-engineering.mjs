import { neon } from '@neondatabase/serverless'
const sql = neon(process.env.DATABASE_URL)
const rows = await sql`SELECT id FROM universities WHERE name = 'Hong Kong Polytechnic University' AND country = 'HK'`
const id = rows[0].id
const source = 'QS World University Rankings by Subject 2026'
const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${id} AND field = 'Engineering' AND "rankSource" = ${source}`
if (existing.length === 0) {
  await sql`
    INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (${id}, 'Engineering', 18, ${source}, 'https://www.topuniversities.com/subject-rankings', 88, 'QS World University Rankings by Subject 2026 — Civil & Structural Engineering world rank.')
  `
  console.log('inserted')
} else {
  console.log('already exists')
}
