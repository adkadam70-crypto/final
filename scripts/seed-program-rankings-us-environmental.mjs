// US program rankings — Environmental Science & Sustainability, ranks 1-48.
// This field previously had zero program-ranking coverage in the catalog.
//
// Source: College Transitions' "2025 Best Colleges for Environmental
// Science."
//
// Run scripts/add-missing-universities-us-environmental.mjs FIRST — 13 of
// these 48 schools are not yet in the general catalog; this script skips
// any name it can't match.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-us-environmental.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const FIELD = 'Environmental Science & Sustainability'
const SOURCE = 'College Transitions — 2025 Best Colleges for Environmental Science'
const SOURCE_URL = 'https://www.collegetransitions.com/blog/best-colleges-for-environmental-science/'

function selectivityFromRank(rank) {
  return Math.max(35, Math.round(96 - (rank - 1) * 1.3))
}

const DATA = [
  ['Northwestern University', 1], ['Johns Hopkins University', 2], ['Duke University', 3],
  ['Brown University', 4], ['University of California, Davis', 5], ['University of California, Berkeley', 6],
  ['Columbia University', 7], ['University of Virginia', 8], ['Dartmouth College', 9],
  ['Rice University', 10], ['Middlebury College', 11], ['University of Chicago', 12],
  ['Colorado College', 13], ['Pomona College', 14], ['University of Notre Dame', 15],
  ['SUNY College of Environmental Science and Forestry', 16], ['University of California, Los Angeles', 17],
  ['University of Washington', 18], ['University of Wisconsin-Madison', 19], ['Hamilton College', 20],
  ['Bates College', 21], ['Bowdoin College', 22], ['University of Michigan', 23],
  ['Wellesley College', 24], ['Wesleyan University', 25], ['Davidson College', 26],
  ['Scripps College', 27], ['Pitzer College', 28], ['Northeastern University', 29],
  ['Dickinson College', 30], ['Clark University', 31], ['Willamette University', 32],
  ['Colgate University', 33], ['University of Colorado Boulder', 34], ['Boston University', 35],
  ['Florida State University', 36], ['Barnard College', 37], ['University of Southern California', 38],
  ['University of North Carolina at Chapel Hill', 39], ['University of California, Santa Cruz', 40],
  ['University of Minnesota Twin Cities', 41], ['University of Vermont', 42], ['Oregon State University', 43],
  ['Hobart and William Smith Colleges', 44], ['Juniata College', 45], ['University of North Carolina Wilmington', 46],
  ['University of North Carolina Asheville', 47], ["St. Mary's College of Maryland", 48],
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
        'Aggregator-compiled ranking (academic strength, research opportunities, outcomes), our own derived scale for comparability with other rankings, not itself a published figure.'
      )
    `
    rankInserted++
  }
}

console.log(`Inserted ${rankInserted} program-ranking rows.`)
if (skipped.length) console.log(`Could not match (not in catalog): ${skipped.join(', ')}`)
