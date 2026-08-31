// First program-specific ranking pass for Australia — Computer Science only.
// Same role/pattern as seed-program-rankings-uk.mjs, but far narrower scope:
// see the note at the bottom of this file for why Business and Engineering
// were researched and then deliberately dropped this round.
//
// Source: QS World University Rankings by Subject 2026 (Computer Science
// and Information Systems). rankValue is an AU-only ordinal derived from
// each school's real global position — same design as the general-ranking
// scripts (seed-overall-rankings-au.mjs etc.): a country-scoped ordinal, not
// the raw global number, so a "Top 50" preference threshold means the same
// kind of thing across every country a student might target.
//
// Real global CS positions used to build the AU-only order (lower = better):
// Melbourne 31, Sydney 38, ANU 48, Monash 51, UNSW 54, UTS 55, Adelaide 73,
// Macquarie 101, Deakin 172. Only the last four (UTS/Adelaide/Macquarie/
// Deakin) are tagged 'Computer Science & IT' in this catalog today, but the
// AI's programRankings lookup keys off universityId + field regardless of
// tagging, so seeding the untagged top 5 too keeps the AU-ordinal for the
// tagged ones honest (UTS is genuinely 6th in Australia, not 1st, once
// Melbourne/Sydney/ANU/Monash/UNSW's real standing is accounted for).
//
// Business and Engineering were researched this round and dropped: QS's
// Business Masters rankings (Management/Finance/Analytics) don't map onto a
// single undergraduate Business subject rank the way CS's subject table
// does, and multiple Engineering & Technology sources gave numbers that
// didn't agree with each other closely enough to trust (WebSearch synthesis
// conflated overall-university-rank facts with subject-specific ones for
// several schools) — better to seed nothing than a number I can't stand
// behind. Singapore and Hong Kong were also checked: the only clean CS data
// found (NUS/NTU for SG, HKU for HK) would just repeat the same order those
// schools already hold in the general ranking, so it wouldn't add any real
// differentiating information — skipped as low-value, not as a gap.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-au.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)
const RANK_SOURCE = 'QS World University Rankings by Subject 2026 — Computer Science and Information Systems'
const RANK_SOURCE_URL = 'https://www.topuniversities.com/university-subject-rankings/computer-science-information-systems'
const FIELD = 'Computer Science & IT'

function selectivityFromRank(rank) {
  return Math.max(15, Math.min(99, Math.round(100 - (rank - 1) * 1.1)))
}

// AU-only ordinal, derived from real global QS CS positions (see header).
const ENTRIES = [
  { name: 'University of Melbourne', rank: 1 },
  { name: 'University of Sydney', rank: 2 },
  { name: 'Australian National University', rank: 3 },
  { name: 'Monash University', rank: 4 },
  { name: 'University of New South Wales', rank: 5 },
  { name: 'University of Technology Sydney', rank: 6 },
  { name: 'University of Adelaide', rank: 7 },
  { name: 'Macquarie University', rank: 8 },
  { name: 'Deakin University', rank: 9 },
]

let inserted = 0
let skipped = []

for (const entry of ENTRIES) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${entry.name} AND country = 'AU'`
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

console.log(`Inserted ${inserted} AU program ranking rows (Computer Science & IT).`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
