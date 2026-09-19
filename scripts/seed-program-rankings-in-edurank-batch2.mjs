// Second edurank.org batch, same sourcing/labeling convention as
// seed-program-rankings-in-edurank-batch.mjs.
// Usage: node --env-file=.env.local scripts/seed-program-rankings-in-edurank-batch2.mjs

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
  ['Gauhati University', 'Engineering', 123, url('gauhati-university'), 'Engineering'],
  ['Gauhati University', 'Science & Technology / Research', 105, url('gauhati-university'), 'Physics'],

  ['Osmania University', 'Science & Technology / Research', 46, url('osmania-university'), 'Chemistry'],
  ['Osmania University', 'Engineering', 61, url('osmania-university'), 'Engineering'],

  ['Mysore University', 'Science & Technology / Research', 51, url('university-of-mysore'), 'Chemistry'],
  ['Mysore University', 'Science & Technology / Research', 90, url('university-of-mysore'), 'Physics'],
  ['Mysore University', 'Engineering', 101, url('university-of-mysore'), 'Engineering'],

  ['Central University of Tamil Nadu', 'Engineering', 315, url('central-university-of-tamil-nadu'), 'Engineering'],
  ['Central University of Tamil Nadu', 'Arts', 254, url('central-university-of-tamil-nadu'), 'Art & Design'],
  ['Central University of Tamil Nadu', 'Biology & Life Sciences', 315, url('central-university-of-tamil-nadu'), 'Biology'],
  ['Central University of Tamil Nadu', 'Science & Technology / Research', 305, url('central-university-of-tamil-nadu'), 'Chemistry'],

  ['Madurai Kamaraj University', 'Science & Technology / Research', 53, url('madurai-kamaraj-university'), 'Chemistry'],
  ['Madurai Kamaraj University', 'Biology & Life Sciences', 61, url('madurai-kamaraj-university'), 'Biology'],
  ['Madurai Kamaraj University', 'Science & Technology / Research', 84, url('madurai-kamaraj-university'), 'Physics'],
  ['Madurai Kamaraj University', 'Engineering', 94, url('madurai-kamaraj-university'), 'Engineering'],

  ['Periyar University', 'Science & Technology / Research', 118, url('periyar-university'), 'Chemistry'],
  ['Periyar University', 'Biology & Life Sciences', 126, url('periyar-university'), 'Biology'],
  ['Periyar University', 'Science & Technology / Research', 130, url('periyar-university'), 'Physics'],
  ['Periyar University', 'Engineering', 152, url('periyar-university'), 'Engineering'],
  ['Periyar University', 'Mathematics & Statistics', 182, url('periyar-university'), 'Mathematics'],

  ['Himachal Pradesh University', 'Science & Technology / Research', 115, url('himachal-pradesh-university'), 'Chemistry'],
  ['Himachal Pradesh University', 'Engineering', 145, url('himachal-pradesh-university'), 'Engineering'],
  ['Himachal Pradesh University', 'Science & Technology / Research', 124, url('himachal-pradesh-university'), 'Physics'],
  ['Himachal Pradesh University', 'Biology & Life Sciences', 134, url('himachal-pradesh-university'), 'Biology'],

  ['Goa University', 'Science & Technology / Research', 175, url('goa-university'), 'Chemistry'],
  ['Goa University', 'Biology & Life Sciences', 202, url('goa-university'), 'Biology'],
  ['Goa University', 'Environmental Science & Sustainability', 180, url('goa-university'), 'Environmental Science'],
  ['Goa University', 'Engineering', 219, url('goa-university'), 'Engineering'],

  ['Berhampur University', 'Science & Technology / Research', 268, url('berhampur-university'), 'Chemistry'],
  ['Berhampur University', 'Biology & Life Sciences', 261, url('berhampur-university'), 'Biology'],
  ['Berhampur University', 'Engineering', 299, url('berhampur-university'), 'Engineering'],
  ['Berhampur University', 'Social Sciences', 243, url('berhampur-university'), 'Liberal Arts & Social Sciences'],
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
