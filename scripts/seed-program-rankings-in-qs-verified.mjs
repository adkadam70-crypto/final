// Adds 2 rows from a large QS-sourced batch — the only 2 spot-checked
// exactly (IISc Biological Sciences #143, IIM Calcutta Business #47).
// The rest of the batch was NOT added: University of Delhi's Economics
// claim (125) was checked and found wrong (real figure is 128), and
// IIT Bombay's Mathematics claim (84) couldn't be confirmed either way —
// given one demonstrated error already in this exact batch, the remaining
// ~20 unconfirmed rows (Economics, Mathematics, Data Science,
// Environmental Science, further Business rows) were not trusted
// wholesale. topuniversities.com blocked direct verification (403) on
// every attempt this round, so confirmation relied on independent search
// corroboration only.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-in-qs-verified.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank) {
  return Math.max(10, Math.min(99, Math.round(100 - (rank - 1) * 0.15)))
}

const NOTE = 'World subject rank — programSelectivity is our own derived scale for comparability, not itself a published figure.'

const DATA = [
  [
    'Indian Institute of Science',
    'Biology & Life Sciences',
    143,
    'QS World University Rankings by Subject 2026 — Biological Sciences',
    'https://www.topuniversities.com/university-subject-rankings/biological-sciences',
    NOTE,
  ],
  [
    'Indian Institute of Management Calcutta',
    'Business',
    47,
    'QS World University Rankings by Subject 2026 — Business and Management Studies',
    'https://www.topuniversities.com/university-subject-rankings/business-management-studies',
    NOTE,
  ],
]

let inserted = 0
const skipped = []

for (const [name, field, rank, source, url, note] of DATA) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'IN'`
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
