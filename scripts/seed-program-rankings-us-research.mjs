// US program rankings — Science & Technology / Research, from College
// Transitions' "Colleges with the Best Undergraduate Research Programs."
// This field previously had zero program-ranking coverage in the catalog.
//
// Unlike every other program-ranking source in this catalog, this list is
// NOT numerically ranked — College Transitions presents the 33 schools
// alphabetically as a flat "recognized for" list, not an ordered ranking.
// rankValue is left null for every row (the schema treats null as "not
// numerically ranked," which is exactly true here — not "unresearched").
// programSelectivity is a flat 70 for all rows since there's no order to
// derive a scale from; this is explicitly noted so it's never confused
// with a real per-school selectivity signal.
//
// Run scripts/add-missing-universities-us-research.mjs FIRST — 4 of these
// 33 schools are not yet in the general catalog; this script skips any
// name it can't match.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-us-research.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const FIELD = 'Science & Technology / Research'
const SOURCE = 'College Transitions — Colleges with the Best Undergraduate Research Programs'
const SOURCE_URL = 'https://www.collegetransitions.com/blog/best-colleges-for-undergraduate-research/'
const PROGRAM_SELECTIVITY = 70
const NOTES = 'Unranked recognition list (alphabetical, not ordered) — rankValue is null by design, and programSelectivity is a flat placeholder rather than derived from any real order; do not treat it as a per-school selectivity signal.'

const NAMES = [
  'American University', 'Baylor University', 'Binghamton University', 'Brown University',
  'California Institute of Technology', 'Carnegie Mellon University', 'Case Western Reserve University',
  'Clark University', 'The College of New Jersey', 'College of William & Mary', 'College of Wooster',
  'Dartmouth College', 'Duke University', 'Harvard University', 'Harvey Mudd College',
  'Johns Hopkins University', 'Lawrence University', 'Massachusetts Institute of Technology',
  'Princeton University', 'Pomona College', 'Rhodes College', 'Rice University', 'St. Lawrence University',
  'Stanford University', 'Swarthmore College', 'Trinity College', 'University of California, Berkeley',
  'University of California, Irvine', 'University of Chicago', 'University of Rochester', 'Vassar College',
  'Villanova University', 'Yale University',
]

let rankInserted = 0
let skipped = []

for (const name of NAMES) {
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
        ${universityId}, ${FIELD}, ${null}, ${SOURCE}, ${SOURCE_URL}, ${PROGRAM_SELECTIVITY}, ${NOTES}
      )
    `
    rankInserted++
  }
}

console.log(`Inserted ${rankInserted} program-ranking rows.`)
if (skipped.length) console.log(`Could not match (not in catalog): ${skipped.join(', ')}`)
