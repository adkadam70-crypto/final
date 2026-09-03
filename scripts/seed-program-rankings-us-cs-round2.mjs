// Links CS program ranks for the 7 schools just added to the catalog
// (add-missing-universities-us-from-cs-programs.mjs) — these were found
// while pulling the live US News CS rankings but weren't in the general
// catalog yet, so they were skipped by seed-program-rankings-us-cs.mjs on
// its first pass. Same source/template as that script.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-us-cs-round2.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const FIELD = 'Computer Science & IT'
const SOURCE = 'U.S. News & World Report — 2026 Best Undergraduate Computer Science Programs (verified directly via subscriber account)'
const SOURCE_URL = 'https://www.usnews.com/best-colleges/rankings/computer-science-overall'

function selectivityFromRank(rank) {
  return Math.max(15, Math.min(99, Math.round(100 - (rank - 1) * 1.1)))
}

const DATA = [
  ['University of California, Santa Cruz', 48],
  ['Rochester Institute of Technology', 54],
  ['University of California, Riverside', 54],
  ['University of Illinois Chicago', 63],
  ['Oregon State University', 63],
  ['Rose-Hulman Institute of Technology', 63],
  ['United States Naval Academy', 71],
]

let inserted = 0
let skipped = []

for (const [name, rank] of DATA) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'US'`
  if (rows.length === 0) {
    skipped.push(name)
    continue
  }
  const universityId = rows[0].id
  const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${universityId} AND field = ${FIELD} AND "rankSource" = ${SOURCE}`
  if (existing.length > 0) continue

  await sql`
    INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (
      ${universityId}, ${FIELD}, ${rank}, ${SOURCE}, ${SOURCE_URL},
      ${selectivityFromRank(rank)},
      'Peer-assessment survey ranking, not an admissions-selectivity metric directly — programSelectivity here is our own derived scale for comparability with other rankings, not itself a published figure.'
    )
  `
  inserted++
}

console.log(`Inserted ${inserted} program-ranking rows.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
