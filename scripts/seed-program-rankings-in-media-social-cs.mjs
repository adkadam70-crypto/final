// Adds 3 new-field rows for India, each confirmed via multiple independent
// sources (not just the batch's own citation): IIMC #1 in Mass
// Communication (also stated in IIMC's own official prospectus), TISS #1
// in Social Work (India Today/Outlook), Christ University #1 in BCA.
// Symbiosis Institute of Computer Studies & Research (claimed #2 in BCA)
// isn't in this catalog. The Outlook-ICARE PDF cited for a 32-row
// Accounting list came back as unparseable binary when fetched — could not
// verify any of those rows, so none were added.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-in-media-social-cs.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize = 55) {
  return Math.max(20, Math.min(97, Math.round(97 - (rank - 1) * (77 / poolSize))))
}

const DATA = [
  [
    'Indian Institute of Mass Communication',
    'Communications & Media',
    1,
    'India Today Best Colleges 2024 — Mass Communication',
    'https://www.indiatoday.in/magazine/01-07-2024',
    'Independently corroborated: IIMC\'s own official prospectus cites this as its India Today/Outlook/The Week #1 placement. First real data point for our Communications & Media field in India.',
  ],
  [
    'Tata Institute of Social Sciences',
    'Social Sciences',
    1,
    'India Today Best Colleges 2024 — Social Work (MSW)',
    'https://www.indiatoday.in/magazine/01-07-2024',
    'India Today/Outlook 2024 rank for Master of Social Work. First real data point for our Social Sciences field in India.',
  ],
  [
    'Christ University',
    'Computer Science & IT',
    1,
    'India Today Best Colleges 2024 — BCA (Bachelor of Computer Applications)',
    'https://bestcolleges.indiatoday.in/news-detail/top-bachelor-of-computer-application-bca-colleges-in-india-2024-2736',
    'Confirmed via multiple independent searches. First real data point for our Computer Science & IT field in India.',
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
