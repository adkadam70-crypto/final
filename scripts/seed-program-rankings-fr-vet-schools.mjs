// France — Thotis 2026 ranking of the 4 national veterinary schools (ENV
// network), matched against the modern-name catalog rows to avoid adding
// to the existing old-name/new-name duplicate pairs for Lyon and Nantes.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-fr-vet-schools.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const FIELD = 'Medicine & Health Sciences'
const SOURCE = 'Thotis Classement des Écoles Vétérinaires 2026'
const URL = 'https://thotismedia.com/classement-thotis-des-ecoles-veterinaires/'
const POOL = 4
const NOTE = 'Thotis ranking of France\'s 4 national veterinary schools (ENV network), based on access rate, selectivity, academic profile of admits, and social inclusion.'

const DATA = [
  ['VetAgro Sup', 1],
  ["École nationale vétérinaire d'Alfort", 2],
  ['École nationale vétérinaire de Toulouse', 3],
  ['Oniris Nantes', 4],
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
