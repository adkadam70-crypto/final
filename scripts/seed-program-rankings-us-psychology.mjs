// US program rankings — Psychology, ranks 1-33 (top 40 real rows).
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-us-psychology.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const FIELD = 'Psychology'
const SOURCE = 'U.S. News & World Report — 2026 Best Undergraduate Psychology Programs (verified directly via subscriber account)'
const SOURCE_URL = 'https://www.usnews.com/best-colleges/rankings/psychology-overall'
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
  ['Harvard University', 1, '1510-1580', '34-36'],
  ['Princeton University', 2, '1510-1580', '34-35'],
  ['Stanford University', 2, '1510-1580', '34-35'],
  ['University of California, Berkeley', 2, 'N/A', 'N/A'],
  ['University of California, Los Angeles', 5, 'N/A', 'N/A'],
  ['University of Michigan', 5, '1360-1530', '31-34'],
  ['Yale University', 5, '1470-1570', '33-35'],
  ['Cornell University', 8, '1500-1570', '33-35'],
  ['Johns Hopkins University', 8, '1520-1570', '34-36'],
  ['University of Illinois Urbana-Champaign', 8, '1380-1540', '30-34'],
  ['Carnegie Mellon University', 11, '1500-1570', '34-35'],
  ['Columbia University', 11, '1510-1580', '34-35'],
  ['Duke University', 11, '1500-1570', '34-35'],
  ['Northwestern University', 11, '1510-1570', '34-35'],
  ['University of California, Davis', 11, 'N/A', 'N/A'],
  ['University of California, San Diego', 11, 'N/A', 'N/A'],
  ['University of North Carolina at Chapel Hill', 11, '1390-1530', '28-34'],
  ['University of Pennsylvania', 11, '1510-1570', '34-36'],
  ['Brown University', 19, '1510-1580', '34-35'],
  ['Dartmouth College', 19, '1500-1570', '33-35'],
  ['University of Chicago', 19, '1510-1580', '34-35'],
  ['University of Texas at Austin', 19, '1320-1530', '29-34'],
  ['University of Wisconsin-Madison', 19, '1350-1510', '29-33'],
  ['Vanderbilt University', 19, '1500-1570', '34-35'],
  ['Washington University in St. Louis', 19, '1500-1570', '33-35'],
  ['Emory University', 26, '1470-1550', '32-35'],
  ['Georgetown University', 26, '1390-1550', '31-35'],
  ['Indiana University Bloomington', 26, '1170-1400', '27-33'],
  ['University of California, Irvine', 26, 'N/A', 'N/A'],
  ['University of Minnesota Twin Cities', 26, '1300-1500', '26-31'],
  ['University of Notre Dame', 26, '1455-1560', '33-35'],
  ['University of Virginia', 26, '1410-1540', '32-35'],
  ['Georgia Institute of Technology', 33, '1370-1540', '30-34'],
  ['New York University', 33, '1480-1560', '34-35'],
  ['Ohio State University', 33, '1310-1480', '28-32'],
  ['Pennsylvania State University', 33, '1240-1420', '27-32'],
  ['Purdue University', 33, '1200-1480', '27-34'],
  ['University of California, Santa Barbara', 33, 'N/A', 'N/A'],
  ['University of Colorado Boulder', 33, '1190-1400', '27-33'],
  ['University of Massachusetts Amherst', 33, '1310-1500', '30-33'],
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
        'Peer-assessment survey ranking, not an admissions-selectivity metric directly — programSelectivity here is our own derived scale for comparability with other rankings, not itself a published figure.'
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
if (skipped.length) console.log(`Could not match (not in catalog): ${skipped.join(', ')}`)
