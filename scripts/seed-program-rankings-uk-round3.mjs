// Program-specific rankings for the UK, round 3 — targets the 35 UK
// universities that had ZERO program-ranking rows at all (verified via a
// LEFT JOIN against programRankings before this script was written), mostly
// smaller/specialist institutions round 1-2's Business/CS/Engineering/
// Medicine/Law/Psychology/Architecture categories never touched: teaching-
// focused universities (education, health), specialist arts/design schools,
// music conservatoires, and one agricultural/area-studies specialist (SOAS).
//
// Real subject tables from The Complete University Guide 2027, fetched
// directly (see each category's url). Each university mapped only to a
// field already present in its own universities.academicFields — e.g. a
// music conservatoire's Music-table rank maps to 'Arts' (its tagged field),
// not to a field it doesn't actually offer.
//
// Not every zero-coverage university appears here: Glasgow School of Art
// isn't listed in the Art & Design table itself (assessed differently /
// not covered under that exact table), and several teaching-focused
// universities' OTHER tagged fields (their Business/Engineering/Comms
// programs) aren't covered by the 6 subject tables researched this round —
// left for a future round rather than guessed at.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-uk-round3.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank) {
  return Math.max(15, Math.min(99, Math.round(100 - (rank - 1) * 1.1)))
}

const CATEGORIES = [
  {
    field: 'Education',
    source: 'The Complete University Guide 2027 — Education subject table',
    url: 'https://www.thecompleteuniversityguide.co.uk/league-tables/rankings/education',
    entries: [
      { name: "St Mary's University, Twickenham", rank: 28 },
      { name: 'Edge Hill University', rank: 31 },
      { name: 'University of Chichester', rank: 39 },
      { name: 'University of Hull', rank: 42 },
      { name: 'University of Cumbria', rank: 52 },
      { name: 'Bath Spa University', rank: 59 },
      { name: 'Cardiff Metropolitan University', rank: 61 },
      { name: 'University of Worcester', rank: 64 },
      { name: 'University of Chester', rank: 69 },
      { name: 'Canterbury Christ Church University', rank: 73 },
    ],
  },
  {
    field: 'Agriculture & Natural Resources',
    source: 'The Complete University Guide 2027 — Agriculture and Forestry subject table',
    url: 'https://www.thecompleteuniversityguide.co.uk/league-tables/rankings/agriculture-and-forestry',
    entries: [
      { name: 'Aberystwyth University', rank: 3 },
      { name: 'Harper Adams University', rank: 5 },
      { name: 'Royal Agricultural University', rank: 15 },
    ],
  },
  {
    field: 'Arts',
    source: 'The Complete University Guide 2027 — Art and Design subject table',
    url: 'https://www.thecompleteuniversityguide.co.uk/league-tables/rankings/art-and-design',
    entries: [
      { name: 'Arts University Bournemouth', rank: 24 },
      { name: 'Norwich University of the Arts', rank: 39 },
      { name: 'Leeds Arts University', rank: 56 },
      { name: 'University of Derby', rank: 59 },
      { name: 'University for the Creative Arts', rank: 69 },
      { name: 'Arts University Plymouth', rank: 74 },
    ],
  },
  {
    field: 'Architecture & Design',
    source: 'The Complete University Guide 2027 — Art and Design subject table',
    url: 'https://www.thecompleteuniversityguide.co.uk/league-tables/rankings/art-and-design',
    entries: [
      { name: 'Cardiff Metropolitan University', rank: 46 },
      { name: 'University of the West of England, Bristol', rank: 31 },
    ],
  },
  {
    field: 'Arts',
    source: 'The Complete University Guide 2027 — Music subject table',
    url: 'https://www.thecompleteuniversityguide.co.uk/league-tables/rankings/music',
    entries: [
      { name: 'Royal Academy of Music', rank: 10 },
      { name: 'Royal College of Music', rank: 13 },
      { name: 'Guildhall School of Music and Drama', rank: 18 },
      { name: 'Royal Conservatoire of Scotland', rank: 24 },
      { name: 'Trinity Laban Conservatoire of Music and Dance', rank: 29 },
      { name: 'Royal Northern College of Music', rank: 35 },
    ],
  },
  {
    field: 'Medicine & Health Sciences',
    source: 'The Complete University Guide 2027 — Medicine subject table',
    url: 'https://www.thecompleteuniversityguide.co.uk/league-tables/rankings/medicine',
    entries: [
      { name: 'Keele University', rank: 21 },
      { name: 'University of Sunderland', rank: 35 },
      { name: 'Edge Hill University', rank: 38 },
    ],
  },
  {
    field: 'Computer Science & IT',
    source: 'The Complete University Guide 2027 — Computer Science subject table',
    url: 'https://www.thecompleteuniversityguide.co.uk/league-tables/rankings/computer-science',
    entries: [
      { name: 'Staffordshire University', rank: 63 },
      { name: 'Teesside University', rank: 73 },
      { name: 'University of South Wales', rank: 92 },
    ],
  },
  {
    field: 'Social Sciences',
    source: 'The Complete University Guide 2027 — Anthropology subject table',
    url: 'https://www.thecompleteuniversityguide.co.uk/league-tables/rankings/anthropology',
    entries: [{ name: 'SOAS University of London', rank: 14 }],
  },
  {
    field: 'Humanities',
    source: 'The Complete University Guide 2027 — African & Middle Eastern Studies subject table',
    url: 'https://www.thecompleteuniversityguide.co.uk/league-tables/rankings/middle-eastern-and-african-studies',
    entries: [{ name: 'SOAS University of London', rank: 6 }],
  },
  {
    field: 'Psychology',
    source: 'The Complete University Guide 2027 — Psychology subject table',
    url: 'https://www.thecompleteuniversityguide.co.uk/league-tables/rankings/psychology',
    entries: [{ name: 'University of East London', rank: 102 }],
  },
  {
    field: 'Business',
    source: 'The Complete University Guide 2027 — Business and Management Studies subject table',
    url: 'https://www.thecompleteuniversityguide.co.uk/league-tables/rankings/business-and-management-studies',
    entries: [
      { name: 'University of East London', rank: 75 },
      { name: 'University of Gloucestershire', rank: 96 },
    ],
  },
]

let totalInserted = 0
let totalSkipped = []

for (const category of CATEGORIES) {
  for (const entry of category.entries) {
    const rows = await sql`SELECT id, "academicFields" FROM universities WHERE name = ${entry.name} AND country = 'UK'`
    if (rows.length === 0) {
      totalSkipped.push(`${entry.name} (${category.field}) — not in catalog`)
      continue
    }
    const universityId = rows[0].id
    const fields = rows[0].academicFields ?? []
    if (!fields.includes(category.field)) {
      totalSkipped.push(`${entry.name} (${category.field}) — field not tagged for this university`)
      continue
    }
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
if (totalSkipped.length) console.log(`Skipped:\n  ${totalSkipped.join('\n  ')}`)
