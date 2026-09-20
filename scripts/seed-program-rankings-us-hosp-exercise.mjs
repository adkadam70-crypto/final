// USA — College Factual 2026 Hospitality Management and Exercise Science
// program rankings, matched by exact name against the existing catalog
// only.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-us-hosp-exercise.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const NOTE = 'College Factual subject-specific ranking based on graduate outcomes and program quality metrics.'

const SRC = {
  hosp: ['Business', 'College Factual 2026 — Best Hospitality Management Schools', 'https://www.collegefactual.com/majors/business-management-marketing-sales/hospitality-management/rankings/top-ranked/', 659],
  ex: ['Biology & Life Sciences', 'College Factual 2026 — Best Exercise Science Schools', 'https://www.collegefactual.com/majors/parks-recreation-fitness/health-and-physical-education/exercise-science/rankings/top-ranked/', 500],
}

const DATA = {
  hosp: [
    ["University of Southern California", 2],
    ["Cornell University", 3],
    ["University of Iowa", 4],
    ["James Madison University", 5],
    ["San José State University", 6],
    ["New York University", 7],
    ["Florida State University", 8],
    ["Michigan State University", 9],
    ["University of Georgia", 12],
    ["University of Denver", 13],
    ["University of Delaware", 14],
    ["University of Massachusetts Amherst", 15],
    ["Boston University", 16],
    ["San Diego State University", 18],
    ["Arizona State University", 21],
    ["George Washington University", 22],
    ["Washington State University", 24],
    ["George Mason University", 26],
    ["Iowa State University", 27],
    ["University of Nebraska-Lincoln", 28],
    ["High Point University", 29],
    ["California State University-East Bay", 30],
    ["University of New Hampshire-Main Campus", 32],
    ["Auburn University", 33],
    ["California State University, Long Beach", 34],
    ["Montclair State University", 36],
    ["Middlesex County College", 37],
    ["San Francisco State University", 38],
    ["California State Polytechnic University-Pomona", 39],
    ["Texas Tech University", 40],
    ["Madison Area Technical College", 43],
    ["University of Central Florida", 46],
    ["University of North Texas", 47],
    ["Endicott College", 50],
    ["Valencia College", 59],
    ["Temple University", 62],
    ["University of Nevada-Las Vegas", 76],
    ["College of Southern Nevada", 82],
    ["Palm Beach State College", 144],
  ],
  ex: [
    ["The College of New Jersey", 4],
    ["University of Maryland, College Park", 6],
    ["University of Kansas", 7],
    ["Indiana University Bloomington", 8],
    ["University of North Carolina at Chapel Hill", 10],
    ["University of Georgia", 13],
    ["University of Tulsa", 16],
    ["Furman University", 18],
    ["Loyola University Chicago", 19],
    ["University of Massachusetts-Lowell", 20],
    ["Wake Forest University", 21],
    ["University of Rhode Island", 22],
    ["University of Wisconsin-Madison", 23],
    ["University of Central Florida", 24],
    ["Merrimack College", 25],
    ["University of Connecticut", 27],
    ["Pepperdine University", 29],
    ["High Point University", 30],
    ["University of Iowa", 31],
    ["Iowa State University", 32],
    ["Thomas Jefferson University", 34],
    ["Towson University", 35],
    ["University of San Francisco", 36],
    ["Illinois State University", 40],
    ["Point Loma Nazarene University", 43],
    ["Rutgers University-New Brunswick", 44],
    ["University of Minnesota-Duluth", 47],
    ["Saint Xavier University", 49],
    ["Oakland University", 50],
    ["University of Delaware", 53],
    ["Arizona State University", 54],
    ["Elon University", 55],
    ["Michigan State University", 56],
    ["Syracuse University", 61],
    ["Temple University", 69],
    ["Endicott College", 70],
    ["Winona State University", 75],
    ["Oregon State University", 76],
    ["University of Wisconsin-La Crosse", 84],
    ["Truman State University", 93],
    ["Carroll University", 94],
    ["Ball State University", 96],
    ["Salisbury University", 97],
    ["University of North Texas", 98],
    ["Appalachian State University", 100],
    ["Aurora University", 106],
    ["University of Houston", 119],
    ["Mississippi State University", 134],
    ["Baylor University", 147],
    ["University of New Hampshire-Main Campus", 164],
    ["George Mason University", 167],
    ["Lebanon Valley College", 64],
    ["Tarleton State University", 72],
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
