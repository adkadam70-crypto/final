// Documents rows inserted directly via SQL in this continued push:
// NIMHANS (Medicine, QS band), Kurukshetra University (Pharmacy, NIRF
// band), Gujarat University + University of Jammu (Business, NIRF
// Management band), University of Agricultural Sciences Dharwad
// (Agriculture, NIRF exact rank 24 — was already fetched earlier this
// session but not yet inserted for this specific catalog id).
// No-op if rows already exist.
// Usage: node --env-file=.env.local scripts/seed-program-rankings-in-final-push2.mjs
import { neon } from '@neondatabase/serverless'
const sql = neon(process.env.DATABASE_URL)

const rows = [
  { id: 2607, field: 'Medicine & Health Sciences', rank: 525, source: 'QS World University Rankings by Subject 2026 — Medicine (estimated from band 501–550)', url: 'https://www.topuniversities.com/university-subject-rankings/medicine', note: 'World subject rank (band).', selectivity: 20 },
  { id: 2578, field: 'Medicine & Health Sciences', rank: 113, source: 'NIRF (National Institutional Ranking Framework) 2024 — Pharmacy category (estimated from band 101–125)', url: 'https://www.nirfindia.org/Rankings/2024/PharmacyRanking150.html', note: 'NIRF band-only listing beyond rank 100, alphabetical order, no individual numeric rank stated — value is the band midpoint.', selectivity: 50 },
  { id: 259, field: 'Business', rank: 113, source: 'NIRF (National Institutional Ranking Framework) 2024 — Management category (estimated from band 101–125)', url: 'https://www.nirfindia.org/Rankings/2024/ManagementRanking150.html', note: 'NIRF band-only listing beyond rank 100, alphabetical order, no individual numeric rank stated — value is the band midpoint.', selectivity: 50 },
  { id: 473, field: 'Business', rank: 113, source: 'NIRF (National Institutional Ranking Framework) 2024 — Management category (estimated from band 101–125)', url: 'https://www.nirfindia.org/Rankings/2024/ManagementRanking150.html', note: 'NIRF band-only listing beyond rank 100, alphabetical order, no individual numeric rank stated — value is the band midpoint.', selectivity: 50 },
  { id: 2694, field: 'Agriculture & Natural Resources', rank: 24, source: 'NIRF (National Institutional Ranking Framework) 2024 — Agriculture category', url: 'https://www.nirfindia.org/Rankings/2024/AgricultureRanking.html', note: 'NIRF 2024 rank, fetched directly from nirfindia.org.', selectivity: 78 },
]

let inserted = 0
for (const r of rows) {
  const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${r.id} AND field = ${r.field} AND "rankSource" = ${r.source}`
  if (existing.length > 0) continue
  await sql`INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (${r.id}, ${r.field}, ${r.rank}, ${r.source}, ${r.url}, ${r.selectivity}, ${r.note})`
  inserted++
}
console.log(`Inserted ${inserted} rows.`)
