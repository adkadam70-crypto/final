// France — Challenges/75secondes 2026 IEP ranks for the 5 IEP campuses just
// added (see scripts/add-missing-ieps.mjs). Same source/pool used in
// scripts/seed-program-rankings-fr-iep-political-science.mjs.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-fr-new-ieps.mjs

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
const NOTE = 'Ranking of the 10-member French IEP network based on Parcoursup selectivity and graduate outcomes.'

const DATA = [
  ['Sciences Po Lille', 3],
  ['Sciences Po Aix-en-Provence', 6],
  ['Sciences Po Rennes', 8],
  ['Sciences Po Grenoble', 9],
  ['Sciences Po Saint-Germain-en-Laye', 10],
]

let inserted = 0
for (const [name, rank] of DATA) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'FR'`
  if (rows.length === 0) { console.log(`Could not match: ${name}`); continue }
  const universityId = rows[0].id
  await sql`
    INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (${universityId}, ${FIELD}, ${rank}, ${SOURCE}, ${URL}, ${selectivityFromRank(rank, POOL)}, ${NOTE})
  `
  inserted++
}

console.log(`Inserted ${inserted} program-ranking rows.`)
