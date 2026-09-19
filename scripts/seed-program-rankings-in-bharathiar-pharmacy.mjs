// Documents the Bharathiar University Pharmacy row (QS 2026, #301)
// inserted directly via SQL for reproducibility — no-op if it exists.
// Usage: node --env-file=.env.local scripts/seed-program-rankings-in-bharathiar-pharmacy.mjs
import { neon } from '@neondatabase/serverless'
const sql = neon(process.env.DATABASE_URL)
const universityId = (await sql`SELECT id FROM universities WHERE name = 'Bharathiar University' AND country = 'IN'`)[0].id
const field = 'Medicine & Health Sciences'
const source = 'QS World University Rankings by Subject 2026 — Pharmacy and Pharmacology'
const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${universityId} AND field = ${field} AND "rankSource" = ${source}`
if (existing.length === 0) {
  await sql`INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (${universityId}, ${field}, 301, ${source}, 'https://www.topuniversities.com/university-subject-rankings/pharmacy-pharmacology', 55, 'World subject rank, confirmed via two independent search results.')`
  console.log('Inserted Bharathiar Pharmacy 301')
} else {
  console.log('Already exists')
}
