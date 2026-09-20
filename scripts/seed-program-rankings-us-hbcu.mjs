// USA — HBCU 2026 ranking (hbculifestyle.com), matched by exact name
// against the existing catalog only.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-us-hbcu.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const FIELD = 'Science & Technology / Research'
const SOURCE = 'HBCU Rankings 2026'
const URL = 'https://hbculifestyle.com/hbcu-rankings-2026-the-top-25-leading-colleges/'
const POOL = 25
const NOTE = 'Overall HBCU-specific institutional ranking, not subject-specific.'

const DATA = [
    ["Spelman College", 1],
    ["Howard University", 2],
    ["Morehouse College", 3],
    ["Tuskegee University", 4],
    ["Hampton University", 7],
    ["Morgan State University", 9],
    ["Bowie State University", 11],
    ["Claflin University", 13],
    ["North Carolina Central University", 13],
    ["Jackson State University", 15],
    ["Dillard University", 17],
    ["Elizabeth City State University", 18],
    ["Prairie View A & M University", 18],
    ["Fisk University", 22],
    ["University of Maryland Eastern Shore", 22],
    ["Winston-Salem State University", 22],
    ["Fayetteville State University", 25],
]

let inserted = 0
for (const [name, rank] of DATA) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'US'`
  if (rows.length === 0) { console.log('not found:', name); continue }
  const id = rows[0].id
  await sql`
    INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (${id}, ${FIELD}, ${rank}, ${SOURCE}, ${URL}, ${selectivityFromRank(rank, POOL)}, ${NOTE})
  `
  inserted++
}
console.log(`Inserted ${inserted} rows.`)
