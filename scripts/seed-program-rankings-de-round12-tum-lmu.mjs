// Twelfth Germany pass — TUM and LMU Munich (both directly verified via
// WebFetch, all claims matched exactly), plus new Goethe Frankfurt
// sub-subjects that were already visible in round9's full page fetch but
// not yet inserted. Rows that exactly duplicate earlier rounds (Goethe
// Political Science/Finance/Ecology/Biological Sciences/Dentistry,
// Wuppertal Psychology) are included with identical source text on
// purpose so the dedupe check skips them rather than double-inserting.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-de-round12-tum-lmu.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank) {
  return Math.max(10, Math.min(99, Math.round(100 - (rank - 1) * 0.15)))
}

const NOTE_EXACT = 'World subject rank — programSelectivity is our own derived scale for comparability, not itself a published figure.'
const NOTE_EST = 'programSelectivity is our own derived scale for comparability. Rank value is the midpoint of the published band, not an exact figure the ranking body itself published.'
const SRC = 'ARWU Global Ranking of Academic Subjects 2026'

function u(school) {
  return `https://www.shanghairanking.com/universities/${school}`
}

const TUM = 'technical-university-of-munich'
const LMU = 'university-of-munich'
const GOETHE = 'goethe-university-frankfurt'

const DATA = [
  ['Technical University of Munich', 'Agriculture & Natural Resources', 7, `${SRC} — Agricultural Sciences`, u(TUM), NOTE_EXACT],
  ['Technical University of Munich', 'Medicine & Health Sciences', 14, `${SRC} — Medical Technology`, u(TUM), NOTE_EXACT],
  ['Technical University of Munich', 'Engineering', 18, `${SRC} — Remote Sensing`, u(TUM), NOTE_EXACT],
  ['Technical University of Munich', 'Engineering', 19, `${SRC} — Robotic Science & Engineering`, u(TUM), NOTE_EXACT],
  ['Technical University of Munich', 'Environmental Science & Sustainability', 32, `${SRC} — Ecology`, u(TUM), NOTE_EXACT],
  ['Technical University of Munich', 'Biology & Life Sciences', 36, `${SRC} — Biotechnology`, u(TUM), NOTE_EXACT],
  ['Technical University of Munich', 'Engineering', 38, `${SRC} — Aerospace Engineering`, u(TUM), NOTE_EXACT],

  ['Ludwig Maximilian University of Munich', 'Communications & Media', 9, `${SRC} — Communication`, u(LMU), NOTE_EXACT],
  ['Ludwig Maximilian University of Munich', 'Medicine & Health Sciences', 15, `${SRC} — Medical Technology`, u(LMU), NOTE_EXACT],
  ['Ludwig Maximilian University of Munich', 'Political Science', 24, `${SRC} — Public Administration`, u(LMU), NOTE_EXACT],
  ['Ludwig Maximilian University of Munich', 'Political Science', 41, `${SRC} — Political Sciences`, u(LMU), NOTE_EXACT],
  ['Ludwig Maximilian University of Munich', 'Science & Technology / Research', 49, `${SRC} — Physics`, u(LMU), NOTE_EXACT],
  ['Ludwig Maximilian University of Munich', 'Environmental Science & Sustainability', 63, `${SRC} — Earth Sciences (estimated from band 51–75)`, u(LMU), NOTE_EST],
  ['Ludwig Maximilian University of Munich', 'Computer Science & IT', 63, `${SRC} — Artificial Intelligence (estimated from band 51–75)`, u(LMU), NOTE_EST],
  ['Ludwig Maximilian University of Munich', 'Biology & Life Sciences', 63, `${SRC} — Biological Sciences (estimated from band 51–75)`, u(LMU), NOTE_EST],
  ['Ludwig Maximilian University of Munich', 'Biology & Life Sciences', 63, `${SRC} — Human Biological Sciences (estimated from band 51–75)`, u(LMU), NOTE_EST],
  ['Ludwig Maximilian University of Munich', 'Medicine & Health Sciences', 63, `${SRC} — Clinical Medicine (estimated from band 51–75)`, u(LMU), NOTE_EST],
  ['Ludwig Maximilian University of Munich', 'Medicine & Health Sciences', 63, `${SRC} — Dentistry & Oral Sciences (estimated from band 51–75)`, u(LMU), NOTE_EST],
  ['Ludwig Maximilian University of Munich', 'Medicine & Health Sciences', 63, `${SRC} — Pharmacy & Pharmaceutical Sciences (estimated from band 51–75)`, u(LMU), NOTE_EST],

  ['Goethe University Frankfurt', 'Political Science', 63, `${SRC} — Political Sciences (estimated from band 51–75)`, u(GOETHE), NOTE_EST],
  ['Goethe University Frankfurt', 'Finance', 88, `${SRC} — Finance (estimated from band 76–100)`, u(GOETHE), NOTE_EST],
  ['Goethe University Frankfurt', 'Environmental Science & Sustainability', 125, `${SRC} — Ecology (estimated from band 101–150)`, u(GOETHE), NOTE_EST],
  ['Goethe University Frankfurt', 'Biology & Life Sciences', 125, `${SRC} — Biological Sciences (estimated from band 101–150)`, u(GOETHE), NOTE_EST],
  ['Goethe University Frankfurt', 'Medicine & Health Sciences', 125, `${SRC} — Dentistry & Oral Sciences (estimated from band 101–150)`, u(GOETHE), NOTE_EST],
  ['Goethe University Frankfurt', 'Medicine & Health Sciences', 125, `${SRC} — Medical Technology (estimated from band 101–150)`, u(GOETHE), NOTE_EST],
  ['Goethe University Frankfurt', 'Medicine & Health Sciences', 125, `${SRC} — Pharmacy & Pharmaceutical Sciences (estimated from band 101–150)`, u(GOETHE), NOTE_EST],
  ['Goethe University Frankfurt', 'Economics', 125, `${SRC} — Economics (estimated from band 101–150)`, u(GOETHE), NOTE_EST],
  ['Goethe University Frankfurt', 'Social Sciences', 125, `${SRC} — Sociology (estimated from band 101–150)`, u(GOETHE), NOTE_EST],
  ['Goethe University Frankfurt', 'Education', 125, `${SRC} — Education (estimated from band 101–150)`, u(GOETHE), NOTE_EST],

  ['University of Wuppertal', 'Psychology', 250, `${SRC} — Psychology (estimated from band 201–300)`, u('university-of-wuppertal'), NOTE_EST],
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
