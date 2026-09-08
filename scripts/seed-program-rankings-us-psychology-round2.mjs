// US program rankings — Psychology, ranks 1-50, from a second real source
// (College Transitions' "2026 Best Colleges for Psychology") independent of
// the U.S. News subscriber-verified list already seeded
// (seed-program-rankings-us-psychology.mjs, ranks 1-33). Kept as a separate
// rankSource rather than merged: the two rankings use different
// methodologies and don't agree on rank order, so stacking them under one
// source would misrepresent which list a given number came from.
//
// Run scripts/add-missing-universities-us-psychology.mjs FIRST — nine of
// these fifty schools are elite liberal-arts colleges not yet in the
// general catalog; this script skips any name it can't match.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-us-psychology-round2.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const FIELD = 'Psychology'
const SOURCE = 'College Transitions — 2026 Best Colleges for Psychology'
const SOURCE_URL = 'https://www.collegetransitions.com/blog/best-colleges-for-psychology/'

function selectivityFromRank(rank) {
  return Math.max(40, Math.round(98 - (rank - 1) * 1.1))
}

const DATA = [
  ['University of Michigan', 1],
  ['Wesleyan University', 2],
  ['Williams College', 3],
  ['Columbia University', 4],
  ['University of California, Santa Barbara', 5],
  ['University of Chicago', 6],
  ['Duke University', 7],
  ['Stanford University', 8],
  ['Harvard University', 9],
  ['Boston College', 10],
  ['University of North Carolina at Chapel Hill', 11],
  ['Barnard College', 12],
  ['Dartmouth College', 13],
  ['University of California, San Diego', 14],
  ['University of Pennsylvania', 15],
  ['Washington University in St. Louis', 16],
  ['Claremont McKenna College', 17],
  ['University of California, Berkeley', 18],
  ['University of Illinois Urbana-Champaign', 19],
  ['Wellesley College', 20],
  ['Bates College', 21],
  ['Princeton University', 22],
  ['Davidson College', 23],
  ['University of Wisconsin-Madison', 24],
  ['University of Texas at Austin', 25],
  ['University of Rochester', 26],
  ['Carleton College', 27],
  ['Emory University', 28],
  ['University of Minnesota Twin Cities', 29],
  ['Cornell University', 30],
  ['Haverford College', 31],
  ['Smith College', 32],
  ['Yale University', 33],
  ['Pomona College', 34],
  ['Colby College', 35],
  ['College of William & Mary', 36],
  ['Tufts University', 37],
  ['Northwestern University', 38],
  ['Brandeis University', 39],
  ['Brown University', 40],
  ['Vassar College', 41],
  ['University of Southern California', 42],
  ['Skidmore College', 43],
  ['Rice University', 44],
  ['Bucknell University', 45],
  ['Connecticut College', 46],
  ['Grinnell College', 47],
  ['Vanderbilt University', 48],
  ['Binghamton University', 49],
  ['University of Colorado Boulder', 50],
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
        'Aggregator-compiled ranking (academic strength, research opportunities, and admissions data), independent methodology from the U.S. News subscriber-verified Psychology list already in this catalog — the two do not share rank order and are kept as separate sources rather than merged.'
      )
    `
    rankInserted++
  }
}

console.log(`Inserted ${rankInserted} program-ranking rows.`)
if (skipped.length) console.log(`Could not match (not in catalog): ${skipped.join(', ')}`)
