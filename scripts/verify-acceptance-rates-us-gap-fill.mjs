// Fills the 10 US catalog schools that had no actualAcceptanceRate on file
// (7 newly added via CS-program-ranking pass, plus 3 pre-existing schools
// that had somehow never gotten one: William & Mary, UC Irvine, UC Santa
// Barbara). Also sets satRange25/75/testScoreSource/testPolicy for the 7
// newly-added schools, read live from each school's own US News profile
// page (Admissions section + explicit "test-optional/test-blind" policy
// sentence in the overview prose) — same subscriber session as everything
// else this session.
//
// Usage: node --env-file=.env.local scripts/verify-acceptance-rates-us-gap-fill.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const RATE_SOURCE = 'U.S. News & World Report — 2026 Best Colleges (verified directly via subscriber account)'
const TEST_SOURCE = 'U.S. News & World Report — 2026 Best Colleges (verified directly via subscriber account)'

const DATA = [
  // name, acceptanceRate, satLow|null, satHigh|null, testPolicy|null
  ['College of William & Mary', 34, null, null, null],
  ['University of California, Irvine', 29, null, null, null],
  ['University of California, Santa Barbara', 33, null, null, null],
  ['Oregon State University', 77, 1140, 1400, 'Test-Optional'],
  ['Rochester Institute of Technology', 67, 1300, 1460, 'Test-Optional'],
  ['Rose-Hulman Institute of Technology', 77, null, null, 'Test-Optional'],
  ['United States Naval Academy', 9, 1210, 1410, null],
  ['University of California, Riverside', 77, null, null, 'Test-Blind'],
  ['University of California, Santa Cruz', 66, null, null, 'Test-Blind'],
  ['University of Illinois Chicago', 77, 1130, 1350, 'Test-Optional'],
]

let updated = 0

for (const [name, rate, lo, hi, policy] of DATA) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'US'`
  if (rows.length === 0) {
    console.log(`Not found: ${name}`)
    continue
  }
  const id = rows[0].id
  await sql`
    UPDATE universities
    SET "actualAcceptanceRate" = ${rate},
        "acceptanceRateSource" = ${RATE_SOURCE},
        "baselineSelectivity" = ${100 - rate}
    WHERE id = ${id}
  `
  if (lo != null && hi != null) {
    await sql`UPDATE universities SET "satRange25" = ${lo}, "satRange75" = ${hi}, "testScoreSource" = ${TEST_SOURCE} WHERE id = ${id}`
  }
  if (policy) {
    await sql`UPDATE universities SET "testPolicy" = ${policy} WHERE id = ${id}`
  }
  updated++
}

console.log(`Updated ${updated} universities.`)
