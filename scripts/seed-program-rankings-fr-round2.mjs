// France round 2 — L'Etudiant 2026 Engineering Schools ranking (174 schools,
// exact ranks 1-80, banded beyond that) and SIGEM 2026 Business Schools
// ranking, matched by exact normalized name against the existing catalog
// only — no new university rows created, per explicit instruction.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-fr-round2.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150 // normalize onto the ~150-school scale the formula was tuned for
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const ENG_SOURCE = "L'Étudiant — Classement 2026 des écoles d'ingénieurs (174 schools)"
const ENG_URL = 'https://www.letudiant.fr/classements/classement-des-ecoles-d-ingenieurs.html'
const BIZ_SOURCE = 'SIGEM — Classement 2026 des écoles de commerce post-prépa'
const BIZ_URL = 'https://www.ecoles-commerce.com/classement-sigem-2026/'

const ENG_DATA = [
  ['École Polytechnique', 1], ['CentraleSupélec', 4], ['Mines Nancy', 7], ['Télécom Paris', 7], ['Centrale Nantes', 10],
  ['Mines Saint-Étienne', 12], ['INSA Lyon', 14], ['ISAE-SUPAERO', 16], ['IMT Nord Europe', 21], ['ESILV', 22],
  ['EFREI Paris', 26], ['Centrale Lille', 28], ['ESIEE Paris', 28], ['INSA Toulouse', 28], ['AgroParisTech', 32],
  ['Centrale Méditerranée', 32], ['IMT Mines Albi', 32], ['ENTPE', 39], ['INSA Rennes', 39], ['ENAC', 44],
  ['ESIEA', 49], ['ESME', 70], ['INSA Strasbourg', 74], ['Sigma Clermont', 80], ['CPE Lyon', 90],
  ['ECAM LaSalle', 90], ['EIGSI La Rochelle', 90], ['ENSICAEN', 90], ['EPITA', 90], ['ESTACA', 90], ['ISAE-ENSMA', 90],
]

const BIZ_DATA = [
  ['HEC Paris', 1], ['ESSEC Business School', 2], ['ESCP Business School', 3], ['EDHEC Business School', 4],
  ['emlyon business school', 5], ['SKEMA Business School', 6], ['NEOMA Business School', 7], ['Audencia', 8],
  ['Grenoble Ecole de Management', 9], ['KEDGE Business School', 10], ['TBS Education', 11], ['Rennes School of Business', 13],
  ['Excelia Business School', 16], ['EM Strasbourg Business School', 17], ['INSEEC Grande École', 19],
  ['Montpellier Business School', 20], ['Ecole Supérieure de Commerce de Brest', 22],
]

const NOTE_BANDED = 'Rank shown is the midpoint of a tied band this school falls into on the source list (e.g. schools ranked 81-100 are all listed as "90" here) — the source itself does not distinguish a precise order within that band.'
const NOTE_EXACT = 'Exact numbered rank from the cited source.'

let inserted = 0
const skipped = []

async function insertRow(name, field, rank, source, url, poolSize, note) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'FR'`
  if (rows.length === 0) {
    skipped.push(`${name} (${field})`)
    return
  }
  const universityId = rows[0].id
  const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${universityId} AND field = ${field} AND "rankSource" = ${source}`
  if (existing.length > 0) return

  await sql`
    INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (${universityId}, ${field}, ${rank}, ${source}, ${url}, ${selectivityFromRank(rank, poolSize)}, ${note})
  `
  inserted++
}

for (const [name, rank] of ENG_DATA) {
  await insertRow(name, 'Engineering', rank, ENG_SOURCE, ENG_URL, 174, rank > 80 ? NOTE_BANDED : NOTE_EXACT)
}
for (const [name, rank] of BIZ_DATA) {
  await insertRow(name, 'Business', rank, BIZ_SOURCE, BIZ_URL, 23, NOTE_EXACT)
}

console.log(`Inserted ${inserted} program-ranking rows.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
