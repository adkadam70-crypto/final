// Sixth Germany program-ranking pass, first to fully clear our
// zero-coverage priority list for three schools. Stuttgart (QS 2024) and
// Münster Psychology (THE 2026) verified via WebFetch against their cited
// pages. Tübingen: the batch cited 4 subjects, but fetching the actual THE
// university-profile page directly surfaced two more real, exact-numbered
// rows the batch missed (Medical and Health #99, Computer Science =#89) —
// added those too since they were sitting right there on the same
// verified page. A "Goethe Frankfurt Philosophy 45" candidate from the
// same batch was dropped: a follow-up search found a conflicting #38 claim
// for the same subject/year, and the page couldn't be fetched to resolve
// which is right.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-de-round6.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank) {
  return Math.max(15, Math.min(99, Math.round(100 - (rank - 1) * 0.42)))
}

const THE_TUB_URL = 'https://www.timeshighereducation.com/world-university-rankings/university-tubingen'
const THE_TUB_NOTE = 'World subject rank — programSelectivity is our own derived scale for comparability, not itself a published figure.'

const DATA = [
  [
    'University of Stuttgart',
    'Engineering',
    48,
    'QS World University Rankings by Subject 2024 — Mechanical, Aeronautical & Manufacturing Engineering',
    'https://www.uni-stuttgart.de/en/university/news/all/Excellent-performance-in-the-QS-World-University-Rankings-by-Subject-2024/',
    'World rank for the narrower Mechanical/Aeronautical/Manufacturing Engineering subject specifically.',
  ],
  ['University of Tübingen', 'Humanities', 36, 'THE World University Rankings by Subject 2026 — Arts and Humanities', THE_TUB_URL, THE_TUB_NOTE],
  ['University of Tübingen', 'Psychology', 48, 'THE World University Rankings by Subject 2026 — Psychology', THE_TUB_URL, THE_TUB_NOTE],
  ['University of Tübingen', 'Education', 68, 'THE World University Rankings by Subject 2026 — Education Studies', THE_TUB_URL, THE_TUB_NOTE],
  ['University of Tübingen', 'Biology & Life Sciences', 68, 'THE World University Rankings by Subject 2026 — Life Sciences', THE_TUB_URL, THE_TUB_NOTE],
  ['University of Tübingen', 'Medicine & Health Sciences', 99, 'THE World University Rankings by Subject 2026 — Medical and Health', THE_TUB_URL, THE_TUB_NOTE],
  ['University of Tübingen', 'Computer Science & IT', 89, 'THE World University Rankings by Subject 2026 — Computer Science', THE_TUB_URL, THE_TUB_NOTE],
  [
    'University of Münster',
    'Psychology',
    98,
    'THE World University Rankings by Subject 2026 — Psychology',
    'https://www.timeshighereducation.com/world-university-rankings/university-munster',
    THE_TUB_NOTE,
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
