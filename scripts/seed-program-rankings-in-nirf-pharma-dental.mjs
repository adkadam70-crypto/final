// India — NIRF 2024 Pharmacy and Dental category rankings, matched by exact
// normalized name against the existing catalog only (no new university
// rows). Field: Medicine & Health Sciences for both (no dedicated
// Pharmacy/Dental field in ACADEMIC_FIELDS).
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-in-nirf-pharma-dental.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const FIELD = 'Medicine & Health Sciences'
const PHARMA_SOURCE = 'NIRF 2024 — Pharmacy Category Ranking'
const PHARMA_URL = 'https://www.nirfindia.org/Rankings/2024/PharmacyRanking.html'
const DENTAL_SOURCE = 'NIRF 2024 — Dental Category Ranking'
const DENTAL_URL = 'https://www.nirfindia.org/Rankings/2024/DentalRanking.html'

const PHARMA_DATA = [
  ['Jamia Hamdard', 1], ['Birla Institute of Technology and Science, Pilani', 3], ['Panjab University', 7],
  ["SVKM's Narsee Monjee Institute of Management Studies", 10], ['Amrita Vishwa Vidyapeetham', 13],
  ['Lovely Professional University', 16], ['Jadavpur University', 18], ['Chitkara University', 19],
  ['Chandigarh University', 20], ['Babasaheb Bhimrao Ambedkar University', 21], ['Amity University', 22],
  ['Central University of Punjab', 23], ['Annamalai University', 27], ['Banasthali Vidyapith', 28],
  ['Central University of Rajasthan', 29], ['Shoolini University of Biotechnology and Management Sciences', 30],
  ['Sri Ramachandra Institute of Higher Education and Research', 31], ['Nirma University', 37],
  ['Dibrugarh University', 43], ['Maharaja Sayajirao University of Baroda', 44], ['Integral University', 45],
  ['Parul University', 47], ['Galgotias University', 50], ['Mohan Lal Sukhadia University', 59],
  ['Sharda University', 69], ['Anurag University', 71], ['Bundelkhand University', 74], ['Kakatiya University', 88],
]

const DENTAL_DATA = [
  ['Saveetha Institute of Medical and Technical Sciences', 1], ["King George's Medical University", 4],
  ['Jamia Millia Islamia', 8], ['Siksha O Anusandhan', 9], ['Sri Ramachandra Institute of Higher Education and Research', 10],
  ['Amrita Vishwa Vidyapeetham', 14], ['Banaras Hindu University', 17], ['Aligarh Muslim University', 18],
  ['Kalinga Institute of Industrial Technology', 22], ['Panjab University', 27],
]

let inserted = 0
const skipped = []

async function insertRow(name, rank, source, url) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'IN'`
  if (rows.length === 0) {
    skipped.push(name)
    return
  }
  const universityId = rows[0].id
  const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${universityId} AND field = ${FIELD} AND "rankSource" = ${source}`
  if (existing.length > 0) return
  await sql`
    INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (${universityId}, ${FIELD}, ${rank}, ${source}, ${url}, ${selectivityFromRank(rank, 100)}, 'NIRF category-specific ranking (out of ~100 ranked institutes in this category), not the institution-wide NIRF rank.')
  `
  inserted++
}

for (const [name, rank] of PHARMA_DATA) await insertRow(name, rank, PHARMA_SOURCE, PHARMA_URL)
for (const [name, rank] of DENTAL_DATA) await insertRow(name, rank, DENTAL_SOURCE, DENTAL_URL)

console.log(`Inserted ${inserted} program-ranking rows.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
