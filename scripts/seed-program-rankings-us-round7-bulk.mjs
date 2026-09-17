// Continuation of round 6's bulk aggregate-list approach — College Factual's
// "Top Ranked" Visual & Performing Arts and Mathematics & Statistics lists,
// cross-matched by exact normalized name against the zero-coverage gap list.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-us-round7-bulk.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank) {
  return Math.max(15, Math.min(99, Math.round(100 - (rank - 1) * 1.1)))
}

const CF_ARTS_SOURCE = 'College Factual — 2026 Best Visual & Performing Arts Schools (Top 50)'
const CF_ARTS_URL = 'https://www.collegefactual.com/majors/visual-and-performing-arts/rankings/top-ranked/'
const CF_MATH_SOURCE = 'College Factual — 2026 Best Mathematics & Statistics Schools (Top 50)'
const CF_MATH_URL = 'https://www.collegefactual.com/majors/mathematics-and-statistics/rankings/top-ranked/'

const DATA = [
  ['San Jose State University', 'Arts', 9, CF_ARTS_SOURCE, CF_ARTS_URL],
  ['Chapman University', 'Arts', 17, CF_ARTS_SOURCE, CF_ARTS_URL],
  ['University of Dayton', 'Arts', 45, CF_ARTS_SOURCE, CF_ARTS_URL],

  ['Chapman University', 'Mathematics & Statistics', 3, CF_MATH_SOURCE, CF_MATH_URL],
  ['San Jose State University', 'Mathematics & Statistics', 16, CF_MATH_SOURCE, CF_MATH_URL],
  ['Trinity University', 'Mathematics & Statistics', 32, CF_MATH_SOURCE, CF_MATH_URL],
  ['Franklin and Marshall College', 'Mathematics & Statistics', 45, CF_MATH_SOURCE, CF_MATH_URL],
]

const NOTE = 'Peer-assessment or composite ranking, not an admissions-selectivity metric directly — programSelectivity here is our own derived scale for comparability with other rankings, not itself a published figure.'

let inserted = 0
const skipped = []

for (const [name, field, rank, source, url] of DATA) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'US'`
  if (rows.length === 0) {
    skipped.push(`${name} (${field})`)
    continue
  }
  const universityId = rows[0].id
  const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${universityId} AND field = ${field} AND "rankSource" = ${source}`
  if (existing.length > 0) continue

  await sql`
    INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (${universityId}, ${field}, ${rank}, ${source}, ${url}, ${selectivityFromRank(rank)}, ${NOTE})
  `
  inserted++
}

console.log(`Inserted ${inserted} program-ranking rows.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
