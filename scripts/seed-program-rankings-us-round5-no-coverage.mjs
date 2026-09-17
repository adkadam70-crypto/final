// Third pass over the same zero-programRankings-coverage gap. Two real,
// citable subject-specific rankings found this round: the US News
// non-doctorate engineering list (same list used for the Air Force Academy
// in round 3) covers USMMA directly; Puerto Rico-Mayaguez only has a
// College Factual figure, same large/mismatched-scale situation as
// Southern University A&M in round 4, so its programSelectivity is kept
// aligned to its existing baselineSelectivity rather than derived from the
// raw rank.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-us-round5-no-coverage.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank) {
  return Math.max(15, Math.min(99, Math.round(100 - (rank - 1) * 1.1)))
}

const USNEWS_ENG_NODOC_SOURCE = 'U.S. News & World Report — 2026 Best Undergraduate Engineering Programs (schools whose highest degree is a bachelor\'s or master\'s)'
const USNEWS_ENG_NODOC_URL = 'https://www.usnews.com/best-colleges/rankings/engineering-overall'
const COLLEGE_FACTUAL_ENG_SOURCE = 'College Factual — 2026 Best Schools for Engineering'
const COLLEGE_FACTUAL_ENG_URL = 'https://www.collegefactual.com/colleges/university-of-puerto-rico-mayaguez/academic-life/academic-majors/engineering/'

let inserted = 0
const skipped = []

async function insertRow(name, field, rankValue, source, url, programSelectivity, notes) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'US'`
  if (rows.length === 0) {
    skipped.push(name)
    return
  }
  const universityId = rows[0].id
  const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${universityId} AND field = ${field} AND "rankSource" = ${source}`
  if (existing.length > 0) return

  await sql`
    INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (${universityId}, ${field}, ${rankValue}, ${source}, ${url}, ${programSelectivity}, ${notes})
  `
  inserted++
}

await insertRow(
  'United States Merchant Marine Academy',
  'Engineering',
  29,
  USNEWS_ENG_NODOC_SOURCE,
  USNEWS_ENG_NODOC_URL,
  selectivityFromRank(29),
  'Tied ranking (#29) on the non-doctorate Best Undergraduate Engineering list.',
)

await insertRow(
  'University of Puerto Rico-Mayaguez',
  'Engineering',
  325,
  COLLEGE_FACTUAL_ENG_SOURCE,
  COLLEGE_FACTUAL_ENG_URL,
  43,
  'Broad multi-metric ranking across ~1,800+ engineering programs of every selectivity tier, not a peer-assessment survey — programSelectivity kept aligned to this school\'s existing researched baselineSelectivity (43) rather than derived from the raw rank number, which spans a much larger and less selective pool than the ~150-school lists used elsewhere in this table.',
)

console.log(`Inserted ${inserted} program-ranking rows.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
