// First program-specific ranking data point for Hong Kong, after a second,
// deeper research pass specifically checking whether program-specific rank
// ever diverges from general rank here (it does, for Business).
//
// Source: QS World University Rankings by Subject 2026 — Business &
// Management Studies. Real global positions found: HKUST #30, HKU #33 (both
// directly quoted from HKUST's and secondary aggregators' coverage of the
// same QS release). rankValue is the Hong-Kong-only ordinal derived from
// these — same design as every other country here.
//
// This is a genuinely interesting case worth noting: HKU is #1 in Hong
// Kong's GENERAL ranking (see seed-overall-rankings-hk.mjs) but HKUST
// out-ranks it specifically for Business (#30 vs #33 globally) — exactly
// the "a school can be lower overall but higher in one program" pattern
// this feature exists to surface.
//
// Not seeded, and why: CUHK and City University of Hong Kong also compete
// for Hong Kong's Business & Economics reputation (CUHK's own reporting
// claims it as HK's #1 for Business per a DIFFERENT ranking body, Times
// Higher Education — a real, irreconcilable disagreement between QS and THE
// on this specific subject, not a data error) — but no exact QS subject
// number could be found for either school after repeated searches, so they
// stay unseeded rather than guessed into a QS-based order they might not
// actually hold. Computer Science was also researched this pass: HKU, CUHK,
// and HKUST all have real but ambiguous/conflicting positions across
// sources — dropped for the same "can't stand behind this number" reason.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-hk.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)
const RANK_SOURCE = 'QS World University Rankings by Subject 2026 — Business and Management Studies'
const RANK_SOURCE_URL = 'https://www.topuniversities.com/university-subject-rankings/business-management-studies'
const FIELD = 'Business'

function selectivityFromRank(rank) {
  return Math.max(15, Math.min(99, Math.round(100 - (rank - 1) * 1.1)))
}

// HK-only ordinal, derived from real global QS Business positions: HKUST #30, HKU #33.
const ENTRIES = [
  { name: 'Hong Kong University of Science and Technology', rank: 1 },
  { name: 'University of Hong Kong', rank: 2 },
]

let inserted = 0
let skipped = []

for (const entry of ENTRIES) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${entry.name} AND country = 'HK'`
  if (rows.length === 0) {
    skipped.push(entry.name)
    continue
  }
  const universityId = rows[0].id

  const existing = await sql`
    SELECT id FROM "programRankings" WHERE "universityId" = ${universityId} AND field = ${FIELD}
  `
  if (existing.length > 0) continue

  await sql`
    INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity")
    VALUES (${universityId}, ${FIELD}, ${entry.rank}, ${RANK_SOURCE}, ${RANK_SOURCE_URL}, ${selectivityFromRank(entry.rank)})
  `
  inserted++
}

console.log(`Inserted ${inserted} HK program ranking rows (Business).`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
