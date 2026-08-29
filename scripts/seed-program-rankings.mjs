// First real per-program ranking data pass. Scope, deliberately: only
// entries directly quoted from a numbered ranking list I could actually
// verify — not search-tool summaries or synthesized "top 10-12" ranges.
// (A computer-science pass was attempted and dropped: every CS source
// available either failed to fetch — usnews.com's own pages are
// JS-rendered and time out — or only produced vague aggregated summaries
// I couldn't independently confirm, including one that turned out to be
// wrong on direct re-check. Better to ship nothing for CS than a number
// I can't stand behind. Same reasoning killed a Northeastern business-rank
// claim a search summary produced but a direct re-fetch of the same
// article didn't actually contain.)
//
// Source: U.S. News & World Report, 2026 Best Undergraduate Business
// Programs (https://www.usnews.com/best-colleges/rankings/business-overall).
// Confirmed via a secondary aggregator (Poets&Quants for Undergrads) that
// quotes the numbered US News list directly, since the usnews.com page
// itself wouldn't render for automated fetching — see rankSourceUrl on
// each row for the page actually used to confirm the number.
//
// programSelectivity is a simple decreasing transform of rank
// (100 - (rank-1)*1.1, clamped 15-99) so it sits on the same 0-100 scale as
// universities.baselineSelectivity — not itself a published figure.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const RANK_SOURCE = 'U.S. News & World Report — 2026 Best Undergraduate Business Programs'
const RANK_SOURCE_URL = 'https://poetsandquantsforundergrads.com/rankings/u-s-news-2026-best-business-schools-ranking-mit-joins-wharton-at-the-top/'
const FIELD = 'Business'

function selectivityFromRank(rank) {
  return Math.max(15, Math.min(99, Math.round(100 - (rank - 1) * 1.1)))
}

// { name: exact match against universities.name, rank: US News 2026 rank (ties share a number) }
const ENTRIES = [
  { name: 'University of Pennsylvania', rank: 1 },
  { name: 'Massachusetts Institute of Technology', rank: 1 },
  { name: 'University of California, Berkeley', rank: 3 },
  { name: 'University of Michigan', rank: 4 },
  { name: 'New York University', rank: 5 },
  { name: 'University of Texas at Austin', rank: 6 },
  { name: 'Carnegie Mellon University', rank: 6 },
  { name: 'University of North Carolina at Chapel Hill', rank: 8 },
  { name: 'Cornell University', rank: 8 },
  { name: 'Indiana University Bloomington', rank: 8 },
  { name: 'University of Southern California', rank: 8 },
  { name: 'Purdue University', rank: 24 },
  { name: 'Michigan State University', rank: 24 },
  { name: 'Rice University', rank: 24 },
  { name: 'Wake Forest University', rank: 41 },
  { name: 'George Washington University', rank: 41 },
  { name: 'Clemson University', rank: 64 },
  { name: 'University of Missouri', rank: 64 },
  { name: 'American University', rank: 77 },
]

const NOTES = 'Tied position — US News reports several schools sharing this rank; confirmed via secondary aggregator since usnews.com is JS-rendered and would not fetch directly.'

let inserted = 0
let skipped = []

for (const entry of ENTRIES) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${entry.name} AND country = 'US'`
  if (rows.length === 0) {
    skipped.push(entry.name)
    continue
  }
  const universityId = rows[0].id

  const existing = await sql`
    SELECT id FROM "programRankings" WHERE "universityId" = ${universityId} AND field = ${FIELD}
  `
  if (existing.length > 0) {
    console.log(`Skipping ${entry.name} — already has a ${FIELD} ranking row.`)
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
