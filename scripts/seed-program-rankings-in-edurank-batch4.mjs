// Fourth and final edurank.org batch, same sourcing/labeling convention.
// Usage: node --env-file=.env.local scripts/seed-program-rankings-in-edurank-batch4.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank) {
  return Math.max(10, Math.min(90, Math.round(95 - (rank - 1) * 0.15)))
}

const SRC = 'EduRank.org Citation-Based Subject Ranking 2026'
const NOTE =
  'Based on publication/citation volume in this subject, not a reputation survey — a real, systematic methodology but a lower tier of rigor than QS/THE/ARWU/NIRF. Rank is this school\'s position among Indian universities specifically. programSelectivity is our own derived scale for comparability.'

function url(slug) {
  return `https://edurank.org/uni/${slug}/rankings/`
}

const DATA = [
  ['Tumkur University', 'Science & Technology / Research', 244, url('tumkur-university'), 'Chemistry'],

  ['NITTE', 'Science & Technology / Research', 257, url('nitte-university'), 'Chemistry'],
  ['NITTE', 'Engineering', 311, url('nitte-university'), 'Engineering'],

  ['University of Madras', 'Science & Technology / Research', 22, url('university-of-madras'), 'Chemistry'],

  ['Patna University', 'Science & Technology / Research', 302, url('patna-university'), 'Chemistry'],
  ['Patna University', 'Biology & Life Sciences', 306, url('patna-university'), 'Biology'],
  ['Patna University', 'Engineering', 321, url('patna-university'), 'Engineering'],
  ['Patna University', 'Environmental Science & Sustainability', 327, url('patna-university'), 'Environmental Science'],

  ['Mizoram University', 'Biology & Life Sciences', 195, url('mizoram-university'), 'Biology'],
  ['Mizoram University', 'Environmental Science & Sustainability', 158, url('mizoram-university'), 'Environmental Science'],
  ['Mizoram University', 'Science & Technology / Research', 207, url('mizoram-university'), 'Chemistry'],
  ['Mizoram University', 'Engineering', 222, url('mizoram-university'), 'Engineering'],

  ['Avinashilingam Institute for Home Science and Higher Education for Women', 'Arts', 243, url('avinashilingam-university'), 'Art & Design'],
  ['Avinashilingam Institute for Home Science and Higher Education for Women', 'Biology & Life Sciences', 267, url('avinashilingam-university'), 'Biology'],
  ['Avinashilingam Institute for Home Science and Higher Education for Women', 'Science & Technology / Research', 265, url('avinashilingam-university'), 'Chemistry'],
  ['Avinashilingam Institute for Home Science and Higher Education for Women', 'Engineering', 270, url('avinashilingam-university'), 'Engineering'],

  ['Bharath Institute of Higher Education and Research', 'Engineering', 183, url('bharath-institute-of-higher-education-and-research'), 'Engineering'],
  ['Bharath Institute of Higher Education and Research', 'Medicine & Health Sciences', 113, url('bharath-institute-of-higher-education-and-research'), 'Medicine'],
]

let inserted = 0
const skipped = []

for (const [name, field, rank, urlv, subject] of DATA) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'IN'`
  if (rows.length === 0) {
    skipped.push(`${name} (${field})`)
    continue
  }
  const universityId = rows[0].id
  const source = `${SRC} — ${subject}`
  const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${universityId} AND field = ${field} AND "rankSource" = ${source}`
  if (existing.length > 0) continue

  await sql`
    INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (${universityId}, ${field}, ${rank}, ${source}, ${urlv}, ${selectivityFromRank(rank)}, ${NOTE})
  `
  inserted++
}

console.log(`Inserted ${inserted} program-ranking rows.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
