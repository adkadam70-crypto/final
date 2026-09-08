// US program rankings — Communications & Media, ranks 1-30.
//
// Source: College Transitions' "2025 Best Colleges for Journalism" —
// real, published, numbered list covering journalism/communications
// programs specifically (distinct from universities.baselineSelectivity,
// which is a school-wide curated estimate).
//
// Run scripts/add-missing-universities-us-communications.mjs FIRST — two of
// these thirty schools (Emerson College, Hofstra University) are not yet in
// the general catalog and this script skips any name it can't match.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-us-communications.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const FIELD = 'Communications & Media'
const SOURCE = 'College Transitions — 2025 Best Colleges for Journalism'
const SOURCE_URL = 'https://www.collegetransitions.com/blog/best-colleges-for-journalism/'

function selectivityFromRank(rank) {
  return Math.max(30, Math.round(95 - (rank - 1) * 1.5))
}

const DATA = [
  ['New York University', 1],
  ['University of Southern California', 2],
  ['Boston University', 3],
  ['University of Texas at Austin', 4],
  ['University of Wisconsin-Madison', 5],
  ['American University', 6],
  ['George Washington University', 7],
  ['University of Maryland, College Park', 8],
  ['University of Richmond', 9],
  ['University of Missouri', 10],
  ['Emerson College', 11],
  ['University of North Carolina at Chapel Hill', 12],
  ['Ohio State University', 13],
  ['Washington and Lee University', 14],
  ['Syracuse University', 15],
  ['Northeastern University', 16],
  ['University of Minnesota Twin Cities', 17],
  ['University of Florida', 18],
  ['Indiana University Bloomington', 19],
  ['Lehigh University', 20],
  ['University of Georgia', 21],
  ['Arizona State University', 22],
  ['Southern Methodist University', 23],
  ['University of Massachusetts Amherst', 24],
  ['Rutgers University-New Brunswick', 25],
  ['Elon University', 26],
  ['Hofstra University', 27],
  ['University of Iowa', 28],
  ['University of Oregon', 29],
  ['Fordham University', 30],
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
        'Aggregator-compiled ranking (student media awards, faculty resources, and admissions data), not a single admissions-selectivity metric — programSelectivity here is our own derived scale for comparability with other rankings, not itself a published figure.'
      )
    `
    rankInserted++
  }
}

console.log(`Inserted ${rankInserted} program-ranking rows.`)
if (skipped.length) console.log(`Could not match (not in catalog): ${skipped.join(', ')}`)
