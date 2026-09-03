// US program rankings — Computer Science & IT, first category of the
// program-specific pass (general rank build is complete through 200; this
// starts the "program rank per field" phase the user asked for next).
// Source: U.S. News & World Report 2026 Best Undergraduate Computer Science
// Programs, read live via the subscriber account, ranks 1-78 (every real
// numbered entry the source published before results ran out this session —
// not padded further). Same template as India/UK/AU program-ranking passes:
// selectivityFromRank derives a comparable 0-100 figure, not itself sourced.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-us-cs.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const FIELD = 'Computer Science & IT'
const SOURCE = 'U.S. News & World Report — 2026 Best Undergraduate Computer Science Programs (verified directly via subscriber account)'
const SOURCE_URL = 'https://www.usnews.com/best-colleges/rankings/computer-science-overall'

function selectivityFromRank(rank) {
  return Math.max(15, Math.min(99, Math.round(100 - (rank - 1) * 1.1)))
}

// [dbName, rank]
const DATA = [
  ['Massachusetts Institute of Technology', 1],
  ['Carnegie Mellon University', 2],
  ['Stanford University', 2],
  ['University of California, Berkeley', 2],
  ['Georgia Institute of Technology', 5],
  ['Princeton University', 5],
  ['Cornell University', 7],
  ['University of Illinois Urbana-Champaign', 7],
  ['California Institute of Technology', 9],
  ['University of Texas at Austin', 9],
  ['University of Washington', 9],
  ['Harvard University', 12],
  ['University of California, San Diego', 12],
  ['University of Michigan', 12],
  ['University of California, Los Angeles', 15],
  ['Columbia University', 16],
  ['Johns Hopkins University', 16],
  ['Purdue University', 16],
  ['University of Maryland, College Park', 16],
  ['University of Pennsylvania', 16],
  ['University of Southern California', 16],
  ['University of Wisconsin-Madison', 16],
  ['Yale University', 16],
  ['Duke University', 24],
  ['Brown University', 25],
  ['Harvey Mudd College', 25],
  ['University of California, Irvine', 25],
  ['University of Chicago', 25],
  ['Virginia Tech', 25],
  ['New York University', 30],
  ['Northwestern University', 30],
  ['Rice University', 30],
  ['University of Colorado Boulder', 30],
  ['University of North Carolina at Chapel Hill', 30],
  ['Northeastern University', 35],
  ['University of California, Davis', 35],
  ['University of California, Santa Barbara', 35],
  ['University of Massachusetts Amherst', 35],
  ['Dartmouth College', 39],
  ['Ohio State University', 39],
  ['Pennsylvania State University', 39],
  ['University of Minnesota Twin Cities', 39],
  ['University of Virginia', 39],
  ['Vanderbilt University', 39],
  ['Texas A&M University', 45],
  ['University of Notre Dame', 45],
  ['Washington University in St. Louis', 45],
  ['Arizona State University', 48],
  ['Boston University', 48],
  ['North Carolina State University', 48],
  ['Rensselaer Polytechnic Institute', 48],
  ['University of Florida', 48],
  ['Indiana University Bloomington', 54],
  ['Michigan State University', 54],
  ['Rutgers University-New Brunswick', 54],
  ['Stony Brook University', 54],
  ['Tufts University', 54],
  ['University of Arizona', 54],
  ['College of William & Mary', 54],
  ['Emory University', 63],
  ['Georgetown University', 63],
  ['George Washington University', 63],
  ['University of Pittsburgh', 63],
  ['University of Utah', 63],
  ['Colorado State University', 71],
  ['University of Connecticut', 71],
  ['University of Iowa', 71],
  ['University of Oregon', 71],
  ['University of Tennessee, Knoxville', 71],
  ['University of Texas at Dallas', 71],
  ['Auburn University', 78],
  ['California Polytechnic State University, San Luis Obispo', 78],
  ['Case Western Reserve University', 78],
]

let inserted = 0
let skipped = []

for (const [name, rank] of DATA) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'US'`
  if (rows.length === 0) {
    skipped.push(name)
    continue
  }
  const universityId = rows[0].id
  const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${universityId} AND field = ${FIELD} AND "rankSource" = ${SOURCE}`
  if (existing.length > 0) continue

  await sql`
    INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (
      ${universityId}, ${FIELD}, ${rank}, ${SOURCE}, ${SOURCE_URL},
      ${selectivityFromRank(rank)},
      'Peer-assessment survey ranking, not an admissions-selectivity metric directly — programSelectivity here is our own derived scale for comparability with other rankings, not itself a published figure.'
    )
  `
  inserted++
}

console.log(`Inserted ${inserted} program-ranking rows.`)
if (skipped.length) console.log(`Could not match (not in catalog): ${skipped.join(', ')}`)
