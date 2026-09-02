// Program-specific rankings for India, round 3 — 3 more real NIRF 2025
// categories: Dental, Agriculture and Allied Sectors, Research
// Institutions. Pulled directly from nirfindia.org.
//
// "Research Institutions" is broader than a single subject (it ranks
// overall research output/quality across all fields) — mapped to
// 'Science & Technology / Research', the closest fit in this app's
// ACADEMIC_FIELDS enum, not a literal 1:1 subject match like the others.
//
// Excludes NIRF's "Dr. D. Y. Patil Vidyapeeth, Pune" (Dental #4) for the
// same reason as round 2 — a real but DIFFERENT institution from the
// catalog's "D. Y. Patil University" in Navi Mumbai.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-india-round3.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank) {
  return Math.max(15, Math.min(99, Math.round(100 - (rank - 1) * 1.1)))
}

const CATEGORIES = [
  {
    field: 'Medicine & Health Sciences',
    source: 'NIRF (National Institutional Ranking Framework) 2025 — Dental category',
    url: 'https://www.nirfindia.org/Rankings/2025/DentalRanking.html',
    entries: [
      { name: 'All India Institute of Medical Sciences, Delhi', rank: 1 },
      { name: 'Amrita Vishwa Vidyapeetham', rank: 14 },
      { name: 'Banaras Hindu University', rank: 15 },
      { name: 'Jamia Millia Islamia', rank: 17 },
      { name: 'Kalinga Institute of Industrial Technology', rank: 26 },
      { name: 'Aligarh Muslim University', rank: 28 },
    ],
  },
  {
    field: 'Agriculture & Natural Resources',
    source: 'NIRF (National Institutional Ranking Framework) 2025 — Agriculture and Allied Sectors category',
    url: 'https://www.nirfindia.org/Rankings/2025/AgricultureRanking.html',
    entries: [
      { name: 'Banaras Hindu University', rank: 4 },
      { name: 'Amity University', rank: 15 },
      { name: 'Lovely Professional University', rank: 17 },
      { name: 'SRM Institute of Science and Technology', rank: 33 },
    ],
  },
  {
    field: 'Science & Technology / Research',
    source: 'NIRF (National Institutional Ranking Framework) 2025 — Research Institutions category',
    url: 'https://www.nirfindia.org/Rankings/2025/ResearchRanking.html',
    entries: [
      { name: 'Indian Institute of Science', rank: 1 },
      { name: 'Indian Institute of Technology Madras', rank: 2 },
      { name: 'Indian Institute of Technology Delhi', rank: 3 },
      { name: 'Indian Institute of Technology Bombay', rank: 4 },
      { name: 'Indian Institute of Technology Kharagpur', rank: 5 },
      { name: 'Indian Institute of Technology Kanpur', rank: 6 },
      { name: 'Indian Institute of Technology Roorkee', rank: 8 },
      { name: 'Indian Institute of Technology Guwahati', rank: 10 },
      { name: 'All India Institute of Medical Sciences, Delhi', rank: 11 },
      { name: 'University of Delhi', rank: 12 },
      { name: 'Vellore Institute of Technology', rank: 14 },
      { name: 'Indian Institute of Technology Hyderabad', rank: 15 },
      { name: 'Banaras Hindu University', rank: 16 },
      { name: 'Birla Institute of Technology and Science, Pilani', rank: 18 },
      { name: 'Manipal Academy of Higher Education', rank: 19 },
      { name: 'Jamia Millia Islamia', rank: 20 },
      { name: 'Jawaharlal Nehru University', rank: 21 },
      { name: 'Jadavpur University', rank: 23 },
      { name: 'Indian Institute of Technology Indore', rank: 24 },
      { name: 'SRM Institute of Science and Technology', rank: 25 },
      { name: 'Anna University', rank: 26 },
      { name: 'Aligarh Muslim University', rank: 28 },
      { name: 'National Institute of Technology Rourkela', rank: 30 },
      { name: 'Amrita Vishwa Vidyapeetham', rank: 31 },
      { name: 'University of Hyderabad', rank: 32 },
      { name: 'National Institute of Technology Tiruchirappalli', rank: 33 },
      { name: 'Chandigarh University', rank: 34 },
      { name: 'Panjab University', rank: 37 },
      { name: 'Amity University', rank: 38 },
      { name: 'Lovely Professional University', rank: 40 },
      { name: 'Mumbai University (Institute of Chemical Technology)', rank: 41 },
      { name: 'Thapar Institute of Engineering and Technology', rank: 42 },
      { name: 'Kalinga Institute of Industrial Technology', rank: 43 },
      { name: 'University of Petroleum and Energy Studies', rank: 45 },
      { name: 'Malaviya National Institute of Technology Jaipur', rank: 50 },
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
