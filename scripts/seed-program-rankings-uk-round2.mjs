// Program-specific rankings for the UK, round 2 — extends beyond the
// original Business/CS/Engineering-only pass to 4 more real subject
// tables from The Complete University Guide 2027: Medicine, Law,
// Psychology, Architecture.
//
// Deliberately excludes entries that don't map cleanly to a single
// catalog row: joint/standalone medical schools not otherwise in the
// catalog (Hull York, Brighton and Sussex, Kent and Medway), and
// "Manchester School of Architecture" / "Architectural Association",
// which are joint or independent schools rather than the university
// names already in the catalog.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-uk-round2.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank) {
  return Math.max(15, Math.min(99, Math.round(100 - (rank - 1) * 1.1)))
}

const CATEGORIES = [
  {
    field: 'Medicine & Health Sciences',
    source: 'The Complete University Guide 2027 — Medicine subject table',
    url: 'https://www.thecompleteuniversityguide.co.uk/league-tables/rankings/medicine',
    entries: [
      { name: 'University of Cambridge', rank: 1 },
      { name: 'University of Oxford', rank: 2 },
      { name: 'Imperial College London', rank: 3 },
      { name: "Queen's University Belfast", rank: 4 },
      { name: 'University of Glasgow', rank: 5 },
      { name: 'University of Leicester', rank: 6 },
      { name: 'University of Bristol', rank: 7 },
      { name: 'University College London', rank: 8 },
      { name: 'Cardiff University', rank: 9 },
      { name: 'University of Exeter', rank: 10 },
      { name: 'University of Dundee', rank: 11 },
      { name: 'Swansea University', rank: 12 },
      { name: 'University of Edinburgh', rank: 13 },
      { name: 'University of St Andrews', rank: 14 },
      { name: 'University of Manchester', rank: 15 },
      { name: 'Lancaster University', rank: 16 },
      { name: "King's College London", rank: 17 },
      { name: 'Queen Mary University of London', rank: 19 },
      { name: 'University of Sheffield', rank: 20 },
      { name: 'University of East Anglia', rank: 22 },
      { name: 'City, University of London', rank: 23 },
      { name: 'University of Liverpool', rank: 24 },
      { name: 'Newcastle University', rank: 25 },
      { name: 'University of Leeds', rank: 26 },
      { name: 'University of Birmingham', rank: 27 },
      { name: 'University of Aberdeen', rank: 28 },
      { name: 'University of Nottingham', rank: 29 },
      { name: 'University of Southampton', rank: 30 },
      { name: 'University of Plymouth', rank: 32 },
      { name: 'University of Warwick', rank: 33 },
      { name: 'Anglia Ruskin University', rank: 34 },
      { name: 'Aston University', rank: 36 },
      { name: 'University of Buckingham', rank: 40 },
    ],
  },
  {
    field: 'Law',
    source: 'The Complete University Guide 2027 — Law subject table',
    url: 'https://www.thecompleteuniversityguide.co.uk/league-tables/rankings/law',
    entries: [
      { name: 'University of Cambridge', rank: 1 },
      { name: 'University of Oxford', rank: 2 },
      { name: 'London School of Economics', rank: 3 },
      { name: 'University College London', rank: 4 },
      { name: 'Durham University', rank: 5 },
      { name: "King's College London", rank: 6 },
      { name: 'University of Bristol', rank: 7 },
      { name: "Queen's University Belfast", rank: 8 },
      { name: 'University of Glasgow', rank: 9 },
      { name: 'University of Warwick', rank: 10 },
      { name: 'University of Nottingham', rank: 11 },
      { name: 'University of Leeds', rank: 12 },
      { name: 'Queen Mary University of London', rank: 13 },
      { name: 'University of Sheffield', rank: 14 },
      { name: 'University of Southampton', rank: 15 },
      { name: 'University of Edinburgh', rank: 16 },
      { name: 'University of Exeter', rank: 17 },
      { name: 'University of Aberdeen', rank: 18 },
      { name: 'University of York', rank: 19 },
      { name: 'University of Birmingham', rank: 20 },
      { name: 'University of Liverpool', rank: 21 },
      { name: 'University of Strathclyde', rank: 22 },
      { name: 'University of Manchester', rank: 23 },
      { name: 'Cardiff University', rank: 24 },
      { name: 'University of Dundee', rank: 25 },
      { name: 'Lancaster University', rank: 26 },
      { name: 'Newcastle University', rank: 27 },
      { name: 'University of Surrey', rank: 28 },
      { name: 'University of Leicester', rank: 29 },
      { name: 'Ulster University', rank: 30 },
    ],
  },
  {
    field: 'Psychology',
    source: 'The Complete University Guide 2027 — Psychology subject table',
    url: 'https://www.thecompleteuniversityguide.co.uk/league-tables/rankings/psychology',
    entries: [
      { name: 'University of Oxford', rank: 1 },
      { name: 'University of Cambridge', rank: 2 },
      { name: 'University of St Andrews', rank: 3 },
      { name: 'London School of Economics', rank: 4 },
      { name: 'University College London', rank: 5 },
      { name: 'University of Bath', rank: 6 },
      { name: 'University of Exeter', rank: 7 },
      { name: 'University of Warwick', rank: 8 },
      { name: 'Loughborough University', rank: 9 },
      { name: 'Durham University', rank: 10 },
      { name: 'University of York', rank: 11 },
      { name: "King's College London", rank: 12 },
      { name: 'University of Bristol', rank: 13 },
      { name: 'Cardiff University', rank: 14 },
      { name: 'University of Birmingham', rank: 15 },
      { name: 'University of Sheffield', rank: 16 },
      { name: 'University of Glasgow', rank: 17 },
      { name: 'University of Leeds', rank: 18 },
      { name: 'University of Edinburgh', rank: 19 },
      { name: 'University of Liverpool', rank: 20 },
      { name: 'University of Southampton', rank: 21 },
      { name: 'Lancaster University', rank: 22 },
      { name: 'University of Nottingham', rank: 23 },
      { name: 'University of Manchester', rank: 24 },
      { name: 'University of East Anglia', rank: 25 },
      { name: 'Royal Holloway, University of London', rank: 26 },
      { name: 'Newcastle University', rank: 27 },
      { name: 'University of Strathclyde', rank: 28 },
      { name: 'University of Surrey', rank: 29 },
      { name: 'Aston University', rank: 30 },
    ],
  },
  {
    field: 'Architecture & Design',
    source: 'The Complete University Guide 2027 — Architecture subject table',
    url: 'https://www.thecompleteuniversityguide.co.uk/league-tables/rankings/architecture',
    entries: [
      { name: 'Loughborough University', rank: 1 },
      { name: 'University of Bath', rank: 2 },
      { name: 'University of Cambridge', rank: 3 },
      { name: 'University of Sheffield', rank: 4 },
      { name: 'Cardiff University', rank: 5 },
      { name: 'University of Edinburgh', rank: 6 },
      { name: 'University College London', rank: 7 },
      { name: 'University of Nottingham', rank: 9 },
      { name: "Queen's University Belfast", rank: 10 },
      { name: 'University of Liverpool', rank: 11 },
      { name: 'Lancaster University', rank: 12 },
      { name: 'University of Dundee', rank: 13 },
      { name: 'Newcastle University', rank: 14 },
      { name: 'University of Strathclyde', rank: 15 },
      { name: 'Liverpool John Moores University', rank: 18 },
      { name: 'University of Plymouth', rank: 19 },
      { name: 'Oxford Brookes University', rank: 20 },
      { name: 'University of Kent', rank: 21 },
      { name: 'University of Reading', rank: 22 },
      { name: 'Ulster University', rank: 23 },
      { name: 'University of the Arts London', rank: 25 },
      { name: 'Sheffield Hallam University', rank: 26 },
      { name: 'Kingston University', rank: 27 },
      { name: 'Nottingham Trent University', rank: 28 },
      { name: 'Northumbria University', rank: 29 },
      { name: 'University of Westminster', rank: 30 },
      { name: 'Birmingham City University', rank: 32 },
      { name: 'Robert Gordon University', rank: 34 },
      { name: 'University of Lincoln', rank: 35 },
      { name: 'University of Salford', rank: 38 },
      { name: 'University of Portsmouth', rank: 39 },
      { name: 'London South Bank University', rank: 46 },
      { name: 'Southampton Solent University', rank: 47 },
      { name: 'University of Hertfordshire', rank: 50 },
      { name: 'University of Huddersfield', rank: 51 },
      { name: 'De Montfort University', rank: 52 },
      { name: 'University of Brighton', rank: 53 },
      { name: 'Coventry University', rank: 54 },
      { name: 'Edinburgh Napier University', rank: 56 },
      { name: 'Anglia Ruskin University', rank: 57 },
      { name: 'London Metropolitan University', rank: 58 },
    ],
  },
]

let totalInserted = 0
let totalSkipped = []

for (const category of CATEGORIES) {
  for (const entry of category.entries) {
    const rows = await sql`SELECT id FROM universities WHERE name = ${entry.name} AND country = 'UK'`
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
