// Program-specific rankings for the 46 India schools added in round 4 —
// cross-referenced against the same real NIRF 2025 category tables already
// pulled this session (Medical, Dental, Agriculture) to find where these
// newly-added schools also carry a real category-specific rank, same
// template/methodology as every other program-rankings pass.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-india-round5.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank) {
  return Math.max(15, Math.min(99, Math.round(100 - (rank - 1) * 1.1)))
}

const GROUPS = [
  {
    field: 'Medicine & Health Sciences',
    source: 'NIRF (National Institutional Ranking Framework) 2025 — Medical category',
    url: 'https://www.nirfindia.org/Rankings/2025/MedicalRanking.html',
    entries: [
      { name: "King George's Medical University", rank: 8 },
      { name: 'Saveetha Institute of Medical and Technical Sciences', rank: 11 },
      { name: 'Siksha O Anusandhan', rank: 15 },
      { name: 'Datta Meghe Institute of Higher Education and Research', rank: 20 },
      { name: 'Sri Ramachandra Institute of Higher Education and Research', rank: 21 },
      { name: 'JSS Academy of Higher Education and Research', rank: 37 },
      { name: 'Jamia Hamdard', rank: 40 },
      { name: 'Chettinad Academy of Research and Education', rank: 49 },
    ],
  },
  {
    field: 'Medicine & Health Sciences',
    source: 'NIRF (National Institutional Ranking Framework) 2025 — Dental category',
    url: 'https://www.nirfindia.org/Rankings/2025/DentalRanking.html',
    entries: [
      { name: 'Saveetha Institute of Medical and Technical Sciences', rank: 2 },
      { name: "King George's Medical University", rank: 7 },
      { name: 'Siksha O Anusandhan', rank: 9 },
    ],
  },
  {
    field: 'Agriculture & Natural Resources',
    source: 'NIRF (National Institutional Ranking Framework) 2025 — Agriculture and Allied Sectors category',
    url: 'https://www.nirfindia.org/Rankings/2025/AgricultureRanking.html',
    entries: [
      { name: 'Indian Agricultural Research Institute', rank: 1 },
      { name: 'Punjab Agricultural University', rank: 3 },
      { name: 'Tamil Nadu Agricultural University', rank: 6 },
      { name: 'University of Agricultural Sciences, Bangalore', rank: 11 },
    ],
  },
]

let totalInserted = 0
let totalSkipped = []

for (const group of GROUPS) {
  for (const entry of group.entries) {
    const rows = await sql`SELECT id FROM universities WHERE name = ${entry.name} AND country = 'IN'`
    if (rows.length === 0) {
      totalSkipped.push(`${entry.name} (${group.field})`)
      continue
    }
    const universityId = rows[0].id
    const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${universityId} AND field = ${group.field} AND "rankSource" = ${group.source}`
    if (existing.length > 0) continue

    await sql`
      INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
      VALUES (
        ${universityId}, ${group.field}, ${entry.rank}, ${group.source}, ${group.url},
        ${selectivityFromRank(entry.rank)},
        'NIRF is India''s official government ranking (Ministry of Education).'
      )
    `
    totalInserted++
  }
}

console.log(`Inserted ${totalInserted} program-ranking rows.`)
if (totalSkipped.length) console.log(`Could not match (not in catalog): ${totalSkipped.join(', ')}`)
