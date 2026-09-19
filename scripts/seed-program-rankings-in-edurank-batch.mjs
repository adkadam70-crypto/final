// Adds genuine but lower-tier subject-specific rankings sourced from
// edurank.org — a citation/publication-count-based ranking (not a
// reputation-survey ranking like QS/THE, and not an official body like
// NIRF/ARWU). Explicitly authorized by the user after being told this is
// a lower tier of rigor than everything else in this file's siblings;
// every row's source string says "EduRank.org Citation-Based Subject
// Ranking" so this is fully distinguishable from QS/THE/ARWU/NIRF data at
// a glance, both in the database and in any UI that surfaces rankSource.
//
// rankValue uses each school's INDIA rank (not world rank) for each
// subject, since that is the more meaningful comparison for this
// catalog's use case and was the number consistently reported alongside
// citation/publication counts in the search results used to compile this.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-in-edurank-batch.mjs

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
  ['Alagappa University', 'Science & Technology / Research', 73, url('alagappa-university'), 'Physics'],

  ['Bangalore University', 'Science & Technology / Research', 64, url('bangalore-university'), 'Chemistry'],
  ['Bangalore University', 'Engineering', 76, url('bangalore-university'), 'Engineering'],
  ['Bangalore University', 'Science & Technology / Research', 64, url('bangalore-university'), 'Physics'],
  ['Bangalore University', 'Biology & Life Sciences', 81, url('bangalore-university'), 'Biology'],

  ['Mangalore University', 'Science & Technology / Research', 106, url('mangalore-university'), 'Chemistry'],
  ['Mangalore University', 'Engineering', 141, url('mangalore-university'), 'Engineering'],
  ['Mangalore University', 'Science & Technology / Research', 111, url('mangalore-university'), 'Physics'],
  ['Mangalore University', 'Biology & Life Sciences', 117, url('mangalore-university'), 'Biology'],

  ['Kannur University', 'Science & Technology / Research', 294, url('kannur-university'), 'Chemistry'],
  ['Kannur University', 'Engineering', 291, url('kannur-university'), 'Engineering'],
  ['Kannur University', 'Science & Technology / Research', 241, url('kannur-university'), 'Physics'],
  ['Kannur University', 'Biology & Life Sciences', 321, url('kannur-university'), 'Biology'],

  ['Kalinga University', 'Science & Technology / Research', 437, url('kalinga-university'), 'Physics'],
  ['Kalinga University', 'Computer Science & IT', 384, url('kalinga-university'), 'Computer Science'],
  ['Kalinga University', 'Engineering', 428, url('kalinga-university'), 'Engineering'],
  ['Kalinga University', 'Social Sciences', 423, url('kalinga-university'), 'Liberal Arts & Social Sciences'],
  ['Kalinga University', 'Biology & Life Sciences', 444, url('kalinga-university'), 'Biology'],

  ['Utkal University', 'Science & Technology / Research', 192, url('utkal-university'), 'Physics'],
  ['Utkal University', 'Science & Technology / Research', 178, url('utkal-university'), 'Chemistry'],
  ['Utkal University', 'Biology & Life Sciences', 186, url('utkal-university'), 'Biology'],
  ['Utkal University', 'Engineering', 222, url('utkal-university'), 'Engineering'],

  ['Manipur University', 'Science & Technology / Research', 247, url('manipur-university'), 'Chemistry'],
  ['Manipur University', 'Environmental Science & Sustainability', 224, url('manipur-university'), 'Environmental Science'],
  ['Manipur University', 'Biology & Life Sciences', 235, url('manipur-university'), 'Biology'],
  ['Manipur University', 'Engineering', 267, url('manipur-university'), 'Engineering'],

  ['Devi Ahilya University of Indore', 'Engineering', 99, url('devi-ahilya-university-indore-university'), 'Engineering'],
  ['Devi Ahilya University of Indore', 'Science & Technology / Research', 100, url('devi-ahilya-university-indore-university'), 'Chemistry'],
  ['Devi Ahilya University of Indore', 'Science & Technology / Research', 108, url('devi-ahilya-university-indore-university'), 'Physics'],

  ['Bundelkhand University', 'Engineering', 280, url('bundelkhand-university'), 'Engineering'],
  ['Bundelkhand University', 'Science & Technology / Research', 259, url('bundelkhand-university'), 'Chemistry'],
  ['Bundelkhand University', 'Science & Technology / Research', 286, url('bundelkhand-university'), 'Physics'],
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
