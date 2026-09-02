// Program-specific rankings, round 3 — extends already-added categories
// deeper into their real, freely-available tables (not new categories):
// India NIRF Pharmacy (which genuinely runs to rank 100, unlike Medical/
// Law/Architecture which end at 50/40/40 respectively — confirmed by
// re-fetching each, not assumed), and UK Complete University Guide Law
// and Psychology (which continue to 113 and 118).
//
// A few names deliberately excluded as before: "Lincoln Bishop University"
// (ambiguous/garbled read, likely Bishop Grosseteste University) and
// "Bharati Vidyapeeth College of Pharmacy" / "Amity University Haryana,
// Gurgaon" (specific sub-colleges/campuses distinct from the catalog's
// parent-institution rows — same reasoning as round 2).
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-round3.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank) {
  return Math.max(15, Math.min(99, Math.round(100 - (rank - 1) * 1.1)))
}

const GROUPS = [
  {
    country: 'IN',
    field: 'Medicine & Health Sciences',
    source: 'NIRF (National Institutional Ranking Framework) 2025 — Pharmacy category',
    url: 'https://www.nirfindia.org/Rankings/2025/PharmacyRanking.html',
    entries: [
      { name: 'Jadavpur University', rank: 24 },
      { name: 'Nirma University', rank: 32 },
      { name: 'Galgotias University', rank: 55 },
      { name: 'Sharda University', rank: 57 },
    ],
  },
  {
    country: 'UK',
    field: 'Law',
    source: 'The Complete University Guide 2027 — Law subject table',
    url: 'https://www.thecompleteuniversityguide.co.uk/league-tables/rankings/law',
    entries: [
      { name: 'Manchester Metropolitan University', rank: 32 },
      { name: 'University of Reading', rank: 33 },
      { name: 'Northumbria University', rank: 35 },
      { name: 'Edinburgh Napier University', rank: 37 },
      { name: 'Glasgow Caledonian University', rank: 38 },
      { name: 'University of Hertfordshire', rank: 39 },
      { name: 'Kingston University', rank: 42 },
      { name: 'Bournemouth University', rank: 43 },
      { name: 'City, University of London', rank: 45 },
      { name: 'University of Essex', rank: 46 },
      { name: 'University of Lincoln', rank: 47 },
      { name: 'University of Bradford', rank: 48 },
      { name: 'Oxford Brookes University', rank: 50 },
      { name: 'Abertay University', rank: 52 },
      { name: 'University of Portsmouth', rank: 53 },
      { name: 'Southampton Solent University', rank: 55 },
      { name: 'University of Huddersfield', rank: 56 },
      { name: 'Liverpool John Moores University', rank: 57 },
      { name: 'Brunel University London', rank: 58 },
      { name: 'University of Salford', rank: 61 },
      { name: 'Robert Gordon University', rank: 63 },
      { name: 'University of Buckingham', rank: 64 },
      { name: 'Royal Holloway, University of London', rank: 65 },
      { name: 'Coventry University', rank: 66 },
      { name: 'Sheffield Hallam University', rank: 70 },
      { name: 'University of Westminster', rank: 72 },
      { name: 'Goldsmiths, University of London', rank: 73 },
      { name: 'London South Bank University', rank: 76 },
      { name: 'Anglia Ruskin University', rank: 77 },
      { name: 'London Metropolitan University', rank: 82 },
      { name: 'University of Greater Manchester', rank: 83 },
      { name: 'De Montfort University', rank: 84 },
      { name: 'York St John University', rank: 86 },
      { name: 'University of Brighton', rank: 87 },
      { name: 'Birmingham City University', rank: 89 },
      { name: 'Leeds Trinity University', rank: 90 },
      { name: 'University of Northampton', rank: 96 },
      { name: 'University of Roehampton', rank: 97 },
      { name: 'Birmingham Newman University', rank: 98 },
      { name: 'Middlesex University', rank: 99 },
      { name: 'University of Bedfordshire', rank: 100 },
      { name: 'Wrexham University', rank: 101 },
      { name: 'Buckinghamshire New University', rank: 102 },
      { name: 'University of the West of Scotland', rank: 103 },
    ],
  },
  {
    country: 'UK',
    field: 'Psychology',
    source: 'The Complete University Guide 2027 — Psychology subject table',
    url: 'https://www.thecompleteuniversityguide.co.uk/league-tables/rankings/psychology',
    entries: [
      { name: 'University of Leeds', rank: 31 },
      { name: 'University of Edinburgh', rank: 32 },
      { name: 'University of Liverpool', rank: 33 },
      { name: 'University of Southampton', rank: 34 },
      { name: 'Lancaster University', rank: 35 },
      { name: 'University of Nottingham', rank: 36 },
      { name: 'University of Manchester', rank: 37 },
      { name: 'University of East Anglia', rank: 38 },
      { name: 'Royal Holloway, University of London', rank: 39 },
      { name: 'Newcastle University', rank: 40 },
      { name: 'University of Strathclyde', rank: 41 },
      { name: 'University of Surrey', rank: 42 },
      { name: 'Aston University', rank: 43 },
      { name: 'University of Leicester', rank: 44 },
      { name: 'University of Aberdeen', rank: 45 },
      { name: 'University of Reading', rank: 46 },
      { name: 'Queen Mary University of London', rank: 47 },
      { name: 'Heriot-Watt University', rank: 48 },
      { name: 'University of Sussex', rank: 49 },
      { name: "Queen's University Belfast", rank: 50 },
      { name: 'City, University of London', rank: 52 },
      { name: 'University of Plymouth', rank: 53 },
      { name: 'Bangor University', rank: 54 },
      { name: 'Swansea University', rank: 55 },
      { name: 'University of Dundee', rank: 56 },
      { name: 'University of Kent', rank: 58 },
      { name: 'University of Lincoln', rank: 59 },
      { name: 'Northumbria University', rank: 61 },
      { name: 'Ulster University', rank: 62 },
      { name: 'Manchester Metropolitan University', rank: 65 },
      { name: 'University of Portsmouth', rank: 66 },
      { name: 'Nottingham Trent University', rank: 67 },
      { name: 'Glasgow Caledonian University', rank: 68 },
      { name: 'University of Huddersfield', rank: 71 },
      { name: 'University of Hertfordshire', rank: 73 },
      { name: 'Edinburgh Napier University', rank: 74 },
      { name: 'University of Essex', rank: 75 },
      { name: 'Abertay University', rank: 76 },
      { name: 'Oxford Brookes University', rank: 79 },
      { name: 'Liverpool John Moores University', rank: 80 },
      { name: 'York St John University', rank: 81 },
      { name: 'Bournemouth University', rank: 85 },
      { name: 'University of Bradford', rank: 88 },
      { name: 'University of Roehampton', rank: 89 },
      { name: 'Brunel University London', rank: 92 },
      { name: 'London Metropolitan University', rank: 99 },
      { name: 'Plymouth Marjon University', rank: 101 },
      { name: 'Coventry University', rank: 102 },
      { name: 'University of Salford', rank: 103 },
      { name: 'Goldsmiths, University of London', rank: 104 },
      { name: 'Sheffield Hallam University', rank: 105 },
      { name: 'Anglia Ruskin University', rank: 106 },
      { name: 'Birmingham City University', rank: 109 },
      { name: 'University of Buckingham', rank: 110 },
      { name: 'University of Westminster', rank: 112 },
      { name: 'London South Bank University', rank: 113 },
      { name: 'University of Bedfordshire', rank: 114 },
      { name: 'Kingston University', rank: 116 },
      { name: 'University of Brighton', rank: 117 },
      { name: 'Middlesex University', rank: 118 },
    ],
  },
]

let totalInserted = 0
let totalSkipped = []

for (const group of GROUPS) {
  for (const entry of group.entries) {
    const rows = await sql`SELECT id FROM universities WHERE name = ${entry.name} AND country = ${group.country}`
    if (rows.length === 0) {
      totalSkipped.push(`${entry.name} (${group.field})`)
      continue
    }
    const universityId = rows[0].id
    const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${universityId} AND field = ${group.field} AND "rankSource" = ${group.source}`
    if (existing.length > 0) continue

    await sql`
      INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
      VALUES (
        ${universityId}, ${group.field}, ${entry.rank}, ${group.source}, ${group.url},
        ${selectivityFromRank(entry.rank)}, null
      )
    `
    totalInserted++
  }
}

console.log(`Inserted ${totalInserted} program-ranking rows.`)
if (totalSkipped.length) console.log(`Could not match (not in catalog): ${totalSkipped.join(', ')}`)
