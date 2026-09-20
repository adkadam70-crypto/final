// Germany — Constructor University (formerly Jacobs University Bremen)
// was silently skipped across multiple EduRank seed scripts because the
// catalog was renamed but those scripts still used the old name. Recovers
// the 2 ranks that are still verifiable directly from committed script
// source (CS and Medicine).
//
// Usage: node --env-file=.env.local scripts/seed-program-ranking-constructor-university.mjs
import { neon } from '@neondatabase/serverless'
const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const rows = await sql`SELECT id FROM universities WHERE name = 'Constructor University' AND country = 'DE'`
const id = rows[0].id
const NOTE = 'EduRank.org citation-based subject ranking (research output/citation counts), not an admissions-selectivity metric — programSelectivity is our own derived scale for comparability, not itself a published figure.'

const DATA = [
  ['Computer Science & IT', 54, 'EduRank.org Citation-Based Subject Ranking 2026 — Computer Science (Germany)', 'https://edurank.org/cs/de/'],
  ['Medicine & Health Sciences', 70, 'EduRank.org Citation-Based Subject Ranking 2026 — Medicine (Germany)', 'https://edurank.org/medicine/de/'],
]

let inserted = 0
for (const [field, rank, source, url] of DATA) {
  const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${id} AND field = ${field} AND "rankSource" = ${source}`
  if (existing.length > 0) continue
  await sql`
    INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (${id}, ${field}, ${rank}, ${source}, ${url}, ${selectivityFromRank(rank, 100)}, ${NOTE})
  `
  inserted++
}
console.log(`Inserted ${inserted} program-ranking rows.`)
