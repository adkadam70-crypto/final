// Fifth Germany program-ranking pass, one confirmed row: University of
// Hamburg Law, rank 66 (QS World University Rankings by Subject 2025) —
// independently corroborated by two separate searches after the original
// source batch (universityguru.com) came back 403 and couldn't be fetched
// directly. The other three candidate Hamburg rows from that same batch
// (Medical Technology 51, History 51, CS/AI 71) were dropped: one directly
// contradicted a separate source (Hamburg Medicine came back as #132
// elsewhere, not 51), and the other two couldn't be confirmed at all.
//
// This file documents the row already inserted directly via SQL in this
// session for reproducibility — running it is a no-op if the row exists.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-de-round5.mjs
import { neon } from '@neondatabase/serverless'
const sql = neon(process.env.DATABASE_URL)
const universityId = (await sql`SELECT id FROM universities WHERE name = 'University of Hamburg' AND country = 'DE'`)[0].id
const field = 'Law'
const source = 'QS World University Rankings by Subject 2025 — Law'
const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${universityId} AND field = ${field} AND "rankSource" = ${source}`
if (existing.length === 0) {
  await sql`INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (${universityId}, ${field}, 66, ${source}, 'https://www.topuniversities.com/university-subject-rankings/law-legal-studies', 73, 'World subject rank, confirmed via two independent sources.')`
  console.log('Inserted Hamburg Law 66')
} else {
  console.log('Already exists')
}
