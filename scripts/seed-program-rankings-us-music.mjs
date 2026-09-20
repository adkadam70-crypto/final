// USA — College Factual 2026 Music program ranking, matched by exact
// name against the existing catalog only.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-us-music.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const FIELD = 'Arts'
const SOURCE = 'College Factual 2026 — Best Music Schools'
const URL = 'https://www.collegefactual.com/majors/visual-and-performing-arts/music/rankings/top-ranked/'
const POOL = 124
const NOTE = 'College Factual subject-specific ranking based on graduate outcomes and program quality metrics.'

const DATA = [
    ["Dartmouth College", 1],
    ["Stanford University", 3],
    ["Case Western Reserve University", 4],
    ["Vanderbilt University", 6],
    ["University of North Carolina at Chapel Hill", 7],
    ["San José State University", 8],
    ["University of California, Santa Barbara", 9],
    ["University of Utah", 10],
    ["University of Florida", 11],
    ["Northwestern University", 12],
    ["The College of New Jersey", 13],
    ["Brown University", 15],
    ["University of Maryland, College Park", 16],
    ["James Madison University", 17],
    ["Sonoma State University", 19],
    ["University of Houston", 20],
    ["County College of Morris", 21],
    ["Illinois State University", 22],
    ["University of the Pacific", 24],
    ["Rowan University", 26],
    ["University of California, Davis", 27],
    ["Texas Christian University", 28],
    ["Rutgers University-New Brunswick", 29],
    ["University of Vermont", 30],
    ["St Olaf College", 32],
    ["New York University", 33],
    ["University of Minnesota Twin Cities", 35],
    ["Drake University", 36],
    ["Gustavus Adolphus College", 37],
    ["Yale University", 38],
    ["Butler University", 39],
    ["University of California, Irvine", 40],
    ["Messiah College", 41],
    ["University of Connecticut", 43],
    ["George Mason University", 46],
    ["Boston University", 47],
    ["Tennessee Technological University", 48],
    ["Occidental College", 49],
    ["University of Rhode Island", 50],
    ["University of California, Los Angeles", 56],
    ["Lawrence University", 63],
    ["University of Wisconsin-Madison", 65],
    ["University of Southern California", 66],
    ["Michigan State University", 68],
    ["Southern Methodist University", 72],
    ["Johns Hopkins University", 80],
    ["Florida State University", 84],
    ["Luther College", 86],
    ["University of North Texas", 90],
    ["Indiana University Bloomington", 92],
    ["Chapman University", 95],
    ["University of Miami", 100],
    ["University of Georgia", 112],
    ["Ithaca College", 121],
    ["Belmont University", 123],
    ["University of Massachusetts Amherst", 124],
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
