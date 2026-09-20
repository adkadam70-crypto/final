// USA — College Factual 2026 Political Science (Texas) and Marketing
// (Rocky Mountains) regional rankings, matched by exact name against the
// existing catalog only.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-us-final-push.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const NOTE = 'College Factual regional subject-specific ranking based on graduate outcomes and program quality metrics.'

const SRC = {
  tx: ['Political Science', 'College Factual 2026 — Best Political Science & Government Schools (Texas)', 'https://www.collegefactual.com/majors/social-sciences/political-science-and-government/rankings/top-ranked/southwest/texas/', 42],
  mkt: ['Marketing', 'College Factual 2026 — Best Marketing Schools (Rocky Mountains Region)', 'https://www.collegefactual.com/majors/business-management-marketing-sales/marketing/rankings/top-ranked/rocky-mountains/', 27],
}

const DATA = {
  tx: [
    ["Rice University", 1],
    ["Southern Methodist University", 4],
    ["Texas Christian University", 5],
    ["Baylor University", 7],
    ["Abilene Christian University", 8],
    ["University of Houston", 9],
    ["University of North Texas", 11],
    ["Texas Tech University", 17],
    ["Trinity University", 21],
    ["Stephen F Austin State University", 23],
    ["Lamar University", 24],
    ["Lone Star College System", 29],
    ["El Centro College", 36],
    ["Midwestern State University", 37],
    ["Southwestern University", 38],
    ["The University of Texas at Tyler", 39],
    ["Texas Southern University", 42],
  ],
  mkt: [
    ["University of Utah", 3],
    ["University of Denver", 4],
    ["Weber State University", 8],
    ["Western Governors University", 10],
    ["Latter-day Saints Business College", 11],
    ["Boise State University", 12],
    ["University of Wyoming", 14],
    ["University of Idaho", 16],
    ["Regis University", 19],
    ["Metropolitan State College of Denver", 21],
    ["College of Western Idaho", 23],
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
