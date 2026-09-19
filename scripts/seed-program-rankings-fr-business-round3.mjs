// France — L'Étudiant 2026 Grandes Écoles de Commerce ranking (round 3),
// matched by exact normalized name against the existing catalog only.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-fr-business-round3.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const FIELD = 'Business'
const SOURCE = "L'Étudiant Classement des Grandes Écoles de Commerce 2026"
const URL = 'https://www.letudiant.fr/classements/classement-des-grandes-ecoles-de-commerce.html'

const DATA = [
  ['Institut Mines-Télécom Business School', 17],
  ['Clermont School of Business', 20],
  ['INSEEC Grande École', 21],
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
    VALUES (${universityId}, ${FIELD}, ${rank}, ${SOURCE}, ${URL}, ${selectivityFromRank(rank, 23)}, 'CEFDG-accredited post-prépa business school ranking.')
  `
  inserted++
}

console.log(`Inserted ${inserted} program-ranking rows.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
