// Continuing the India push past 178. Adds NIRF 2024 Research-category
// and Open-University-category rows for the remaining zero-coverage
// matches found this round.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-in-nirf-round2-research-open.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize = 50) {
  return Math.max(30, Math.min(97, Math.round(97 - (rank - 1) * (67 / poolSize))))
}

const RESEARCH_SOURCE = 'NIRF (National Institutional Ranking Framework) 2024 — Research Institutions category'
const RESEARCH_URL = 'https://www.nirfindia.org/Rankings/2024/ResearchRanking.html'
const OPEN_SOURCE = 'NIRF (National Institutional Ranking Framework) 2024 — Open University category'
const OPEN_URL = 'https://www.nirfindia.org/Rankings/2024/OpenUniversityRanking.html'

const DATA = [
  ['Jawaharlal Nehru Centre for Advanced Scientific Research', 'Science & Technology / Research', 34, RESEARCH_SOURCE, RESEARCH_URL],
  ['National Institute of Mental Health and Neuro Sciences', 'Science & Technology / Research', 43, RESEARCH_SOURCE, RESEARCH_URL],
  ['Indian Institute of Science Education and Research Mohali', 'Science & Technology / Research', 49, RESEARCH_SOURCE, RESEARCH_URL],
  ['Indira Gandhi National Open University', 'Education', 1, OPEN_SOURCE, OPEN_URL],
]

let inserted = 0
const skipped = []

for (const [name, field, rank, source, url] of DATA) {
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
    VALUES (${universityId}, ${field}, ${rank}, ${source}, ${url}, ${selectivityFromRank(rank)}, 'NIRF 2024 rank, fetched directly from nirfindia.org.')
  `
  inserted++
}

console.log(`Inserted ${inserted} program-ranking rows.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
