// Extends India's NIRF coverage (Engineering/Management/Medical/Law/
// Agriculture/Research/Architecture already seeded) with two more official
// NIRF categories: Pharmacy and Dental. Both map onto our existing
// "Medicine & Health Sciences" field since we don't have a separate
// Pharmacy/Dental field — notes flag this explicitly so it's never
// confused with a general-Medical rank.
//
// Institute list and exact ranks pulled directly from the official NIRF
// government pages (nirfindia.org/Rankings/2025/PharmacyRanking.html and
// .../DentalRanking.html) via WebFetch, then matched against this catalog
// by exact/near-exact name — anything ambiguous or not a confident exact
// match was left out rather than guessed (e.g. many specialty pharmacy/
// dental colleges in the official list simply aren't in this catalog, and
// NIRF Dental rank #12 "Postgraduate Institute of Dental Sciences" (Rohtak)
// was deliberately NOT matched to the catalog's "Postgraduate Institute of
// Medical Education and Research, Chandigarh" (PGIMER) — a different
// institution entirely despite the similar name).
//
// AIIMS Delhi is deliberately excluded from the Dental list even though it
// ranks #1 there — it already has a Medicine & Health Sciences row from the
// NIRF Medical category, and adding a second identical-field row for the
// same rank #1 position would be redundant, not additive information.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-in-pharmacy-dental.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize = 100) {
  return Math.max(20, Math.min(97, Math.round(97 - (rank - 1) * (77 / poolSize))))
}

const PHARM_SOURCE = 'NIRF (National Institutional Ranking Framework) 2025 — Pharmacy category'
const PHARM_URL = 'https://www.nirfindia.org/Rankings/2025/PharmacyRanking.html'
const PHARM_NOTE = 'NIRF Pharmacy-category rank specifically (not the general Medical ranking) — shown under our broader Medicine & Health Sciences field.'

const DENTAL_SOURCE = 'NIRF (National Institutional Ranking Framework) 2025 — Dental category'
const DENTAL_URL = 'https://www.nirfindia.org/Rankings/2025/DentalRanking.html'
const DENTAL_NOTE = 'NIRF Dental-category rank specifically (not the general Medical ranking) — shown under our broader Medicine & Health Sciences field.'

const DATA = [
  // [name, rank, source, url, note]
  ['Jamia Hamdard', 1, PHARM_SOURCE, PHARM_URL, PHARM_NOTE],
  ['Birla Institute of Technology and Science, Pilani', 2, PHARM_SOURCE, PHARM_URL, PHARM_NOTE],
  ['Panjab University', 3, PHARM_SOURCE, PHARM_URL, PHARM_NOTE],
  ['Mumbai University (Institute of Chemical Technology)', 6, PHARM_SOURCE, PHARM_URL, PHARM_NOTE],
  ['SRM Institute of Science and Technology', 10, PHARM_SOURCE, PHARM_URL, PHARM_NOTE],
  ["SVKM's Narsee Monjee Institute of Management Studies", 11, PHARM_SOURCE, PHARM_URL, PHARM_NOTE],
  ['Lovely Professional University', 13, PHARM_SOURCE, PHARM_URL, PHARM_NOTE],
  ['Amrita Vishwa Vidyapeetham', 14, PHARM_SOURCE, PHARM_URL, PHARM_NOTE],
  ['Chandigarh University', 15, PHARM_SOURCE, PHARM_URL, PHARM_NOTE],
  ['Chitkara University', 16, PHARM_SOURCE, PHARM_URL, PHARM_NOTE],
  ['Amity University', 18, PHARM_SOURCE, PHARM_URL, PHARM_NOTE],
  ['Central University of Punjab', 20, PHARM_SOURCE, PHARM_URL, PHARM_NOTE],
  ['Banasthali Vidyapith', 22, PHARM_SOURCE, PHARM_URL, PHARM_NOTE],
  ['Jadavpur University', 24, PHARM_SOURCE, PHARM_URL, PHARM_NOTE],

  ['Saveetha Institute of Medical and Technical Sciences', 2, DENTAL_SOURCE, DENTAL_URL, DENTAL_NOTE],
  ['Sri Ramachandra Institute of Higher Education and Research', 13, DENTAL_SOURCE, DENTAL_URL, DENTAL_NOTE],
  ['Banaras Hindu University', 15, DENTAL_SOURCE, DENTAL_URL, DENTAL_NOTE],
  ['Jamia Millia Islamia', 17, DENTAL_SOURCE, DENTAL_URL, DENTAL_NOTE],
  ['Kalinga Institute of Industrial Technology', 26, DENTAL_SOURCE, DENTAL_URL, DENTAL_NOTE],
  ['Aligarh Muslim University', 28, DENTAL_SOURCE, DENTAL_URL, DENTAL_NOTE],
]

let inserted = 0
const skipped = []

for (const [name, rank, source, url, note] of DATA) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'IN'`
  if (rows.length === 0) {
    skipped.push(name)
    continue
  }
  const universityId = rows[0].id
  const field = 'Medicine & Health Sciences'
  const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${universityId} AND field = ${field} AND "rankSource" = ${source}`
  if (existing.length > 0) continue

  await sql`
    INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (${universityId}, ${field}, ${rank}, ${source}, ${url}, ${selectivityFromRank(rank, 100)}, ${note})
  `
  inserted++
}

console.log(`Inserted ${inserted} program-ranking rows.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
