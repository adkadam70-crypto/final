// Program-specific rankings for Australia, round 2 — adds Medicine and
// Psychology (beyond the original Business/CS/Engineering pass), sourced
// from THE's Australia-specific subject guides, same convention as
// seed-overall-rankings-au.mjs and the original program-rankings pass.
// These two tables cover essentially the entire real Australian
// university landscape (37/36 of ~39), so this is close to complete.
//
// Name mapping notes: THE's list uses "Adelaide University" (the 2024
// merger of the University of Adelaide + University of South Australia)
// and "UNSW Sydney" — mapped to the catalog's existing "University of
// Adelaide" and "University of New South Wales" rows, the same
// institutions under their prior/catalog names.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-au-round2.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank) {
  return Math.max(15, Math.min(99, Math.round(100 - (rank - 1) * 1.1)))
}

const CATEGORIES = [
  {
    field: 'Medicine & Health Sciences',
    source: 'Times Higher Education — Best Universities in Australia for Medicine 2026',
    url: 'https://www.timeshighereducation.com/student/best-universities/best-universities-australia-medicine-degrees',
    entries: [
      { name: 'University of Melbourne', rank: 1 },
      { name: 'Monash University', rank: 2 },
      { name: 'University of Sydney', rank: 3 },
      { name: 'University of Queensland', rank: 4 },
      { name: 'University of New South Wales', rank: 5 },
      { name: 'University of Adelaide', rank: 6 },
      { name: 'Australian National University', rank: 6 },
      { name: 'Macquarie University', rank: 8 },
      { name: 'University of Western Australia', rank: 8 },
      { name: 'University of Technology Sydney', rank: 8 },
      { name: 'La Trobe University', rank: 11 },
      { name: 'Deakin University', rank: 12 },
      { name: 'Queensland University of Technology', rank: 12 },
      { name: 'Flinders University', rank: 14 },
      { name: 'University of Newcastle', rank: 14 },
      { name: 'Western Sydney University', rank: 14 },
      { name: 'Australian Catholic University', rank: 17 },
      { name: 'Bond University', rank: 17 },
      { name: 'Curtin University', rank: 17 },
      { name: 'Griffith University', rank: 17 },
      { name: 'Murdoch University', rank: 17 },
      { name: 'University of Wollongong', rank: 17 },
      { name: 'Central Queensland University', rank: 23 },
      { name: 'Edith Cowan University', rank: 23 },
      { name: 'Federation University Australia', rank: 23 },
      { name: 'James Cook University', rank: 23 },
      { name: 'RMIT University', rank: 23 },
      { name: 'University of Tasmania', rank: 23 },
      { name: 'Swinburne University of Technology', rank: 29 },
      { name: 'University of Canberra', rank: 29 },
      { name: 'University of Southern Queensland', rank: 29 },
      { name: 'University of the Sunshine Coast', rank: 29 },
      { name: 'Victoria University', rank: 29 },
      { name: 'Charles Darwin University', rank: 34 },
      { name: 'Charles Sturt University', rank: 34 },
      { name: 'Southern Cross University', rank: 36 },
      { name: 'University of Notre Dame Australia', rank: 36 },
    ],
  },
  {
    field: 'Psychology',
    source: 'Times Higher Education — Best Universities in Australia for Psychology 2026',
    url: 'https://www.timeshighereducation.com/student/best-universities/best-universities-psychology-degrees-australia',
    entries: [
      { name: 'University of Melbourne', rank: 1 },
      { name: 'University of Queensland', rank: 2 },
      { name: 'University of Sydney', rank: 3 },
      { name: 'University of New South Wales', rank: 4 },
      { name: 'Monash University', rank: 5 },
      { name: 'Macquarie University', rank: 6 },
      { name: 'Australian National University', rank: 7 },
      { name: 'University of Western Australia', rank: 7 },
      { name: 'Australian Catholic University', rank: 9 },
      { name: 'University of Adelaide', rank: 10 },
      { name: 'Curtin University', rank: 10 },
      { name: 'Deakin University', rank: 12 },
      { name: 'Flinders University', rank: 12 },
      { name: 'La Trobe University', rank: 12 },
      { name: 'Griffith University', rank: 15 },
      { name: 'Queensland University of Technology', rank: 15 },
      { name: 'Swinburne University of Technology', rank: 15 },
      { name: 'University of Wollongong', rank: 15 },
      { name: 'RMIT University', rank: 19 },
      { name: 'Victoria University', rank: 19 },
      { name: 'Central Queensland University', rank: 21 },
      { name: 'Edith Cowan University', rank: 21 },
      { name: 'Murdoch University', rank: 21 },
      { name: 'Southern Cross University', rank: 21 },
      { name: 'University of Notre Dame Australia', rank: 21 },
      { name: 'University of Newcastle', rank: 21 },
      { name: 'University of Southern Queensland', rank: 21 },
      { name: 'University of Tasmania', rank: 21 },
      { name: 'University of Technology Sydney', rank: 21 },
      { name: 'Western Sydney University', rank: 21 },
      { name: 'Bond University', rank: 31 },
      { name: 'James Cook University', rank: 31 },
      { name: 'University of Canberra', rank: 31 },
      { name: 'University of the Sunshine Coast', rank: 31 },
      { name: 'Charles Sturt University', rank: 35 },
      { name: 'Federation University Australia', rank: 35 },
    ],
  },
]

let totalInserted = 0
let totalSkipped = []

for (const category of CATEGORIES) {
  for (const entry of category.entries) {
    const rows = await sql`SELECT id FROM universities WHERE name = ${entry.name} AND country = 'AU'`
    if (rows.length === 0) {
      totalSkipped.push(`${entry.name} (${category.field})`)
      continue
    }
    const universityId = rows[0].id
    const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${universityId} AND field = ${category.field} AND "rankSource" = ${category.source}`
    if (existing.length > 0) continue

    await sql`
      INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
      VALUES (
        ${universityId}, ${category.field}, ${entry.rank}, ${category.source}, ${category.url},
        ${selectivityFromRank(entry.rank)}, null
      )
    `
    totalInserted++
  }
}

console.log(`Inserted ${totalInserted} program-ranking rows across ${CATEGORIES.length} categories.`)
if (totalSkipped.length) console.log(`Could not match (not in catalog): ${totalSkipped.join(', ')}`)
