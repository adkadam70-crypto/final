// US program rankings — Architecture & Design, ranks 1-10.
//
// Source: Architect Magazine's "Top 10 Undergraduate Architecture Schools in
// the U.S." — a peer-reputation survey among practicing architects and
// educators (originally compiled with DesignIntelligence data before that
// survey was permanently discontinued in 2022; Architect Magazine's own
// published top-10 list remains the real, citable source used here). Only
// 10 rows: this is a top-10 list, not an expanded ranking — do not extend it
// with invented ranks beyond what the source actually published.
//
// Run scripts/add-missing-universities-us-architecture.mjs FIRST — five of
// these ten schools (Cal Poly SLO, Cooper Union, Pratt, RISD, SCI-Arc) are
// not yet in the general catalog and this script skips any name it can't
// match.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-us-architecture.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const FIELD = 'Architecture & Design'
const SOURCE = "Architect Magazine — Top 10 Undergraduate Architecture Schools in the U.S."
const SOURCE_URL = 'https://www.architectmagazine.com/practice/professional-development/the-top-10-undergraduate-architecture-schools-in-the-u-s_o/'

function selectivityFromRank(rank) {
  return Math.max(85, Math.round(100 - (rank - 1) * 1.5))
}

const DATA = [
  ['Cornell University', 1],
  ['Rice University', 2],
  ['California Polytechnic State University, San Luis Obispo', 3],
  ['Syracuse University', 4],
  ['The Cooper Union for the Advancement of Science and Art', 5],
  ['Rhode Island School of Design', 6],
  ['Pratt Institute', 7],
  ['Virginia Tech', 8],
  ['Southern California Institute of Architecture', 9],
  ['University of Texas at Austin', 10],
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
        'Peer-reputation survey ranking, not an admissions-selectivity metric directly — programSelectivity here is our own derived scale for comparability with other rankings, not itself a published figure. The architecture program specifically is typically far more selective than the school-wide baselineSelectivity (e.g. Cooper Union admits ~4% to its architecture school vs ~11% university-wide).'
      )
    `
    rankInserted++
  }
}

console.log(`Inserted ${rankInserted} program-ranking rows.`)
if (skipped.length) console.log(`Could not match (not in catalog): ${skipped.join(', ')}`)
