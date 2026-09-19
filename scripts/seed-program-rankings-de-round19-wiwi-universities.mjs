// Nineteenth Germany pass, 3 rows: RWTH Aachen, TU Berlin, KIT Karlsruhe —
// Wirtschaftsingenieurwesen (Industrial Engineering), Universities pool,
// WiWo HR-Manager Ranking 2024, ranks 1/2/3. Confirmed via a direct fetch
// of vwi.org's own reporting on the ranking.
//
// This same fetch also settled the question of the 6 remaining
// zero-coverage Fachhochschulen (HTWK Leipzig, Fachhochschule Dortmund,
// HFT Stuttgart, Hochschule Bonn-Rhein-Sieg, Hochschule Hannover,
// Ostfalia): the article explicitly states the full ranked list beyond
// the top 3 per pool is only in "the WiWo print edition No. 25 from June
// 14, 2024" and is not reproduced online. That's direct evidence, not
// just failed searching, that these 6 schools' exact positions are not
// published anywhere on the free web — only behind WiWo's paywall/print
// edition, which cannot be verified from here.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-de-round19-wiwi-universities.mjs
import { neon } from '@neondatabase/serverless'
const sql = neon(process.env.DATABASE_URL)
const src = 'WirtschaftsWoche HR-Manager Ranking 2024 — Wirtschaftsingenieurwesen (Industrial Engineering, Universities)'
const url = 'https://vwi.org/2024/06/wiwo-ranking-2024-rwth-aachen-und-htw-berlin-vorn/'
const note = 'Real German-specific HR-recruiter survey rank, not a world-subject rank — programSelectivity is our own derived scale for comparability.'
const rows = [
  ['RWTH Aachen University', 1],
  ['Technical University of Berlin', 2],
  ['Karlsruhe Institute of Technology', 3],
]
let inserted = 0
for (const [name, rank] of rows) {
  const u = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'DE'`
  if (!u.length) continue
  const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${u[0].id} AND field = 'Engineering' AND "rankSource" = ${src}`
  if (existing.length) continue
  const sel = Math.max(60, Math.min(98, Math.round(98 - (rank - 1) * 3)))
  await sql`INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (${u[0].id}, 'Engineering', ${rank}, ${src}, ${url}, ${sel}, ${note})`
  inserted++
}
console.log('Inserted', inserted)
