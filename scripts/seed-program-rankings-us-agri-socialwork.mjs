// USA — College Factual 2026 Agriculture and Social Work program rankings,
// matched by exact name against the existing catalog only.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-us-agri-socialwork.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const NOTE = 'College Factual subject-specific ranking based on graduate outcomes and program quality metrics.'

const SRC = {
  agri: ['Agriculture & Natural Resources', 'College Factual 2026 — Best Agriculture & Agriculture Operations Schools', 'https://www.collegefactual.com/majors/agriculture-ag-operations/rankings/top-ranked/', 50],
  social: ['Social Sciences', 'College Factual 2026 — Best Social Work Schools', 'https://www.collegefactual.com/majors/social-services-public-administration/social-work/rankings/top-ranked/', 50],
}

const DATA = {
  agri: [
    ["University of Pennsylvania", 3],
    ["Cornell University", 4],
    ["University of California, Santa Cruz", 5],
    ["California Polytechnic State University, San Luis Obispo", 8],
    ["Sacred Heart University", 9],
    ["Harvard University", 11],
    ["Chapman University", 12],
    ["University of California, Davis", 13],
    ["Illinois State University", 14],
    ["Illinois Institute of Technology", 15],
    ["University of Florida", 17],
    ["California State University-Fresno", 18],
    ["Iowa State University", 19],
    ["Texas Christian University", 21],
    ["University of Wisconsin-Madison", 22],
    ["Linn State Technical College", 23],
    ["Lee College", 25],
    ["University of Massachusetts Amherst", 27],
    ["California State University-Chico", 28],
    ["University of Maryland, College Park", 29],
    ["Western Illinois University", 32],
    ["University of Wisconsin-Stout", 33],
    ["University of Arizona", 34],
    ["California State University-Monterey Bay", 35],
    ["University of Georgia", 36],
    ["Chippewa Valley Technical College", 37],
    ["California State Polytechnic University-Pomona", 38],
    ["Fox Valley Technical College", 40],
    ["New England Institute of Technology", 41],
    ["Farmingdale State College", 42],
    ["Texas Tech University", 45],
  ],
  social: [
    ["University of Pennsylvania", 1],
    ["California State University, Long Beach", 3],
    ["University of California, Los Angeles", 4],
    ["University of California, Berkeley", 5],
    ["University of Massachusetts Amherst", 6],
    ["Boston University", 7],
    ["Boston College", 9],
    ["University of Southern California", 10],
    ["California State University-Sacramento", 13],
    ["San José State University", 15],
    ["California State University, Fullerton", 16],
    ["New York University", 17],
    ["CUNY Hunter College", 18],
    ["San Francisco State University", 19],
    ["Rutgers University-New Brunswick", 20],
    ["San Diego State University", 21],
    ["University of Wisconsin-Stout", 22],
    ["University of Minnesota Twin Cities", 23],
    ["Washington University in St. Louis", 25],
    ["University of Chicago", 28],
    ["Fordham University", 29],
    ["California State University-Northridge", 30],
    ["University of North Carolina at Chapel Hill", 31],
    ["James Madison University", 32],
    ["University of Connecticut", 33],
    ["Seattle University", 34],
    ["Marist College", 35],
    ["California State University-San Bernardino", 36],
    ["University of Portland", 37],
    ["University of Wisconsin-Eau Claire", 38],
    ["Point Loma Nazarene University", 39],
    ["University of Wisconsin-Madison", 40],
    ["California State University-Chico", 41],
    ["Case Western Reserve University", 42],
    ["George Mason University", 43],
    ["University of Utah", 44],
    ["University of Denver", 45],
    ["Rutgers University-Newark", 46],
    ["California State University-East Bay", 50],
  ],
}

let inserted = 0
for (const [key, rows] of Object.entries(DATA)) {
  const [field, source, url, pool] = SRC[key]
  for (const [name, rank] of rows) {
    const r = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'US'`
    if (r.length === 0) { console.log('not found:', name); continue }
    const id = r[0].id
    const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${id} AND field = ${field} AND "rankSource" = ${source}`
    if (existing.length > 0) continue
    await sql`
      INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
      VALUES (${id}, ${field}, ${rank}, ${source}, ${url}, ${selectivityFromRank(rank, pool)}, ${NOTE})
    `
    inserted++
  }
}
console.log(`Inserted ${inserted} rows.`)
