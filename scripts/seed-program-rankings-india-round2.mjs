// Program-specific rankings for India, round 2 — extends beyond the
// original Engineering/Management-only pass to 4 more real NIRF 2025
// categories: Medical, Law, Pharmacy, Architecture. Pulled directly from
// nirfindia.org (the official Ministry of Education source), not a
// secondary aggregator.
//
// Deliberately excludes a few real NIRF-ranked institutions whose exact
// campus doesn't match what's in the catalog (e.g. NIRF's "Dr. D. Y. Patil
// Vidyapeeth, Pune" medical rank is a DIFFERENT real institution from the
// catalog's "D. Y. Patil University" in Navi Mumbai — same family of
// deemed universities, not the same legal entity; "Manipal University
// Jaipur" and "Amity University Haryana, Gurgaon" are likewise distinct
// campuses from the catalog's "Manipal Academy of Higher Education" and
// main "Amity University" — attaching NIRF's real rank to the wrong
// specific campus would be a fabrication dressed up as sourced data).
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-india-round2.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank) {
  return Math.max(15, Math.min(99, Math.round(100 - (rank - 1) * 1.1)))
}

const CATEGORIES = [
  {
    field: 'Medicine & Health Sciences',
    source: 'NIRF (National Institutional Ranking Framework) 2025 — Medical category',
    url: 'https://www.nirfindia.org/Rankings/2025/MedicalRanking.html',
    entries: [
      { name: 'All India Institute of Medical Sciences, Delhi', rank: 1 },
      { name: 'Christian Medical College, Vellore', rank: 3 },
      { name: 'Banaras Hindu University', rank: 6 },
      { name: 'Amrita Vishwa Vidyapeetham', rank: 9 },
      { name: 'SRM Institute of Science and Technology', rank: 18 },
      { name: 'Kalinga Institute of Industrial Technology', rank: 24 },
      { name: 'Aligarh Muslim University', rank: 29 },
    ],
  },
  {
    field: 'Medicine & Health Sciences',
    source: 'NIRF (National Institutional Ranking Framework) 2025 — Pharmacy category',
    url: 'https://www.nirfindia.org/Rankings/2025/PharmacyRanking.html',
    entries: [
      { name: 'Birla Institute of Technology and Science, Pilani', rank: 2 },
      { name: 'Panjab University', rank: 3 },
      { name: 'Mumbai University (Institute of Chemical Technology)', rank: 6 },
      { name: 'SRM Institute of Science and Technology', rank: 10 },
      { name: 'Lovely Professional University', rank: 13 },
      { name: 'Amrita Vishwa Vidyapeetham', rank: 14 },
      { name: 'Chandigarh University', rank: 15 },
      { name: 'Amity University', rank: 18 },
    ],
  },
  {
    field: 'Law',
    source: 'NIRF (National Institutional Ranking Framework) 2025 — Law category',
    url: 'https://www.nirfindia.org/Rankings/2025/LawRanking.html',
    entries: [
      { name: 'Indian Institute of Technology Kharagpur', rank: 6 },
      { name: 'Jamia Millia Islamia', rank: 8 },
      { name: 'Aligarh Muslim University', rank: 9 },
      { name: 'Cochin University of Science and Technology', rank: 13 },
      { name: 'Kalinga Institute of Industrial Technology', rank: 14 },
      { name: 'University of Petroleum and Energy Studies', rank: 18 },
      { name: 'Alliance University', rank: 20 },
      { name: 'Guru Gobind Singh Indraprastha University', rank: 22 },
      { name: 'Christ University', rank: 24 },
      { name: 'SRM Institute of Science and Technology', rank: 25 },
      { name: 'Lovely Professional University', rank: 26 },
      { name: 'Nirma University', rank: 33 },
      { name: 'Galgotias University', rank: 36 },
    ],
  },
  {
    field: 'Architecture & Design',
    source: 'NIRF (National Institutional Ranking Framework) 2025 — Architecture category',
    url: 'https://www.nirfindia.org/Rankings/2025/ArchitectureRanking.html',
    entries: [
      { name: 'Indian Institute of Technology Roorkee', rank: 1 },
      { name: 'National Institute of Technology Calicut', rank: 2 },
      { name: 'Indian Institute of Technology Kharagpur', rank: 3 },
      { name: 'Jamia Millia Islamia', rank: 5 },
      { name: 'National Institute of Technology Tiruchirappalli', rank: 9 },
      { name: 'Visvesvaraya National Institute of Technology Nagpur', rank: 10 },
      { name: 'Malaviya National Institute of Technology Jaipur', rank: 12 },
      { name: 'Chandigarh University', rank: 14 },
      { name: 'Jadavpur University', rank: 16 },
      { name: 'SRM Institute of Science and Technology', rank: 18 },
      { name: 'Lovely Professional University', rank: 24 },
      { name: 'Amity University', rank: 25 },
      { name: 'Aligarh Muslim University', rank: 26 },
      { name: 'Anna University', rank: 28 },
      { name: 'Nirma University', rank: 29 },
      { name: 'Christ University', rank: 34 },
      { name: 'Guru Gobind Singh Indraprastha University', rank: 36 },
    ],
  },
]

let totalInserted = 0
let totalSkipped = []

for (const category of CATEGORIES) {
  for (const entry of category.entries) {
    const rows = await sql`SELECT id FROM universities WHERE name = ${entry.name} AND country = 'IN'`
    if (rows.length === 0) {
      totalSkipped.push(`${entry.name} (${category.field})`)
      continue
    }
    const universityId = rows[0].id
    const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${universityId} AND field = ${category.field} AND "rankSource" = ${category.source}`
    if (existing.length > 0) continue

    await sql`
      INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
      VALUES (
        ${universityId}, ${category.field}, ${entry.rank}, ${category.source}, ${category.url},
        ${selectivityFromRank(entry.rank)},
        'NIRF is India''s official government ranking (Ministry of Education).'
      )
    `
    totalInserted++
  }
}

console.log(`Inserted ${totalInserted} program-ranking rows across ${CATEGORIES.length} categories.`)
if (totalSkipped.length) console.log(`Could not match (not in catalog): ${totalSkipped.join(', ')}`)
