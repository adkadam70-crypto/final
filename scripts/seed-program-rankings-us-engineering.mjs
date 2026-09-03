// US program rankings — Engineering (Doctorate Offered), ranks 1-17 (top 20
// real rows). Same template/source pattern as Business and CS passes.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-us-engineering.mjs

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
  ['Massachusetts Institute of Technology', 1, '1520-1580', '34-36'],
  ['Stanford University', 2, '1510-1580', '34-35'],
  ['Georgia Institute of Technology', 3, '1370-1540', '30-34'],
  ['University of California, Berkeley', 3, 'N/A', 'N/A'],
  ['California Institute of Technology', 5, 'N/A', 'N/A'],
  ['University of Illinois Urbana-Champaign', 5, '1380-1540', '30-34'],
  ['University of Michigan', 5, '1360-1530', '31-34'],
  ['Carnegie Mellon University', 8, '1500-1570', '34-35'],
  ['Purdue University', 8, '1200-1480', '27-34'],
  ['Cornell University', 10, '1500-1570', '33-35'],
  ['Princeton University', 11, '1510-1580', '34-35'],
  ['University of Texas at Austin', 11, '1320-1530', '29-34'],
  ['Johns Hopkins University', 13, '1520-1570', '34-36'],
  ['University of California, Los Angeles', 14, 'N/A', 'N/A'],
  ['University of Wisconsin-Madison', 14, '1350-1510', '29-33'],
  ['Virginia Tech', 14, '1280-1450', '28-32'],
  ['Duke University', 17, '1500-1570', '34-35'],
  ['Northwestern University', 17, '1510-1570', '34-35'],
  ['Texas A&M University', 17, '1150-1400', '25-31'],
  ['University of California, San Diego', 17, 'N/A', 'N/A'],
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
