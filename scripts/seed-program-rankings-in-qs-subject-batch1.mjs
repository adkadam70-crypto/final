// First batch of GENUINE subject-specific rankings for the 57 India
// universities that previously had only institution-level NIRF rows.
// Sourced from QS World University Rankings by Subject 2026, verified via
// independent web searches (topuniversities.com itself 403s on direct
// fetch, consistent with earlier findings this session).
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-in-qs-subject-batch1.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank) {
  return Math.max(10, Math.min(99, Math.round(100 - (rank - 1) * 0.15)))
}

const SRC = 'QS World University Rankings by Subject 2026'
const NOTE = 'World subject rank — programSelectivity is our own derived scale for comparability, not itself a published figure.'
const NOTE_BAND = 'World subject rank (band) — programSelectivity is our own derived scale. Rank value is the midpoint of the published band.'

function url(subject) {
  return `https://www.topuniversities.com/university-subject-rankings/${subject}`
}

const DATA = [
  ['Jawaharlal Nehru University', 'Political Science', 95, `${SRC} — Politics and International Studies`, url('politics'), NOTE],
  ['Jawaharlal Nehru University', 'Social Sciences', 26, `${SRC} — Development Studies`, url('development-studies'), NOTE],

  ['University of Delhi', 'Humanities', 175, `${SRC} — Linguistics (estimated from band 151–200)`, url('linguistics'), NOTE_BAND],

  ['University of Hyderabad', 'Humanities', 175, `${SRC} — Linguistics (estimated from band 151–200)`, url('linguistics'), NOTE_BAND],
  ['University of Hyderabad', 'Humanities', 275, `${SRC} — English Language and Literature (estimated from band 251–300)`, url('english-language-literature'), NOTE_BAND],
  ['University of Hyderabad', 'Social Sciences', 275, `${SRC} — Sociology (estimated from band 251–300)`, url('sociology'), NOTE_BAND],
  ['University of Hyderabad', 'Political Science', 350, `${SRC} — Political Science (estimated from band 301–400)`, url('politics'), NOTE_BAND],
  ['University of Hyderabad', 'Science & Technology / Research', 425, `${SRC} — Chemistry (estimated from band 401–450)`, url('chemistry'), NOTE_BAND],
  ['University of Hyderabad', 'Economics', 525, `${SRC} — Economics and Econometrics (estimated from band 501–550)`, url('economics-econometrics'), NOTE_BAND],
  ['University of Hyderabad', 'Biology & Life Sciences', 675, `${SRC} — Biological Sciences (estimated from band 651–700)`, url('biological-sciences'), NOTE_BAND],

  ['Indian Institute of Science Education and Research Pune', 'Science & Technology / Research', 575, `${SRC} — Chemistry (estimated from band 551–600)`, url('chemistry'), NOTE_BAND],

  ['Calcutta University', 'Economics', 425, `${SRC} — Economics and Econometrics (estimated from band 401–450)`, url('economics-econometrics'), NOTE_BAND],

  ['Savitribai Phule Pune University', 'Science & Technology / Research', 475, `${SRC} — Natural Sciences (estimated from band 451–500)`, url('natural-sciences'), NOTE_BAND],
]

let inserted = 0
const skipped = []

for (const [name, field, rank, source, urlv, note] of DATA) {
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
    VALUES (${universityId}, ${field}, ${rank}, ${source}, ${urlv}, ${selectivityFromRank(rank)}, ${note})
  `
  inserted++
}

console.log(`Inserted ${inserted} program-ranking rows.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
