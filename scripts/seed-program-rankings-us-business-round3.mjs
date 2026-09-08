// US program rankings — Business, ranks 1-50, from a second real source
// (College Transitions' "2026 Best Colleges for Business") independent of
// the U.S. News subscriber-verified Business list already seeded (which
// goes to rank 150 but with real gaps between numbered points).
//
// Run scripts/add-missing-universities-us-business-round3.mjs FIRST —
// Bentley University is not yet in the general catalog; this script skips
// any name it can't match.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-us-business-round3.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const FIELD = 'Business'
const SOURCE = 'College Transitions — 2026 Best Colleges for Business'
const SOURCE_URL = 'https://www.collegetransitions.com/blog/best-colleges-for-business/'

function selectivityFromRank(rank) {
  return Math.max(50, Math.round(97 - (rank - 1) * 0.9))
}

const DATA = [
  ['University of Pennsylvania', 1], ['University of Michigan', 2], ['University of Southern California', 3],
  ['New York University', 4], ['Georgetown University', 5], ['Carnegie Mellon University', 6],
  ['University of Virginia', 7], ['Cornell University', 8], ['University of California, Berkeley', 9],
  ['Emory University', 10], ['Washington University in St. Louis', 11], ['University of Texas at Austin', 12],
  ['University of Notre Dame', 13], ['Georgia Institute of Technology', 14], ['University of North Carolina at Chapel Hill', 15],
  ['Boston College', 16], ['Babson College', 17], ['University of Wisconsin-Madison', 18],
  ['University of Illinois Urbana-Champaign', 19], ['University of Washington', 20], ['Indiana University Bloomington', 21],
  ['Ohio State University', 22], ['Villanova University', 23], ['University of Minnesota Twin Cities', 24],
  ['University of Richmond', 25], ['Wake Forest University', 26], ['Boston University', 27],
  ['Tulane University', 28], ['Washington and Lee University', 29], ['Southern Methodist University', 30],
  ['University of Maryland, College Park', 31], ['University of Georgia', 32], ['University of Florida', 33],
  ['Northeastern University', 34], ['Bentley University', 35], ['Fordham University', 36],
  ['Pennsylvania State University', 37], ['Lehigh University', 38], ['University of Miami', 39],
  ['Case Western Reserve University', 40], ['Texas A&M University', 41], ['University of Pittsburgh', 42],
  ['University of Rochester', 43], ['Florida State University', 44], ['Rutgers University-New Brunswick', 45],
  ['Michigan State University', 46], ['College of William & Mary', 47], ['George Washington University', 48],
  ['Santa Clara University', 49], ['Bucknell University', 50],
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
        'Aggregator-compiled ranking (IPEDS, PayScale/College Scorecard outcomes, peer assessment), independent methodology from the U.S. News subscriber-verified Business list already in this catalog — kept as a separate source rather than merged.'
      )
    `
    rankInserted++
  }
}

console.log(`Inserted ${rankInserted} program-ranking rows.`)
if (skipped.length) console.log(`Could not match (not in catalog): ${skipped.join(', ')}`)
