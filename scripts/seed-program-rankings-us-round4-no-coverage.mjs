// Second pass over the same zero-programRankings-coverage gap as round 3.
// Most of the remaining candidates (Denison, Hillsdale, Spelman, Bryn Mawr,
// Mount Holyoke, Fisk, Minerva, ...) are liberal-arts colleges without a
// named professional school, so the major aggregators don't publish a
// genuine numbered subject-rank for them — only research-citation counts
// (EduRank-style "865th for Biology") aimed at grad/faculty research
// output, not undergraduate admissions comparability. Using those through
// the same rank->selectivity formula as the ~150-school US News-style
// lists elsewhere in this table would silently misrepresent an unrelated
// metric as a selectivity signal, so this round deliberately adds only the
// one candidate with a real subject-specific list of comparable scale.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-us-round4-no-coverage.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const COLLEGE_FACTUAL_ENG_SOURCE = 'College Factual — 2026 Best Schools for Engineering'
const COLLEGE_FACTUAL_ENG_URL = 'https://www.collegefactual.com/colleges/southern-university-and-a-and-m-college/academic-life/academic-majors/engineering/'

const DATA = [
  {
    name: 'Southern University and A & M College',
    field: 'Engineering',
    rankValue: 363,
    rankSource: COLLEGE_FACTUAL_ENG_SOURCE,
    rankSourceUrl: COLLEGE_FACTUAL_ENG_URL,
    // Manually set, not via the rank->selectivity formula used elsewhere:
    // College Factual's list spans ~1,800+ schools of every selectivity
    // tier (not a curated ~150-school peer-assessment pool like US News),
    // so a raw #363 would floor out the formula and imply near-zero
    // selectivity for a school whose overall baselineSelectivity is 65.
    // Kept aligned to that existing, already-researched figure instead.
    programSelectivity: 65,
    notes:
      'Broad multi-metric ranking across ~1,800+ engineering programs of every selectivity tier, not a peer-assessment survey — programSelectivity kept aligned to this school\'s existing researched baselineSelectivity rather than derived from the raw rank number, which spans a much larger and less selective pool than the ~150-school lists used elsewhere in this table.',
  },
]

let inserted = 0
const skipped = []

for (const row of DATA) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${row.name} AND country = 'US'`
  if (rows.length === 0) {
    skipped.push(row.name)
    continue
  }
  const universityId = rows[0].id
  const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${universityId} AND field = ${row.field} AND "rankSource" = ${row.rankSource}`
  if (existing.length > 0) continue

  await sql`
    INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (
      ${universityId}, ${row.field}, ${row.rankValue}, ${row.rankSource}, ${row.rankSourceUrl},
      ${row.programSelectivity}, ${row.notes}
    )
  `
  inserted++
}

console.log(`Inserted ${inserted} program-ranking rows.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
