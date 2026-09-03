// US rank + SAT-range pass #5 — completes the live U.S. News recheck through
// rank 200 (round 4 covered 1-100), and for the FULL 1-200 range populates
// each matched catalog school's real published 25th-75th percentile SAT
// range (satRange25/satRange75/testScoreSource — new columns added this
// session to support the SAT-fit comparison feature in match.ts /
// analyze-target-university.ts). All data read live from the user's own
// premium.usnews.com subscriber session, 2026 Best Colleges edition.
//
// testPolicy is set to 'Test-Blind' ONLY for the University of California
// system and Caltech — these are stable, systemwide, publicly documented
// permanent policies (UC Board of Regents, 2021; Caltech, 2025), not
// something that drifts year to year like individual private schools'
// testing requirements. Every other school showing "N/A" for SAT range on
// the search-card view is left with testPolicy=null (not yet researched) —
// deliberately NOT guessed at, since most other N/A cards just mean no
// range is published on this particular view, not that the school doesn't
// consider scores. A dedicated per-school policy pass is a separate task.
//
// Schools seen live in this range but not yet in our catalog are skipped
// entirely (reported at the end) — same reasoning as round 4: a rank/SAT
// number alone isn't enough to add a school, it needs full profile
// research first.
//
// Usage: node --env-file=.env.local scripts/seed-overall-rankings-us-round5.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const RANK_SOURCE = 'U.S. News & World Report — 2026 Best National Universities (verified directly via subscriber account)'
const TEST_SOURCE = 'U.S. News & World Report — 2026 Best Colleges (verified directly via subscriber account)'

