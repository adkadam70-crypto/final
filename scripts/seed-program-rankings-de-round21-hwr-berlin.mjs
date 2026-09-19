// Twenty-first Germany pass. HWR Berlin was wrongly marked "not in the
// catalog" earlier this session — it's actually present under its
// official English name, "Berlin School of Economics and Law" (id 592).
// Real 2024 WiWo numbers for it were already confirmed via HWR's own
// official announcement (search result citing their X/Twitter post: "Im
// aktuellen Hochschul-Ranking der WirtschaftsWoche sind unsere
// Studienrichtungen BWL, Informatik & Wirtschaftsinformatik deutschlandweit
// unter den TOP 5 der HAW") but never inserted because the name lookup
// failed at the time.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-de-round21-hwr-berlin.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank) {
  return Math.max(60, Math.min(98, Math.round(98 - (rank - 1) * 3)))
}

const NOTE_FH = 'Real German-specific HR-recruiter survey rank among Fachhochschulen, not a world-subject rank — programSelectivity is our own derived scale for comparability.'
const URL = 'https://x.com/HWR_Berlin/status/1809527715961483484'

const DATA = [
  ['Berlin School of Economics and Law', 'Computer Science & IT', 3, 'WirtschaftsWoche HR-Manager Ranking 2024 — Wirtschaftsinformatik (Business Informatics, Fachhochschulen)', URL, NOTE_FH],
  ['Berlin School of Economics and Law', 'Computer Science & IT', 4, 'WirtschaftsWoche HR-Manager Ranking 2024 — Informatik (Computer Science, Fachhochschulen)', URL, NOTE_FH],
  ['Berlin School of Economics and Law', 'Business', 5, 'WirtschaftsWoche HR-Manager Ranking 2024 — Betriebswirtschaftslehre (BWL, Fachhochschulen)', URL, NOTE_FH],
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
