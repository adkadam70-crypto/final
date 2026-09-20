// USA — College Factual 2026 Political Science & Government regional
// rankings (Middle Atlantic, New England), matched by exact name against
// the existing catalog only.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-us-polisci-regions3.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const NOTE = 'College Factual regional subject-specific ranking based on graduate outcomes and program quality metrics.'

const SRC = {
  ma: ['Political Science', 'College Factual 2026 — Best Political Science & Government Schools (Middle Atlantic Region)', 'https://www.collegefactual.com/majors/social-sciences/political-science-and-government/rankings/top-ranked/middle-atlantic/', 50],
  ne: ['Political Science', 'College Factual 2026 — Best Political Science & Government Schools (New England Region)', 'https://www.collegefactual.com/majors/social-sciences/political-science-and-government/rankings/top-ranked/new-england/', 50],
}

const DATA = {
  ma: [
    ["Georgetown University", 1],
    ["Johns Hopkins University", 2],
    ["University of Pennsylvania", 3],
    ["Colgate University", 5],
    ["Barnard College", 6],
    ["Lafayette College", 7],
    ["Princeton University", 8],
    ["Cornell University", 9],
    ["Hamilton College", 10],
    ["University of Maryland, College Park", 11],
    ["George Washington University", 12],
    ["New York University", 13],
    ["American University", 14],
    ["Bucknell University", 15],
    ["Swarthmore College", 16],
    ["Lehigh University", 18],
    ["Haverford College", 19],
    ["Vassar College", 20],
    ["University of Rochester", 21],
    ["Villanova University", 22],
    ["Yeshiva University", 23],
    ["CUNY Graduate School and University Center", 24],
    ["Fordham University", 26],
    ["Dickinson College", 27],
    ["Franklin and Marshall College", 28],
    ["Stony Brook University", 29],
    ["University of Delaware", 30],
    ["Messiah College", 32],
    ["Gettysburg College", 33],
    ["Syracuse University", 35],
    ["CUNY Hunter College", 36],
    ["The College of New Jersey", 37],
    ["University of Maryland-Baltimore County", 39],
    ["Skidmore College", 40],
    ["Towson University", 41],
    ["Marist College", 42],
    ["Rutgers University-New Brunswick", 43],
    ["CUNY Bernard M Baruch College", 47],
  ],
  ne: [
    ["Harvard University", 1],
    ["Dartmouth College", 2],
    ["Boston College", 3],
    ["Tufts University", 4],
    ["Yale University", 5],
    ["Bowdoin College", 6],
    ["Wesleyan University", 7],
    ["Brown University", 8],
    ["Middlebury College", 9],
    ["Bates College", 10],
    ["Massachusetts Institute of Technology", 11],
    ["Williams College", 12],
    ["Wellesley College", 13],
    ["Amherst College", 14],
    ["Northeastern University", 15],
    ["College of the Holy Cross", 16],
    ["University of Connecticut", 17],
    ["Trinity College", 18],
    ["University of Massachusetts Amherst", 19],
    ["Colby College", 20],
    ["Providence College", 21],
    ["Connecticut College", 22],
    ["Boston University", 23],
    ["Smith College", 24],
    ["Brandeis University", 25],
    ["Fairfield University", 26],
    ["University of Vermont", 27],
    ["Mount Holyoke College", 28],
    ["Bryant University", 29],
    ["University of New Hampshire-Main Campus", 30],
    ["University of Rhode Island", 31],
    ["Stonehill College", 32],
    ["Saint Anselm College", 33],
    ["Quinnipiac University", 34],
    ["Suffolk University", 35],
    ["University of Massachusetts Boston", 36],
    ["Bridgewater State University", 37],
    ["Clark University", 38],
    ["Simmons College", 40],
    ["University of Massachusetts-Lowell", 41],
    ["University of Massachusetts-Dartmouth", 42],
    ["Norwich University", 46],
    ["University of Hartford", 48],
    ["Assumption College", 50],
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
