// Second real per-program ranking pass: Computer Science & IT.
// Source: U.S. News & World Report's Best Undergraduate Computer Science
// Programs (peer-assessment survey of CS department chairs/faculty) — this
// is a DIFFERENT US News list from the overall "national universities"
// ranking, built entirely from reputation survey rather than
// graduation-rate/financial metrics. usnews.com's own page is JS-rendered
// and wouldn't fetch directly; confirmed via a secondary article
// (topschoolsrankings.com) that explicitly names its source and methodology
// and presents the numbered list directly rather than as a vague summary —
// same bar used for the Business pass.
//
// Deliberately stops at 10: this is as far as any source gave me a clean,
// directly-quotable numbered list. Every attempt to extend further (or to
// find a verified rank for Northeastern specifically, which the user asked
// about by name) produced inconsistent numbers across sources — one said
// #27, another #34, a third referenced a *graduate* CS ranking instead of
// undergraduate — so none of those are included. Better an honest 10 than
// a padded list with numbers that don't hold up on a second look.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-cs.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const RANK_SOURCE = "U.S. News & World Report — Best Undergraduate Computer Science Programs (peer assessment survey)"
const RANK_SOURCE_URL = 'https://topschoolsrankings.com/top-10-computer-science-universities-in-usa/'
const FIELD = 'Computer Science & IT'

function selectivityFromRank(rank) {
  return Math.max(15, Math.min(99, Math.round(100 - (rank - 1) * 1.1)))
}

const ENTRIES = [
  { name: 'Massachusetts Institute of Technology', rank: 1 },
  { name: 'Carnegie Mellon University', rank: 2 },
  { name: 'Stanford University', rank: 2 },
  { name: 'University of California, Berkeley', rank: 2 },
  { name: 'Princeton University', rank: 5 },
  { name: 'Georgia Institute of Technology', rank: 5 },
  { name: 'University of Illinois Urbana-Champaign', rank: 7 },
  { name: 'Cornell University', rank: 7 },
  { name: 'California Institute of Technology', rank: 9 },
  { name: 'University of Washington', rank: 10 },
]

const NOTES = 'Tied position — US News reports several schools sharing this rank; confirmed via a secondary article that explicitly cites the US News peer-assessment methodology and presents the list directly (usnews.com itself is JS-rendered and would not fetch).'

let inserted = 0
let skipped = []

for (const entry of ENTRIES) {
  const rows = await sql`SELECT id, "academicFields" FROM universities WHERE name = ${entry.name} AND country = 'US'`
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

  // Also make sure these 10 verified-for-CS schools carry the tag, so a
  // CS-intent student's field filter (once broadly tagged enough to
  // activate — see MIN_FIELD_MATCHED_POOL) recognizes them. This does NOT
  // by itself activate field filtering for CS; the threshold is
  // deliberately high enough that 10 elite schools alone can't do that.
  const currentFields = rows[0].academicFields || []
  if (!currentFields.includes(FIELD)) {
    await sql`UPDATE universities SET "academicFields" = ${JSON.stringify([...currentFields, FIELD])}::jsonb WHERE id = ${universityId}`
  }
}

console.log(`\nInserted ${inserted} program ranking rows for field "${FIELD}".`)
if (skipped.length) {
  console.log(`Could not match ${skipped.length} name(s) against the catalog (check spelling): ${skipped.join(', ')}`)
}
