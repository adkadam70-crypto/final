// USA — College Factual 2026 Mathematics regional rankings (Great Lakes,
// Far Western, Middle Atlantic, New England), matched by exact name
// against the existing catalog only.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-us-math-regions.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const NOTE = 'College Factual regional subject-specific ranking based on graduate outcomes and program quality metrics.'

const SRC = {
  gl: ['Mathematics & Statistics', 'College Factual 2026 — Best Mathematics Schools (Great Lakes Region)', 'https://www.collegefactual.com/majors/mathematics-and-statistics/mathematics/rankings/top-ranked/great-lakes/', 50],
  fw: ['Mathematics & Statistics', 'College Factual 2026 — Best Mathematics Schools (Far Western US Region)', 'https://www.collegefactual.com/majors/mathematics-and-statistics/mathematics/rankings/top-ranked/far-western-us/', 40],
  ma: ['Mathematics & Statistics', 'College Factual 2026 — Best Mathematics Schools (Middle Atlantic Region)', 'https://www.collegefactual.com/majors/mathematics-and-statistics/mathematics/rankings/top-ranked/middle-atlantic/', 50],
  ne: ['Mathematics & Statistics', 'College Factual 2026 — Best Mathematics Schools (New England Region)', 'https://www.collegefactual.com/majors/mathematics-and-statistics/mathematics/rankings/top-ranked/new-england/', 37],
}

const DATA = {
  gl: [
    ["Northwestern University", 1],
    ["University of Chicago", 2],
    ["Case Western Reserve University", 3],
    ["University of Notre Dame", 4],
    ["University of Wisconsin-Madison", 5],
    ["Denison University", 7],
    ["Xavier University", 8],
    ["Kenyon College", 10],
    ["University of Wisconsin-River Falls", 16],
    ["Oakland University", 17],
    ["Indiana University Bloomington", 18],
    ["Dominican University", 19],
    ["Aurora University", 20],
    ["Michigan State University", 21],
    ["DePaul University", 22],
    ["Western Illinois University", 23],
    ["Illinois State University", 24],
    ["Youngstown State University", 25],
    ["Southern Illinois University Edwardsville", 27],
    ["University of Wisconsin-Oshkosh", 28],
    ["Oberlin College", 30],
    ["Franciscan University of Steubenville", 33],
    ["University of Wisconsin-Eau Claire", 34],
    ["University of Toledo", 36],
    ["Bowling Green State University-Main Campus", 37],
    ["University of Wisconsin-Whitewater", 38],
    ["Ball State University", 40],
    ["University of Wisconsin-Milwaukee", 41],
    ["Carthage College", 42],
    ["University of Wisconsin-Stevens Point", 44],
    ["Northern Illinois University", 45],
    ["University of Southern Indiana", 46],
    ["Grand Valley State University", 47],
    ["Wright State University-Main Campus", 49],
    ["Indiana State University", 50],
  ],
  fw: [
    ["University of California, Los Angeles", 1],
    ["University of California, Berkeley", 3],
    ["University of California, San Diego", 4],
    ["University of Southern California", 5],
    ["University of California, Santa Barbara", 6],
    ["University of California, Davis", 7],
    ["Santa Clara University", 8],
    ["University of California, Irvine", 9],
    ["University of California, Santa Cruz", 10],
  ],
  ma: [
    ["Johns Hopkins University", 1],
    ["Cornell University", 2],
    ["Georgetown University", 3],
    ["University of Pennsylvania", 4],
    ["Lehigh University", 6],
    ["Lafayette College", 7],
    ["Princeton University", 8],
    ["Carnegie Mellon University", 9],
    ["University of Maryland, College Park", 10],
    ["Swarthmore College", 11],
    ["New York University", 12],
    ["Franklin and Marshall College", 13],
    ["Stevens Institute of Technology", 15],
    ["Hamilton College", 16],
    ["Haverford College", 17],
    ["Skidmore College", 18],
    ["CUNY Bernard M Baruch College", 20],
    ["Villanova University", 21],
    ["Yeshiva University", 22],
    ["University of Rochester", 23],
    ["Rutgers University-New Brunswick", 24],
    ["University of Maryland-Baltimore County", 25],
    ["Vassar College", 26],
    ["CUNY Brooklyn College", 28],
    ["Rensselaer Polytechnic Institute", 29],
    ["Allegheny College", 30],
    ["Fordham University", 32],
    ["St. Lawrence University", 33],
    ["Bryn Mawr College", 35],
    ["Drexel University", 36],
    ["Lycoming College", 37],
    ["University at Buffalo", 38],
    ["The College of New Jersey", 39],
    ["CUNY Graduate School and University Center", 40],
    ["Howard University", 41],
    ["Hofstra University", 42],
    ["University of Delaware", 43],
    ["Rowan University", 44],
    ["Towson University", 45],
    ["Stony Brook University", 47],
    ["Touro College", 48],
    ["New Jersey Institute of Technology", 49],
    ["Temple University", 50],
  ],
  ne: [
    ["Dartmouth College", 1],
    ["Massachusetts Institute of Technology", 2],
    ["Yale University", 3],
    ["Harvard University", 4],
    ["Tufts University", 5],
    ["Brown University", 6],
    ["Williams College", 7],
    ["Middlebury College", 8],
    ["Boston College", 9],
    ["Amherst College", 10],
    ["Bowdoin College", 11],
    ["Bates College", 12],
    ["Wesleyan University", 13],
    ["Wellesley College", 14],
    ["Quinnipiac University", 15],
    ["Worcester Polytechnic Institute", 16],
    ["Trinity College", 17],
    ["University of New Hampshire-Main Campus", 18],
    ["Sacred Heart University", 19],
    ["Northeastern University", 20],
    ["Boston University", 21],
    ["University of Vermont", 22],
    ["College of the Holy Cross", 23],
    ["Smith College", 24],
    ["University of Connecticut", 25],
    ["University of Massachusetts Amherst", 26],
    ["University of Rhode Island", 27],
    ["Vermont Technical College", 28],
    ["University of Massachusetts-Lowell", 30],
    ["Bridgewater State University", 31],
    ["Lesley University", 33],
    ["University of Massachusetts Boston", 37],
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
