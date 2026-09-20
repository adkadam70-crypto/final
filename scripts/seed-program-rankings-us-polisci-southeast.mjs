// USA — College Factual 2026 Political Science & Government Southeast
// regional ranking, matched by exact name against the existing catalog
// only.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-us-polisci-southeast.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const FIELD = 'Political Science'
const SOURCE = 'College Factual 2026 — Best Political Science & Government Schools (Southeast Region)'
const URL = 'https://www.collegefactual.com/majors/social-sciences/political-science-and-government/rankings/top-ranked/southeast/'
const POOL = 50
const NOTE = 'College Factual regional subject-specific ranking based on graduate outcomes and program quality metrics.'

const DATA = [
    ["Duke University", 1],
    ["Vanderbilt University", 2],
    ["University of North Carolina at Chapel Hill", 3],
    ["Wake Forest University", 5],
    ["Davidson College", 7],
    ["James Madison University", 8],
    ["University of Florida", 9],
    ["University of Georgia", 10],
    ["George Mason University", 12],
    ["Emory University", 13],
    ["Florida State University", 14],
    ["University of Richmond", 16],
    ["Belmont University", 17],
    ["University of Miami", 18],
    ["Elon University", 20],
    ["Washington and Lee University", 21],
    ["Clemson University", 22],
    ["Christopher Newport University", 23],
    ["High Point University", 24],
    ["Mercer University", 25],
    ["Centre College", 26],
    ["Nova Southeastern University", 28],
    ["Harding University", 29],
    ["Berry College", 30],
    ["Virginia Commonwealth University", 31],
    ["Rhodes College", 32],
    ["Roanoke College", 34],
    ["University of Kentucky", 38],
    ["East Carolina University", 41],
    ["Wingate University", 42],
    ["Appalachian State University", 43],
    ["University of Central Florida", 47],
    ["Berea College", 50],
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
