// Program-specific rankings for the UK, round 4 — Mathematics & Statistics
// and Business fields, closing gaps mostly among universities that already
// have SOME program-ranking coverage from earlier rounds but were missing
// these two.
//
// Data verified via raw HTML extraction (data-ga-lt-index attributes),
// NOT the AI-summarized WebFetch tool — round 3 shipped 3 wrong rank
// numbers (Royal Northern College of Music, and both University of East
// London/Gloucestershire Business entries) because that tool's HTML-to-
// markdown-to-summary pipeline silently mis-transcribed numbers on long
// tables. Cross-checking every round-3 claim against this raw-HTML method
// caught and fixed those before this round shipped anything new.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-uk-round4.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank) {
  return Math.max(15, Math.min(99, Math.round(100 - (rank - 1) * 1.1)))
}

const CATEGORIES = [
  {
    field: 'Mathematics & Statistics',
    source: 'The Complete University Guide 2027 — Mathematics subject table',
    url: 'https://www.thecompleteuniversityguide.co.uk/league-tables/rankings/mathematics',
    entries: [
      { name: 'University of St Andrews', rank: 1 },
      { name: 'University of Warwick', rank: 5 },
      { name: 'University of Bath', rank: 6 },
      { name: 'University of Bristol', rank: 7 },
      { name: 'Durham University', rank: 8 },
      { name: 'University of Nottingham', rank: 17 },
      { name: 'University of Leicester', rank: 18 },
      { name: 'University of Birmingham', rank: 19 },
      { name: 'University of Exeter', rank: 20 },
      { name: 'University of Glasgow', rank: 21 },
      { name: 'University of Surrey', rank: 22 },
      { name: 'University of Sheffield', rank: 24 },
      { name: 'University of York', rank: 25 },
      { name: 'Newcastle University', rank: 30 },
      { name: 'University of Strathclyde', rank: 32 },
      { name: 'Aston University', rank: 34 },
      { name: 'University of Reading', rank: 37 },
      { name: 'University of Hertfordshire', rank: 39 },
      { name: 'Aberystwyth University', rank: 42 },
      { name: 'University of Lincoln', rank: 43 },
      { name: 'University of Aberdeen', rank: 44 },
      { name: 'Keele University', rank: 45 },
      { name: 'Royal Holloway, University of London', rank: 47 },
      { name: 'University of Liverpool', rank: 48 },
      { name: 'Nottingham Trent University', rank: 49 },
      { name: 'Northumbria University', rank: 50 },
      { name: 'University of Plymouth', rank: 51 },
      { name: 'University of East Anglia', rank: 52 },
      { name: 'Liverpool John Moores University', rank: 54 },
      { name: 'University of Derby', rank: 55 },
      { name: 'Brunel University London', rank: 56 },
      { name: 'University of Portsmouth', rank: 57 },
      { name: 'Sheffield Hallam University', rank: 59 },
      { name: 'University of Salford', rank: 63 },
      { name: 'Swansea University', rank: 29 },
      { name: 'Heriot-Watt University', rank: 28 },
      { name: 'Loughborough University', rank: 16 },
      { name: 'Lancaster University', rank: 15 },
    ],
  },
  {
    field: 'Business',
    source: 'The Complete University Guide 2027 — Business and Management Studies subject table',
    url: 'https://www.thecompleteuniversityguide.co.uk/league-tables/rankings/business-and-management-studies',
    entries: [
      { name: 'University of Chester', rank: 64 },
      { name: 'Keele University', rank: 48 },
      { name: 'Cardiff Metropolitan University', rank: 103 },
      { name: 'University of Derby', rank: 69 },
      { name: 'University of Hull', rank: 52 },
      { name: 'University of Sunderland', rank: 113 },
      { name: 'University of the West of England, Bristol', rank: 61 },
      { name: 'University of Worcester', rank: 91 },
      { name: 'Royal Agricultural University', rank: 84 },
      { name: 'Anglia Ruskin University', rank: 102 },
      { name: 'London Metropolitan University', rank: 104 },
      { name: 'University of Buckingham', rank: 81 },
      { name: 'University of Bedfordshire', rank: 119 },
      { name: 'University of Northampton', rank: 106 },
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
