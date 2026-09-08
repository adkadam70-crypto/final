// US program rankings — Engineering, ranks 1-51, from a third real source
// (College Transitions' "Best Colleges for Mechanical Engineering," used as
// a representative Engineering-field list) independent of the two U.S.
// News-sourced Engineering rounds already seeded.
//
// Run scripts/add-missing-universities-us-engineering.mjs FIRST — four of
// these fifty-one schools (Olin College, West Point, Colorado School of
// Mines, Clarkson) are not yet in the general catalog; this script skips
// any name it can't match.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-us-engineering-round3.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const FIELD = 'Engineering'
const SOURCE = 'College Transitions — Best Colleges for Mechanical Engineering'
const SOURCE_URL = 'https://www.collegetransitions.com/blog/best-colleges-for-mechanical-engineering/'

function selectivityFromRank(rank) {
  return Math.max(45, Math.round(98 - (rank - 1) * 0.9))
}

const DATA = [
  ['Massachusetts Institute of Technology', 1], ['California Institute of Technology', 2],
  ['Washington University in St. Louis', 3], ['Duke University', 4], ['Carnegie Mellon University', 5],
  ['Yale University', 6], ['Princeton University', 7], ['Stanford University', 8],
  ['Johns Hopkins University', 9], ['University of Notre Dame', 10], ['Northeastern University', 11],
  ['Worcester Polytechnic Institute', 12], ['University of Michigan', 13], ['United States Naval Academy', 14],
  ['Rensselaer Polytechnic Institute', 15], ['Rice University', 16], ['Georgia Institute of Technology', 17],
  ['Northwestern University', 18], ['Cornell University', 19], ['Franklin W. Olin College of Engineering', 20],
  ['University of Pennsylvania', 21], ['United States Military Academy', 22], ['University of California, Berkeley', 23],
  ['Colorado School of Mines', 24], ['Rose-Hulman Institute of Technology', 25], ['Lehigh University', 26],
  ['Stevens Institute of Technology', 27], ['University of Florida', 28], ['Columbia University', 29],
  ['Harvard University', 30], ['University of Maryland, College Park', 31], ['Virginia Tech', 32],
  ['University of Texas at Austin', 33], ['Purdue University', 34], ['Pennsylvania State University', 35],
  ['Lafayette College', 36], ['University of California, San Diego', 37], ['University of Illinois Urbana-Champaign', 38],
  ['New Jersey Institute of Technology', 39], ['University of California, Los Angeles', 40],
  ['Boston University', 41], ['Texas A&M University', 42], ['Ohio State University', 43],
  ['University of Wisconsin-Madison', 44], ['Clemson University', 45], ['Case Western Reserve University', 46],
  ['University of Connecticut', 47], ['Clarkson University', 48], ['Vanderbilt University', 49],
  ['North Carolina State University', 50], ['California Polytechnic State University, San Luis Obispo', 51],
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
        'Ranking of Mechanical Engineering programs specifically, used as a representative Engineering-field signal — independent methodology from the U.S. News-sourced Engineering rounds already in this catalog, kept as a separate source rather than merged.'
      )
    `
    rankInserted++
  }
}

console.log(`Inserted ${rankInserted} program-ranking rows.`)
if (skipped.length) console.log(`Could not match (not in catalog): ${skipped.join(', ')}`)
