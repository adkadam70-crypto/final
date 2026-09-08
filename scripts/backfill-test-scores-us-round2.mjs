// Backfills satRange/actRange/testPolicy for the 35 US universities added
// earlier this session (Communications, Psychology, Nursing, Economics,
// Engineering gap-fill batches) whose add-missing-universities-us-*.mjs
// scripts only captured acceptance rate + core profile fields. Test score
// ranges feed match.ts/analyze-target-university.ts's testScoreFit
// comparison directly, so every new catalog addition should carry them.
// Uses COALESCE so it never overwrites a value already set.
//
// Usage: node --env-file=.env.local scripts/backfill-test-scores-us-round2.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const SOURCE = 'CollegeTuitionCompare / BigFuture / PrepScholar, self-reported scores of enrolled students (2024-25 cycle)'

// [name, satLo, satHi, actLo, actHi, testPolicy]
const DATA = [
  // Communications & Media
  ['Emerson College', 1250, 1430, 30, 32, 'Test-Optional'],
  ['Hofstra University', 1190, 1370, 26, 31, 'Test-Optional'],
  // Psychology (elite LACs)
  ['Barnard College', 1380, 1550, 31, 34, 'Test-Optional'],
  ['Wellesley College', 1400, 1540, 31, 34, 'Test-Optional'],
  ['Bates College', 1430, 1510, 32, 34, 'Test-Optional'],
  ['Carleton College', 1350, 1530, 31, 34, 'Test-Optional'],
  ['Smith College', 1420, 1540, 32, 35, 'Test-Optional'],
  ['Colby College', 1460, 1550, 32, 34, 'Test-Optional'],
  ['Skidmore College', 1340, 1480, 31, 34, 'Test-Optional'],
  ['Connecticut College', 1290, 1430, 30, 32, 'Test-Optional'],
  ['Grinnell College', 1400, 1550, 30, 33, 'Test-Optional'],
  // Economics
  ['College of the Holy Cross', 1240, 1410, 27, 32, 'Test-Optional'],
  ['Hamilton College', 1450, 1550, 33, 35, 'Test-Optional'],
  ['Lafayette College', 1340, 1500, 31, 33, 'Test-Optional'],
  // Engineering
  ['Franklin W. Olin College of Engineering', 1500, 1560, 34, 35, 'Test-Optional'],
  ['United States Military Academy', 1210, 1420, 27, 33, 'Required'],
  ['Colorado School of Mines', 1140, 1450, 30, 34, 'Test-Optional'],
  ['Clarkson University', 1200, 1390, 25, 32, 'Test-Optional'],
  // Nursing
  ['Fairfield University', 1210, 1350, 29, 32, 'Test-Optional'],
  ['Samford University', 1158, 1227, 25, 26, 'Test-Optional'],
  ['Widener University', 1050, 1260, 22, 29, 'Test-Optional'],
  ['Simmons University', 1215, 1380, 26, 32, 'Test-Optional'],
  ['University of Portland', 1168, 1370, 25, 31, 'Test-Optional'],
  ['Quinnipiac University', 1150, 1320, 24, 29, 'Test-Optional'],
  ['University of Scranton', 1160, 1318, 25, 30, 'Test-Optional'],
  ['James Madison University', 1140, 1320, 23, 29, 'Test-Optional'],
  ['Virginia Commonwealth University', 1010, 1270, 22, 30, 'Test-Optional'],
  ['Georgia College & State University', 1070, 1230, 22, 26, 'Test-Optional'],
  ['University of North Carolina at Greensboro', 1130, 1310, null, null, 'Test-Optional'],
  ["Texas Woman's University", 970, 1150, 16, 22, 'Test-Optional'],
  ['South Dakota State University', 1070, 1220, 19, 25, 'Test-Optional'],
  ['Gonzaga University', 1220, 1400, 29, 32, 'Test-Optional'],
  ['Regis University', 1020, 1220, 22, 29, 'Test-Optional'],
  ['Adelphi University', 1110, 1310, 22, 29, 'Test-Optional'],
  ['Thomas Jefferson University', 1180, 1320, 25, 30, 'Test-Optional'],
]

let updated = 0
let notFound = []
for (const [name, satLo, satHi, actLo, actHi, policy] of DATA) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'US'`
  if (rows.length === 0) {
    notFound.push(name)
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
if (notFound.length) console.log(`Not found: ${notFound.join(', ')}`)
