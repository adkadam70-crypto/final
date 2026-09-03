// US program rankings — Engineering round 2, ranks 21-57 (extends the
// top-20 pass from seed-program-rankings-us-engineering.mjs).
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-us-engineering-round2.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const FIELD = 'Engineering'
const SOURCE = 'U.S. News & World Report — 2026 Best Undergraduate Engineering Programs, Doctorate Offered (verified directly via subscriber account)'
const SOURCE_URL = 'https://www.usnews.com/best-colleges/rankings/engineering-doctorate'
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
  ['Columbia University', 21, '1510-1580', '34-35'],
  ['Harvard University', 21, '1510-1580', '34-36'],
  ['Pennsylvania State University', 21, '1240-1420', '27-32'],
  ['Rice University', 21, '1510-1570', '34-35'],
  ['University of Maryland, College Park', 21, '1390-1530', '32-35'],
  ['University of Pennsylvania', 21, '1510-1570', '34-36'],
  ['University of Washington', 21, 'N/A', 'N/A'],
  ['Ohio State University', 28, '1310-1480', '28-32'],
  ['University of Colorado Boulder', 28, '1190-1400', '27-33'],
  ['University of Minnesota Twin Cities', 28, '1300-1500', '26-31'],
  ['University of Southern California', 28, '1450-1550', '32-35'],
  ['University of California, Davis', 32, 'N/A', 'N/A'],
  ['University of Florida', 32, '1320-1500', '30-34'],
  ['Vanderbilt University', 32, '1500-1570', '34-35'],
  ['Arizona State University', 35, '1120-1380', '19-28'],
  ['North Carolina State University', 35, '1300-1470', '28-32'],
  ['Northeastern University', 35, '1440-1540', '33-35'],
  ['Rensselaer Polytechnic Institute', 35, '1375-1510', '30-34'],
  ['University of California, Irvine', 35, 'N/A', 'N/A'],
  ['University of Virginia', 35, '1410-1540', '32-35'],
  ['Yale University', 35, '1470-1570', '33-35'],
  ['Brown University', 42, '1510-1580', '34-35'],
  ['Case Western Reserve University', 42, '1440-1550', '32-35'],
  ['Colorado School of Mines', 42, '1320-1480', '29-33'],
  ['University of California, Santa Barbara', 42, 'N/A', 'N/A'],
  ['University of Notre Dame', 42, '1455-1560', '33-35'],
  ['Washington University in St. Louis', 42, '1500-1570', '33-35'],
  ['Boston University', 48, '1420-1530', '32-34'],
  ['Michigan State University', 48, '1180-1360', '25-31'],
  ['Clemson University', 50, '1240-1410', '28-32'],
  ['Iowa State University', 50, '1120-1360', '21-28'],
  ['Rutgers University-New Brunswick', 50, '1310-1500', '28-33'],
  ['Tufts University', 50, '1470-1560', '33-35'],
  ['University of Arizona', 50, '1150-1420', '21-29'],
  ['University of Delaware', 50, '1200-1390', '28-32'],
  ['University of North Carolina at Chapel Hill', 50, '1390-1530', '28-34'],
  ['Auburn University', 57, '1250-1390', '26-31'],
  ['Dartmouth College', 57, '1500-1570', '33-35'],
  ['Lehigh University', 57, '1370-1500', '31-34'],
  ['Rochester Institute of Technology', 57, '1300-1460', '30-34'],
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
if (skipped.length) console.log(`Could not match (not in catalog yet): ${skipped.join(', ')}`)
