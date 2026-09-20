// USA — College Factual 2026 Nursing program ranking, round 3, matched by
// exact name against the existing catalog only.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-us-nursing-round3.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const FIELD = 'Medicine & Health Sciences'
const SOURCE = 'College Factual 2026 — Best Nursing Schools'
const URL = 'https://www.collegefactual.com/majors/health-care-professions/nursing/rankings/top-ranked/'
const POOL = 700
const NOTE = 'College Factual subject-specific ranking based on graduate outcomes and program quality metrics.'

const DATA = [
    ["University of Southern California", 1],
    ["San Diego State University", 2],
    ["Yale University", 4],
    ["University of Pennsylvania", 7],
    ["California State University, Fullerton", 9],
    ["San José State University", 10],
    ["Stony Brook University", 11],
    ["California State University, Long Beach", 12],
    ["CUNY Graduate School and University Center", 13],
    ["California State University-Northridge", 14],
    ["California State University-Chico", 15],
    ["Johns Hopkins University", 16],
    ["Boston College", 17],
    ["University of California, Los Angeles", 18],
    ["New York University", 19],
    ["University of California, Irvine", 20],
    ["California State University-Sacramento", 21],
    ["California State University-San Bernardino", 23],
    ["University of the Pacific", 24],
    ["California State University-East Bay", 27],
    ["Georgetown University", 28],
    ["University of San Francisco", 29],
    ["California State University-Monterey Bay", 31],
    ["Quinnipiac University", 32],
    ["San Francisco State University", 34],
    ["California State University-Stanislaus", 36],
    ["Emory University", 37],
    ["Sonoma State University", 39],
    ["Fairfield University", 40],
    ["University of Delaware", 41],
    ["Vanderbilt University", 42],
    ["William Paterson University of New Jersey", 43],
    ["Rutgers University-New Brunswick", 44],
    ["City College of San Francisco", 45],
    ["Hofstra University", 47],
    ["California State University-Dominguez Hills", 50],
    ["Duke University", 57],
    ["CUNY Hunter College", 58],
    ["University of Nevada, Reno", 59],
    ["University of Rhode Island", 61],
    ["Baylor University", 63],
    ["University of Florida", 64],
    ["Washington State University", 65],
    ["Gonzaga University", 66],
    ["California State University-Channel Islands", 67],
    ["University of Minnesota Twin Cities", 68],
    ["University of Connecticut", 69],
    ["University of Scranton", 71],
    ["California State University-San Marcos", 73],
    ["California State University-Fresno", 74],
    ["Seattle University", 75],
    ["George Washington University", 77],
    ["University at Buffalo", 78],
    ["Riverside City College", 79],
    ["Towson University", 80],
    ["University of Miami", 82],
    ["Adelphi University", 83],
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
