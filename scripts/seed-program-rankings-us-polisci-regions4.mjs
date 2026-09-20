// USA — College Factual 2026 Political Science & Government regional
// rankings (Southwest, Rocky Mountains, Plains States), matched by exact
// name against the existing catalog only.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-us-polisci-regions4.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const NOTE = 'College Factual regional subject-specific ranking based on graduate outcomes and program quality metrics.'

const SRC = {
  sw: ['Political Science', 'College Factual 2026 — Best Political Science & Government Schools (Southwest Region)', 'https://www.collegefactual.com/majors/social-sciences/political-science-and-government/rankings/top-ranked/southwest/', 50],
  rm: ['Political Science', 'College Factual 2026 — Best Political Science & Government Schools (Rocky Mountains Region)', 'https://www.collegefactual.com/majors/social-sciences/political-science-and-government/rankings/top-ranked/rocky-mountains/', 25],
  ps: ['Political Science', 'College Factual 2026 — Best Political Science & Government Schools (Plains States Region)', 'https://www.collegefactual.com/majors/social-sciences/political-science-and-government/rankings/top-ranked/the-plains-states/', 38],
}

const DATA = {
  sw: [
    ["Rice University", 1],
    ["Southern Methodist University", 4],
    ["University of Tulsa", 5],
    ["Texas Christian University", 6],
    ["Arizona State University", 7],
    ["University of Arizona", 10],
    ["Baylor University", 11],
    ["Abilene Christian University", 13],
    ["University of Houston", 15],
    ["University of North Texas", 17],
    ["Texas Tech University", 24],
    ["Trinity University", 28],
    ["Grand Canyon University", 29],
    ["Stephen F Austin State University", 33],
    ["Lamar University", 34],
    ["Lone Star College System", 39],
    ["El Centro College", 47],
    ["Midwestern State University", 48],
    ["Southwestern University", 49],
  ],
  rm: [
    ["Colorado College", 2],
    ["University of Colorado Boulder", 3],
    ["University of Denver", 4],
    ["University of Utah", 5],
    ["University of Wyoming", 7],
    ["Montana State University", 12],
    ["University of Idaho", 14],
    ["Weber State University", 15],
    ["Boise State University", 17],
    ["University of Northern Colorado", 19],
    ["Metropolitan State College of Denver", 22],
    ["College of Western Idaho", 25],
  ],
  ps: [
    ["Washington University in St. Louis", 1],
    ["University of Minnesota Twin Cities", 2],
    ["Grinnell College", 4],
    ["University of Kansas", 6],
    ["University of Nebraska-Lincoln", 7],
    ["University of Iowa", 8],
    ["St Olaf College", 9],
    ["University of Minnesota-Duluth", 10],
    ["Macalester College", 12],
    ["Truman State University", 13],
    ["Iowa State University", 14],
    ["Simpson College", 16],
    ["Creighton University", 17],
    ["Drake University", 18],
    ["Washburn University", 20],
    ["Hamline University", 22],
    ["Gustavus Adolphus College", 24],
    ["Wichita State University", 30],
    ["South Dakota State University", 31],
    ["Winona State University", 32],
    ["University of Nebraska at Omaha", 33],
    ["Minnesota State University-Mankato", 35],
    ["Fort Hays State University", 38],
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
