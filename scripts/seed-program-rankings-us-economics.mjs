// US program rankings — Economics (mapped to our "Social Sciences" academic
// field), ranks 1-27 (top 30 real rows). Williams College appeared in this
// list but isn't in our catalog yet (a real, well-known liberal arts
// college) — flagged as a future new-school candidate rather than added
// here without full profile research.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-us-economics.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const FIELD = 'Social Sciences'
const SOURCE = 'U.S. News & World Report — 2026 Best Undergraduate Economics Programs (verified directly via subscriber account)'
const SOURCE_URL = 'https://www.usnews.com/best-colleges/rankings/economics-overall'
const TEST_SOURCE = 'U.S. News & World Report — 2026 Best Colleges (verified directly via subscriber account)'

function selectivityFromRank(rank) {
  return Math.max(15, Math.min(99, Math.round(100 - (rank - 1) * 1.1)))
}

function parseRange(s) {
  if (!s || s === 'N/A') return [null, null]
  const [lo, hi] = s.split('-').map(Number)
  return [lo, hi]
}

const DATA = [
  ['Stanford University', 1, '1510-1580', '34-35'],
  ['Harvard University', 2, '1510-1580', '34-36'],
  ['Massachusetts Institute of Technology', 2, '1520-1580', '34-36'],
  ['Princeton University', 2, '1510-1580', '34-35'],
  ['University of California, Berkeley', 2, 'N/A', 'N/A'],
  ['University of Chicago', 2, '1510-1580', '34-35'],
  ['Yale University', 2, '1470-1570', '33-35'],
  ['Northwestern University', 8, '1510-1570', '34-35'],
  ['University of Pennsylvania', 8, '1510-1570', '34-36'],
  ['Columbia University', 10, '1510-1580', '34-35'],
  ['Brown University', 11, '1510-1580', '34-35'],
  ['Cornell University', 11, '1500-1570', '33-35'],
  ['University of California, Los Angeles', 11, 'N/A', 'N/A'],
  ['California Institute of Technology', 14, 'N/A', 'N/A'],
  ['Duke University', 14, '1500-1570', '34-35'],
  ['University of Michigan', 14, '1360-1530', '31-34'],
  ['New York University', 17, '1480-1560', '34-35'],
  ['Dartmouth College', 18, '1500-1570', '33-35'],
  ['University of California, San Diego', 18, 'N/A', 'N/A'],
  ['University of Wisconsin-Madison', 18, '1350-1510', '29-33'],
  ['Carnegie Mellon University', 21, '1500-1570', '34-35'],
  ['Johns Hopkins University', 21, '1520-1570', '34-36'],
  ['University of California, Davis', 21, 'N/A', 'N/A'],
  ['University of Texas at Austin', 21, '1320-1530', '29-34'],
  ['Vanderbilt University', 21, '1500-1570', '34-35'],
  ['Boston University', 27, '1420-1530', '32-34'],
  ['University of Illinois Urbana-Champaign', 27, '1380-1540', '30-34'],
  ['University of Minnesota Twin Cities', 27, '1300-1500', '26-31'],
  ['University of Notre Dame', 27, '1455-1560', '33-35'],
]

let rankInserted = 0
let satUpdated = 0
let skipped = []

for (const [name, rank, satStr, actStr] of DATA) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'US'`
  if (rows.length === 0) {
    skipped.push(name)
    continue
  }
  const universityId = rows[0].id

  const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${universityId} AND field = ${FIELD} AND "rankSource" = ${SOURCE}`
  if (existing.length === 0) {
    await sql`
      INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
      VALUES (
        ${universityId}, ${FIELD}, ${rank}, ${SOURCE}, ${SOURCE_URL},
        ${selectivityFromRank(rank)},
        'Peer-assessment survey ranking for the Economics program specifically, not an admissions-selectivity metric directly — programSelectivity here is our own derived scale for comparability, not itself a published figure.'
      )
    `
    rankInserted++
  }

  const [satLo, satHi] = parseRange(satStr)
  const [actLo, actHi] = parseRange(actStr)
  if (satLo != null || actLo != null) {
    await sql`
      UPDATE universities SET
        "satRange25" = COALESCE(${satLo}, "satRange25"),
        "satRange75" = COALESCE(${satHi}, "satRange75"),
        "actRange25" = COALESCE(${actLo}, "actRange25"),
        "actRange75" = COALESCE(${actHi}, "actRange75"),
        "testScoreSource" = COALESCE("testScoreSource", ${TEST_SOURCE})
      WHERE id = ${universityId}
    `
    satUpdated++
  }
}

console.log(`Inserted ${rankInserted} program-ranking rows. Updated SAT/ACT for ${satUpdated} schools.`)
if (skipped.length) console.log(`Could not match (not in catalog yet — future new-school candidate): ${skipped.join(', ')}`)
