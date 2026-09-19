// Eighteenth Germany pass. 4 more rows: HTW Dresden (Wirtschaftsingenieurwesen
// #3, Elektrotechnik #5 — both explicitly 2024, unlike an earlier fetch of
// HTW Dresden's own page which turned out to be 2022 data and was
// correctly excluded), HAW Hamburg (Wirtschaftsingenieurwesen #8, 9.4%),
// plus two bonus confirmations for schools already in the database: HTW
// Berlin Electrical Engineering #2, and Hamburg University of Technology
// (TUHH) Electrical Engineering #10 (university pool).
//
// Ostfalia Hochschule and Fachhochschule Dortmund remain with zero data —
// no confirmable exact 2024 number was found for either after several
// search attempts.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-de-round18-final-fh.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank) {
  return Math.max(60, Math.min(98, Math.round(98 - (rank - 1) * 3)))
}

const NOTE = 'Real German-specific HR-recruiter survey rank, not a world-subject rank — programSelectivity is our own derived scale for comparability.'
const NOTE_FH = `${NOTE} Rank is among Fachhochschulen/Universities of Applied Sciences specifically.`

const DATA = [
  [
    'Dresden University of Applied Sciences',
    'Engineering',
    3,
    'WirtschaftsWoche HR-Manager Ranking 2024 — Wirtschaftsingenieurwesen (Industrial Engineering, Fachhochschulen)',
    'https://vwi.org/2024/06/wiwo-ranking-2024-rwth-aachen-und-htw-berlin-vorn/',
    NOTE_FH,
  ],
  [
    'Dresden University of Applied Sciences',
    'Engineering',
    5,
    'WirtschaftsWoche HR-Manager Ranking 2024 — Elektrotechnik (Electrical Engineering, Fachhochschulen)',
    'https://www.haw-hamburg.de/detail/news/news/show/haw-hamburg-im-che-ranking-bei-elektrotechnik-und-informationstechnik-in-spitzengruppen/',
    NOTE_FH,
  ],
  [
    'Hamburg University of Applied Sciences',
    'Engineering',
    8,
    'WirtschaftsWoche HR-Manager Ranking 2024 — Wirtschaftsingenieurwesen (Industrial Engineering, Fachhochschulen)',
    'https://www.haw-hamburg.de/detail/news/news/show/haw-hamburg-im-che-ranking-bei-elektrotechnik-und-informationstechnik-in-spitzengruppen/',
    NOTE_FH,
  ],
  [
    'HTW Berlin',
    'Engineering',
    2,
    'WirtschaftsWoche HR-Manager Ranking 2024 — Elektrotechnik (Electrical Engineering, Fachhochschulen)',
    'https://www.haw-hamburg.de/detail/news/news/show/haw-hamburg-im-che-ranking-bei-elektrotechnik-und-informationstechnik-in-spitzengruppen/',
    NOTE_FH,
  ],
  [
    'Hamburg University of Technology',
    'Engineering',
    10,
    'WirtschaftsWoche HR-Manager Ranking 2024 — Elektrotechnik (Electrical Engineering, Universities)',
    'https://www.haw-hamburg.de/detail/news/news/show/haw-hamburg-im-che-ranking-bei-elektrotechnik-und-informationstechnik-in-spitzengruppen/',
    NOTE,
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
