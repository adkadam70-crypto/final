// One-off cleanup: collapse every (university, field) in programRankings to
// a single row. Two duplication patterns had crept in from overlapping
// seed passes:
//
//  A. US News CS / Engineering / Business — an early pass
//     (seed-program-rankings{,-cs,-engineering}.mjs) seeded rows under a
//     vague source label ("(peer assessment survey)", or no "verified"
//     suffix), then a later verified pass (seed-program-rankings-us-*.mjs
//     + -round2) seeded a second row under the precise
//     "... (verified directly via subscriber account)" label. Same ranking,
//     two rows. Keep the verified row, drop the early one.
//
//  B. India health — NIRF has separate Medical, Dental and Pharmacy
//     category tables, and the app has only one "Medicine & Health
//     Sciences" field, so a school ranked in more than one landed multiple
//     rows. A generic health-field badge should reflect the general Medical
//     ranking, not a sub-specialty, so where a Medical-category row exists
//     the Dental / Pharmacy rows for that school are dropped. A school
//     ranked ONLY in Dental or Pharmacy keeps its row (it's the best
//     available signal).
//
// Data-driven and idempotent — safe to re-run. The match query and the
// target-analysis query both pick one row per (university, field); after
// this there is only one, so the pick is unambiguous.
//
// Usage: node --import ./scripts/_dns-fix.mjs --env-file=.env scripts/dedupe-program-rankings.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const before = (await sql`SELECT count(*)::int AS c FROM "programRankings"`)[0].c

// --- Pattern A: early US News labels superseded by the verified pass ---
const STALE_A = [
  'U.S. News & World Report — 2026 Best Undergraduate Business Programs', // early Business (no "verified" suffix)
  'U.S. News & World Report — Best Undergraduate Computer Science Programs (peer assessment survey)',
  'U.S. News & World Report — Best Undergraduate Engineering Programs (Doctorate), peer assessment + selectivity/outcomes',
]
// Only delete an early row when the same (university, field) also has a
// "verified" row — never leave a school with no ranking at all.
const deletedA = await sql`
  DELETE FROM "programRankings" a
  USING "programRankings" b
  WHERE a."rankSource" = ANY(${STALE_A})
    AND b."universityId" = a."universityId"
    AND b.field = a.field
    AND b.id <> a.id
    AND b."rankSource" LIKE '%verified directly via subscriber account%'
  RETURNING a.id`

// --- Pattern B: NIRF Dental / Pharmacy rows where a Medical row exists ---
const deletedB = await sql`
  DELETE FROM "programRankings" a
  USING "programRankings" b
  WHERE a."rankSource" LIKE 'NIRF%'
    AND (a."rankSource" LIKE '%Dental category' OR a."rankSource" LIKE '%Pharmacy category')
    AND b."universityId" = a."universityId"
    AND b.field = a.field
    AND b.id <> a.id
    AND b."rankSource" LIKE '%Medical category'
  RETURNING a.id`

const after = (await sql`SELECT count(*)::int AS c FROM "programRankings"`)[0].c

// --- Verify: no (university, field) left with more than one row ---
const remaining = await sql`
  SELECT "universityId", field, count(*)::int AS c
  FROM "programRankings" GROUP BY "universityId", field HAVING count(*) > 1`

console.log(`Pattern A (stale US News): deleted ${deletedA.length}`)
console.log(`Pattern B (NIRF Dental/Pharmacy w/ Medical): deleted ${deletedB.length}`)
console.log(`programRankings: ${before} -> ${after}`)
if (remaining.length) {
  console.log(`\nSTILL multi-row (${remaining.length}) — inspect:`)
  for (const r of remaining) {
    const rows = await sql`SELECT id, "rankValue", "rankSource" FROM "programRankings" WHERE "universityId" = ${r.universityId} AND field = ${r.field}`
    console.log(`  uid ${r.universityId} / ${r.field}`)
    for (const x of rows) console.log(`    id ${x.id}  #${x.rankValue}  ${x.rankSource}`)
  }
} else {
  console.log('\nEvery (university, field) now has exactly one row. ✓')
}
