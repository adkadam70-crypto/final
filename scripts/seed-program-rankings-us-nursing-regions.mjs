// USA — College Factual 2026 Nursing program rankings (Southeast, Great
// Lakes, Middle Atlantic, Plains States regions), filed under Medicine &
// Health Sciences, matched by exact name against the existing catalog only.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-us-nursing-regions.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const NOTE = 'College Factual regional Nursing program ranking, filed under Medicine & Health Sciences.'
const FIELD = 'Medicine & Health Sciences'

const SRC = {
  se: ['College Factual 2026 — Best Nursing Schools (Southeast Region)', 'https://www.collegefactual.com/majors/health-care-professions/nursing/rankings/top-ranked/southeast/', 50],
  gl: ['College Factual 2026 — Best Nursing Schools (Great Lakes Region)', 'https://www.collegefactual.com/majors/health-care-professions/nursing/rankings/top-ranked/great-lakes/', 50],
  ma: ['College Factual 2026 — Best Nursing Schools (Middle Atlantic Region)', 'https://www.collegefactual.com/majors/health-care-professions/nursing/rankings/top-ranked/middle-atlantic/', 50],
  ps: ['College Factual 2026 — Best Nursing Schools (Plains States Region)', 'https://www.collegefactual.com/majors/health-care-professions/nursing/rankings/top-ranked/the-plains-states/', 135],
}

const DATA = {
  se: [
    ["Emory University", 1],
    ["Vanderbilt University", 2],
    ["Wake Forest University", 3],
    ["Duke University", 4],
    ["University of Florida", 5],
    ["University of Miami", 6],
    ["George Mason University", 7],
    ["Valencia College", 8],
    ["James Madison University", 10],
    ["Clemson University", 11],
    ["Broward College", 12],
    ["Florida International University", 13],
    ["University of North Carolina at Chapel Hill", 18],
    ["University of North Carolina at Charlotte", 19],
    ["Miami Dade College", 20],
    ["Florida State University", 21],
    ["Virginia Commonwealth University", 25],
    ["University of Alabama at Birmingham", 26],
    ["University of Central Florida", 27],
    ["East Carolina University", 28],
    ["Kennesaw State University", 30],
    ["Auburn University", 31],
    ["Samford University", 32],
    ["University of North Carolina at Greensboro", 34],
    ["Southern Crescent Technical College", 35],
    ["Polk State College", 36],
    ["University of Kentucky", 38],
    ["Randolph-Macon College", 40],
    ["Palm Beach State College", 43],
    ["Spring Hill College", 44],
    ["University of Arkansas", 45],
    ["Elon University", 46],
    ["Daytona State College", 48],
    ["Gaston College", 49],
  ],
  gl: [
    ["University of Wisconsin-Madison", 4],
    ["Loyola University Chicago", 5],
    ["Illinois State University", 7],
    ["Case Western Reserve University", 9],
    ["Marquette University", 10],
    ["Michigan State University", 11],
    ["Southern Illinois University Edwardsville", 12],
    ["College of Lake County", 14],
    ["Gateway Technical College", 15],
    ["Lewis University", 18],
    ["University of Toledo", 19],
    ["Moraine Park Technical College", 20],
    ["University of Southern Indiana", 21],
    ["University of Wisconsin-Eau Claire", 22],
    ["Xavier University", 25],
    ["University of Dayton", 27],
    ["Fox Valley Technical College", 28],
    ["Harper College", 30],
    ["University of Wisconsin-Oshkosh", 33],
    ["Schoolcraft College", 34],
    ["Joliet Junior College", 35],
    ["Chippewa Valley Technical College", 36],
    ["Northern Illinois University", 37],
    ["Elmhurst College", 39],
    ["Wayne State University", 40],
    ["Southern Illinois University Carbondale", 41],
    ["Aurora University", 44],
    ["Bradley University", 45],
    ["Carroll University", 46],
    ["Grand Valley State University", 47],
    ["Madison Area Technical College", 49],
  ],
  ma: [
    ["University of Pennsylvania", 2],
    ["Stony Brook University", 4],
    ["CUNY Graduate School and University Center", 5],
    ["Johns Hopkins University", 6],
    ["New York University", 7],
    ["Georgetown University", 9],
    ["University of Delaware", 12],
    ["William Paterson University of New Jersey", 13],
    ["Rutgers University-New Brunswick", 14],
    ["Hofstra University", 15],
    ["CUNY Hunter College", 16],
    ["University of Scranton", 18],
    ["George Washington University", 20],
    ["University at Buffalo", 21],
    ["Towson University", 22],
    ["Adelphi University", 23],
    ["Drexel University", 26],
    ["CUNY Lehman College", 27],
    ["The College of New Jersey", 28],
    ["Villanova University", 29],
    ["Temple University", 32],
    ["Monmouth University", 33],
    ["Thomas Jefferson University", 34],
    ["Siena College", 35],
    ["Rutgers University-Camden", 41],
    ["Farmingdale State College", 43],
    ["Saint Vincent College", 44],
    ["Montclair State University", 48],
    ["Rowan University", 50],
  ],
  ps: [
    ["University of Minnesota Twin Cities", 2],
    ["University of Kansas", 3],
    ["Creighton University", 6],
    ["University of Iowa", 7],
    ["Bellevue University", 8],
    ["Winona State University", 9],
    ["Capella University", 12],
    ["Minnesota State University-Mankato", 13],
    ["Iowa State University", 16],
    ["Rochester Community and Technical College", 19],
    ["Concordia University-Saint Paul", 24],
    ["Washburn University", 26],
    ["Luther College", 29],
    ["Walden University", 31],
    ["Truman State University", 32],
    ["Fort Hays State University", 33],
    ["Augsburg College", 37],
    ["Saint Cloud State University", 38],
    ["St Olaf College", 42],
  ],
}

let inserted = 0
for (const [key, rows] of Object.entries(DATA)) {
  const [source, url, pool] = SRC[key]
  for (const [name, rank] of rows) {
    const r = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'US'`
    if (r.length === 0) { console.log('not found:', name); continue }
    const id = r[0].id
    const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${id} AND field = ${FIELD} AND "rankSource" = ${source}`
    if (existing.length > 0) continue
    await sql`
      INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
      VALUES (${id}, ${FIELD}, ${rank}, ${source}, ${url}, ${selectivityFromRank(rank, pool)}, ${NOTE})
    `
    inserted++
  }
}
console.log(`Inserted ${inserted} rows.`)
