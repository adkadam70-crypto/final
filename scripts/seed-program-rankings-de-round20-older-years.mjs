// Twentieth Germany pass. Real WiWo data for HFT Stuttgart (2022 edition,
// directly fetched and confirmed). HTWK Leipzig's real numbers were also
// found but from 2018 — 7 years old, too stale to represent current
// standing for a college-matching app, so deliberately excluded even
// though real and correctly dateable (unlike HFT's 2022 figures, which
// are in the same recency ballpark as other WiWo data already on file).
//
// Fachhochschule Dortmund, Hochschule Bonn-Rhein-Sieg, Hochschule
// Hannover, and Ostfalia still have no confirmable exact number in ANY
// reasonably recent year after extensive searching — these 4 appear to be
// genuinely absent from any freely accessible published ranking table.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-de-round20-older-years.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank) {
  return Math.max(60, Math.min(98, Math.round(98 - (rank - 1) * 3)))
}

const NOTE_FH = 'Real German-specific HR-recruiter survey rank among Fachhochschulen, not a world-subject rank — programSelectivity is our own derived scale for comparability. This is an older edition of the ranking (not the 2024 one used elsewhere), correctly dated rather than misattributed.'

const HFT = 'Stuttgart University of Applied Sciences' // catalog name for HFT Stuttgart (Hochschule für Technik Stuttgart)

const DATA = [
  [
    HFT,
    'Computer Science & IT',
    8,
    'WirtschaftsWoche HR-Manager Ranking 2022 — Wirtschaftsinformatik (Business Informatics, Fachhochschulen)',
    'https://innovative-trends.de/2022/04/26/wiwo-ranking-2022-wirtschaftsinformatik-informatik-und-bwl-der-hft-stuttgart-in-den-top-10/',
    NOTE_FH,
  ],
  [
    HFT,
    'Computer Science & IT',
    9,
    'WirtschaftsWoche HR-Manager Ranking 2022 — Informatik (Computer Science, Fachhochschulen)',
    'https://innovative-trends.de/2022/04/26/wiwo-ranking-2022-wirtschaftsinformatik-informatik-und-bwl-der-hft-stuttgart-in-den-top-10/',
    NOTE_FH,
  ],
  [
    HFT,
    'Business',
    10,
    'WirtschaftsWoche HR-Manager Ranking 2022 — Betriebswirtschaft (Business Administration, Fachhochschulen)',
    'https://innovative-trends.de/2022/04/26/wiwo-ranking-2022-wirtschaftsinformatik-informatik-und-bwl-der-hft-stuttgart-in-den-top-10/',
    NOTE_FH,
  ],
]

let inserted = 0
const skipped = []

for (const [name, field, rank, source, url, note] of DATA) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'DE'`
  if (rows.length === 0) {
    skipped.push(`${name} (${field})`)
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
