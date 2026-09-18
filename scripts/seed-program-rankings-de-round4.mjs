// Fourth Germany program-ranking pass. Sourced from a batch Gemini
// returned, verified row-by-row via WebFetch against the cited page before
// insertion. Two rows from that batch were dropped: "Bonn Computer Science
// & IT rank 95" (the cited THE press release does not mention Bonn for
// Computer Science at all — only for Law — so that row was a fabricated
// citation, not a real one) and "Bonn Physical Sciences 46 / Economics 69"
// from collegebatch.com (an SEO aggregator, could not be independently
// verified). University of Hamburg and a second University of Freiburg
// batch from universityguru.com were dropped entirely — that site 403'd on
// every fetch attempt, so those numbers are unverifiable and were left out
// rather than trusted on Gemini's word alone.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-de-round4.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank) {
  return Math.max(15, Math.min(99, Math.round(100 - (rank - 1) * 0.42)))
}

const ARWU_SOURCE_BASE = 'ARWU Global Ranking of Academic Subjects 2024'
const ARWU_URL = 'https://www.uni-bonn.de/en/news/219-2024'

const DATA = [
  [
    'University of Bonn',
    'Agriculture & Natural Resources',
    34,
    `${ARWU_SOURCE_BASE} — Agricultural Sciences`,
    ARWU_URL,
    'World subject rank — programSelectivity is our own derived scale for comparability, not itself a published figure.',
  ],
  [
    'University of Bonn',
    'Mathematics & Statistics',
    38,
    `${ARWU_SOURCE_BASE} — Mathematics`,
    ARWU_URL,
    'World subject rank.',
  ],
  [
    'University of Bonn',
    'Economics',
    41,
    `${ARWU_SOURCE_BASE} — Economics`,
    ARWU_URL,
    'World subject rank.',
  ],
  [
    'University of Bonn',
    'Law',
    95,
    'THE World University Rankings by Subject 2025 — Law',
    'https://www.timeshighereducation.com/press-releases/out-now-times-higher-education-world-university-rankings-subject-2025',
    'World subject rank — "newly ranked at joint 95" per THE\'s own press release.',
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
