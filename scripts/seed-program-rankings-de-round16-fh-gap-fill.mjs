// Sixteenth Germany pass, targeting the 15 Fachhochschulen that had zero
// real data anywhere in the database (identified after rejecting the WiWo
// batches in rounds 13/15). Real 2024 WirtschaftsWoche placements found
// and verified for 5 of them via official university press releases and
// direct page fetches; the rest either had no confirmable 2024-specific
// number (HTWK Leipzig, Fachhochschule Dortmund, HTW Dresden — its own
// pages only had 2022/2023 data, and mixing years risks citing the wrong
// figure), or aren't in this catalog at all (HWR Berlin — genuinely
// absent from the universities table, a catalog-completeness gap rather
// than a missing-data one).
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-de-round16-fh-gap-fill.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank) {
  return Math.max(60, Math.min(98, Math.round(98 - (rank - 1) * 3)))
}

const NOTE = 'Real German-specific HR-recruiter survey rank among Fachhochschulen (Universities of Applied Sciences), not a world-subject rank — programSelectivity is our own derived scale for comparability.'

const DATA = [
  [
    'Reutlingen University',
    'Business',
    2,
    'WirtschaftsWoche HR-Manager Ranking 2024 — Betriebswirtschaftslehre (BWL, Fachhochschulen)',
    'https://www.reutlingen-university.de/en/newsroom/news/news-detail/erneute-spitzenplaetze-beim-ranking-der-wirtschaftswoche',
    NOTE,
  ],
  [
    'Frankfurt University of Applied Sciences',
    'Business',
    4,
    'WirtschaftsWoche HR-Manager Ranking 2024 — Betriebswirtschaftslehre (BWL, Fachhochschulen)',
    'https://www.frankfurt-university.de/en/news2024/n-studi-news-en/wirtschaftswoche-university-ranking-frankfurt-uas-in-the-top-10-three-times-again/',
    NOTE,
  ],
  [
    'Frankfurt University of Applied Sciences',
    'Engineering',
    4,
    'WirtschaftsWoche HR-Manager Ranking 2024 — Wirtschaftsingenieurwesen (Industrial Engineering, Fachhochschulen)',
    'https://www.frankfurt-university.de/en/news2024/n-studi-news-en/wirtschaftswoche-university-ranking-frankfurt-uas-in-the-top-10-three-times-again/',
    NOTE,
  ],
  [
    'Frankfurt University of Applied Sciences',
    'Computer Science & IT',
    7,
    'WirtschaftsWoche HR-Manager Ranking 2024 — Informatik (Computer Science, Fachhochschulen)',
    'https://www.frankfurt-university.de/en/news2024/n-studi-news-en/wirtschaftswoche-university-ranking-frankfurt-uas-in-the-top-10-three-times-again/',
    NOTE,
  ],
  [
    'Cologne Business School',
    'Business',
    7,
    'WirtschaftsWoche HR-Manager Ranking 2024 — Betriebswirtschaftslehre (BWL, Fachhochschulen)',
    'https://www.openpr.de/news/989371/Cologne-Business-School-erreicht-erneut-Spitzenposition-im-Hochschul-Ranking.html',
    NOTE,
  ],
  [
    'IU Internationale Hochschule GmbH',
    'Business',
    9,
    'WirtschaftsWoche HR-Manager Ranking 2024 — Betriebswirtschaftslehre (BWL, Fachhochschulen)',
    'https://idw-online.de/de/news827869',
    NOTE,
  ],
  [
    'Berliner Hochschule für Technik',
    'Engineering',
    3,
    'WirtschaftsWoche HR-Manager Ranking 2024 — Elektrotechnik (Electrical Engineering, Fachhochschulen)',
    'https://www.bht-berlin.de/3897/article/9300',
    NOTE,
  ],
  [
    'Berliner Hochschule für Technik',
    'Engineering',
    3,
    'WirtschaftsWoche HR-Manager Ranking 2024 — Maschinenbau (Mechanical Engineering, Fachhochschulen)',
    'https://www.bht-berlin.de/3897/article/9300',
    NOTE,
  ],
  [
    'Berliner Hochschule für Technik',
    'Computer Science & IT',
    5,
    'WirtschaftsWoche HR-Manager Ranking 2024 — Informatik (Computer Science, Fachhochschulen)',
    'https://www.bht-berlin.de/3897/article/9300',
    NOTE,
  ],
  [
    'Berliner Hochschule für Technik',
    'Engineering',
    6,
    'WirtschaftsWoche HR-Manager Ranking 2024 — Wirtschaftsingenieurwesen (Industrial Engineering, Fachhochschulen)',
    'https://www.bht-berlin.de/3897/article/9300',
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
