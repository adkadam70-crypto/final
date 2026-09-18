// Tenth Germany pass — largest single batch, 20 universities (most first-
// ever coverage: Würzburg, Kiel, Hohenheim, Duisburg-Essen, Ulm, Leipzig,
// Jena, Giessen, Halle-Wittenberg, Magdeburg, Rostock, Oldenburg,
// Greifswald, Paderborn, Passau) plus new rows for Bremen/Ruhr Bochum/
// Marburg. Spot-checked 8 of the 20 universities directly against their
// own shanghairanking.com pages (Würzburg, Kiel, Duisburg-Essen, Bremen,
// Regensburg, Leipzig, Halle-Wittenberg, Passau — including the two odd
// details in the batch, Passau's old 2022 date and Bremen's Oceanography
// number differing from the 2025 figure already on file) — all 8 matched
// exactly, so the remaining 12 universities in this batch were trusted
// without individual verification.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-de-round10-arwu2026-broad.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank) {
  return Math.max(10, Math.min(99, Math.round(100 - (rank - 1) * 0.15)))
}

const NOTE_EXACT = 'World subject rank — programSelectivity is our own derived scale for comparability, not itself a published figure.'
const NOTE_EST = 'programSelectivity is our own derived scale for comparability. Rank value is the midpoint of the published band, not an exact figure the ranking body itself published.'

function u(school) {
  return `https://www.shanghairanking.com/universities/${school}`
}

const SRC26 = 'ARWU Global Ranking of Academic Subjects 2026'
const SRC25 = 'ARWU Global Ranking of Academic Subjects 2025'
const SRC22 = 'ARWU Global Ranking of Academic Subjects 2022'

