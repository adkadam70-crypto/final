// USA — College Factual 2026 Architecture and Biological & Biomedical
// Sciences program rankings, matched by exact name against the existing
// catalog only.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-us-arch-bio.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const NOTE = 'College Factual subject-specific ranking based on graduate outcomes and program quality metrics.'

const SRC = {
  arch: ['Architecture & Design', 'College Factual 2026 — Best Architecture Schools', 'https://www.collegefactual.com/majors/architecture-and-related-services/general-architecture/architecture/rankings/top-ranked/', 55],
  bio: ['Biology & Life Sciences', 'College Factual 2026 — Best Biological & Biomedical Sciences Schools', 'https://www.collegefactual.com/majors/biological-biomedical-sciences/rankings/top-ranked/', 1903],
}

const DATA = {
  arch: [
    ["Rice University", 5],
    ["University of California, Berkeley", 6],
    ["Lehigh University", 8],
    ["Brown University", 9],
    ["University of Maryland, College Park", 10],
    ["Harvard University", 11],
    ["Princeton University", 13],
    ["University of Notre Dame", 14],
    ["Yale University", 15],
    ["Clemson University", 17],
    ["Carnegie Mellon University", 18],
    ["Washington University in St. Louis", 19],
    ["Auburn University", 20],
    ["University of Florida", 21],
    ["University of Minnesota Twin Cities", 23],
    ["Arizona State University", 24],
    ["California State Polytechnic University-Pomona", 25],
    ["Middlebury College", 26],
    ["Drexel University", 27],
    ["Bowling Green State University-Main Campus", 29],
    ["California State University-Fresno", 30],
    ["University of San Francisco", 31],
    ["Rensselaer Polytechnic Institute", 32],
    ["University of North Carolina at Charlotte", 35],
    ["Texas Tech University", 36],
    ["University at Buffalo", 38],
    ["Kean University", 39],
    ["Mississippi State University", 41],
    ["University of Houston", 42],
    ["Howard University", 43],
    ["Benedictine College", 45],
    ["University of California, Los Angeles", 46],
    ["University of Arkansas", 49],
    ["Ball State University", 50],
  ],
  bio: [
    ["Rice University", 1],
    ["Johns Hopkins University", 5],
    ["San Francisco State University", 7],
    ["Tufts University", 8],
    ["Bowdoin College", 9],
    ["Colby College", 11],
    ["Stanford University", 12],
    ["Stevens Institute of Technology", 13],
    ["Loma Linda University", 14],
    ["Colorado School of Mines", 15],
    ["San José State University", 16],
    ["University of Pennsylvania", 17],
    ["Carnegie Mellon University", 18],
    ["University of Chicago", 19],
    ["Wellesley College", 21],
    ["Davidson College", 22],
    ["Harvard University", 23],
    ["New York University", 25],
    ["Boston College", 26],
    ["Northwestern University", 27],
    ["Butler University", 28],
    ["Duke University", 29],
    ["Lafayette College", 30],
    ["University of California, Santa Barbara", 31],
    ["Wesleyan University", 32],
    ["Hamilton College", 34],
    ["University of Tulsa", 35],
    ["Pomona College", 36],
    ["California State University-Sacramento", 37],
    ["University of Texas Southwestern Medical Center", 40],
    ["University of California, Berkeley", 41],
    ["Cornell University", 44],
    ["Washington University in St. Louis", 45],
    ["University of California, Davis", 47],
    ["University of Wisconsin-Madison", 48],
    ["San Diego State University", 50],
    ["Northeastern University", 52],
    ["Georgetown University", 54],
    ["University of California, San Diego", 55],
    ["Vanderbilt University", 58],
    ["University of California-Merced", 60],
    ["Santa Clara University", 63],
    ["Lehigh University", 66],
    ["California Polytechnic State University, San Luis Obispo", 70],
    ["Dartmouth College", 71],
    ["University of Utah", 73],
    ["University of Maryland, College Park", 74],
    ["California State University, Long Beach", 75],
    ["University of Minnesota Twin Cities", 76],
    ["University of Delaware", 77],
    ["University of California, Los Angeles", 81],
    ["University of Rochester", 82],
    ["Williams College", 83],
    ["Indiana University Bloomington", 84],
    ["Brown University", 85],
    ["Middlebury College", 87],
    ["George Washington University", 91],
    ["Yale University", 92],
    ["California State University, Fullerton", 56],
    ["Skidmore College", 65],
    ["Grinnell College", 88],
    ["California State University-East Bay", 105],
    ["California State University-San Marcos", 112],
    ["Vassar College", 116],
    ["California State Polytechnic University-Pomona", 117],
    ["California State University-Channel Islands", 125],
    ["University of San Francisco", 130],
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
