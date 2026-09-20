// Australia — EduRank.org citation-based Engineering and Business subject
// rankings, matched against the existing catalog only.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-au-eng-biz.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const NOTE = 'EduRank.org citation-based subject ranking (research output/citation counts), not an admissions-selectivity metric — programSelectivity is our own derived scale for comparability, not itself a published figure.'

const SRC = {
  eng: ['Engineering', 'EduRank.org Citation-Based Subject Ranking 2026 — Engineering (Australia)', 'https://edurank.org/engineering/au/', 39],
  biz: ['Business', 'EduRank.org Citation-Based Subject Ranking 2026 — Business (Australia)', 'https://edurank.org/business/au/', 39],
}

const DATA = {
  eng: [
    ["University of New South Wales", 1],
    ["University of Sydney", 2],
    ["University of Melbourne", 3],
    ["University of Queensland", 4],
    ["Monash University", 5],
    ["Australian National University", 6],
    ["University of Adelaide", 7],
    ["University of Western Australia", 8],
    ["Queensland University of Technology", 9],
    ["University of Wollongong", 10],
    ["University of Technology Sydney", 11],
    ["RMIT University", 12],
    ["Curtin University", 13],
    ["Macquarie University", 14],
    ["Griffith University", 15],
    ["University of Newcastle", 16],
    ["Deakin University", 17],
    ["University of South Australia", 18],
    ["Swinburne University of Technology", 19],
    ["University of Tasmania", 20],
    ["La Trobe University", 21],
    ["Flinders University", 22],
    ["Western Sydney University", 23],
    ["James Cook University", 24],
    ["Murdoch University", 25],
    ["Victoria University", 26],
    ["University of Southern Queensland", 27],
    ["University of Canberra", 28],
    ["Edith Cowan University", 29],
    ["Central Queensland University", 31],
    ["Charles Sturt University", 32],
    ["Southern Cross University", 33],
    ["Charles Darwin University", 34],
    ["Federation University Australia", 35],
    ["University of the Sunshine Coast", 36],
    ["Australian Catholic University", 37],
    ["Bond University", 38],
    ["University of Notre Dame Australia", 39],
  ],
  biz: [
    ["University of New South Wales", 1],
    ["University of Melbourne", 2],
    ["University of Sydney", 3],
    ["University of Queensland", 4],
    ["Monash University", 5],
    ["Australian National University", 6],
    ["Queensland University of Technology", 7],
    ["Griffith University", 8],
    ["University of Technology Sydney", 9],
    ["Deakin University", 10],
    ["University of Western Australia", 11],
    ["Curtin University", 12],
    ["RMIT University", 13],
    ["University of Adelaide", 14],
    ["Macquarie University", 15],
    ["University of Wollongong", 16],
    ["University of Newcastle", 17],
    ["University of South Australia", 18],
    ["La Trobe University", 19],
    ["Western Sydney University", 20],
    ["Swinburne University of Technology", 21],
    ["University of Tasmania", 22],
    ["Flinders University", 23],
    ["University of Canberra", 24],
    ["Edith Cowan University", 25],
    ["Victoria University", 26],
    ["James Cook University", 27],
    ["University of Southern Queensland", 28],
    ["Central Queensland University", 29],
    ["Murdoch University", 31],
    ["Charles Sturt University", 32],
    ["Bond University", 33],
    ["Southern Cross University", 34],
    ["Australian Catholic University", 35],
    ["University of the Sunshine Coast", 36],
    ["Federation University Australia", 37],
    ["Charles Darwin University", 38],
    ["University of Notre Dame Australia", 39],
  ],
}

let inserted = 0
for (const [key, rows] of Object.entries(DATA)) {
  const [field, source, url, pool] = SRC[key]
  for (const [name, rank] of rows) {
    const r = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'AU'`
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
