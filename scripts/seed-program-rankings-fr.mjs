// Program-specific rankings for France — Engineering and Business, from
// L'Étudiant's 2026 national rankings. Same role as the US (U.S. News),
// India (NIRF) and UK (Complete University Guide) subject-ranking passes:
// a per-school, per-field ordinal from a named source, distinct from the
// general THE-France rank in universities.rankValue.
//
// Why L'Étudiant: France's grandes écoles are ranked domestically by sector,
// not in one combined table, and L'Étudiant's engineering and business-school
// rankings are the most widely cited references (alongside L'Usine Nouvelle
// for engineering and Le Figaro). Positions here are the 2026 editions:
//   - Engineering: 174 CTI-accredited schools ranked; Polytechnique #1.
//   - Business: post-prépa Programme Grande École ranking; HEC #1.
//
// Umbrella mapping: L'Étudiant ranks specific component schools of the
// INP institutes and the Polytech network (Ensimag, ENSEEIHT, ENSEIRB-
// MATMECA, Polytech Nice Sophia). Where our catalog has only the umbrella
// row (Grenoble INP, Toulouse INP, Bordeaux INP, Polytech Network), it
// carries that best-ranked component's position, noted on the row.
//
// Ties (two schools at the same rank) are real in L'Étudiant's tables and
// expected — kept as-is.
//
// programSelectivity uses the same transform as every other program-ranking
// pass: 100 - (rank-1)*1.1, clamped 15-99. Not a published figure.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-fr.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank) {
  return Math.max(15, Math.min(99, Math.round(100 - (rank - 1) * 1.1)))
}

const ENG_SOURCE = "L'Étudiant — Classement 2026 des écoles d'ingénieurs"
const ENG_URL = 'https://www.letudiant.fr/classements/classement-des-ecoles-d-ingenieurs.html'
const ENG_NOTE = "L'Étudiant's engineering-school ranking is a widely cited French national reference (2026 edition, 174 CTI-accredited schools)."
const ENG_ENTRIES = [
  { name: 'École Polytechnique', rank: 1 },
  { name: 'ENSTA Paris', rank: 2 },
  { name: 'IMT Atlantique', rank: 3 },
  { name: 'CentraleSupélec', rank: 4 },
  { name: 'ESPCI Paris – PSL', rank: 4 },
  { name: 'Mines Paris – PSL', rank: 6 },
  { name: 'Mines Nancy', rank: 7 },
  { name: 'Télécom Paris', rank: 7 },
  { name: 'École des Ponts ParisTech', rank: 9 },
  { name: 'École Centrale de Lyon', rank: 10 },
  { name: 'Centrale Nantes', rank: 10 },
  { name: 'Mines Saint-Étienne', rank: 12 },
  { name: 'ENSAE Paris', rank: 13 },
  { name: 'INSA Lyon', rank: 14 },
  { name: 'Chimie ParisTech – PSL', rank: 15 },
  { name: 'ISAE-SUPAERO', rank: 16 },
  { name: 'Grenoble INP', rank: 18, umbrella: 'Ensimag' },
  { name: 'Arts et Métiers', rank: 20 },
  { name: 'IMT Nord Europe', rank: 21 },
  { name: 'ESILV', rank: 22 },
  { name: 'EFREI Paris', rank: 26 },
  { name: 'Polytech Network', rank: 26, umbrella: 'Polytech Nice Sophia' },
  { name: 'Centrale Lille', rank: 28 },
  { name: 'ESIEE Paris', rank: 28 },
  { name: 'INSA Toulouse', rank: 28 },
  { name: 'Toulouse INP', rank: 28, umbrella: 'ENSEEIHT' },
  { name: 'AgroParisTech', rank: 32 },
  { name: 'Centrale Méditerranée', rank: 32 },
  { name: 'IMT Mines Albi', rank: 32 },
  { name: 'Université de Technologie de Compiègne', rank: 35 },
  { name: 'Bordeaux INP', rank: 36, umbrella: 'ENSEIRB-MATMECA' },
  { name: 'Université de Technologie de Troyes', rank: 37 },
  { name: 'INSA Rennes', rank: 39 },
]

const BIZ_SOURCE = "L'Étudiant — Classement 2026 des grandes écoles de commerce"
const BIZ_URL = 'https://www.letudiant.fr/classements/classement-des-grandes-ecoles-de-commerce.html'
const BIZ_NOTE = "L'Étudiant's post-prépa Programme Grande École ranking is a widely cited French national reference (2026 edition)."
const BIZ_ENTRIES = [
  { name: 'HEC Paris', rank: 1 },
  { name: 'ESCP Business School', rank: 2 },
  { name: 'ESSEC Business School', rank: 3 },
  { name: 'EDHEC Business School', rank: 4 },
  { name: 'emlyon business school', rank: 4 },
  { name: 'SKEMA Business School', rank: 6 },
  { name: 'NEOMA Business School', rank: 7 },
  { name: 'Audencia', rank: 8 },
  { name: 'Grenoble École de Management', rank: 9 },
  { name: 'TBS Education', rank: 10 },
  { name: 'Montpellier Business School', rank: 11 },
  { name: 'KEDGE Business School', rank: 12 },
  { name: 'Rennes School of Business', rank: 13 },
  { name: 'EM Strasbourg Business School', rank: 14 },
  { name: 'Excelia Business School', rank: 14 },
  { name: 'ICN Business School', rank: 14 },
]

async function seed(field, source, url, note, entries) {
  let inserted = 0
  const skipped = []
  for (const entry of entries) {
    const rows = await sql`SELECT id, "academicFields" FROM universities WHERE name = ${entry.name} AND country = 'FR'`
    if (rows.length === 0) { skipped.push(entry.name); continue }
    const universityId = rows[0].id
    const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${universityId} AND field = ${field}`
    if (existing.length > 0) { console.log(`Skipping ${entry.name} (${field}) — already ranked.`); continue }
    const rowNote = entry.umbrella
      ? `${note} Position is that of its top-ranked component school (${entry.umbrella}).`
      : note
    await sql`
      INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
      VALUES (${universityId}, ${field}, ${entry.rank}, ${source}, ${url}, ${selectivityFromRank(entry.rank)}, ${rowNote})
    `
    const currentFields = rows[0].academicFields || []
    if (!currentFields.includes(field)) {
      await sql`UPDATE universities SET "academicFields" = ${JSON.stringify([...currentFields, field])}::jsonb WHERE id = ${universityId}`
    }
    inserted++
  }
  console.log(`${field}: inserted ${inserted}.${skipped.length ? ` Could not match: ${skipped.join(', ')}` : ''}`)
}

await seed('Engineering', ENG_SOURCE, ENG_URL, ENG_NOTE, ENG_ENTRIES)
await seed('Business', BIZ_SOURCE, BIZ_URL, BIZ_NOTE, BIZ_ENTRIES)
