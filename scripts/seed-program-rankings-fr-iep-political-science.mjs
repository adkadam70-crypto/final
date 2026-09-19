// France — Challenges/75secondes 2026 IEP (Institut d'études politiques /
// Sciences Po network) ranking, matched by exact normalized name against
// the existing catalog only.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-fr-iep-political-science.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const FIELD = 'Political Science'
const SOURCE = 'Challenges/75secondes Classement des IEP 2026'
const URL = 'https://www.75secondes.fr/classement/classement-2026-des-iep-paris-lyon-et-lille-sur-le-podium'
const POOL = 10

const DATA = [
  ['Sciences Po', 1],
  ['Sciences Po Lyon', 2],
  ['Sciences Po Bordeaux', 5],
  ['Sciences Po Toulouse', 7],
  ['University of Strasbourg IEP / Sciences Po Strasbourg', 4],
]

let inserted = 0
const skipped = []

for (const [name, rank] of DATA) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'FR'`
  if (rows.length === 0) { skipped.push(name); continue }
  const universityId = rows[0].id
  const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${universityId} AND field = ${FIELD} AND "rankSource" = ${SOURCE}`
  if (existing.length > 0) continue
  await sql`
    INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (${universityId}, ${FIELD}, ${rank}, ${SOURCE}, ${URL}, ${selectivityFromRank(rank, POOL)}, 'Ranking of the 10-member French IEP network based on Parcoursup selectivity and graduate outcomes.')
  `
  inserted++
}

console.log(`Inserted ${inserted} program-ranking rows.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