// [dbName, rank, satLow|null, satHigh|null]
const DATA = [
  ['Princeton University', 1, 1510, 1580],
  ['Massachusetts Institute of Technology', 2, 1520, 1580],
  ['Harvard University', 3, 1510, 1580],
  ['Stanford University', 4, 1510, 1580],
  ['Yale University', 4, 1470, 1570],
  ['University of Chicago', 6, 1510, 1580],
  ['Duke University', 7, 1500, 1570],
  ['Johns Hopkins University', 7, 1520, 1570],
  ['Northwestern University', 7, 1510, 1570],
  ['University of Pennsylvania', 7, 1510, 1570],
  ['California Institute of Technology', 11, null, null],
  ['Cornell University', 12, 1500, 1570],
  ['Brown University', 13, 1510, 1580],
  ['Dartmouth College', 13, 1500, 1570],
  ['Columbia University', 15, 1510, 1580],
  ['University of California, Berkeley', 15, null, null],
  ['Rice University', 17, 1510, 1570],
  ['University of California, Los Angeles', 17, null, null],
  ['Vanderbilt University', 17, 1500, 1570],
  ['Carnegie Mellon University', 20, 1500, 1570],
  ['University of Michigan', 20, 1360, 1530],
  ['University of Notre Dame', 20, 1455, 1560],
  ['Washington University in St. Louis', 20, 1500, 1570],
  ['Emory University', 24, 1470, 1550],
  ['Georgetown University', 24, 1390, 1550],
  ['University of North Carolina at Chapel Hill', 26, 1390, 1530],
  ['University of Virginia', 26, 1410, 1540],
  ['University of Southern California', 28, 1450, 1550],
  ['University of California, San Diego', 29, null, null],
  ['University of Florida', 30, 1320, 1500],
  ['University of Texas at Austin', 30, 1320, 1530],
  ['Georgia Institute of Technology', 32, 1370, 1540],
  ['New York University', 32, 1480, 1560],
  ['University of California, Davis', 32, null, null],
  ['University of California, Irvine', 32, null, null],
  ['Boston College', 36, 1440, 1540],
  ['Tufts University', 36, 1470, 1560],
  ['University of Illinois Urbana-Champaign', 36, 1380, 1540],
  ['University of Wisconsin-Madison', 36, 1350, 1510],
  ['University of California, Santa Barbara', 40, null, null],
  ['Ohio State University', 41, 1310, 1480],
  ['Boston University', 42, 1420, 1530],
  ['Rutgers University-New Brunswick', 42, 1310, 1500],
  ['University of Maryland, College Park', 42, 1390, 1530],
  ['University of Washington', 42, null, null],
  ['Lehigh University', 46, 1370, 1500],
  ['Northeastern University', 46, 1440, 1540],
  ['Purdue University', 46, 1200, 1480],
  ['University of Georgia', 46, 1270, 1480],
  ['University of Rochester', 46, 1410, 1540],
  ['Wake Forest University', 51, 1410, 1520],
  ['Case Western Reserve University', 51, 1440, 1550],
  ['Florida State University', 51, 1270, 1410],
  ['Texas A&M University', 51, 1150, 1400],
  ['Virginia Tech', 51, 1280, 1450],
  ['College of William & Mary', 51, 1400, 1530],
  ['Villanova University', 57, 1395, 1510],
  ['George Washington University', 59, 1350, 1500],
  ['Pennsylvania State University', 59, 1240, 1420],
  ['Santa Clara University', 59, 1350, 1490],
  ['Stony Brook University', 59, 1330, 1500],
  ['University of Minnesota Twin Cities', 59, 1300, 1500],
  ['Michigan State University', 64, 1180, 1360],
  ['North Carolina State University', 64, 1300, 1470],
  ['Rensselaer Polytechnic Institute', 64, 1375, 1510],
  ['University of Massachusetts Amherst', 64, 1310, 1500],
  ['University of Miami', 64, 1320, 1480],
  ['Brandeis University', 69, 1390, 1520],
  ['Tulane University', 69, 1400, 1520],
  ['University of Connecticut', 69, 1210, 1440],
  ['University of Pittsburgh', 69, 1280, 1460],
  ['Binghamton University', 73, 1340, 1490],
  ['Indiana University Bloomington', 73, 1170, 1400],
  ['Clemson University', 75, 1240, 1410],
  ['Syracuse University', 75, 1270, 1440],
  ['University at Buffalo', 75, 1210, 1380],
  ['Drexel University', 80, 1240, 1440],
  ['New Jersey Institute of Technology', 80, 1240, 1480],
  ['Stevens Institute of Technology', 80, 1380, 1505],
  ['Pepperdine University', 84, 1290, 1450],
  ['Worcester Polytechnic Institute', 84, null, null],
  ['American University', 88, 1280, 1450],
  ['Baylor University', 88, 1200, 1400],
  ['Howard University', 88, 1130, 1330],
  ['Marquette University', 88, 1200, 1360],
  ['Southern Methodist University', 88, 1340, 1490],
  ['University of Delaware', 88, 1200, 1390],
  ['University of South Florida', 88, 1130, 1320],
  ['Fordham University', 97, 1320, 1480],
  ['Texas Christian University', 97, 1200, 1380],
  ['University of Colorado Boulder', 97, 1190, 1400],
  ['Auburn University', 102, 1250, 1390],
  ['Loyola Marymount University', 102, 1260, 1430],
  ['Saint Louis University', 102, 1200, 1410],
  ['Temple University', 102, 1180, 1390],
  ['University of Iowa', 102, 1130, 1330],
  ['University of Missouri', 102, 1150, 1330],
  ['University of Tennessee, Knoxville', 102, 1200, 1370],
  ['University of Oklahoma', 110, 1140, 1330],
  ['University of Oregon', 110, 1130, 1360],
  ['University of San Diego', 110, null, null],
  ['University of Texas at Dallas', 110, 1160, 1410],
  ['Arizona State University', 117, 1120, 1380],
  ['Elon University', 117, 1130, 1280],
  ['George Mason University', 117, 1160, 1360],
  ['Illinois Institute of Technology', 117, 1180, 1400],
  ['Iowa State University', 117, 1120, 1360],
  ['San Diego State University', 117, null, null],
  ['University of Central Florida', 117, 1200, 1350],
  ['University of Denver', 117, 1190, 1390],
  ['California State University, Long Beach', 127, null, null],
  ['University of Arizona', 127, 1150, 1420],
  ['University of South Carolina', 127, 1180, 1360],
  ['Loyola University Chicago', 132, 1170, 1360],
  ['University of Houston', 132, 1160, 1340],
  ['California State University, Fullerton', 139, 860, 1080],
  ['Miami University', 143, 1220, 1390],
  ['University of Dayton', 143, 1200, 1380],
  ['University of Kansas', 143, 1070, 1300],
  ['University of Kentucky', 143, 1070, 1290],
  ['University of North Carolina at Charlotte', 143, 1140, 1330],
  ['Colorado State University', 151, null, null],
  ['University of Utah', 151, 1190, 1380],
  ['University of Cincinnati', 158, 1160, 1370],
  ['University of Louisville', 158, 1040, 1270],
  ['University of Nebraska-Lincoln', 158, 1098, 1330],
  ['DePaul University', 169, 1140, 1330],
  ['Louisiana State University', 169, 1180, 1340],
  ['Mercer University', 169, 1160, 1350],
  ['University of Alabama', 169, 1170, 1400],
  ['University of Mississippi', 169, 1000, 1200],
  ['University of Arkansas', 183, 1030, 1220],
  ['East Carolina University', 192, 1050, 1230],
  ['University of Nevada, Reno', 192, 1060, 1290],
  ['Washington State University', 192, null, null],
]

const TEST_BLIND = new Set([
  'California Institute of Technology',
  'University of California, Berkeley',
  'University of California, Los Angeles',
  'University of California, San Diego',
  'University of California, Davis',
  'University of California, Irvine',
  'University of California, Santa Barbara',
])

let rankUpdated = 0
let satUpdated = 0
let policyUpdated = 0
let skipped = []

for (const [name, rank, lo, hi] of DATA) {
  const rows = await sql`SELECT id, "rankValue" FROM universities WHERE name = ${name} AND country = 'US'`
  if (rows.length === 0) {
    skipped.push(name)
    continue
  }
  const id = rows[0].id

  if (rows[0].rankValue !== rank) {
    await sql`UPDATE universities SET "rankValue" = ${rank}, "rankSource" = ${RANK_SOURCE} WHERE id = ${id}`
    rankUpdated++
  }

  if (lo != null && hi != null) {
    await sql`UPDATE universities SET "satRange25" = ${lo}, "satRange75" = ${hi}, "testScoreSource" = ${TEST_SOURCE} WHERE id = ${id}`
    satUpdated++
  }

  if (TEST_BLIND.has(name)) {
    await sql`UPDATE universities SET "testPolicy" = 'Test-Blind' WHERE id = ${id}`
    policyUpdated++
  }
}

console.log(`Rank updated: ${rankUpdated}. SAT range set: ${satUpdated}. Test-Blind policy set: ${policyUpdated}.`)
if (skipped.length) console.log(`Could not match (not in catalog): ${skipped.join(', ')}`)
