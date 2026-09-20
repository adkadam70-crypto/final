// USA — College Factual 2026 Computer Science and Communication & Media
// Studies program rankings, matched by exact name against the existing
// catalog only.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-us-cs-comm-round3.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const NOTE = 'College Factual subject-specific ranking based on graduate outcomes and program quality metrics.'

const SRC = {
  cs: ['Computer Science & IT', 'College Factual 2026 — Best Computer Science Schools', 'https://www.collegefactual.com/majors/computer-information-sciences/computer-science/rankings/top-ranked/', 1091],
  comm: ['Communications & Media', 'College Factual 2026 — Best Communication & Media Studies Schools', 'https://www.collegefactual.com/majors/communication-journalism-media/communication-media-studies/rankings/top-ranked/', 1403],
}

const DATA = {
  cs: [
    ["University of California, Berkeley", 1],
    ["Duke University", 2],
    ["Cornell University", 3],
    ["University of North Carolina at Chapel Hill", 4],
    ["Massachusetts Institute of Technology", 5],
    ["Harvard University", 6],
    ["Stanford University", 7],
    ["University of Maryland, College Park", 8],
    ["University of California, Los Angeles", 9],
    ["California Institute of Technology", 10],
    ["Georgetown University", 11],
    ["Carnegie Mellon University", 12],
    ["University of California, San Diego", 13],
    ["Northwestern University", 14],
    ["University of Pennsylvania", 15],
    ["University of California, Davis", 16],
    ["Washington University in St. Louis", 17],
    ["Tufts University", 18],
    ["Vanderbilt University", 20],
    ["Dartmouth College", 21],
    ["Princeton University", 22],
    ["University of Chicago", 26],
    ["Milwaukee School of Engineering", 27],
    ["Brown University", 28],
    ["Boston College", 29],
    ["University of Southern California", 31],
    ["George Washington University", 32],
    ["Williams College", 34],
    ["University of California, Santa Barbara", 35],
    ["University of Rochester", 37],
    ["Pomona College", 38],
    ["Stony Brook University", 40],
    ["Bowdoin College", 41],
    ["Boston University", 42],
    ["Colgate University", 43],
    ["University of Minnesota Twin Cities", 45],
    ["University of California, Irvine", 46],
    ["San José State University", 47],
    ["Quinnipiac University", 50],
    ["University of California, Santa Cruz", 53],
    ["University of Nebraska-Lincoln", 54],
    ["Lehigh University", 55],
    ["California Polytechnic State University, San Luis Obispo", 56],
    ["Emory University", 57],
    ["Rose-Hulman Institute of Technology", 60],
    ["Wake Forest University", 63],
    ["Amherst College", 65],
    ["Carleton College", 66],
    ["Grinnell College", 71],
    ["Middlebury College", 72],
    ["University of Maryland-Baltimore County", 73],
    ["Southern Methodist University", 77],
    ["University of San Diego", 78],
    ["George Mason University", 79],
    ["Villanova University", 80],
    ["Rochester Institute of Technology", 82],
    ["Rensselaer Polytechnic Institute", 87],
    ["Arizona State University", 89],
    ["University of San Francisco", 90],
    ["Colorado School of Mines", 93],
    ["University of Dayton", 94],
    ["University of California, Riverside", 95],
    ["University of Colorado Boulder", 100],
    ["University of Portland", 101],
    ["University at Buffalo", 102],
    ["Ball State University", 103],
    ["Case Western Reserve University", 104],
    ["Worcester Polytechnic Institute", 108],
  ],
  comm: [
    ["University of North Carolina at Chapel Hill", 1],
    ["Boston College", 2],
    ["Southern Methodist University", 3],
    ["University of Pennsylvania", 5],
    ["University of California, Davis", 6],
    ["University of California, Los Angeles", 9],
    ["University of California, Berkeley", 10],
    ["University of California, Santa Barbara", 11],
    ["Johns Hopkins University", 12],
    ["University of Southern California", 13],
    ["University of Maryland, College Park", 14],
    ["Cornell University", 15],
    ["Stanford University", 16],
    ["James Madison University", 17],
    ["George Mason University", 18],
    ["Wake Forest University", 19],
    ["Northwestern University", 24],
    ["Chapman University", 25],
    ["Clemson University", 26],
    ["University of Arizona", 27],
    ["California Polytechnic State University, San Luis Obispo", 30],
    ["University of Delaware", 31],
    ["University of Florida", 33],
    ["San José State University", 34],
    ["University of Connecticut", 36],
    ["University of Wisconsin-Madison", 37],
    ["Vanderbilt University", 38],
    ["Rutgers University-New Brunswick", 39],
    ["University of Minnesota Twin Cities", 40],
    ["Santa Clara University", 41],
    ["Elon University", 43],
    ["Pepperdine University", 44],
    ["University of Colorado Boulder", 45],
    ["Northeastern University", 46],
    ["Loyola Marymount University", 47],
    ["California State University-Sacramento", 49],
    ["San Diego State University", 50],
    ["San Francisco State University", 51],
    ["University of Dayton", 52],
    ["Baylor University", 54],
    ["American University", 56],
    ["University of Kansas", 57],
    ["Villanova University", 58],
    ["University at Buffalo", 59],
    ["The College of New Jersey", 60],
    ["California State University, Fullerton", 61],
    ["Auburn University", 65],
    ["Illinois State University", 67],
    ["Texas Christian University", 68],
    ["University of Utah", 69],
    ["Indiana University Bloomington", 70],
    ["Marist College", 71],
    ["University of California, San Diego", 73],
    ["University of San Francisco", 77],
    ["University of Massachusetts Amherst", 78],
    ["University of New Hampshire-Main Campus", 80],
    ["University of Arkansas", 81],
    ["University of Georgia", 83],
    ["George Washington University", 84],
    ["Towson University", 87],
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
