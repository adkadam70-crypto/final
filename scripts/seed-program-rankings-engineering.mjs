// Third real per-program ranking pass: Engineering (doctorate-granting track
// — the large-research-university category; the separate "no doctorate"
// US News track for undergrad-only engineering colleges like Harvey Mudd is
// not covered here).
//
// Source: U.S. News & World Report's Best Undergraduate Engineering
// Programs (Doctorate) — peer-assessment survey of engineering deans and
// senior faculty, combined with selectivity/outcomes data. Confirmed via
// the same secondary source used for the CS pass (names its methodology
// directly, presents a clean numbered list) since usnews.com itself is
// JS-rendered and won't fetch.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-engineering.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const RANK_SOURCE = 'U.S. News & World Report — Best Undergraduate Engineering Programs (Doctorate), peer assessment + selectivity/outcomes'
const RANK_SOURCE_URL = 'https://topschoolsrankings.com/top-10-engineering-universities-in-usa/'
const FIELD = 'Engineering'

function selectivityFromRank(rank) {
  return Math.max(15, Math.min(99, Math.round(100 - (rank - 1) * 1.1)))
}

const ENTRIES = [
  { name: 'Massachusetts Institute of Technology', rank: 1 },
  { name: 'Stanford University', rank: 2 },
  { name: 'University of California, Berkeley', rank: 3 },
  { name: 'Georgia Institute of Technology', rank: 3 },
  { name: 'California Institute of Technology', rank: 5 },
  { name: 'University of Illinois Urbana-Champaign', rank: 5 },
  { name: 'University of Michigan', rank: 5 },
  { name: 'Carnegie Mellon University', rank: 8 },
  { name: 'Purdue University', rank: 8 },
  { name: 'Cornell University', rank: 10 },
  { name: 'University of Texas at Austin', rank: 10 },
]

const NOTES = 'Doctorate-granting track only (large research universities) — US News scores undergrad-only engineering colleges like Harvey Mudd separately, not included here. Tied positions confirmed via a secondary article naming the US News methodology directly.'

let inserted = 0
let skipped = []

for (const entry of ENTRIES) {
  const rows = await sql`SELECT id, "academicFields" FROM universities WHERE name = ${entry.name} AND country = 'US'`
  if (rows.length === 0) {
    skipped.push(entry.name)
    continue
  }
  const universityId = rows[0].id

  const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${universityId} AND field = ${FIELD}`
  if (existing.length > 0) {
    console.log(`Skipping ${entry.name} — already has an ${FIELD} ranking row.`)
    continue
  }

  await sql`
    INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (${universityId}, ${FIELD}, ${entry.rank}, ${RANK_SOURCE}, ${RANK_SOURCE_URL}, ${selectivityFromRank(entry.rank)}, ${NOTES})
  `
  inserted++
}

console.log(`\nInserted ${inserted} program ranking rows for field "${FIELD}".`)
if (skipped.length) {
  console.log(`Could not match ${skipped.length} name(s) against the catalog (check spelling): ${skipped.join(', ')}`)
}
