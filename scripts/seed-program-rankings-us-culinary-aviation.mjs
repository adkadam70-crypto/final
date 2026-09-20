// USA — College Factual 2026 Culinary Arts and Air Transportation program
// rankings, matched by exact name against the existing catalog only.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-us-culinary-aviation.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const NOTE = 'College Factual subject-specific ranking based on graduate outcomes and program quality metrics.'

const SRC = {
  culinary: ['Business', 'College Factual 2026 — Best Culinary Arts Schools', 'https://www.collegefactual.com/majors/personal-and-culinary-services/culinary-arts/rankings/top-ranked/', 445],
  air: ['Engineering', 'College Factual 2026 — Best Air Transportation Schools', 'https://www.collegefactual.com/majors/transportation-materials-handling/air-transportation/rankings/top-ranked/', 300],
}

const DATA = {
  culinary: [
    ["Drexel University", 1],
    ["Boston University", 3],
    ["Madison Area Technical College", 4],
    ["Fox Valley Technical College", 5],
    ["Santa Rosa Junior College", 7],
    ["El Centro College", 15],
    ["Chippewa Valley Technical College", 16],
    ["Miami Dade College", 18],
    ["Lee College", 24],
    ["Clover Park Technical College", 27],
    ["Hennepin Technical College", 28],
    ["South Georgia Technical College", 29],
    ["Renton Technical College", 32],
    ["College of DuPage", 33],
    ["Indian River State College", 35],
    ["National Louis University", 38],
    ["Orange Coast College", 39],
    ["Cuesta College", 41],
    ["Southern Crescent Technical College", 42],
    ["Diablo Valley College", 44],
    ["Waukesha County Technical College", 49],
    ["Milwaukee Area Technical College", 69],
    ["Saint Paul College", 84],
    ["Valencia College", 89],
  ],
  air: [
    ["San José State University", 2],
    ["Baylor University", 4],
    ["Minnesota State University-Mankato", 5],
    ["South Dakota State University", 6],
    ["Montana State University", 8],
    ["California Baptist University", 10],
    ["University of Nebraska at Omaha", 12],
    ["Louisiana Tech University", 13],
    ["Arizona State University", 14],
    ["Auburn University", 17],
    ["Liberty University", 18],
    ["Polk State College", 20],
    ["Middle Tennessee State University", 25],
    ["Orange Coast College", 27],
    ["Cypress College", 30],
    ["Lewis University", 32],
    ["Vermont Technical College", 33],
    ["San Diego Miramar College", 34],
    ["University of North Texas", 36],
    ["Southern Illinois University Carbondale", 37],
    ["Miami Dade College", 42],
    ["Parkland College", 49],
    ["University of Memphis", 50],
    ["Florida Institute of Technology", 53],
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
