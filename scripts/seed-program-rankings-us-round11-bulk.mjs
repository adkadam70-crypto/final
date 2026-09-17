// Continuation of the bulk aggregate-list approach (rounds 6-10) — final
// batch this session: College Factual "Top Ranked" Mechanical Engineering,
// Electrical Engineering, Elementary Education, and Music lists,
// cross-matched by exact normalized name against the zero-coverage gap
// list.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-us-round11-bulk.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank) {
  return Math.max(15, Math.min(99, Math.round(100 - (rank - 1) * 1.1)))
}

const SRC = {
  mecheng: ['College Factual — 2026 Best Mechanical Engineering Schools (Top 50)', 'https://www.collegefactual.com/majors/engineering/me-mechanical-engineering/rankings/top-ranked/'],
  eleceng: ['College Factual — 2026 Best Electrical Engineering Schools (Top 50)', 'https://www.collegefactual.com/majors/engineering/ee-electrical-engineering/rankings/top-ranked/'],
  elemed: ['College Factual — 2026 Best Elementary Education Schools (Top 50)', 'https://www.collegefactual.com/majors/education/teacher-education-development-levels-methods/elementary-education/rankings/top-ranked/'],
  music: ['College Factual — 2026 Best Music Schools (Top 50)', 'https://www.collegefactual.com/majors/visual-and-performing-arts/music/rankings/top-ranked/'],
}

// [name in our catalog, field, rank, sourceKey]
const DATA = [
  ['San Jose State University', 'Engineering', 22, 'mecheng'],
  ['San Jose State University', 'Engineering', 34, 'eleceng'],

  // Elementary Education -> Education
  ['Towson University', 'Education', 18, 'elemed'],
  ['University of Rhode Island', 'Education', 21, 'elemed'],
  ['Monmouth University', 'Education', 23, 'elemed'],
  ['University of Hawaii at Manoa', 'Education', 30, 'elemed'],
  ['Azusa Pacific University', 'Education', 37, 'elemed'],
  ['Chapman University', 'Education', 43, 'elemed'],
  ['CUNY City College', 'Education', 44, 'elemed'],
  ['Longwood University', 'Education', 45, 'elemed'],

  // Music -> Arts
  ['San Jose State University', 'Arts', 8, 'music'],
  ['Sonoma State University', 'Arts', 19, 'music'],
  ['University of Mississippi', 'Arts', 23, 'music'],
  ['University of the Pacific', 'Arts', 24, 'music'],
  ['Rowan University', 'Arts', 26, 'music'],
  ["St Olaf College", 'Arts', 32, 'music'],
  ['Drake University', 'Arts', 36, 'music'],
  ['Gustavus Adolphus College', 'Arts', 37, 'music'],
  ['Butler University', 'Arts', 39, 'music'],
  ['Tennessee Technological University', 'Arts', 48, 'music'],
  ['Occidental College', 'Arts', 49, 'music'],
  ['University of Rhode Island', 'Arts', 50, 'music'],
]

const NOTE = 'Peer-assessment or composite ranking, not an admissions-selectivity metric directly — programSelectivity here is our own derived scale for comparability with other rankings, not itself a published figure.'

let inserted = 0
const skipped = []

for (const [name, field, rank, sourceKey] of DATA) {
  const [source, url] = SRC[sourceKey]
  const rows = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'US'`
  if (rows.length === 0) {
    skipped.push(`${name} (${field})`)
    continue
  }
  const universityId = rows[0].id
  const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${universityId} AND field = ${field} AND "rankSource" = ${source}`
  if (existing.length > 0) continue

  await sql`
    INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (${universityId}, ${field}, ${rank}, ${source}, ${url}, ${selectivityFromRank(rank)}, ${NOTE})
  `
  inserted++
}

console.log(`Inserted ${inserted} program-ranking rows.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
