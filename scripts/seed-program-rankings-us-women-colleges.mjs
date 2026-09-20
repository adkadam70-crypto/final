// USA — Newsweek "America's Best Colleges for Women" 2026 ranking,
// matched by exact name against the existing catalog only.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-us-women-colleges.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const FIELD = 'Science & Technology / Research'
const SOURCE = "Newsweek America's Best Colleges for Women 2026"
const URL = 'https://rankings.newsweek.com/americas-best-colleges-for-women-2026'
const POOL = 50
const NOTE = 'Newsweek/Gender Fair institutional ranking evaluating colleges on leadership, pay/policies, safety, and opportunity for women — not subject-specific.'

const DATA = [
    ["Spelman College", 1],
    ["Thomas Jefferson University", 2],
    ["Alverno College", 5],
    ["Miami Dade College", 10],
    ["Mercy University", 11],
    ["Johnson C. Smith University", 15],
    ["Our Lady of the Lake University", 16],
    ["Texas Woman's University", 18],
    ["Coppin State University", 20],
    ["Brenau University", 21],
    ["CUNY York College", 24],
    ["National Louis University", 24],
    ["Pasco-Hernando State College", 24],
    ["Molloy College", 28],
    ["San Francisco State University", 29],
    ["Barry University", 31],
    ["CUNY Lehman College", 32],
    ["University of Holy Cross", 32],
    ["Bellevue College", 35],
    ["Marymount Manhattan College", 40],
    ["Bowdoin College", 41],
    ["Palm Beach State College", 41],
    ["Sonoma State University", 45],
    ["CUNY New York City College of Technology", 46],
    ["Georgian Court University", 46],
    ["CUNY Hunter College", 49],
    ["Simmons University", 49],
]

let inserted = 0
for (const [name, rank] of DATA) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'US'`
  if (rows.length === 0) { console.log('not found:', name); continue }
  const id = rows[0].id
  const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${id} AND field = ${FIELD} AND "rankSource" = ${SOURCE}`
  if (existing.length > 0) continue
  await sql`
    INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (${id}, ${FIELD}, ${rank}, ${SOURCE}, ${URL}, ${selectivityFromRank(rank, POOL)}, ${NOTE})
  `
  inserted++
}
console.log(`Inserted ${inserted} rows.`)
