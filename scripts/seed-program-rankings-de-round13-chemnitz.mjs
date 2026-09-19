// Thirteenth Germany pass. Only one row survived from this batch: TU
// Chemnitz Mathematics, and even that had to be corrected — the batch
// cited collegedunia.com claiming "250, estimated from 201-300, ARWU
// 2025" but the real shanghairanking.com page shows the actual 2026 band
// is 301-400 (median 350).
//
// The other ~88 rows in the same batch (a claimed WirtschaftsWoche 2024
// HR-Manager Ranking covering ~40 universities across Business, Computer
// Science, Engineering, Economics, and Law) were rejected in full: the
// cited URL is a WiWo subscriber-only page that returns NO visible ranking
// content when fetched. Gemini could not have read a real table there —
// the entire batch was fabricated, not sourced. Confirmed by the suspicious
// shape of the data itself before even checking the URL: a single article
// URL was reused across every unrelated subject, and the numbers formed an
// implausibly clean pattern (e.g. LMU Munich simultaneously "#1" in
// Business, Economics, AND Law; Humboldt "#2" in all three) — the
// signature of a model completing a plausible-looking grid rather than
// reading real distinct data.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-de-round13-chemnitz.mjs
import { neon } from '@neondatabase/serverless'
const sql = neon(process.env.DATABASE_URL)
const universityId = 570
const field = 'Mathematics & Statistics'
const source = 'ARWU Global Ranking of Academic Subjects 2026 — Mathematics (estimated from band 301–400)'
const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${universityId} AND field = ${field} AND "rankSource" = ${source}`
if (existing.length === 0) {
  await sql`INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (${universityId}, ${field}, 350, ${source}, 'https://www.shanghairanking.com/universities/chemnitz-university-of-technology', 47, 'programSelectivity is our own derived scale for comparability. Rank value is the midpoint of the published band, not an exact figure the ranking body itself published.')`
  console.log('Inserted TU Chemnitz Mathematics 350')
} else {
  console.log('Already exists')
}
