// USA — College Factual 2026 Mathematics program rankings (National +
// Southeast region), matched by exact name against the existing catalog
// only.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-us-math-round2.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const NOTE = 'College Factual subject-specific ranking based on graduate outcomes and program quality metrics.'

const SRC = {
  nat: ['Mathematics & Statistics', 'College Factual 2026 — Best Mathematics Schools', 'https://www.collegefactual.com/majors/mathematics-and-statistics/mathematics/rankings/top-ranked/', 283],
  se: ['Mathematics & Statistics', 'College Factual 2026 — Best Mathematics Schools (Southeast Region)', 'https://www.collegefactual.com/majors/mathematics-and-statistics/mathematics/rankings/top-ranked/southeast/', 50],
}

const DATA = {
  nat: [
    ["Johns Hopkins University", 1],
    ["Dartmouth College", 2],
    ["Stanford University", 3],
    ["Massachusetts Institute of Technology", 4],
    ["Vanderbilt University", 5],
    ["Duke University", 6],
    ["Cornell University", 7],
    ["San José State University", 8],
    ["Northwestern University", 9],
    ["Yale University", 10],
    ["Georgetown University", 11],
    ["Harvard University", 12],
    ["University of Pennsylvania", 14],
    ["University of North Carolina at Chapel Hill", 16],
    ["Tufts University", 17],
    ["Lehigh University", 18],
    ["University of Chicago", 19],
    ["Wake Forest University", 20],
    ["Case Western Reserve University", 21],
    ["Brown University", 23],
    ["Williams College", 24],
    ["University of Notre Dame", 25],
    ["Lafayette College", 26],
    ["Carleton College", 27],
    ["Middlebury College", 28],
    ["Texas Christian University", 29],
    ["University of Richmond", 30],
    ["Princeton University", 31],
    ["Carnegie Mellon University", 32],
    ["Boston College", 33],
    ["University of Maryland, College Park", 34],
    ["Davidson College", 35],
    ["University of Denver", 36],
    ["Amherst College", 37],
    ["Swarthmore College", 38],
    ["Bowdoin College", 39],
    ["Washington and Lee University", 40],
    ["New York University", 41],
    ["Franklin and Marshall College", 42],
    ["University of Wisconsin-Madison", 43],
    ["Loyola Marymount University", 45],
    ["Washington University in St. Louis", 47],
    ["Bates College", 48],
    ["Wesleyan University", 49],
    ["Wellesley College", 50],
    ["Worcester Polytechnic Institute", 59],
    ["Hamilton College", 64],
    ["Southern Methodist University", 76],
    ["University of Minnesota Twin Cities", 78],
    ["University of Southern California", 81],
    ["Northeastern University", 82],
    ["University of California, Los Angeles", 85],
    ["Macalester College", 91],
    ["Villanova University", 95],
    ["University of Florida", 96],
    ["Boston University", 99],
    ["University of Rochester", 106],
    ["University of California, San Diego", 107],
    ["Rice University", 108],
    ["Rutgers University-New Brunswick", 110],
    ["University of California, Santa Barbara", 111],
    ["University of California, Irvine", 114],
    ["University of Iowa", 118],
    ["University of California, Berkeley", 123],
    ["St Olaf College", 125],
    ["University of California, Davis", 129],
    ["University of Arizona", 130],
  ],
  se: [
    ["Vanderbilt University", 1],
    ["Duke University", 2],
    ["University of North Carolina at Chapel Hill", 3],
    ["Wake Forest University", 4],
    ["University of Richmond", 6],
    ["Davidson College", 7],
    ["Washington and Lee University", 8],
    ["Furman University", 12],
    ["Rhodes College", 13],
    ["Centre College", 15],
    ["University of Florida", 16],
    ["University of Central Florida", 18],
    ["Florida International University", 19],
    ["Berry College", 20],
    ["James Madison University", 22],
    ["Clemson University", 23],
    ["West Virginia University", 24],
    ["Christopher Newport University", 25],
    ["University of Arkansas", 28],
    ["University of Georgia", 31],
    ["George Mason University", 32],
    ["Mississippi State University", 33],
    ["Emory University", 35],
    ["Louisiana Tech University", 37],
    ["Florida State University", 38],
    ["Spelman College", 39],
    ["Murray State University", 40],
    ["Auburn University", 42],
    ["University of Kentucky", 43],
    ["Old Dominion University", 45],
    ["Appalachian State University", 47],
    ["University of North Carolina at Charlotte", 48],
    ["Middle Tennessee State University", 49],
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
