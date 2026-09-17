// Continuation of the bulk aggregate-list approach (rounds 6-9) — six more
// College Factual "Top Ranked" major lists (Social Work, Public Relations &
// Advertising, Philosophy, Human Resource Management, Drama & Theater Arts,
// Civil Engineering), cross-matched by exact normalized name against the
// zero-coverage gap list.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-us-round10-bulk.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank) {
  return Math.max(15, Math.min(99, Math.round(100 - (rank - 1) * 1.1)))
}

const SRC = {
  socwork: ['College Factual — 2026 Best Social Work Schools (Top 50)', 'https://www.collegefactual.com/majors/social-services-public-administration/social-work/rankings/top-ranked/'],
  pr: ['College Factual — 2026 Best Public Relations & Advertising Schools (Top 50)', 'https://www.collegefactual.com/majors/communication-journalism-media/public-relations-advertising/rankings/top-ranked/'],
  phil: ['College Factual — 2026 Best Philosophy Schools (Top 50)', 'https://www.collegefactual.com/majors/philosophy-and-religious-studies/philosophy/rankings/top-ranked/'],
  hr: ['College Factual — 2026 Best Human Resource Management Schools (Top 50)', 'https://www.collegefactual.com/majors/business-management-marketing-sales/human-resource-management/rankings/top-ranked/'],
  drama: ['College Factual — 2026 Best Drama & Theater Arts Schools (Top 50)', 'https://www.collegefactual.com/majors/visual-and-performing-arts/drama-and-theater-arts/rankings/top-ranked/'],
  civeng: ['College Factual — 2026 Best Civil Engineering Schools (Top 50)', 'https://www.collegefactual.com/majors/engineering/civil-engineering/rankings/top-ranked/'],
}

// [name in our catalog, field, rank, sourceKey]
const DATA = [
  // Social Work -> Social Sciences
  ["Saint Mary's University of Minnesota", 'Social Sciences', 14, 'socwork'],
  ['San Jose State University', 'Social Sciences', 15, 'socwork'],
  ['California State University, Fullerton', 'Social Sciences', 16, 'socwork'],
  ['CUNY Hunter College', 'Social Sciences', 18, 'socwork'],
  ['San Francisco State University', 'Social Sciences', 19, 'socwork'],
  ['University of Wisconsin-Stout', 'Social Sciences', 22, 'socwork'],
  ['Seattle University', 'Social Sciences', 34, 'socwork'],
  ['University of Wisconsin-Eau Claire', 'Social Sciences', 38, 'socwork'],
  ['Point Loma Nazarene University', 'Social Sciences', 39, 'socwork'],
  ['Rutgers University-Newark', 'Social Sciences', 46, 'socwork'],

  // Public Relations & Advertising -> Communications & Media
  ['University of Dayton', 'Communications & Media', 5, 'pr'],
  ['San Jose State University', 'Communications & Media', 13, 'pr'],
  ['Miami University', 'Communications & Media', 23, 'pr'],
  ['Towson University', 'Communications & Media', 24, 'pr'],
  ['Chapman University', 'Communications & Media', 38, 'pr'],
  ['University of Rhode Island', 'Communications & Media', 40, 'pr'],

  // Philosophy -> Humanities
  ['San Jose State University', 'Humanities', 12, 'phil'],
  ['Chapman University', 'Humanities', 17, 'phil'],
  ['University of Dayton', 'Humanities', 30, 'phil'],
  ['Sonoma State University', 'Humanities', 48, 'phil'],
  ['Wheaton College', 'Humanities', 49, 'phil'],

  // Human Resource Management -> Business
  ['Miami University', 'Business', 28, 'hr'],
  ['DePaul University', 'Business', 48, 'hr'],
  ['Bryant University', 'Business', 49, 'hr'],
  ["Saint Mary's College of California", 'Business', 50, 'hr'],

  // Drama & Theater Arts -> Arts
  ['San Jose State University', 'Arts', 4, 'drama'],
  ['Xavier University', 'Arts', 12, 'drama'],
  ['Chapman University', 'Arts', 18, 'drama'],
  ['Sonoma State University', 'Arts', 20, 'drama'],
  ['University of Wyoming', 'Arts', 35, 'drama'],
  ['Oklahoma State University', 'Arts', 47, 'drama'],

  // Civil Engineering -> Engineering
  ['San Jose State University', 'Engineering', 12, 'civeng'],
  ['California State University, Fullerton', 'Engineering', 44, 'civeng'],
]

const NOTE = 'Peer-assessment or composite ranking, not an admissions-selectivity metric directly — programSelectivity here is our own derived scale for comparability with other rankings, not itself a published figure.'

let inserted = 0
const skipped = []

for (const [name, field, rank, sourceKey] of DATA) {
  const [source, url] = SRC[sourceKey]
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
