// India — NIRF 2024 State Public University category ranking. This
// category specifically targets large state universities that the more
// specialized categories (Engineering, Medical, Management, ...) often
// miss entirely, so it's the best single source this round for growing the
// DISTINCT university count, not just adding more rows to already-covered
// schools. Matched by exact normalized name against the existing catalog
// only — no new university rows created.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-in-nirf-state-public.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const FIELD = 'Science & Technology / Research'
const SOURCE = 'NIRF 2024 — State Public University Category Ranking'
const URL = 'https://www.nirfindia.org/Rankings/2024/StatePublicUniversityRanking.html'

const DATA = [
  ['Anna University', 1], ['Jadavpur University', 2], ['Savitribai Phule Pune University', 3], ['Calcutta University', 4],
  ['Panjab University', 5], ['Osmania University', 6], ['Andhra University', 7], ['Bharathiar University', 8],
  ['Kerala University', 9], ['Cochin University of Science and Technology', 10], ['University of Madras', 12],
  ['Gauhati University', 13], ['University of Kashmir', 14], ['Delhi Technological University', 15],
  ['Bharathidasan University', 16], ['Alagappa University', 17], ['Mysore University', 19], ['Acharya Nagarjuna University', 20],
  ['Guru Gobind Singh Indraprastha University', 21], ['Visvesvaraya Technological University', 22], ['University of Jammu', 23],
  ['Bangalore University', 24], ['Periyar University', 25], ['Madurai Kamaraj University', 26], ["King George's Medical University", 27],
  ['Dibrugarh University', 28], ['Gujarat University', 29], ['Punjab Agricultural University', 30], ['Annamalai University', 31],
  ['University of Lucknow', 32], ['COEP Technological University', 33], ['University of Burdwan', 36],
  ['G. B. Pant University of Agriculture and Technology', 38], ['Sri Venkateswara University', 39], ['Kurukshetra University', 41],
  ['Utkal University', 42], ['Tamil Nadu Agricultural University', 49],
]

let inserted = 0
const skipped = []

for (const [name, rank] of DATA) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'IN'`
  if (rows.length === 0) {
    skipped.push(name)
    continue
  }
  const universityId = rows[0].id
  const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${universityId} AND field = ${FIELD} AND "rankSource" = ${SOURCE}`
  if (existing.length > 0) continue
  await sql`
    INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (${universityId}, ${FIELD}, ${rank}, ${SOURCE}, ${URL}, ${selectivityFromRank(rank, 50)}, 'NIRF category-specific ranking (state public universities specifically), not the institution-wide NIRF rank.')
  `
  inserted++
}

console.log(`Inserted ${inserted} program-ranking rows.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
