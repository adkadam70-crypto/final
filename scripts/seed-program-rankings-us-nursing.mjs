// US program rankings — Nursing (mapped to our "Medicine & Health Sciences"
// academic field), ranks 1-40, matched against existing catalog schools.
// Several real schools seen in this list are NOT yet in our catalog
// (Indiana University Indianapolis, University of Alabama at Birmingham,
// University of Maryland Baltimore, University of Massachusetts Boston,
// Catholic University of America, University of San Francisco) and grad-
// focused institutions with no real undergrad population (Oregon Health &
// Science University, University of Nebraska Medical Center, University of
// Tennessee Health Science Center) were deliberately excluded — these are
// flagged separately for a future new-school pass, not silently dropped.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-us-nursing.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const FIELD = 'Medicine & Health Sciences'
const SOURCE = 'U.S. News & World Report — 2026 Best Undergraduate Nursing Programs (verified directly via subscriber account)'
const SOURCE_URL = 'https://www.usnews.com/best-colleges/rankings/nursing-overall'
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
  ['Duke University', 1, '1500-1570', '34-35'],
  ['Emory University', 2, '1470-1550', '32-35'],
  ['University of Pennsylvania', 2, '1510-1570', '34-36'],
  ['Ohio State University', 4, '1310-1480', '28-32'],
  ['University of North Carolina at Chapel Hill', 4, '1390-1530', '28-34'],
  ['University of Illinois Chicago', 6, '1130-1350', '25-31'],
  ['University of Michigan', 6, '1360-1530', '31-34'],
  ['University of Iowa', 8, '1130-1330', '21-28'],
  ['University of Minnesota Twin Cities', 8, '1300-1500', '26-31'],
  ['University of Pittsburgh', 8, '1280-1460', '29-33'],
  ['University of Washington', 8, 'N/A', 'N/A'],
  ['University of Wisconsin-Madison', 8, '1350-1510', '29-33'],
  ['Boston College', 13, '1440-1540', '33-35'],
  ['Case Western Reserve University', 13, '1440-1550', '32-35'],
  ['Loyola University Chicago', 13, '1170-1360', '27-32'],
  ['New York University', 13, '1480-1560', '34-35'],
  ['University of California, Los Angeles', 13, 'N/A', 'N/A'],
  ['University of Virginia', 13, '1410-1540', '32-35'],
  ['University of Alabama', 22, '1170-1400', '24-31'],
  ['University of Rochester', 22, '1410-1540', '32-34'],
  ['University of South Carolina', 22, '1180-1360', '26-32'],
  ['Villanova University', 22, '1395-1510', '32-34'],
  ['Baylor University', 28, '1200-1400', '27-32'],
  ['George Washington University', 28, '1350-1500', '30-34'],
  ['Marquette University', 28, '1200-1360', '26-31'],
  ['Michigan State University', 28, '1180-1360', '25-31'],
  ['Northeastern University', 28, '1440-1540', '33-35'],
  ['University of Arizona', 28, '1150-1420', '21-29'],
  ['University of California, Irvine', 28, 'N/A', 'N/A'],
  ['University of Tennessee, Knoxville', 28, '1200-1370', '25-31'],
  ['Arizona State University', 40, '1120-1380', '19-28'],
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
        'Peer-assessment survey ranking for the Nursing program specifically, not an admissions-selectivity metric directly — programSelectivity here is our own derived scale for comparability, not itself a published figure.'
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
if (skipped.length) console.log(`Could not match (not in catalog yet — future new-school candidates): ${skipped.join(', ')}`)
