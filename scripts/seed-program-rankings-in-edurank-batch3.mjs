// Third edurank.org batch, same sourcing/labeling convention as the
// previous two batches.
// Usage: node --env-file=.env.local scripts/seed-program-rankings-in-edurank-batch3.mjs

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
  ['Kerala University', 'Engineering', 93, url('university-of-kerala'), 'Engineering'],
  ['Kerala University', 'Science & Technology / Research', 89, url('university-of-kerala'), 'Physics'],

  ['University of Calicut', 'Science & Technology / Research', 149, url('university-of-calicut'), 'Chemistry'],
  ['University of Calicut', 'Science & Technology / Research', 159, url('university-of-calicut'), 'Physics'],
  ['University of Calicut', 'Engineering', 181, url('university-of-calicut'), 'Engineering'],

  ['Bharathidasan University', 'Environmental Science & Sustainability', 47, url('bharathidasan-university'), 'Environmental Science'],
  ['Bharathidasan University', 'Science & Technology / Research', 44, url('bharathidasan-university'), 'Chemistry'],
  ['Bharathidasan University', 'Biology & Life Sciences', 39, url('bharathidasan-university'), 'Biology'],
  ['Bharathidasan University', 'Engineering', 68, url('bharathidasan-university'), 'Engineering'],

  ['University of Kashmir', 'Biology & Life Sciences', 60, url('university-of-kashmir'), 'Biology'],
  ['University of Kashmir', 'Science & Technology / Research', 91, url('university-of-kashmir'), 'Chemistry'],
  ['University of Kashmir', 'Environmental Science & Sustainability', 60, url('university-of-kashmir'), 'Environmental Science'],

  ['Shivaji University', 'Science & Technology / Research', 41, url('shivaji-university'), 'Chemistry'],
  ['Shivaji University', 'Engineering', 47, url('shivaji-university'), 'Engineering'],
  ['Shivaji University', 'Biology & Life Sciences', 49, url('shivaji-university'), 'Biology'],
  ['Shivaji University', 'Science & Technology / Research', 42, url('shivaji-university'), 'Physics'],

  ['University of Burdwan', 'Science & Technology / Research', 74, url('university-of-burdwan'), 'Chemistry'],
  ['University of Burdwan', 'Science & Technology / Research', 71, url('university-of-burdwan'), 'Physics'],
  ['University of Burdwan', 'Biology & Life Sciences', 83, url('university-of-burdwan'), 'Biology'],
  ['University of Burdwan', 'Engineering', 85, url('university-of-burdwan'), 'Engineering'],

  ['Vidyasagar University', 'Science & Technology / Research', 143, url('vidyasagar-university'), 'Chemistry'],
  ['Vidyasagar University', 'Biology & Life Sciences', 116, url('vidyasagar-university'), 'Biology'],
  ['Vidyasagar University', 'Engineering', 151, url('vidyasagar-university'), 'Engineering'],
  ['Vidyasagar University', 'Environmental Science & Sustainability', 113, url('vidyasagar-university'), 'Environmental Science'],

  ['Visva-Bharati University', 'Science & Technology / Research', 84, url('visva-bharati-university'), 'Chemistry'],
  ['Visva-Bharati University', 'Science & Technology / Research', 86, url('visva-bharati-university'), 'Physics'],
  ['Visva-Bharati University', 'Biology & Life Sciences', 84, url('visva-bharati-university'), 'Biology'],
  ['Visva-Bharati University', 'Environmental Science & Sustainability', 80, url('visva-bharati-university'), 'Environmental Science'],

  ['Mahatma Gandhi University, Kottayam', 'Science & Technology / Research', 61, url('mahatma-gandhi-university'), 'Chemistry'],
  ['Mahatma Gandhi University, Kottayam', 'Engineering', 73, url('mahatma-gandhi-university'), 'Engineering'],
  ['Mahatma Gandhi University, Kottayam', 'Biology & Life Sciences', 83, url('mahatma-gandhi-university'), 'Biology'],
  ['Mahatma Gandhi University, Kottayam', 'Science & Technology / Research', 65, url('mahatma-gandhi-university'), 'Physics'],
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
