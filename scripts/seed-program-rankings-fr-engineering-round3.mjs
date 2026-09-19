import { neon } from '@neondatabase/serverless'
const sql = neon(process.env.DATABASE_URL)
function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}
const FIELD = 'Engineering'
const SOURCE = "L'Étudiant Classement des Écoles d'Ingénieurs 2026 (round 3)"
const URL = 'https://www.letudiant.fr/classements/classement-des-ecoles-d-ingenieurs.html'
const DATA = [['CPE Lyon', 64], ['ECAM LaSalle', 65], ['ENSICAEN', 71], ['EPITA', 73], ['ESTACA', 74], ['ISAE-ENSMA', 78], ["ISEP – Institut Supérieur d'Électronique de Paris", 79], ["CESI École d'Ingénieurs", 82], ["EPF Ecole d'Ingénieurs", 91], ['UniLaSalle', 119], ['ISEN Yncréa Ouest', 136]]
let inserted = 0
const skipped = []
for (const [name, rank] of DATA) {
  const found = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'FR'`
  if (found.length === 0) { skipped.push(name); continue }
  const universityId = found[0].id
  const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${universityId} AND field = ${FIELD} AND "rankSource" = ${SOURCE}`
  if (existing.length > 0) continue
  await sql`INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes) VALUES (${universityId}, ${FIELD}, ${rank}, ${SOURCE}, ${URL}, ${selectivityFromRank(rank, 174)}, 'Banded rank from L''Étudiant 2026 engineering-school ranking, approximate position within tie band.')`
  inserted++
}
console.log(`Inserted ${inserted} rows.`)
if (skipped.length) console.log('skipped:', skipped.join(', '))
