import { neon } from '@neondatabase/serverless'
const sql = neon(process.env.DATABASE_URL)
function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}
const FIELD = 'Medicine & Health Sciences'
const SOURCE = 'College Factual 2026 — Best Physical Therapy Schools'
const URL = 'https://www.collegefactual.com/majors/health-care-professions/rehab-and-therapeutic-professions/physical-therapy-therapist/rankings/top-ranked/'
const POOL = 224
const NOTE = 'College Factual subject-specific ranking based on graduate outcomes and program quality metrics.'
const DATA = [
  ['Lebanon Valley College', 31],
  ['George Fox University', 38],
  ['California State University-Sacramento', 40],
  ['University of Massachusetts-Lowell', 50],
]
let inserted = 0
for (const [name, rank] of DATA) {
  const r = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'US'`
  if (r.length === 0) { console.log('not found:', name); continue }
  const id = r[0].id
  await sql`
    INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (${id}, ${FIELD}, ${rank}, ${SOURCE}, ${URL}, ${selectivityFromRank(rank, POOL)}, ${NOTE})
  `
  inserted++
}
console.log(`Inserted ${inserted} rows.`)
