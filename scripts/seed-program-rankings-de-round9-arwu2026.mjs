// Ninth Germany pass — ARWU Global Ranking of Academic Subjects 2026, full
// per-university pages fetched and cross-checked directly (not trusted
// from the batch's own citations, which twice this session cited a
// secondary aggregator instead of shanghairanking.com itself and got a
// number wrong). One real correction found this round: Saarland's
// Biotechnology rank is an EXACT #44 per its own ARWU page, not the "63
// estimated from band 51-75" the batch claimed (sourced from
// collegedunia.com, which has now produced a wrong/unverifiable number on
// four separate occasions this session). Everything below was read
// directly off each university's own shanghairanking.com page.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-de-round9-arwu2026.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank) {
  return Math.max(10, Math.min(99, Math.round(100 - (rank - 1) * 0.15)))
}

const SRC = 'ARWU Global Ranking of Academic Subjects 2026'
const NOTE_EXACT = 'World subject rank — programSelectivity is our own derived scale for comparability, not itself a published figure.'
const NOTE_EST = 'programSelectivity is our own derived scale for comparability. Rank value is the midpoint of the published band, not an exact figure the ranking body itself published.'

function u(school) {
  return `https://www.shanghairanking.com/universities/${school}`
}

const DATA = [
  // University of Potsdam
  ['University of Potsdam', 'Political Science', 21, `${SRC} — Public Administration`, u('University-of-Potsdam'), NOTE_EXACT],
  ['University of Potsdam', 'Environmental Science & Sustainability', 88, `${SRC} — Water Resources (estimated from band 76–100)`, u('University-of-Potsdam'), NOTE_EST],
  ['University of Potsdam', 'Environmental Science & Sustainability', 125, `${SRC} — Earth Sciences (estimated from band 101–150)`, u('University-of-Potsdam'), NOTE_EST],
  ['University of Potsdam', 'Environmental Science & Sustainability', 125, `${SRC} — Atmospheric Science (estimated from band 101–150)`, u('University-of-Potsdam'), NOTE_EST],
  ['University of Potsdam', 'Psychology', 125, `${SRC} — Psychology (estimated from band 101–150)`, u('University-of-Potsdam'), NOTE_EST],
  ['University of Potsdam', 'Environmental Science & Sustainability', 175, `${SRC} — Ecology (estimated from band 151–200)`, u('University-of-Potsdam'), NOTE_EST],
  ['University of Potsdam', 'Political Science', 250, `${SRC} — Political Sciences (estimated from band 201–300)`, u('University-of-Potsdam'), NOTE_EST],

  // University of Göttingen
  ['University of Göttingen', 'Environmental Science & Sustainability', 25, `${SRC} — Ecology`, u('university-of-goettingen'), NOTE_EXACT],
  ['University of Göttingen', 'Agriculture & Natural Resources', 38, `${SRC} — Agricultural Sciences`, u('university-of-goettingen'), NOTE_EXACT],
  ['University of Göttingen', 'Biology & Life Sciences', 88, `${SRC} — Human Biological Sciences (estimated from band 76–100)`, u('university-of-goettingen'), NOTE_EST],
  ['University of Göttingen', 'Environmental Science & Sustainability', 125, `${SRC} — Earth Sciences (estimated from band 101–150)`, u('university-of-goettingen'), NOTE_EST],
  ['University of Göttingen', 'Mathematics & Statistics', 125, `${SRC} — Statistics (estimated from band 101–150)`, u('university-of-goettingen'), NOTE_EST],

  // Goethe University Frankfurt
  ['Goethe University Frankfurt', 'Political Science', 63, `${SRC} — Political Sciences (estimated from band 51–75)`, u('goethe-university-frankfurt'), NOTE_EST],
  ['Goethe University Frankfurt', 'Finance', 88, `${SRC} — Finance (estimated from band 76–100)`, u('goethe-university-frankfurt'), NOTE_EST],
  ['Goethe University Frankfurt', 'Environmental Science & Sustainability', 125, `${SRC} — Ecology (estimated from band 101–150)`, u('goethe-university-frankfurt'), NOTE_EST],
  ['Goethe University Frankfurt', 'Biology & Life Sciences', 125, `${SRC} — Biological Sciences (estimated from band 101–150)`, u('goethe-university-frankfurt'), NOTE_EST],
  ['Goethe University Frankfurt', 'Medicine & Health Sciences', 125, `${SRC} — Dentistry & Oral Sciences (estimated from band 101–150)`, u('goethe-university-frankfurt'), NOTE_EST],

  // Ruhr University Bochum — only the one new row; the rest duplicate the estimated-bands round exactly and are skipped by the dedupe check using identical source text
  ['Ruhr University Bochum', 'Mathematics & Statistics', 63, `${SRC} — Statistics (estimated from band 51–75)`, u('university-of-bochum'), NOTE_EST],
  ['Ruhr University Bochum', 'Engineering', 88, `${SRC} — Metallurgical Engineering (estimated from band 76–100)`, u('university-of-bochum'), NOTE_EST],
  ['Ruhr University Bochum', 'Psychology', 88, `${SRC} — Psychology (estimated from band 76–100)`, u('university-of-bochum'), NOTE_EST],
  ['Ruhr University Bochum', 'Engineering', 125, `${SRC} — Telecommunication Engineering (estimated from band 101–150)`, u('university-of-bochum'), NOTE_EST],
  ['Ruhr University Bochum', 'Science & Technology / Research', 175, `${SRC} — Chemistry (estimated from band 151–200)`, u('university-of-bochum'), NOTE_EST],
  ['Ruhr University Bochum', 'Science & Technology / Research', 125, `${SRC} — Physics (estimated from band 101–150)`, u('university-of-bochum'), NOTE_EST],

  // University of Erlangen-Nuremberg (FAU) — first coverage for this school
  ['University of Erlangen-Nuremberg', 'Engineering', 63, `${SRC} — Telecommunication Engineering (estimated from band 51–75)`, u('university-of-erlangen-nuremberg'), NOTE_EST],
  ['University of Erlangen-Nuremberg', 'Mathematics & Statistics', 88, `${SRC} — Mathematics (estimated from band 76–100)`, u('university-of-erlangen-nuremberg'), NOTE_EST],
  ['University of Erlangen-Nuremberg', 'Engineering', 88, `${SRC} — Electrical & Electronic Engineering (estimated from band 76–100)`, u('university-of-erlangen-nuremberg'), NOTE_EST],
  ['University of Erlangen-Nuremberg', 'Engineering', 88, `${SRC} — Energy Science & Engineering (estimated from band 76–100)`, u('university-of-erlangen-nuremberg'), NOTE_EST],
  ['University of Erlangen-Nuremberg', 'Biology & Life Sciences', 88, `${SRC} — Human Biological Sciences (estimated from band 76–100)`, u('university-of-erlangen-nuremberg'), NOTE_EST],

  // Leibniz University Hannover
  ['Leibniz University Hannover', 'Engineering', 63, `${SRC} — Civil Engineering (estimated from band 51–75)`, u('leibniz-university-hannover'), NOTE_EST],
  ['Leibniz University Hannover', 'Mathematics & Statistics', 125, `${SRC} — Mathematics (estimated from band 101–150)`, u('leibniz-university-hannover'), NOTE_EST],
  ['Leibniz University Hannover', 'Engineering', 175, `${SRC} — Remote Sensing (estimated from band 151–200)`, u('leibniz-university-hannover'), NOTE_EST],
  ['Leibniz University Hannover', 'Science & Technology / Research', 250, `${SRC} — Chemistry (estimated from band 201–300)`, u('leibniz-university-hannover'), NOTE_EST],

  // Saarland University — first coverage for this school, using the REAL exact figure (44), not the batch's wrong estimate (63)
  ['Saarland University', 'Biology & Life Sciences', 44, `${SRC} — Biotechnology`, u('saarland-university'), NOTE_EXACT],

  // TU Braunschweig — new rows beyond what round8 already added
  ['TU Braunschweig', 'Engineering', 175, `${SRC} — Electrical & Electronic Engineering (estimated from band 151–200)`, u('technical-university-of-braunschweig'), NOTE_EST],
  ['TU Braunschweig', 'Engineering', 175, `${SRC} — Telecommunication Engineering (estimated from band 151–200)`, u('technical-university-of-braunschweig'), NOTE_EST],
  ['TU Braunschweig', 'Science & Technology / Research', 450, `${SRC} — Chemistry (estimated from band 401–500)`, u('technical-university-of-braunschweig'), NOTE_EST],

  // University of Bayreuth — new rows beyond what the estimated-bands round already added
  ['University of Bayreuth', 'Environmental Science & Sustainability', 175, `${SRC} — Ecology (estimated from band 151–200)`, u('university-of-bayreuth'), NOTE_EST],
  ['University of Bayreuth', 'Science & Technology / Research', 250, `${SRC} — Chemistry (estimated from band 201–300)`, u('university-of-bayreuth'), NOTE_EST],
  ['University of Bayreuth', 'Environmental Science & Sustainability', 250, `${SRC} — Environmental Science & Engineering (estimated from band 201–300)`, u('university-of-bayreuth'), NOTE_EST],
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