const DATA = [
  ['University of Würzburg', 'Medicine & Health Sciences', 46, `${SRC26} — Medical Technology`, u('university-of-wuerzburg'), NOTE_EXACT],
  ['University of Würzburg', 'Medicine & Health Sciences', 63, `${SRC26} — Pharmacy & Pharmaceutical Sciences (estimated from band 51–75)`, u('university-of-wuerzburg'), NOTE_EST],
  ['University of Würzburg', 'Biology & Life Sciences', 88, `${SRC26} — Biological Sciences (estimated from band 76–100)`, u('university-of-wuerzburg'), NOTE_EST],
  ['University of Würzburg', 'Communications & Media', 125, `${SRC26} — Communication (estimated from band 101–150)`, u('university-of-wuerzburg'), NOTE_EST],

  ['Kiel University', 'Environmental Science & Sustainability', 29, `${SRC26} — Oceanography`, u('university-of-kiel'), NOTE_EXACT],
  ['Kiel University', 'Environmental Science & Sustainability', 88, `${SRC26} — Earth Sciences (estimated from band 76–100)`, u('university-of-kiel'), NOTE_EST],
  ['Kiel University', 'Agriculture & Natural Resources', 125, `${SRC26} — Agricultural Sciences (estimated from band 101–150)`, u('university-of-kiel'), NOTE_EST],
  ['Kiel University', 'Medicine & Health Sciences', 125, `${SRC26} — Dentistry & Oral Sciences (estimated from band 101–150)`, u('university-of-kiel'), NOTE_EST],

  ['University of Hohenheim', 'Agriculture & Natural Resources', 125, `${SRC26} — Food Science & Technology (estimated from band 101–150)`, u('university-of-hohenheim'), NOTE_EST],
  ['University of Hohenheim', 'Agriculture & Natural Resources', 125, `${SRC26} — Agricultural Sciences (estimated from band 101–150)`, u('university-of-hohenheim'), NOTE_EST],
  ['University of Hohenheim', 'Environmental Science & Sustainability', 175, `${SRC26} — Ecology (estimated from band 151–200)`, u('university-of-hohenheim'), NOTE_EST],
  ['University of Hohenheim', 'Medicine & Health Sciences', 175, `${SRC26} — Public Health (estimated from band 151–200)`, u('university-of-hohenheim'), NOTE_EST],

  ['University of Duisburg-Essen', 'Medicine & Health Sciences', 34, `${SRC26} — Medical Technology`, u('university-of-duisburg-essen-1'), NOTE_EXACT],
  ['University of Duisburg-Essen', 'Engineering', 88, `${SRC26} — Automation & Control (estimated from band 76–100)`, u('university-of-duisburg-essen-1'), NOTE_EST],
  ['University of Duisburg-Essen', 'Engineering', 125, `${SRC26} — Energy Science & Engineering (estimated from band 101–150)`, u('university-of-duisburg-essen-1'), NOTE_EST],
  ['University of Duisburg-Essen', 'Medicine & Health Sciences', 125, `${SRC26} — Clinical Medicine (estimated from band 101–150)`, u('university-of-duisburg-essen-1'), NOTE_EST],
  ['University of Duisburg-Essen', 'Communications & Media', 125, `${SRC26} — Communication (estimated from band 101–150)`, u('university-of-duisburg-essen-1'), NOTE_EST],

  ['University of Regensburg', 'Mathematics & Statistics', 88, `${SRC26} — Mathematics (estimated from band 76–100)`, u('university-of-regensburg'), NOTE_EST],
  ['University of Regensburg', 'Medicine & Health Sciences', 88, `${SRC26} — Dentistry & Oral Sciences (estimated from band 76–100)`, u('university-of-regensburg'), NOTE_EST],
  ['University of Regensburg', 'Biology & Life Sciences', 175, `${SRC26} — Human Biological Sciences (estimated from band 151–200)`, u('university-of-regensburg'), NOTE_EST],
  ['University of Regensburg', 'Engineering', 250, `${SRC26} — Biomedical Engineering (estimated from band 201–300)`, u('university-of-regensburg'), NOTE_EST],

  ['Ulm University', 'Medicine & Health Sciences', 175, `${SRC26} — Clinical Medicine (estimated from band 151–200)`, u('university-of-ulm'), NOTE_EST],
  ['Ulm University', 'Mathematics & Statistics', 250, `${SRC26} — Statistics (estimated from band 201–300)`, u('university-of-ulm'), NOTE_EST],
  ['Ulm University', 'Psychology', 250, `${SRC26} — Psychology (estimated from band 201–300)`, u('university-of-ulm'), NOTE_EST],

  ['Leipzig University', 'Engineering', 63, `${SRC26} — Remote Sensing (estimated from band 51–75)`, u('university-of-leipzig'), NOTE_EST],
  ['Leipzig University', 'Environmental Science & Sustainability', 88, `${SRC26} — Ecology (estimated from band 76–100)`, u('university-of-leipzig'), NOTE_EST],
  ['Leipzig University', 'Communications & Media', 88, `${SRC26} — Communication (estimated from band 76–100)`, u('university-of-leipzig'), NOTE_EST],
  ['Leipzig University', 'Psychology', 125, `${SRC26} — Psychology (estimated from band 101–150)`, u('university-of-leipzig'), NOTE_EST],

  ['Friedrich Schiller University Jena', 'Environmental Science & Sustainability', 175, `${SRC26} — Ecology (estimated from band 151–200)`, u('university-of-jena'), NOTE_EST],
  ['Friedrich Schiller University Jena', 'Medicine & Health Sciences', 175, `${SRC26} — Dentistry & Oral Sciences (estimated from band 151–200)`, u('university-of-jena'), NOTE_EST],
  ['Friedrich Schiller University Jena', 'Biology & Life Sciences', 175, `${SRC26} — Biological Sciences (estimated from band 151–200)`, u('university-of-jena'), NOTE_EST],
  ['Friedrich Schiller University Jena', 'Mathematics & Statistics', 250, `${SRC26} — Mathematics (estimated from band 201–300)`, u('university-of-jena'), NOTE_EST],

  ['Justus Liebig University Giessen', 'Agriculture & Natural Resources', 63, `${SRC26} — Veterinary Sciences (estimated from band 51–75)`, u('university-of-giessen'), NOTE_EST],
  ['Justus Liebig University Giessen', 'Medicine & Health Sciences', 88, `${SRC26} — Pharmacy & Pharmaceutical Sciences (estimated from band 76–100)`, u('university-of-giessen'), NOTE_EST],
  ['Justus Liebig University Giessen', 'Environmental Science & Sustainability', 125, `${SRC26} — Ecology (estimated from band 101–150)`, u('university-of-giessen'), NOTE_EST],
  ['Justus Liebig University Giessen', 'Agriculture & Natural Resources', 125, `${SRC26} — Agricultural Sciences (estimated from band 101–150)`, u('university-of-giessen'), NOTE_EST],

  ['Martin Luther University of Halle-Wittenberg', 'Environmental Science & Sustainability', 63, `${SRC26} — Ecology (estimated from band 51–75)`, u('university-of-halle-wittenberg'), NOTE_EST],
  ['Martin Luther University of Halle-Wittenberg', 'Medicine & Health Sciences', 250, `${SRC26} — Pharmacy & Pharmaceutical Sciences (estimated from band 201–300)`, u('university-of-halle-wittenberg'), NOTE_EST],
  ['Martin Luther University of Halle-Wittenberg', 'Agriculture & Natural Resources', 350, `${SRC26} — Agricultural Sciences (estimated from band 301–400)`, u('university-of-halle-wittenberg'), NOTE_EST],

  ['Otto von Guericke University Magdeburg', 'Medicine & Health Sciences', 175, `${SRC26} — Medical Technology (estimated from band 151–200)`, u('university-of-magdeburg'), NOTE_EST],
  ['Otto von Guericke University Magdeburg', 'Mathematics & Statistics', 350, `${SRC26} — Mathematics (estimated from band 301–400)`, u('university-of-magdeburg'), NOTE_EST],
  ['Otto von Guericke University Magdeburg', 'Engineering', 350, `${SRC26} — Mechanical Engineering (estimated from band 301–400)`, u('university-of-magdeburg'), NOTE_EST],

  ['University of Rostock', 'Agriculture & Natural Resources', 125, `${SRC26} — Agricultural Sciences (estimated from band 101–150)`, u('university-of-rostock'), NOTE_EST],
  ['University of Rostock', 'Medicine & Health Sciences', 250, `${SRC26} — Medical Technology (estimated from band 201–300)`, u('university-of-rostock'), NOTE_EST],

  ['University of Oldenburg', 'Environmental Science & Sustainability', 63, `${SRC26} — Oceanography (estimated from band 51–75)`, u('university-of-oldenburg'), NOTE_EST],
  ['University of Oldenburg', 'Environmental Science & Sustainability', 250, `${SRC26} — Ecology (estimated from band 201–300)`, u('university-of-oldenburg'), NOTE_EST],

  ['University of Greifswald', 'Medicine & Health Sciences', 175, `${SRC26} — Dentistry & Oral Sciences (estimated from band 151–200)`, u('university-of-greifswald'), NOTE_EST],

  ['Paderborn University', 'Mathematics & Statistics', 125, `${SRC25} — Mathematics (estimated from band 101–150)`, u('university-of-paderborn'), NOTE_EST],
  ['Paderborn University', 'Business', 350, `${SRC25} — Management (estimated from band 301–400)`, u('university-of-paderborn'), NOTE_EST],

  ['University of Passau', 'Business', 450, `${SRC22} — Management (estimated from band 401–500)`, u('university-of-passau'), NOTE_EST],

  // New rows for already-covered schools
  ['University of Bremen', 'Environmental Science & Sustainability', 31, `${SRC26} — Oceanography`, u('university-of-bremen'), NOTE_EXACT],
  ['University of Bremen', 'Environmental Science & Sustainability', 63, `${SRC26} — Atmospheric Science (estimated from band 51–75)`, u('university-of-bremen'), NOTE_EST],
  ['University of Bremen', 'Communications & Media', 125, `${SRC26} — Communication (estimated from band 101–150)`, u('university-of-bremen'), NOTE_EST],
  ['University of Bremen', 'Mathematics & Statistics', 175, `${SRC26} — Statistics (estimated from band 151–200)`, u('university-of-bremen'), NOTE_EST],

  ['Ruhr University Bochum', 'Science & Technology / Research', 250, `${SRC26} — Nanoscience & Nanotechnology (estimated from band 201–300)`, u('university-of-bochum'), NOTE_EST],

  ['University of Marburg', 'Psychology', 88, `${SRC26} — Psychology (estimated from band 76–100)`, u('university-of-marburg'), NOTE_EST],
  ['University of Marburg', 'Environmental Science & Sustainability', 250, `${SRC26} — Ecology (estimated from band 201–300)`, u('university-of-marburg'), NOTE_EST],
  ['University of Marburg', 'Medicine & Health Sciences', 250, `${SRC26} — Dentistry & Oral Sciences (estimated from band 201–300)`, u('university-of-marburg'), NOTE_EST],
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
