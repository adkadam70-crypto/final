// Fifteenth Germany pass. From a large WiWo-Engineering batch, only 6 rows
// survived verification. wiwi-treff.de failed to connect on three separate
// attempts this session (not once — genuinely unreachable from here), so
// every claim resting solely on it was rejected: Electrical Engineering's
// full "Universities" top 10, the entire Business Informatics table, and
// most of Mechanical Engineering. profiling-institut.de is real and did
// verify three rows — but also caught a real error in the batch: the
// actual #3 in Industrial Engineering (Fachhochschulen) is TH Köln, not
// the "Hochschule Reutlingen (ESB)" the batch claimed. ingenieur.de gave
// only descriptive prose ("TUM: sehr stark in Fahrzeugtechnik...") with no
// stated "Platz X" numbers, so its ordering wasn't treated as a numeric
// ranking.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-de-round15-wiwo-fh-verified.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank) {
  return Math.max(60, Math.min(98, Math.round(98 - (rank - 1) * 3)))
}

const SRC = 'WirtschaftsWoche HR-Manager Ranking 2024 (via profiling-institut.de)'
const URL = 'https://www.profiling-institut.de/ranking/beste-hochschulen-2026/'
const NOTE = 'Real German-specific HR-recruiter survey rank among Fachhochschulen/Universities of Applied Sciences specifically, not a world-subject rank — programSelectivity is our own derived scale for comparability.'

const HTW = 'HTW Berlin'

const FINAL = [
  ['FH Aachen', 'Engineering', 1, `${SRC} — Maschinenbau (Mechanical Engineering, Fachhochschulen)`, URL, NOTE],
  [HTW, 'Engineering', 2, `${SRC} — Maschinenbau (Mechanical Engineering, Fachhochschulen)`, URL, NOTE],
  ['FH Aachen', 'Engineering', 1, `${SRC} — Elektrotechnik (Electrical Engineering, Fachhochschulen)`, URL, NOTE],
  [HTW, 'Engineering', 1, `${SRC} — Wirtschaftsingenieurwesen (Industrial Engineering, Fachhochschulen)`, URL, NOTE],
  ['Hochschule München', 'Engineering', 2, `${SRC} — Wirtschaftsingenieurwesen (Industrial Engineering, Fachhochschulen)`, URL, NOTE],
  ['TH Köln', 'Engineering', 3, `${SRC} — Wirtschaftsingenieurwesen (Industrial Engineering, Fachhochschulen)`, URL, NOTE],
]

let inserted = 0
const skipped = []

for (const [name, field, rank, source, url, note] of FINAL) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'DE'`
  if (rows.length === 0) {
    skipped.push(`${name} (${field}: ${source})`)
    continue
  }
  const universityId = rows[0].id
  const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${universityId} AND field = ${field} AND "rankSource" = ${source}`
  if (existing.length > 0) continue

  await sql`
    INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (${universityId}, ${field}, ${rank}, ${source}, ${url}, ${selectivityFromRank(rank)}, ${note})
  `
  inserted++
}

console.log(`Inserted ${inserted} program-ranking rows.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
