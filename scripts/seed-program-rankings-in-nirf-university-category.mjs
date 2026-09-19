// India — NIRF 2024 University category ranking, matched by exact
// normalized name against the existing catalog only (only the genuinely
// new-to-coverage matches from this list; most entries duplicate schools
// already covered under other NIRF categories).
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-in-nirf-university-category.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const FIELD = 'Science & Technology / Research'
const SOURCE = 'NIRF 2024 — University Category Ranking'
const URL = 'https://www.nirfindia.org/Rankings/2024/UniversityRanking.html'
const NOTE = 'NIRF category-specific ranking, not the institution-wide NIRF rank.'

const DATA = [
  ['Koneru Lakshmaiah Education Foundation', 22],
  ['Mahatma Gandhi University, Kottayam', 37],
]

let inserted = 0
const skipped = []

for (const [name, rank] of DATA) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'IN'`
  if (rows.length === 0) { skipped.push(name); continue }
  const universityId = rows[0].id
  const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${universityId} AND field = ${FIELD} AND "rankSource" = ${SOURCE}`
  if (existing.length > 0) continue
  await sql`
    INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (${universityId}, ${FIELD}, ${rank}, ${SOURCE}, ${URL}, ${selectivityFromRank(rank, 100)}, ${NOTE})
  `
  inserted++
}

console.log(`Inserted ${inserted} program-ranking rows.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
