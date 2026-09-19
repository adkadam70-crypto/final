// Fifth edurank.org batch — the last one for this push, same
// sourcing/labeling convention as the previous four.
// Usage: node --env-file=.env.local scripts/seed-program-rankings-in-edurank-batch5.mjs

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
  ['Kuvempu University', 'Science & Technology / Research', 140, url('kuvempu-university'), 'Chemistry'],
  ['Kuvempu University', 'Engineering', 168, url('kuvempu-university'), 'Engineering'],

  ['North Maharashtra University', 'Science & Technology / Research', 168, url('north-maharashtra-university'), 'Chemistry'],
  ['North Maharashtra University', 'Engineering', 188, url('north-maharashtra-university'), 'Engineering'],

  ['Dr. Babasaheb Ambedkar Marathwada Universtiy', 'Science & Technology / Research', 127, url('dr-babasaheb-ambedkar-marathwada-university'), 'Chemistry'],
  ['Dr. Babasaheb Ambedkar Marathwada Universtiy', 'Engineering', 148, url('dr-babasaheb-ambedkar-marathwada-university'), 'Engineering'],

  ['Indian Institute of Science Education and Research Mohali', 'Science & Technology / Research', 114, url('indian-institute-of-science-education-and-research-mohali'), 'Physics'],

  ['North-Eastern Hill University', 'Engineering', 178, url('north-eastern-hill-university'), 'Engineering'],

  ['Shiv Nadar University', 'Science & Technology / Research', 203, url('shiv-nadar-university'), 'Chemistry'],
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
