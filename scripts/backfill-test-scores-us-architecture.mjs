// Backfills satRange/actRange/testPolicy for the 4 architecture schools
// added in add-missing-universities-us-architecture.mjs — that script only
// captured acceptance rate + core profile fields; test score ranges are
// used directly by match.ts/analyze-target-university.ts's testScoreFit
// comparison and were missing an explicit backfill pass. Uses COALESCE so
// it never overwrites a value that's already set.
//
// Usage: node --env-file=.env.local scripts/backfill-test-scores-us-architecture.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const SOURCE = 'CollegeTuitionCompare / BigFuture, self-reported scores of enrolled students (2024-25 cycle)'

const DATA = [
  ['The Cooper Union for the Advancement of Science and Art', 1405, 1550, 33, 35, 'Test-Optional'],
  ['Pratt Institute', 1140, 1390, 24, 31, 'Test-Optional'],
  ['Rhode Island School of Design', 1396, 1530, 31, 34, 'Test-Optional'],
  ['Southern California Institute of Architecture', 1020, 1230, 27, 30, 'Test-Optional'],
]

let updated = 0
for (const [name, satLo, satHi, actLo, actHi, policy] of DATA) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'US'`
  if (rows.length === 0) {
    console.log(`Not found: ${name}`)
    continue
  }
  await sql`
    UPDATE universities SET
      "satRange25" = COALESCE("satRange25", ${satLo}),
      "satRange75" = COALESCE("satRange75", ${satHi}),
      "actRange25" = COALESCE("actRange25", ${actLo}),
      "actRange75" = COALESCE("actRange75", ${actHi}),
      "testScoreSource" = COALESCE("testScoreSource", ${SOURCE}),
      "testPolicy" = COALESCE("testPolicy", ${policy})
    WHERE id = ${rows[0].id}
  `
  updated++
}
console.log(`Updated ${updated} schools.`)
