// US program rankings — Business, read live via subscriber account,
// ranks 1-19 (top 20 real rows). Same template as CS pass: rank +
// SAT/ACT range written directly onto the university row where present
// (satRange25/75, actRange25/75), plus a programRankings row.
// Source: U.S. News & World Report 2026 Best Undergraduate Business Programs.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-us-business.mjs

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

// [dbName, rank, satRange, actRange]
const DATA = [
  ['Massachusetts Institute of Technology', 1, '1520-1580', '34-36'],
  ['University of Pennsylvania', 1, '1510-1570', '34-36'],
  ['University of California, Berkeley', 3, 'N/A', 'N/A'],
  ['University of Michigan', 4, '1360-1530', '31-34'],
  ['New York University', 5, '1480-1560', '34-35'],
  ['Carnegie Mellon University', 6, '1500-1570', '34-35'],
  ['University of Texas at Austin', 6, '1320-1530', '29-34'],
  ['Cornell University', 8, '1500-1570', '33-35'],
  ['Indiana University Bloomington', 8, '1170-1400', '27-33'],
  ['University of North Carolina at Chapel Hill', 8, '1390-1530', '28-34'],
  ['University of Southern California', 8, '1450-1550', '32-35'],
  ['Emory University', 12, '1470-1550', '32-35'],
  ['Georgetown University', 12, '1390-1550', '31-35'],
  ['Ohio State University', 12, '1310-1480', '28-32'],
  ['University of Illinois Urbana-Champaign', 12, '1380-1540', '30-34'],
  ['University of Notre Dame', 12, '1455-1560', '33-35'],
  ['University of Virginia', 12, '1410-1540', '32-35'],
  ['Washington University in St. Louis', 12, '1500-1570', '33-35'],
  ['Georgia Institute of Technology', 19, '1370-1540', '30-34'],
  ['University of Georgia', 19, '1270-1480', '29-34'],
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
