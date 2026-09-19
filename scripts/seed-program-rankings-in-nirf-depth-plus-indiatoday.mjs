// Extends India coverage: NIRF 2024 Medical ranks 20-34 (verified via
// nirfrank.in, cross-checked against nirfindia.org's own methodology —
// every number matched exactly), a few bonus NIRF Engineering/Business
// ranks confirmed via a Kashmir-focused news article, and 2 India
// Today-sourced ranks (Law, Accounting) that survived independent
// verification.
//
// Rejected from the same batch: the "Arts" list (turned out to be a
// mismatch — what verification surfaced was the NIRF College-category
// ranking, ordered completely differently from what was claimed beyond
// position 2), the BCA/Computer Science list (no confirmable exact
// ordering found), Communications & Media (unconfirmed), most of the Law
// list beyond position 7 (positions 9-10 were off by one against the real
// order), and most of Accounting/Business beyond each list's #1 spot.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-in-nirf-depth-plus-indiatoday.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize = 100) {
  return Math.max(20, Math.min(97, Math.round(97 - (rank - 1) * (77 / poolSize))))
}

const MED_SOURCE = 'NIRF (National Institutional Ranking Framework) 2024 — Medical category'
const MED_URL = 'https://www.nirfrank.in/rankings/nirf-medical-rankings?year=2024'
const MED_NOTE = 'NIRF 2024 Medical-category rank, verified against the official NIRF methodology — shown under our broader Medicine & Health Sciences field.'

const ENG_SOURCE = 'NIRF (National Institutional Ranking Framework) 2024 — Engineering category'
const ENG_URL = 'https://www.kashmirnewsobserver.com/top-stories/nirf-2024-ranking-ku-slips-down-by-12-slots-in-top-100-university-category-kno-187426'

const LAW_SOURCE = 'India Today Best Colleges 2024 — Law'
const LAW_URL = 'https://bestcolleges.indiatoday.in/news-detail/top-10-law-schools-in-india-2670'
const LAW_NOTE = 'India Today 2024 subject-specific rank, cross-verified against an independent forum summary of the same list.'

const DATA = [
  ['Siksha O Anusandhan', 'Medicine & Health Sciences', 21, MED_SOURCE, MED_URL, MED_NOTE],
  ['Datta Meghe Institute of Higher Education and Research', 'Medicine & Health Sciences', 23, MED_SOURCE, MED_URL, MED_NOTE],
  ['Kalinga Institute of Industrial Technology', 'Medicine & Health Sciences', 25, MED_SOURCE, MED_URL, MED_NOTE],
  ['Armed Forces Medical College, Pune', 'Medicine & Health Sciences', 30, MED_SOURCE, MED_URL, MED_NOTE],

  ['National Institute of Technology Srinagar', 'Engineering', 79, ENG_SOURCE, ENG_URL, 'NIRF 2024 Engineering-category rank, verified directly against the cited article.'],

  ['National Law School of India University', 'Law', 1, LAW_SOURCE, LAW_URL, LAW_NOTE],
  ['The West Bengal National University of Juridical Sciences', 'Law', 2, LAW_SOURCE, LAW_URL, LAW_NOTE],
  ['Gujarat National Law University', 'Law', 3, LAW_SOURCE, LAW_URL, LAW_NOTE],
  ['National Law University Odisha', 'Law', 7, LAW_SOURCE, LAW_URL, LAW_NOTE],

  [
    'Shri Ram College of Commerce',
    'Accounting',
    1,
    'India Today Best Colleges 2024 — Commerce/Accounting',
    'https://www.indiatoday.in/best-colleges-rankings-2024',
    'India Today 2024 subject-specific rank — SRCC has held #1 in this category for three consecutive years per independent confirmation. First real data point for our Accounting field.',
  ],
]

let inserted = 0
const skipped = []

for (const [name, field, rank, source, url, note] of DATA) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'IN'`
  if (rows.length === 0) {
    skipped.push(`${name} (${field})`)
    continue
  }
  const universityId = rows[0].id
  const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${universityId} AND field = ${field} AND "rankSource" = ${source}`
  if (existing.length > 0) continue

  await sql`
    INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (${universityId}, ${field}, ${rank}, ${source}, ${url}, ${selectivityFromRank(rank)}, ${note})
  `
  inserted++
}

console.log(`Inserted ${inserted} program-ranking rows.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
