// Continuation of the bulk aggregate-list approach (rounds 6-8) — twelve
// more College Factual "Top Ranked" major lists (Biology, Finance,
// Accounting, Sociology, Public Health, Marketing, Chemistry, Physics,
// Journalism, Graphic Design, Anthropology), cross-matched by exact
// normalized name against the zero-coverage gap list.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-us-round9-bulk.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank) {
  return Math.max(15, Math.min(99, Math.round(100 - (rank - 1) * 1.1)))
}

const SRC = {
  bio: ['College Factual — 2026 Best General Biology Schools (Top 50)', 'https://www.collegefactual.com/majors/biological-biomedical-sciences/general-biology/rankings/top-ranked/'],
  finance: ['College Factual — 2026 Best Finance Schools (Top 50)', 'https://www.collegefactual.com/majors/business-management-marketing-sales/finance-financial-management/finance/rankings/top-ranked/'],
  acct: ['College Factual — 2026 Best Accounting Schools (Top 50)', 'https://www.collegefactual.com/majors/business-management-marketing-sales/accounting/rankings/top-ranked/'],
  socio: ['College Factual — 2026 Best Sociology Schools (Top 50)', 'https://www.collegefactual.com/majors/social-sciences/sociology/rankings/top-ranked/'],
  pubhealth: ['College Factual — 2026 Best Public Health Schools (Top 50)', 'https://www.collegefactual.com/majors/health-care-professions/public-health/rankings/top-ranked/'],
  marketing: ['College Factual — 2026 Best Marketing Schools (Top 50)', 'https://www.collegefactual.com/majors/business-management-marketing-sales/marketing/rankings/top-ranked/'],
  chem: ['College Factual — 2026 Best Chemistry Schools (Top 50)', 'https://www.collegefactual.com/majors/physical-sciences/chemistry/rankings/top-ranked/'],
  physics: ['College Factual — 2026 Best Physics Schools (Top 50)', 'https://www.collegefactual.com/majors/physical-sciences/physics/rankings/top-ranked/'],
  journ: ['College Factual — 2026 Best Journalism Schools (Top 50)', 'https://www.collegefactual.com/majors/communication-journalism-media/journalism/rankings/top-ranked/'],
  graphic: ['College Factual — 2026 Best Graphic Design Schools (Top 50)', 'https://www.collegefactual.com/majors/visual-and-performing-arts/design-and-applied-arts/graphic-design/rankings/top-ranked/'],
  anthro: ['College Factual — 2026 Best Anthropology Schools (Top 50)', 'https://www.collegefactual.com/majors/social-sciences/anthropology/rankings/top-ranked/'],
}

// [name in our catalog, field, rank, sourceKey]
const DATA = [
  // Biology -> Science & Technology / Research
  ['San Francisco State University', 'Science & Technology / Research', 9, 'bio'],
  ['San Jose State University', 'Science & Technology / Research', 17, 'bio'],
  ['Massachusetts College of Pharmacy and Health Sciences', 'Science & Technology / Research', 23, 'bio'],
  ['Butler University', 'Science & Technology / Research', 30, 'bio'],
  ['University of Tulsa', 'Science & Technology / Research', 38, 'bio'],

  // Finance -> Business
  ['Miami University', 'Business', 28, 'finance'],
  // Accounting -> Business
  ['Chapman University', 'Business', 37, 'acct'],
  // Marketing -> Business
  ['Miami University', 'Business', 23, 'marketing'],
  ['Drake University', 'Business', 44, 'marketing'],

  // Sociology -> Social Sciences
  ['San Jose State University', 'Social Sciences', 37, 'socio'],
  ['Point Loma Nazarene University', 'Social Sciences', 44, 'socio'],
  ['San Francisco State University', 'Social Sciences', 50, 'socio'],

  // Public Health -> Medicine & Health Sciences
  ['San Jose State University', 'Medicine & Health Sciences', 42, 'pubhealth'],
  ['CUNY Graduate School and University Center', 'Medicine & Health Sciences', 44, 'pubhealth'],

  // Chemistry -> Science & Technology / Research
  ['San Jose State University', 'Science & Technology / Research', 5, 'chem'],
  ['Drake University', 'Science & Technology / Research', 20, 'chem'],
  ['Bradley University', 'Science & Technology / Research', 37, 'chem'],
  ['Franklin and Marshall College', 'Science & Technology / Research', 38, 'chem'],
  ['Sonoma State University', 'Science & Technology / Research', 41, 'chem'],
  ['Furman University', 'Science & Technology / Research', 50, 'chem'],

  // Physics -> Science & Technology / Research
  ['San Jose State University', 'Science & Technology / Research', 10, 'physics'],
  ['Gettysburg College', 'Science & Technology / Research', 30, 'physics'],

  // Journalism -> Communications & Media
  ['Chapman University', 'Communications & Media', 22, 'journ'],
  ['San Jose State University', 'Communications & Media', 25, 'journ'],
  ['San Francisco State University', 'Communications & Media', 34, 'journ'],
  ['University of Wisconsin-Oshkosh', 'Communications & Media', 37, 'journ'],
  ['High Point University', 'Communications & Media', 42, 'journ'],

  // Graphic Design -> Arts
  ['San Jose State University', 'Arts', 1, 'graphic'],
  ['Chapman University', 'Arts', 3, 'graphic'],
  ['Point Loma Nazarene University', 'Arts', 14, 'graphic'],
  ['High Point University', 'Arts', 17, 'graphic'],
  ['Miami University', 'Arts', 20, 'graphic'],
  ['Appalachian State University', 'Arts', 31, 'graphic'],
  ['Suffolk University', 'Arts', 42, 'graphic'],
  ['DePaul University', 'Arts', 43, 'graphic'],
  ['Thomas Jefferson University', 'Arts', 44, 'graphic'],
  ['University of Wisconsin-Stevens Point', 'Arts', 46, 'graphic'],
  ['Endicott College', 'Arts', 50, 'graphic'],

  // Anthropology -> Social Sciences
  ['San Jose State University', 'Social Sciences', 34, 'anthro'],
  ['California State University, Fullerton', 'Social Sciences', 42, 'anthro'],
  ['CUNY Graduate School and University Center', 'Social Sciences', 48, 'anthro'],
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
