// US rank correction pass #3 — 4 exact tie-band corrections for schools already
// in the catalog (ranks 25-30), verified directly against the user's own
// logged-in U.S. News College Compass subscriber account (2026 Best National
// Universities, /best-colleges/search?_sort=rank&_sortDirection=asc), which
// shows exact tie-accurate ranks per card (e.g. "#26 in National Universities
// (tie)"). This supersedes the sequential/aggregator-derived numbers used in
// round 2 for these 4 schools with the real US News tie-band numbers.
//
// Usage: node --env-file=.env.local scripts/seed-overall-rankings-us-round3.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const RANK_SOURCE = 'U.S. News & World Report — 2026 Best National Universities (verified directly via subscriber account)'

const CORRECTIONS = [
  { name: 'University of North Carolina at Chapel Hill', rank: 26 },
  { name: 'University of Southern California', rank: 28 },
  { name: 'University of California, San Diego', rank: 29 },
  { name: 'University of Florida', rank: 30 },
]

let updated = 0
let skipped = []

for (const { name, rank } of CORRECTIONS) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'US'`
  if (rows.length === 0) {
    skipped.push(name)
    continue
  }
  await sql`UPDATE universities SET "rankValue" = ${rank}, "rankSource" = ${RANK_SOURCE} WHERE id = ${rows[0].id}`
  updated++
}

console.log(`Updated ${updated} rank values.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
