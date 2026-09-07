// Program-specific rankings for the India tranche-2 additions (commit
// 0eeb385) — cross-referenced against the real NIRF 2025 category tables,
// same template/methodology as every other program-rankings pass. Only
// schools that carry a genuine NIRF category placement are here; the design,
// media, performing-arts and comprehensive-university additions get their
// standing from the overall NIRF Universities/College rank instead (NIRF has
// no category for those disciplines).
//
// Most of these rows were already seeded by an earlier India program pass
// (shared DB); this script is idempotent — it skips a row that already
// exists for the same (university, field, rankSource). Source strings here
// match that earlier pass exactly (note "Architecture and Planning", not
// "& Planning") so the skip works. The one row this pass actually added was
// NIT Delhi in Engineering.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-india-round6.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank) {
  return Math.max(15, Math.min(99, Math.round(100 - (rank - 1) * 1.1)))
}

const GROUPS = [
  {
    field: 'Law',
    source: 'NIRF (National Institutional Ranking Framework) 2025 — Law category',
    url: 'https://www.nirfindia.org/Rankings/2025/LawRanking.html',
    entries: [
      { name: 'National Law School of India University', rank: 1 },
      { name: 'National Law University Delhi', rank: 2 },
      { name: 'NALSAR University of Law', rank: 3 },
      { name: 'The West Bengal National University of Juridical Sciences', rank: 4 },
      { name: 'Gujarat National Law University', rank: 5 },
      { name: 'National Law University Odisha', rank: 15 },
    ],
  },
  {
    field: 'Architecture & Design',
    source: 'NIRF (National Institutional Ranking Framework) 2025 — Architecture and Planning category',
    url: 'https://www.nirfindia.org/Rankings/2025/ArchitectureRanking.html',
    entries: [
      { name: 'CEPT University', rank: 6 },
      { name: 'School of Planning and Architecture, Delhi', rank: 8 },
    ],
  },
  {
    field: 'Engineering',
    source: 'NIRF (National Institutional Ranking Framework) 2025 — Engineering category',
    url: 'https://www.nirfindia.org/Rankings/2025/EngineeringRanking.html',
    entries: [
      { name: 'Indian Institute of Technology (ISM) Dhanbad', rank: 15 },
      { name: 'Indian Institute of Technology Gandhinagar', rank: 25 },
      { name: 'Indian Institute of Technology Jodhpur', rank: 27 },
      { name: 'Indian Institute of Technology Ropar', rank: 32 },
      { name: 'National Institute of Technology Silchar', rank: 50 },
      { name: 'National Institute of Technology Delhi', rank: 65 },
    ],
  },
  {
    field: 'Business',
    source: 'NIRF (National Institutional Ranking Framework) 2025 — Management category',
    url: 'https://www.nirfindia.org/Rankings/2025/ManagementRanking.html',
    entries: [
      { name: 'Indian Institute of Management Indore', rank: 8 },
    ],
  },
  {
    field: 'Medicine & Health Sciences',
    source: 'NIRF (National Institutional Ranking Framework) 2025 — Medical category',
    url: 'https://www.nirfindia.org/Rankings/2025/MedicalRanking.html',
    entries: [
      { name: 'Postgraduate Institute of Medical Education and Research, Chandigarh', rank: 2 },
      { name: 'Jawaharlal Institute of Postgraduate Medical Education and Research', rank: 4 },
      { name: 'National Institute of Mental Health and Neurosciences', rank: 7 },
    ],
  },
]

let totalInserted = 0
const totalSkipped = []

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
