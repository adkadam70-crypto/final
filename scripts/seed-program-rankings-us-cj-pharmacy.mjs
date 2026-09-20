// USA — College Factual 2026 Criminal Justice and Pharmacy program
// rankings, matched by exact name against the existing catalog only.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-us-cj-pharmacy.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const NOTE = 'College Factual subject-specific ranking based on graduate outcomes and program quality metrics.'

const SRC = {
  cj: ['Social Sciences', 'College Factual 2026 — Best Criminal Justice Schools', 'https://www.collegefactual.com/majors/protective-security-safety-services/criminal-justice-and-corrections/criminal-justice/rankings/top-ranked/', 250],
  pharm: ['Medicine & Health Sciences', 'College Factual 2026 — Best Pharmacy Schools', 'https://www.collegefactual.com/majors/health-care-professions/pharmacy-pharmaceutical-sciences/pharmacy/rankings/top-ranked/', 147],
}

const DATA = {
  cj: [
    ["University of San Diego", 3],
    ["The College of New Jersey", 4],
    ["Michigan State University", 5],
    ["University of Nevada, Reno", 6],
    ["Arizona State University", 7],
    ["CUNY John Jay College of Criminal Justice", 9],
    ["Virginia Commonwealth University", 11],
    ["Santa Rosa Junior College", 13],
    ["Grand Valley State University", 14],
    ["University of Georgia", 15],
    ["Aurora University", 17],
    ["University of New Haven", 18],
    ["University of Massachusetts-Lowell", 21],
    ["Roger Williams University", 23],
    ["Robert Morris University", 24],
    ["Ferris State University", 25],
    ["Western Illinois University", 26],
    ["College of San Mateo", 30],
    ["University of Louisville", 31],
    ["Norwich University", 37],
    ["Stevenson University", 40],
    ["Grossmont College", 41],
    ["Abilene Christian University", 42],
    ["Marist College", 43],
    ["Salem State University", 44],
    ["Lynn University", 45],
    ["Kean University", 46],
    ["Mt. San Antonio College", 48],
    ["Butte College", 54],
    ["Sacramento City College", 55],
    ["Lake Superior State University", 61],
    ["Broward College", 65],
    ["College of the Desert", 70],
    ["Yuba College", 83],
    ["East Los Angeles College", 96],
    ["Moreno Valley College", 101],
    ["Riverside City College", 125],
    ["Valencia College", 126],
    ["Fresno City College", 138],
  ],
  pharm: [
    ["University of Southern California", 2],
    ["St. Louis College of Pharmacy", 7],
    ["University of Minnesota Twin Cities", 8],
    ["University of Wisconsin-Madison", 9],
    ["University of North Carolina at Chapel Hill", 12],
    ["University of the Pacific", 13],
    ["Samford University", 15],
    ["Rutgers University-New Brunswick", 17],
    ["University of Kansas", 18],
    ["University of Georgia", 19],
    ["Washington State University", 20],
    ["Creighton University", 22],
    ["University of Arizona", 23],
    ["University of California, San Diego", 25],
    ["Butler University", 26],
    ["Shenandoah University", 28],
    ["Belmont University", 29],
    ["Auburn University", 31],
    ["University of Florida", 34],
    ["University at Buffalo", 36],
    ["Temple University", 38],
    ["Regis University", 39],
    ["Oregon State University", 40],
    ["Loma Linda University", 45],
    ["Concordia University Wisconsin", 46],
    ["High Point University", 47],
    ["Duquesne University", 48],
    ["University of Rhode Island", 50],
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
