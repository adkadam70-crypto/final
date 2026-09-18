// Eighth Germany pass. TU Braunschweig, Marburg, Bremen, Konstanz — 10
// rows, each confirmed via direct fetch or independent search. Two of the
// TU Braunschweig rows were corrected in the process: a batch labeled them
// "estimated from a 301-400 band" but the real source shows exact 301
// figures for both. Saarland, Regensburg, and Göttingen dropped entirely
// (source pages blocked, no corroboration found).
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-de-round8.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank) {
  return Math.max(10, Math.min(99, Math.round(100 - (rank - 1) * 0.15)))
}

const NOTE_EXACT = 'World subject rank — programSelectivity is our own derived scale for comparability, not itself a published figure.'
const NOTE_EST = 'programSelectivity is our own derived scale for comparability. Rank value is the midpoint of the published band, not an exact figure the ranking body itself published.'

const DATA = [
  ['TU Braunschweig', 'Engineering', 151, 'QS World University Rankings by Subject 2024 — Mechanical Engineering', 'https://yocket.com/universities/braunschweig-university-of-technology-2869/rankings', NOTE_EXACT],
  ['TU Braunschweig', 'Computer Science & IT', 301, 'THE World University Rankings by Subject 2024 — Computer Science', 'https://yocket.com/universities/braunschweig-university-of-technology-2869/rankings', NOTE_EXACT],
  ['TU Braunschweig', 'Biology & Life Sciences', 301, 'THE World University Rankings by Subject 2024 — Life Sciences', 'https://yocket.com/universities/braunschweig-university-of-technology-2869/rankings', NOTE_EXACT],
  ['TU Braunschweig', 'Engineering', 63, 'ARWU Global Ranking of Academic Subjects 2026 — Aerospace Engineering (estimated from band 51–75)', 'https://www.shanghairanking.com/universities/technical-university-of-braunschweig', NOTE_EST],

  ['University of Marburg', 'Biology & Life Sciences', 275, 'QS World University Rankings by Subject 2024 — Biological Sciences (estimated from band 251–300)', 'https://yocket.com/universities/philipps-university-marburg-2900/rankings', NOTE_EST],
  ['University of Marburg', 'Science & Technology / Research', 325, 'QS World University Rankings by Subject 2024 — Chemistry (estimated from band 301–350)', 'https://yocket.com/universities/philipps-university-marburg-2900/rankings', NOTE_EST],
  ['University of Marburg', 'Medicine & Health Sciences', 325, 'QS World University Rankings by Subject 2024 — Medicine (estimated from band 301–350)', 'https://yocket.com/universities/philipps-university-marburg-2900/rankings', NOTE_EST],

  ['University of Bremen', 'Environmental Science & Sustainability', 46, 'QS World University Rankings by Subject 2026 — Earth & Marine Sciences', 'https://www.topuniversities.com/university-subject-rankings/earth-marine-sciences', NOTE_EXACT],
  ['University of Bremen', 'Environmental Science & Sustainability', 28, 'ARWU Global Ranking of Academic Subjects 2025 — Oceanography', 'https://www.shanghairanking.com/universities/university-of-bremen', NOTE_EXACT],

  ['University of Konstanz', 'Political Science', 15, 'ARWU Global Ranking of Academic Subjects 2025 — Political Science', 'https://www.polver.uni-konstanz.de/en/the-department/rankings/', NOTE_EXACT],
]

let inserted = 0
const skipped = []

for (const [name, field, rank, source, url, note] of DATA) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'DE'`
  if (rows.length === 0) {
    skipped.push(`${name} (${field})`)
    continue
  }
  const universityId = rows[0].id
  const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${universityId} AND field = ${field} AND "rankSource" = ${source}`
  if (existing.length > 0) continue

  await sql`
    INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (${universityId}, ${field}, ${rank}, ${source}, ${url}, ${selectivityFromRank(rank)}, ${note})
  `
  inserted++
}

console.log(`Inserted ${inserted} program-ranking rows.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
