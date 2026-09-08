// US program rankings — Economics, ranks 1-50, from a second real source
// (College Transitions' "2025 Best Colleges for Economics") independent of
// the existing "Economics"-tagged U.S. News list already in this catalog.
//
// Run scripts/add-missing-universities-us-economics.mjs FIRST — three of
// these fifty schools (Holy Cross, Hamilton, Lafayette) are not yet in the
// general catalog; this script skips any name it can't match.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-us-economics-round2.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const FIELD = 'Economics'
const SOURCE = 'College Transitions — 2025 Best Colleges for Economics'
const SOURCE_URL = 'https://www.collegetransitions.com/blog/best-colleges-for-economics/'

function selectivityFromRank(rank) {
  return Math.max(50, Math.round(98 - (rank - 1) * 0.9))
}

const DATA = [
  ['Yale University', 1], ['University of Chicago', 2], ['Harvard University', 3],
  ['Columbia University', 4], ['Johns Hopkins University', 5], ['Northwestern University', 6],
  ['Massachusetts Institute of Technology', 7], ['Duke University', 8], ['University of Pennsylvania', 9],
  ['Dartmouth College', 10], ['Stanford University', 11], ['Princeton University', 12],
  ['Claremont McKenna College', 13], ['Washington University in St. Louis', 14], ['Brown University', 15],
  ['Vanderbilt University', 16], ['University of Notre Dame', 17], ['United States Naval Academy', 18],
  ['Rice University', 19], ['University of California, Los Angeles', 20], ['University of Virginia', 21],
  ['Georgetown University', 22], ['Williams College', 23], ['Boston College', 24],
  ['Tufts University', 25], ['University of California, Berkeley', 26], ['Wake Forest University', 27],
  ['Colgate University', 28], ['Swarthmore College', 30], ['Cornell University', 31],
  ['Emory University', 32], ['Wellesley College', 33], ['Wesleyan University', 34],
  ['Bowdoin College', 35], ['College of the Holy Cross', 36], ['Middlebury College', 37],
  ['Davidson College', 38], ['University of Michigan', 39], ['Bates College', 40],
  ['Hamilton College', 41], ['University of California, Santa Barbara', 42], ['Pomona College', 43],
  ['Bucknell University', 44], ['New York University', 45], ['Lafayette College', 46],
  ['University of North Carolina at Chapel Hill', 47], ['Colby College', 48], ['Boston University', 49],
  ['California Institute of Technology', 50],
]

let rankInserted = 0
let skipped = []

for (const [name, rank] of DATA) {
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
        'Aggregator-compiled ranking, independent methodology from the existing U.S. News-sourced Economics/Social Sciences rows in this catalog — kept as a separate source rather than merged since rank order does not match.'
      )
    `
    rankInserted++
  }
}

console.log(`Inserted ${rankInserted} program-ranking rows.`)
if (skipped.length) console.log(`Could not match (not in catalog): ${skipped.join(', ')}`)
