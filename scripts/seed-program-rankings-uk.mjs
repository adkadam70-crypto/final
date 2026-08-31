// First program-specific ranking pass for the UK — same role and pattern as
// scripts/seed-program-rankings.mjs (US) and scripts/seed-program-rankings-india.mjs.
//
// Source: The Complete University Guide 2027 subject league tables — the
// same publisher used for the UK's general/overall rank (see
// seed-overall-rankings-uk.mjs), so a school's program rank and general rank
// come from one consistent methodology rather than mixing sources.
//
// Coverage, and why it's uneven per field: only schools already tagged with
// that field in universities.academicFields were looked up (18 for
// Business, 43 for Computer Science, 25 candidates for Engineering). General
// Engineering's own subject table only covered 8 of those 25 — the rest
// aren't missing data by mistake, CUG's "General Engineering" table simply
// doesn't include every engineering-tagged school (some may only appear
// under narrower tables like Civil/Mechanical/Electrical Engineering, which
// this pass didn't chase down individually).
//
// programSelectivity uses the same decreasing transform as every other
// program-rankings script: 100 - (rank-1)*1.1, clamped 15-99 — not itself a
// published figure, just puts the rank on the same 0-100 scale as
// baselineSelectivity.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-uk.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)
const RANK_SOURCE_PREFIX = 'The Complete University Guide 2027'

function selectivityFromRank(rank) {
  return Math.max(15, Math.min(99, Math.round(100 - (rank - 1) * 1.1)))
}

const FIELDS = [
  {
    field: 'Business',
    rankSource: `${RANK_SOURCE_PREFIX} — Business and Management Studies subject table`,
    rankSourceUrl: 'https://www.thecompleteuniversityguide.co.uk/league-tables/rankings/business-and-management-studies?tabletype=full-table',
    entries: [
      { name: "King's College London", rank: 7 },
      { name: 'University of Warwick', rank: 2 },
      { name: 'Durham University', rank: 14 },
      { name: 'University of Birmingham', rank: 10 },
      { name: 'University of Bath', rank: 6 },
      { name: 'University of Exeter', rank: 8 },
      { name: 'University of Nottingham', rank: 20 },
      { name: 'Lancaster University', rank: 18 },
      { name: 'City, University of London', rank: 17 },
      { name: 'University of Surrey', rank: 26 },
      { name: 'Aston University', rank: 32 },
      { name: 'Heriot-Watt University', rank: 37 },
      { name: 'University of Reading', rank: 29 },
      { name: 'Robert Gordon University', rank: 40 },
      { name: 'Bournemouth University', rank: 58 },
      { name: 'Manchester Metropolitan University', rank: 48 },
      { name: 'Glasgow Caledonian University', rank: 54 },
      { name: 'Middlesex University', rank: 100 },
    ],
  },
  {
    field: 'Computer Science & IT',
    rankSource: `${RANK_SOURCE_PREFIX} — Computer Science subject table`,
    rankSourceUrl: 'https://www.thecompleteuniversityguide.co.uk/league-tables/rankings/computer-science?tabletype=full-table',
    entries: [
      { name: 'University of Warwick', rank: 5 },
      { name: 'University of St Andrews', rank: 4 },
      { name: 'Durham University', rank: 8 },
      { name: 'University of Bristol', rank: 10 },
      { name: 'University of Glasgow', rank: 14 },
      { name: 'University of Birmingham', rank: 6 },
      { name: 'University of Bath', rank: 9 },
      { name: 'University of Exeter', rank: 15 },
      { name: 'University of York', rank: 20 },
      { name: 'University of Sheffield', rank: 13 },
      { name: 'University of Southampton', rank: 11 },
      { name: 'University of Nottingham', rank: 16 },
      { name: 'Lancaster University', rank: 22 },
      { name: 'Loughborough University', rank: 17 },
      { name: 'Newcastle University', rank: 24 },
      { name: 'University of Liverpool', rank: 25 },
      { name: 'University of Aberdeen', rank: 29 },
      { name: 'University of Surrey', rank: 23 },
      { name: 'Royal Holloway, University of London', rank: 26 },
      { name: 'University of Strathclyde', rank: 28 },
      { name: 'University of Leicester', rank: 30 },
      { name: 'Heriot-Watt University', rank: 37 },
      { name: 'Aston University', rank: 41 },
      { name: 'University of East Anglia', rank: 38 },
      { name: 'University of Reading', rank: 44 },
      { name: 'Swansea University', rank: 32 },
      { name: 'Brunel University London', rank: 49 },
      { name: 'Northumbria University', rank: 48 },
      { name: 'Robert Gordon University', rank: 62 },
      { name: 'Oxford Brookes University', rank: 57 },
      { name: 'Bangor University', rank: 43 },
      { name: 'Nottingham Trent University', rank: 52 },
      { name: 'Coventry University', rank: 81 },
      { name: 'University of Portsmouth', rank: 59 },
      { name: 'Ulster University', rank: 42 },
      { name: 'Edinburgh Napier University', rank: 60 },
      { name: 'University of Lincoln', rank: 54 },
      { name: 'Sheffield Hallam University', rank: 80 },
      { name: 'University of Plymouth', rank: 69 },
      { name: 'Liverpool John Moores University', rank: 83 },
      { name: 'University of Salford', rank: 79 },
      { name: 'University of Huddersfield', rank: 53 },
      { name: 'University of Hertfordshire', rank: 47 },
    ],
  },
  {
    field: 'Engineering',
    rankSource: `${RANK_SOURCE_PREFIX} — General Engineering subject table`,
    rankSourceUrl: 'https://www.thecompleteuniversityguide.co.uk/league-tables/rankings/general-engineering?tabletype=full-table',
    entries: [
      { name: 'University of Bristol', rank: 2 },
      { name: 'University of Sheffield', rank: 4 },
      { name: 'Loughborough University', rank: 12 },
      { name: 'University of Liverpool', rank: 17 },
      { name: 'University of Aberdeen', rank: 15 },
      { name: 'Aston University', rank: 22 },
      { name: 'Brunel University London', rank: 20 },
      { name: 'Coventry University', rank: 27 },
    ],
  },
]

let inserted = 0
let skipped = []

for (const { field, rankSource, rankSourceUrl, entries } of FIELDS) {
  for (const entry of entries) {
    const rows = await sql`SELECT id FROM universities WHERE name = ${entry.name} AND country = 'UK'`
    if (rows.length === 0) {
      skipped.push(`${field}: ${entry.name}`)
      continue
    }
    const universityId = rows[0].id

    const existing = await sql`
      SELECT id FROM "programRankings" WHERE "universityId" = ${universityId} AND field = ${field}
    `
    if (existing.length > 0) continue

    await sql`
      INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity")
      VALUES (${universityId}, ${field}, ${entry.rank}, ${rankSource}, ${rankSourceUrl}, ${selectivityFromRank(entry.rank)})
    `
    inserted++
  }
}

console.log(`Inserted ${inserted} UK program ranking rows.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
