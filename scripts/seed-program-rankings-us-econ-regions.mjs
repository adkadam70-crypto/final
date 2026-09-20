// USA — College Factual 2026 Economics regional rankings (Plains States,
// Rocky Mountains), matched by exact name against the existing catalog
// only.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-us-econ-regions.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const NOTE = 'College Factual regional subject-specific ranking based on graduate outcomes and program quality metrics.'

const SRC = {
  ps: ['Economics', 'College Factual 2026 — Best Economics Schools (Plains States Region)', 'https://www.collegefactual.com/majors/social-sciences/economics/rankings/top-ranked/the-plains-states/', 31],
  rm: ['Economics', 'College Factual 2026 — Best Economics Schools (Rocky Mountains Region)', 'https://www.collegefactual.com/majors/social-sciences/economics/rankings/top-ranked/rocky-mountains/', 40],
}

const DATA = {
  ps: [
    ["Washington University in St. Louis", 1],
    ["University of Minnesota Twin Cities", 2],
    ["Carleton College", 4],
    ["Grinnell College", 5],
    ["University of Iowa", 7],
    ["Macalester College", 8],
    ["St Olaf College", 12],
    ["Iowa State University", 14],
    ["Drake University", 15],
    ["Truman State University", 16],
    ["Lindenwood University", 17],
    ["University of Nebraska-Lincoln", 18],
    ["Creighton University", 20],
    ["Gustavus Adolphus College", 21],
    ["University of Kansas", 22],
    ["Wichita State University", 23],
    ["Minnesota State University-Mankato", 24],
    ["University of Minnesota-Duluth", 25],
    ["Saint Cloud State University", 28],
    ["University of Nebraska at Omaha", 29],
    ["Fort Hays State University", 30],
  ],
  rm: [
    ["Colorado College", 2],
    ["University of Utah", 3],
    ["Colorado School of Mines", 4],
    ["University of Colorado Boulder", 5],
    ["University of Denver", 7],
    ["University of Wyoming", 9],
    ["Weber State University", 12],
    ["Montana State University", 14],
    ["Boise State University", 15],
    ["University of Northern Colorado", 16],
    ["Fort Lewis College", 18],
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
