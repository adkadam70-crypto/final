// USA — College Factual 2026 Education program ranking, matched by exact
// name against the existing catalog only.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-us-education.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const FIELD = 'Education'
const SOURCE = 'College Factual 2026 — Best Education Schools'
const URL = 'https://www.collegefactual.com/majors/education/rankings/top-ranked/'
const POOL = 114
const NOTE = 'College Factual subject-specific ranking based on graduate outcomes and program quality metrics.'

const DATA = [
    ["University of Notre Dame", 1],
    ["Johns Hopkins University", 3],
    ["Harvard University", 4],
    ["New York University", 6],
    ["Yale University", 7],
    ["University of California, Los Angeles", 8],
    ["Stanford University", 9],
    ["University of California, Irvine", 10],
    ["University of Pennsylvania", 11],
    ["University of California, Berkeley", 12],
    ["Rice University", 13],
    ["University of Southern California", 14],
    ["Northwestern University", 15],
    ["Santa Clara University", 18],
    ["Fordham University", 19],
    ["Middlebury College", 21],
    ["Duke University", 22],
    ["University of California, San Diego", 23],
    ["California State University-Northridge", 24],
    ["James Madison University", 25],
    ["University of Wisconsin-Madison", 26],
    ["California State University, Long Beach", 27],
    ["Stony Brook University", 28],
    ["University of Massachusetts Amherst", 29],
    ["Washington University in St. Louis", 30],
    ["University of Miami", 31],
    ["Trinity College", 32],
    ["San José State University", 33],
    ["University of Maryland, College Park", 34],
    ["American University", 38],
    ["University of Delaware", 39],
    ["Bucknell University", 40],
    ["Boston College", 43],
    ["Siena College", 44],
    ["Washington State University", 45],
    ["Pepperdine University", 46],
    ["University of California, Davis", 48],
    ["Rochester Institute of Technology", 49],
    ["California State University-Sacramento", 50],
    ["Rockhurst College", 37],
]

let inserted = 0
const skipped = []

for (const [name, rank] of DATA) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'US'`
  if (rows.length === 0) { skipped.push(name); continue }
  const universityId = rows[0].id
  const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${universityId} AND field = ${FIELD} AND "rankSource" = ${SOURCE}`
  if (existing.length > 0) continue
  await sql`
    INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (${universityId}, ${FIELD}, ${rank}, ${SOURCE}, ${URL}, ${selectivityFromRank(rank, POOL)}, ${NOTE})
  `
  inserted++
}

console.log(`Inserted ${inserted} program-ranking rows.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
