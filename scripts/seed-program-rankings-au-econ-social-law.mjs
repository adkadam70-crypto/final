// Australia — EduRank.org citation-based Economics, Liberal Arts & Social
// Sciences, and Law subject rankings, matched against the existing
// catalog only (all 39 rows in each list match cleanly).
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-au-econ-social-law.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const NOTE = 'EduRank.org citation-based subject ranking (research output/citation counts), not an admissions-selectivity metric — programSelectivity is our own derived scale for comparability, not itself a published figure.'
const POOL = 39

const SRC = {
  econ: ['Economics', 'EduRank.org Citation-Based Subject Ranking 2026 — Economics (Australia)', 'https://edurank.org/economics/au/'],
  la: ['Social Sciences', 'EduRank.org Citation-Based Subject Ranking 2026 — Liberal Arts & Social Sciences (Australia)', 'https://edurank.org/liberal-arts/au/'],
  law: ['Law', 'EduRank.org Citation-Based Subject Ranking 2026 — Law (Australia)', 'https://edurank.org/liberal-arts/law/au/'],
}

const DATA = {
  econ: [
    ["University of Sydney", 1],
    ["University of Melbourne", 2],
    ["Australian National University", 3],
    ["University of New South Wales", 4],
    ["University of Queensland", 5],
    ["Monash University", 6],
    ["Griffith University", 7],
    ["Queensland University of Technology", 8],
    ["Deakin University", 9],
    ["University of Technology Sydney", 10],
    ["University of Western Australia", 11],
    ["University of Adelaide", 12],
    ["Macquarie University", 13],
    ["Curtin University", 14],
    ["La Trobe University", 15],
    ["University of Wollongong", 16],
    ["University of South Australia", 17],
    ["University of Newcastle", 18],
    ["RMIT University", 19],
    ["Western Sydney University", 20],
    ["Flinders University", 21],
    ["University of Tasmania", 22],
    ["University of New England", 23],
    ["James Cook University", 24],
    ["University of Canberra", 25],
    ["Swinburne University of Technology", 26],
    ["Charles Sturt University", 27],
    ["University of Southern Queensland", 28],
    ["Murdoch University", 29],
    ["Edith Cowan University", 30],
    ["Victoria University", 31],
    ["Australian Catholic University", 32],
    ["Central Queensland University", 33],
    ["Bond University", 34],
    ["Southern Cross University", 35],
    ["Charles Darwin University", 36],
    ["University of the Sunshine Coast", 37],
    ["Federation University Australia", 38],
    ["University of Notre Dame Australia", 39],
  ],
  la: [
    ["University of Sydney", 1],
    ["University of Melbourne", 2],
    ["Australian National University", 3],
    ["University of New South Wales", 4],
    ["University of Queensland", 5],
    ["Monash University", 6],
    ["Griffith University", 7],
    ["Queensland University of Technology", 8],
    ["Deakin University", 9],
    ["University of Technology Sydney", 10],
    ["University of Western Australia", 11],
    ["University of Adelaide", 12],
    ["Macquarie University", 13],
    ["Curtin University", 14],
    ["La Trobe University", 15],
    ["University of Wollongong", 16],
    ["University of South Australia", 17],
    ["University of Newcastle", 18],
    ["RMIT University", 19],
    ["Western Sydney University", 20],
    ["Flinders University", 21],
    ["University of Tasmania", 22],
    ["University of New England", 23],
    ["James Cook University", 24],
    ["University of Canberra", 25],
    ["Swinburne University of Technology", 26],
    ["Charles Sturt University", 27],
    ["University of Southern Queensland", 28],
    ["Murdoch University", 29],
    ["Edith Cowan University", 30],
    ["Victoria University", 31],
    ["Australian Catholic University", 32],
    ["Central Queensland University", 33],
    ["Bond University", 34],
    ["Southern Cross University", 35],
    ["Charles Darwin University", 36],
    ["University of the Sunshine Coast", 37],
    ["Federation University Australia", 38],
    ["University of Notre Dame Australia", 39],
  ],
  law: [
    ["University of Melbourne", 1],
    ["University of Sydney", 2],
    ["University of Queensland", 3],
    ["University of New South Wales", 4],
    ["Monash University", 5],
    ["Australian National University", 6],
    ["Griffith University", 7],
    ["Deakin University", 8],
    ["Queensland University of Technology", 9],
    ["Macquarie University", 10],
    ["University of Adelaide", 11],
    ["University of Western Australia", 12],
    ["University of Technology Sydney", 13],
    ["La Trobe University", 14],
    ["Curtin University", 15],
    ["RMIT University", 16],
    ["University of Wollongong", 17],
    ["University of Newcastle", 18],
    ["University of South Australia", 19],
    ["Flinders University", 20],
    ["Western Sydney University", 21],
    ["University of Tasmania", 22],
    ["James Cook University", 23],
    ["University of Canberra", 24],
    ["Swinburne University of Technology", 25],
    ["Murdoch University", 26],
    ["Edith Cowan University", 27],
    ["Charles Sturt University", 28],
    ["Australian Catholic University", 29],
    ["University of New England", 30],
    ["Victoria University", 31],
    ["University of Southern Queensland", 32],
    ["Bond University", 33],
    ["Central Queensland University", 34],
    ["Southern Cross University", 35],
    ["University of the Sunshine Coast", 36],
    ["Federation University Australia", 37],
    ["Charles Darwin University", 38],
    ["University of Notre Dame Australia", 39],
  ],
}

let inserted = 0
for (const [key, rows] of Object.entries(DATA)) {
  const [field, source, url] = SRC[key]
  for (const [name, rank] of rows) {
    const r = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'AU'`
    if (r.length === 0) { console.log('not found:', name); continue }
    const id = r[0].id
    const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${id} AND field = ${field} AND "rankSource" = ${source}`
    if (existing.length > 0) continue
    await sql`
      INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
      VALUES (${id}, ${field}, ${rank}, ${source}, ${url}, ${selectivityFromRank(rank, POOL)}, ${NOTE})
    `
    inserted++
  }
}
console.log(`Inserted ${inserted} rows.`)
