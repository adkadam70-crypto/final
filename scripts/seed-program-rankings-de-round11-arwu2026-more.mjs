// Eleventh Germany pass — 9 more universities, first-ever coverage for
// Mainz, Düsseldorf, Bielefeld, Wuppertal, Lübeck, Siegen, Kassel,
// Augsburg, Hannover Medical School. Spot-checked 4 of the 9
// (Düsseldorf, Bielefeld, Mainz, Hannover Medical School — ~25 of 41 rows)
// directly against shanghairanking.com; all matched exactly, so the
// remaining 5 were trusted without individual verification.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-de-round11-arwu2026-more.mjs

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

const DATA = [
  ['Johannes Gutenberg University Mainz', 'Communications & Media', 45, `${SRC} — Communication`, u('university-of-mainz'), NOTE_EXACT],
  ['Johannes Gutenberg University Mainz', 'Medicine & Health Sciences', 63, `${SRC} — Pharmacy & Pharmaceutical Sciences (estimated from band 51–75)`, u('university-of-mainz'), NOTE_EST],
  ['Johannes Gutenberg University Mainz', 'Science & Technology / Research', 88, `${SRC} — Physics (estimated from band 76–100)`, u('university-of-mainz'), NOTE_EST],
  ['Johannes Gutenberg University Mainz', 'Environmental Science & Sustainability', 125, `${SRC} — Earth Sciences (estimated from band 101–150)`, u('university-of-mainz'), NOTE_EST],
  ['Johannes Gutenberg University Mainz', 'Environmental Science & Sustainability', 125, `${SRC} — Atmospheric Science (estimated from band 101–150)`, u('university-of-mainz'), NOTE_EST],
  ['Johannes Gutenberg University Mainz', 'Biology & Life Sciences', 125, `${SRC} — Human Biological Sciences (estimated from band 101–150)`, u('university-of-mainz'), NOTE_EST],

  ['Heinrich Heine University Düsseldorf', 'Biology & Life Sciences', 63, `${SRC} — Biotechnology (estimated from band 51–75)`, u('heinrich-heine-university-duesseldorf'), NOTE_EST],
  ['Heinrich Heine University Düsseldorf', 'Medicine & Health Sciences', 63, `${SRC} — Medical Technology (estimated from band 51–75)`, u('heinrich-heine-university-duesseldorf'), NOTE_EST],
  ['Heinrich Heine University Düsseldorf', 'Biology & Life Sciences', 88, `${SRC} — Human Biological Sciences (estimated from band 76–100)`, u('heinrich-heine-university-duesseldorf'), NOTE_EST],
  ['Heinrich Heine University Düsseldorf', 'Biology & Life Sciences', 175, `${SRC} — Biological Sciences (estimated from band 151–200)`, u('heinrich-heine-university-duesseldorf'), NOTE_EST],
  ['Heinrich Heine University Düsseldorf', 'Medicine & Health Sciences', 175, `${SRC} — Clinical Medicine (estimated from band 151–200)`, u('heinrich-heine-university-duesseldorf'), NOTE_EST],
  ['Heinrich Heine University Düsseldorf', 'Medicine & Health Sciences', 175, `${SRC} — Pharmacy & Pharmaceutical Sciences (estimated from band 151–200)`, u('heinrich-heine-university-duesseldorf'), NOTE_EST],
  ['Heinrich Heine University Düsseldorf', 'Psychology', 250, `${SRC} — Psychology (estimated from band 201–300)`, u('heinrich-heine-university-duesseldorf'), NOTE_EST],
  ['Heinrich Heine University Düsseldorf', 'Science & Technology / Research', 450, `${SRC} — Physics (estimated from band 401–500)`, u('heinrich-heine-university-duesseldorf'), NOTE_EST],
  ['Heinrich Heine University Düsseldorf', 'Medicine & Health Sciences', 450, `${SRC} — Public Health (estimated from band 401–500)`, u('heinrich-heine-university-duesseldorf'), NOTE_EST],
  ['Heinrich Heine University Düsseldorf', 'Economics', 450, `${SRC} — Economics (estimated from band 401–500)`, u('heinrich-heine-university-duesseldorf'), NOTE_EST],

  ['Bielefeld University', 'Mathematics & Statistics', 88, `${SRC} — Mathematics (estimated from band 76–100)`, u('bielefeld-university'), NOTE_EST],
  ['Bielefeld University', 'Social Sciences', 125, `${SRC} — Sociology (estimated from band 101–150)`, u('bielefeld-university'), NOTE_EST],
  ['Bielefeld University', 'Economics', 250, `${SRC} — Economics (estimated from band 201–300)`, u('bielefeld-university'), NOTE_EST],
  ['Bielefeld University', 'Mathematics & Statistics', 250, `${SRC} — Statistics (estimated from band 201–300)`, u('bielefeld-university'), NOTE_EST],
  ['Bielefeld University', 'Political Science', 250, `${SRC} — Political Sciences (estimated from band 201–300)`, u('bielefeld-university'), NOTE_EST],
  ['Bielefeld University', 'Education', 250, `${SRC} — Education (estimated from band 201–300)`, u('bielefeld-university'), NOTE_EST],
  ['Bielefeld University', 'Psychology', 250, `${SRC} — Psychology (estimated from band 201–300)`, u('bielefeld-university'), NOTE_EST],
  ['Bielefeld University', 'Biology & Life Sciences', 350, `${SRC} — Biotechnology (estimated from band 301–400)`, u('bielefeld-university'), NOTE_EST],
  ['Bielefeld University', 'Computer Science & IT', 350, `${SRC} — Artificial Intelligence (estimated from band 301–400)`, u('bielefeld-university'), NOTE_EST],

  ['University of Wuppertal', 'Psychology', 250, `${SRC} — Psychology (estimated from band 201–300)`, u('university-of-wuppertal'), NOTE_EST],
  ['University of Wuppertal', 'Mathematics & Statistics', 350, `${SRC} — Mathematics (estimated from band 301–400)`, u('university-of-wuppertal'), NOTE_EST],
  ['University of Wuppertal', 'Science & Technology / Research', 350, `${SRC} — Physics (estimated from band 301–400)`, u('university-of-wuppertal'), NOTE_EST],
  ['University of Wuppertal', 'Business', 350, `${SRC} — Management (estimated from band 301–400)`, u('university-of-wuppertal'), NOTE_EST],
  ['University of Wuppertal', 'Environmental Science & Sustainability', 450, `${SRC} (estimated from band 401–500)`, u('university-of-wuppertal'), NOTE_EST],

  ['University of Lübeck', 'Biology & Life Sciences', 250, `${SRC} — Human Biological Sciences (estimated from band 201–300)`, u('university-of-luebeck'), NOTE_EST],
  ['University of Lübeck', 'Medicine & Health Sciences', 250, `${SRC} — Medical Technology (estimated from band 201–300)`, u('university-of-luebeck'), NOTE_EST],
  ['University of Lübeck', 'Biology & Life Sciences', 350, `${SRC} (estimated from band 301–400)`, u('university-of-luebeck'), NOTE_EST],
  ['University of Lübeck', 'Medicine & Health Sciences', 350, `${SRC} — Clinical Medicine (estimated from band 301–400)`, u('university-of-luebeck'), NOTE_EST],

  ['University of Siegen', 'Engineering', 250, `${SRC} — Mechanical Engineering (estimated from band 201–300)`, u('university-of-siegen'), NOTE_EST],
  ['University of Siegen', 'Science & Technology / Research', 350, `${SRC} — Physics (estimated from band 301–400)`, u('university-of-siegen'), NOTE_EST],
  ['University of Siegen', 'Business', 450, `${SRC} — Management (estimated from band 401–500)`, u('university-of-siegen'), NOTE_EST],

  ['University of Kassel', 'Agriculture & Natural Resources', 250, `${SRC} (estimated from band 201–300)`, u('university-of-kassel'), NOTE_EST],
  ['University of Kassel', 'Business', 450, `${SRC} — Management (estimated from band 401–500)`, u('university-of-kassel'), NOTE_EST],

  ['University of Augsburg', 'Mathematics & Statistics', 125, `${SRC} (estimated from band 101–150)`, u('university-of-augsburg'), NOTE_EST],
  ['University of Augsburg', 'Medicine & Health Sciences', 175, `${SRC} — Medical Technology (estimated from band 151–200)`, u('university-of-augsburg'), NOTE_EST],

  ['Medizinische Hochschule Hannover', 'Medicine & Health Sciences', 88, `${SRC} — Medical Technology (estimated from band 76–100)`, u('hannover-medical-school'), NOTE_EST],
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
