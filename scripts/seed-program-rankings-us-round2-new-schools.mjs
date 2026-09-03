// Links program-specific ranks for the 6 schools just added in
// add-missing-universities-us-round2.mjs — these were originally flagged
// because they appeared in a program ranking (Business, Nursing, Economics)
// but weren't in the catalog yet, so their program row couldn't be written
// at the time. Same real-source template as every other program-ranking
// script this session.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-us-round2-new-schools.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank) {
  return Math.max(15, Math.min(99, Math.round(100 - (rank - 1) * 1.1)))
}

const BUSINESS_SOURCE = 'U.S. News & World Report — 2026 Best Undergraduate Business Programs (verified directly via subscriber account)'
const BUSINESS_URL = 'https://www.usnews.com/best-colleges/rankings/business-overall'
const NURSING_SOURCE = 'U.S. News & World Report — 2026 Best Undergraduate Nursing Programs (verified directly via subscriber account)'
const NURSING_URL = 'https://www.usnews.com/best-colleges/rankings/nursing-overall'
const ECON_SOURCE = 'U.S. News & World Report — 2026 Best Undergraduate Economics Programs (verified directly via subscriber account)'
const ECON_URL = 'https://www.usnews.com/best-colleges/rankings/economics-overall'

const DATA = [
  ['Williams College', 'Social Sciences', 21, ECON_SOURCE, ECON_URL],
  ['University of Alabama at Birmingham', 'Medicine & Health Sciences', 13, NURSING_SOURCE, NURSING_URL],
  ['Indiana University Indianapolis', 'Medicine & Health Sciences', 13, NURSING_SOURCE, NURSING_URL],
  ['University of Massachusetts Boston', 'Business', 150, BUSINESS_SOURCE, BUSINESS_URL],
  ['University of San Francisco', 'Business', 131, BUSINESS_SOURCE, BUSINESS_URL],
]

let inserted = 0
let skipped = []

for (const [name, field, rank, source, url] of DATA) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'US'`
  if (rows.length === 0) {
    skipped.push(name)
    continue
  }
  const universityId = rows[0].id
  const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${universityId} AND field = ${field} AND "rankSource" = ${source}`
  if (existing.length > 0) continue

  await sql`
    INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (
      ${universityId}, ${field}, ${rank}, ${source}, ${url},
      ${selectivityFromRank(rank)},
      'Peer-assessment survey ranking, not an admissions-selectivity metric directly — programSelectivity here is our own derived scale for comparability with other rankings, not itself a published figure.'
    )
  `
  inserted++
}

console.log(`Inserted ${inserted} program-ranking rows.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
