// USA — College Factual 2026 Political Science & Government regional
// rankings (Great Lakes, Far Western US), matched by exact name against
// the existing catalog only.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-us-polisci-regions2.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const NOTE = 'College Factual regional subject-specific ranking based on graduate outcomes and program quality metrics.'

const SRC = {
  gl: ['Political Science', 'College Factual 2026 — Best Political Science & Government Schools (Great Lakes Region)', 'https://www.collegefactual.com/majors/social-sciences/political-science-and-government/rankings/top-ranked/great-lakes/', 50],
  fw: ['Political Science', 'College Factual 2026 — Best Political Science & Government Schools (Far Western US Region)', 'https://www.collegefactual.com/majors/social-sciences/political-science-and-government/rankings/top-ranked/far-western-us/', 84],
}

const DATA = {
  gl: [
    ["University of Chicago", 1],
    ["Northwestern University", 2],
    ["University of Notre Dame", 3],
    ["University of Wisconsin-Madison", 5],
    ["Michigan State University", 8],
    ["Indiana University Bloomington", 9],
    ["Kenyon College", 13],
    ["University of Dayton", 14],
    ["Marquette University", 15],
    ["Cedarville University", 17],
    ["Elmhurst College", 18],
    ["Butler University", 19],
    ["Taylor University", 21],
    ["Aurora University", 22],
    ["Loyola University Chicago", 23],
    ["Xavier University", 24],
    ["Illinois State University", 25],
    ["University of Southern Indiana", 26],
    ["DePaul University", 27],
    ["Denison University", 28],
    ["University of Wisconsin-La Crosse", 29],
    ["University of Wisconsin-Eau Claire", 31],
    ["University of Wisconsin-Oshkosh", 35],
    ["Franciscan University of Steubenville", 37],
    ["Hope College", 38],
    ["Ripon College", 39],
    ["Grand Valley State University", 40],
    ["University of Wisconsin-Stevens Point", 41],
    ["Oberlin College", 42],
    ["Eastern Illinois University", 43],
    ["Case Western Reserve University", 44],
    ["Northern Illinois University", 45],
    ["Ball State University", 46],
    ["Bowling Green State University-Main Campus", 48],
    ["University of Wisconsin-Milwaukee", 49],
  ],
  fw: [
    ["University of California, Los Angeles", 1],
    ["University of California, Berkeley", 2],
    ["Stanford University", 3],
    ["University of Southern California", 4],
    ["University of California, Davis", 5],
    ["University of California, Santa Barbara", 7],
    ["University of California, Irvine", 8],
    ["University of California, San Diego", 9],
    ["University of California, Riverside", 10],
    ["University of California, Santa Cruz", 11],
    ["Santa Clara University", 12],
    ["University of Oregon", 13],
    ["Claremont McKenna College", 14],
    ["San Diego State University", 15],
    ["San Francisco State University", 16],
    ["California State University, Long Beach", 17],
    ["California State University-Sacramento", 18],
    ["Loyola Marymount University", 19],
    ["University of Puget Sound", 20],
    ["University of Nevada, Reno", 21],
    ["California Polytechnic State University, San Luis Obispo", 22],
    ["Washington State University", 23],
    ["Chapman University", 25],
    ["University of San Diego", 26],
    ["City College of San Francisco", 27],
    ["Gonzaga University", 28],
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
