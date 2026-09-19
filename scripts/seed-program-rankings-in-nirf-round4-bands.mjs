// Continuing the India push. NIRF publishes ranks beyond 100 only as
// alphabetically-listed bands (no individual numeric order within the
// band) — these rows use the band midpoint, transparently labeled as an
// estimate, consistent with the same honest-labeling pattern used for
// Germany's band-derived rows earlier this session.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-in-nirf-round4-bands.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const NOTE = 'NIRF only publishes an alphabetical band beyond rank 100, with no individual numeric order within it — rankValue is the band midpoint, not an exact published figure. programSelectivity is our own derived scale.'

const ENG_SOURCE = 'NIRF (National Institutional Ranking Framework) 2024 — Engineering category (estimated from band 101–150)'
const ENG_URL = 'https://www.nirfindia.org/Rankings/2024/EngineeringRanking150.html'

const STATE_SOURCE = 'NIRF (National Institutional Ranking Framework) 2024 — State Public University category (estimated from band 51–100)'
const STATE_URL = 'https://www.nirfindia.org/Rankings/2024/STATEPUBLICUNIVERSITYRanking100.html'

const DATA = [
  ['Mahindra University', 'Engineering', 125, ENG_SOURCE, ENG_URL],
  ['PES University', 'Engineering', 125, ENG_SOURCE, ENG_URL],
  ['Veermata Jijabai Technological Institute', 'Engineering', 125, ENG_SOURCE, ENG_URL],

  ['Berhampur University', 'Science & Technology / Research', 75, STATE_SOURCE, STATE_URL],
  ['Bundelkhand University', 'Science & Technology / Research', 75, STATE_SOURCE, STATE_URL],
  ['Goa University', 'Science & Technology / Research', 75, STATE_SOURCE, STATE_URL],
  ['Himachal Pradesh University', 'Science & Technology / Research', 75, STATE_SOURCE, STATE_URL],
  ['Kannur University', 'Science & Technology / Research', 75, STATE_SOURCE, STATE_URL],
  ['Kuvempu University', 'Science & Technology / Research', 75, STATE_SOURCE, STATE_URL],
  ['Mangalore University', 'Science & Technology / Research', 75, STATE_SOURCE, STATE_URL],
  ['North Maharashtra University', 'Science & Technology / Research', 75, STATE_SOURCE, STATE_URL],
  ['Patna University', 'Science & Technology / Research', 75, STATE_SOURCE, STATE_URL],
  ['Shivaji University', 'Science & Technology / Research', 75, STATE_SOURCE, STATE_URL],
  ['Tumkur University', 'Science & Technology / Research', 75, STATE_SOURCE, STATE_URL],
  ['Vidyasagar University', 'Science & Technology / Research', 75, STATE_SOURCE, STATE_URL],
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
    VALUES (${universityId}, ${field}, ${rank}, ${source}, ${url}, 50, ${NOTE})
  `
  inserted++
}

console.log(`Inserted ${inserted} program-ranking rows.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
