// US program rankings — Business round 2, ranks 24-51 (extends the top-20
// pass from seed-program-rankings-us-business.mjs). Read live via the user's
// own second Chrome tab, sorted by real Business Programs rank.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-us-business-round2.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const FIELD = 'Business'
const SOURCE = 'U.S. News & World Report — 2026 Best Undergraduate Business Programs (verified directly via subscriber account)'
const SOURCE_URL = 'https://www.usnews.com/best-colleges/rankings/business-overall'
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
  ['Arizona State University', 24, '1120-1380', '19-28'],
  ['Michigan State University', 24, '1180-1360', '25-31'],
  ['Pennsylvania State University', 24, '1240-1420', '27-32'],
  ['Purdue University', 24, '1200-1480', '27-34'],
  ['Rice University', 24, '1510-1570', '34-35'],
  ['Texas A&M University', 24, '1150-1400', '25-31'],
  ['University of Florida', 24, '1320-1500', '30-34'],
  ['University of Maryland, College Park', 24, '1390-1530', '32-35'],
  ['Boston College', 32, '1440-1540', '33-35'],
  ['University of Arizona', 32, '1150-1420', '21-29'],
  ['University of California, Irvine', 32, 'N/A', 'N/A'],
  ['University of Colorado Boulder', 32, '1190-1400', '27-33'],
  ['University of Iowa', 32, '1130-1330', '21-28'],
  ['Babson College', 37, 'N/A', 'N/A'],
  ['Boston University', 37, '1420-1530', '32-34'],
  ['University of Tennessee, Knoxville', 37, '1200-1370', '25-31'],
  ['Case Western Reserve University', 41, '1440-1550', '32-35'],
  ['George Washington University', 41, '1350-1500', '30-34'],
  ['Tulane University', 41, '1400-1520', '31-34'],
  ['University of Arkansas', 41, '1030-1220', '21-28'],
  ['University of Miami', 41, '1320-1480', '30-33'],
  ['University of Oregon', 41, '1130-1360', '23-30'],
  ['University of Pittsburgh', 41, '1280-1460', '29-33'],
  ['University of South Carolina', 41, '1180-1360', '26-32'],
  ['University of Utah', 41, '1190-1380', '22-29'],
  ['Wake Forest University', 41, '1410-1520', '32-34'],
  ['Auburn University', 51, '1250-1390', '26-31'],
  ['Florida State University', 51, '1270-1410', '29-32'],
  ['Southern Methodist University', 51, '1340-1490', '30-34'],
  ['Syracuse University', 51, '1270-1440', '29-32'],
  ['University of Alabama', 51, '1170-1400', '24-31'],
  ['University of California, San Diego', 51, 'N/A', 'N/A'],
  ['University of Connecticut', 51, '1210-1440', '28-33'],
  ['University of Oklahoma', 51, '1140-1330', '23-29'],
  ['University of Texas at Dallas', 51, '1160-1410', '24-32'],
  ['Villanova University', 51, '1395-1510', '32-34'],
  ['Virginia Tech', 51, '1280-1450', '28-32'],
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
