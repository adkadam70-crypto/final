// ACT range backfill — the general 200-school pass (seed-overall-rankings-us-round5.mjs)
// captured SAT ranges but predates the decision to also track ACT, leaving
// 42 catalog schools with a real SAT range but no ACT range on file. All 42
// verified live via each school's own US News profile page (Admissions
// section), same subscriber session as everything else this pass.
//
// Usage: node --env-file=.env.local scripts/backfill-act-ranges-us.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const DATA = [
  ['American University', 29, 32],
  ['Binghamton University', 31, 34],
  ['Brandeis University', 31, 34],
  ['California State University, Fullerton', 21, 30],
  ['College of William & Mary', 32, 34],
  ['DePaul University', 25, 31],
  ['Drexel University', 27, 32],
  ['East Carolina University', 19, 25],
  ['Elon University', 23, 28],
  ['Fordham University', 30, 33],
  ['George Mason University', 25, 30],
  ['Howard University', 23, 29],
  ['Illinois Institute of Technology', 26, 32],
  ['Louisiana State University', 24, 30],
  ['Loyola Marymount University', 28, 32],
  ['Mercer University', 25, 31],
  ['Miami University', 25, 30],
  ['New Jersey Institute of Technology', 29, 35],
  ['Oregon State University', 24, 31],
  ['Pepperdine University', 29, 32],
  ['Saint Louis University', 25, 31],
  ['Santa Clara University', 31, 33],
  ['Stevens Institute of Technology', 31, 34],
  ['Stony Brook University', 29, 33],
  ['Temple University', 23, 31],
  ['Texas Christian University', 28, 32],
  ['United States Naval Academy', 25, 31],
  ['University at Buffalo', 27, 32],
  ['University of Central Florida', 25, 29],
  ['University of Cincinnati', 24, 29],
  ['University of Dayton', 26, 32],
  ['University of Denver', 28, 32],
  ['University of Houston', 23, 29],
  ['University of Kansas', 20, 28],
  ['University of Kentucky', 21, 28],
  ['University of Louisville', 19, 27],
  ['University of Mississippi', 21, 29],
  ['University of Missouri', 23, 30],
  ['University of Nebraska-Lincoln', 22, 28],
  ['University of Nevada, Reno', 19, 26],
  ['University of North Carolina at Charlotte', 21, 28],
  ['University of South Florida', 24, 29],
]

let updated = 0
let skipped = []

for (const [name, lo, hi] of DATA) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'US'`
  if (rows.length === 0) {
    skipped.push(name)
    continue
  }
  await sql`UPDATE universities SET "actRange25" = ${lo}, "actRange75" = ${hi} WHERE id = ${rows[0].id}`
  updated++
}

console.log(`Updated ACT range for ${updated} schools.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
