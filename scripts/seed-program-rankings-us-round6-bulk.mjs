// Bulk pass — same zero-programRankings-coverage gap as rounds 3-5, but
// sourced from full aggregate ranking lists (Poets&Quants' complete
// 110-school 2026 undergrad business ranking, and College Factual's
// "Top Ranked" major-specific lists for Engineering/Psychology/Education)
// instead of one search per school, then cross-matched by exact
// normalized name against the ~711-school gap list. Every row here is a
// real numbered entry from one of these public lists — schools that showed
// up on a list but don't exist in our catalog, or whose name didn't match
// exactly (so couldn't be safely auto-matched), are simply absent, not
// guessed at.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-us-round6-bulk.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank) {
  return Math.max(15, Math.min(99, Math.round(100 - (rank - 1) * 1.1)))
}

const PQ_BUSINESS_SOURCE = 'Poets&Quants — 2026 Best Undergraduate Business Programs (complete 110-school ranking)'
const PQ_BUSINESS_URL = 'https://poetsandquants.com/2026/03/26/poetsquants-best-undergraduate-business-schools-of-2026/6/'
const CF_ENGINEERING_SOURCE = 'College Factual — 2026 Best Engineering Schools (Top 50)'
const CF_ENGINEERING_URL = 'https://www.collegefactual.com/majors/engineering/rankings/top-ranked/'
const CF_PSYCHOLOGY_SOURCE = 'College Factual — 2026 Best Psychology Schools'
const CF_PSYCHOLOGY_URL = 'https://www.collegefactual.com/majors/psychology/rankings/top-ranked/'
const CF_EDUCATION_SOURCE = 'College Factual — 2026 Best Education Schools (Top 50)'
const CF_EDUCATION_URL = 'https://www.collegefactual.com/majors/education/rankings/top-ranked/'

// [name in our catalog, field, rank, source, url]
const DATA = [
  // Poets&Quants 2026 Business — exact catalog-name matches only
  ['Trinity University', 'Business', 30, PQ_BUSINESS_SOURCE, PQ_BUSINESS_URL],
  ['Providence College', 'Business', 48, PQ_BUSINESS_SOURCE, PQ_BUSINESS_URL],
  ['Miami University', 'Business', 58, PQ_BUSINESS_SOURCE, PQ_BUSINESS_URL],
  ['Lipscomb University', 'Business', 59, PQ_BUSINESS_SOURCE, PQ_BUSINESS_URL],
  ['Florida Southern College', 'Business', 69, PQ_BUSINESS_SOURCE, PQ_BUSINESS_URL],
  ['University of Dayton', 'Business', 70, PQ_BUSINESS_SOURCE, PQ_BUSINESS_URL],
  ['Susquehanna University', 'Business', 71, PQ_BUSINESS_SOURCE, PQ_BUSINESS_URL],
  ['Sacred Heart University', 'Business', 72, PQ_BUSINESS_SOURCE, PQ_BUSINESS_URL],
  ['Seattle University', 'Business', 79, PQ_BUSINESS_SOURCE, PQ_BUSINESS_URL],
  ['Towson University', 'Business', 84, PQ_BUSINESS_SOURCE, PQ_BUSINESS_URL],
  ['Butler University', 'Business', 87, PQ_BUSINESS_SOURCE, PQ_BUSINESS_URL],
  ['Texas State University', 'Business', 89, PQ_BUSINESS_SOURCE, PQ_BUSINESS_URL],
  ['San Jose State University', 'Business', 93, PQ_BUSINESS_SOURCE, PQ_BUSINESS_URL],
  ['Bryant University', 'Business', 95, PQ_BUSINESS_SOURCE, PQ_BUSINESS_URL],
  ['Christopher Newport University', 'Business', 99, PQ_BUSINESS_SOURCE, PQ_BUSINESS_URL],
  ['University of Evansville', 'Business', 100, PQ_BUSINESS_SOURCE, PQ_BUSINESS_URL],
  ['Kennesaw State University', 'Business', 102, PQ_BUSINESS_SOURCE, PQ_BUSINESS_URL],
  ['Longwood University', 'Business', 103, PQ_BUSINESS_SOURCE, PQ_BUSINESS_URL],
  ['University of the Pacific', 'Business', 104, PQ_BUSINESS_SOURCE, PQ_BUSINESS_URL],
  ['University of Wisconsin-Milwaukee', 'Business', 105, PQ_BUSINESS_SOURCE, PQ_BUSINESS_URL],
  ['Northern Illinois University', 'Business', 106, PQ_BUSINESS_SOURCE, PQ_BUSINESS_URL],
  ['Iona University', 'Business', 107, PQ_BUSINESS_SOURCE, PQ_BUSINESS_URL],
  ['Ithaca College', 'Business', 108, PQ_BUSINESS_SOURCE, PQ_BUSINESS_URL],
  ['Roger Williams University', 'Business', 109, PQ_BUSINESS_SOURCE, PQ_BUSINESS_URL],

  // College Factual 2026 Engineering (Top 50)
  ['Point Loma Nazarene University', 'Engineering', 21, CF_ENGINEERING_SOURCE, CF_ENGINEERING_URL],
  ['San Jose State University', 'Engineering', 25, CF_ENGINEERING_SOURCE, CF_ENGINEERING_URL],

  // College Factual 2026 Psychology
  ['San Jose State University', 'Psychology', 10, CF_PSYCHOLOGY_SOURCE, CF_PSYCHOLOGY_URL],
  ['Simmons College', 'Psychology', 63, CF_PSYCHOLOGY_SOURCE, CF_PSYCHOLOGY_URL],
  ['University of Rhode Island', 'Psychology', 74, CF_PSYCHOLOGY_SOURCE, CF_PSYCHOLOGY_URL],
  ['Towson University', 'Psychology', 76, CF_PSYCHOLOGY_SOURCE, CF_PSYCHOLOGY_URL],

  // College Factual 2026 Education (Top 50)
  ['San Jose State University', 'Education', 33, CF_EDUCATION_SOURCE, CF_EDUCATION_URL],
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
