// France — ARWU (Shanghai Ranking) 2026 overall institutional positions,
// matched by exact normalized name against the existing catalog only.
// General/overall ranking, not subject-specific, so filed under
// "Science & Technology / Research" — same convention used elsewhere.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-fr-shanghai-overall.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const FIELD = 'Science & Technology / Research'
const SOURCE = 'ARWU (Shanghai Ranking) 2026 — France'
const URL = 'https://www.letudiant.fr/etudes/fac/classement-de-shanghai-2026-paris-saclay-psl-et-sorbonne-universite-restent-le-top-3-francais.html'
const NOTE = 'ARWU (Shanghai Ranking) world position, banded beyond rank 100 — programSelectivity is our own derived scale for comparability, not itself a published figure.'

const DATA = [
  ['Université Paris-Saclay', 13], ['PSL University', 33], ['Sorbonne University', 55], ['Université Paris Cité', 57],
  ['University of Strasbourg', 101], ['Aix-Marseille University', 151], ['Université Grenoble Alpes', 151], ['University of Montpellier', 151],
  ['Claude Bernard University Lyon 1', 201], ['Institut Polytechnique de Paris', 201],
  ['Ecole Normale Supérieure de Lyon', 301], ['Université Paul Sabatier (Toulouse III)', 301], ['University of Bordeaux', 301], ['University of Lorraine', 301],
  ['Toulouse Capitole University', 401], ['University of Lille', 401], ['University of Rennes', 401],
  ['Université de Bretagne Occidentale', 601], ['University of Angers', 801], ['Université de Picardie Jules-Verne', 801], ['University of Clermont Auvergne', 601],
]

let inserted = 0
const skipped = []

for (const [name, rank] of DATA) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'FR'`
  if (rows.length === 0) {
    skipped.push(name)
    continue
  }
  const universityId = rows[0].id
  const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${universityId} AND field = ${FIELD} AND "rankSource" = ${SOURCE}`
  if (existing.length > 0) continue
  await sql`
    INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (${universityId}, ${FIELD}, ${rank}, ${SOURCE}, ${URL}, ${selectivityFromRank(rank, 900)}, ${NOTE})
  `
  inserted++
}

console.log(`Inserted ${inserted} program-ranking rows.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
