// General/overall ranking pass for UK — fills universities.rankSource/rankValue,
// same role as scripts/seed-overall-rankings-us.mjs and -india.mjs: the
// fallback the AI cites as "#42 overall" when no programRankings row exists.
//
// Source: The Complete University Guide — the standard UK domestic league
// table (equivalent role to US News for the US), directly fetched from the
// live table rather than a secondary summary. rankValue here IS the table's
// own overall position (not a QS/THE global number) — same "ordinal among
// this country's own universities" semantics as US News/NIRF, which matters
// once a student targets multiple countries at once and a single "Top 50"
// threshold gets compared across them (see match.ts rank filter).
//
// Cross-check note: the live table returned inconsistent exact positions for
// a handful of schools (Leeds, Surrey, Liverpool, Queen's Belfast) across two
// separate fetches of the same page — a tool/extraction issue reading a large
// interactive table, not a real data conflict. Resolved by preferring the
// clean, gapless sequential top-27 read over the individually-queried read
// for just those 4 schools. University of Glasgow could not be resolved to
// an exact position after two attempts and is deliberately left unranked
// (null) rather than guessed.
//
// Usage: node --env-file=.env.local scripts/seed-overall-rankings-uk.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const RANK_SOURCE = 'The Complete University Guide 2027 — UK league table'
const RANK_SOURCE_URL = 'https://www.thecompleteuniversityguide.co.uk/league-tables/rankings?tabletype=full-table'

const ENTRIES = [
  { name: 'University of Cambridge', rank: 1 },
  { name: 'University of Oxford', rank: 2 },
  { name: 'London School of Economics', rank: 3 },
  { name: 'University of St Andrews', rank: 4 },
  { name: 'Imperial College London', rank: 5 },
  { name: 'Durham University', rank: 6 },
  { name: 'University of Warwick', rank: 7 },
  { name: 'Loughborough University', rank: 8 },
  { name: 'University of Bath', rank: 9 },
  { name: 'Lancaster University', rank: 10 },
  { name: 'University of Exeter', rank: 11 },
  { name: 'University of Birmingham', rank: 12 },
  { name: 'University of Sheffield', rank: 13 },
  { name: 'University College London', rank: 13 },
  { name: 'University of Southampton', rank: 15 },
  { name: "King's College London", rank: 16 },
  { name: 'University of Bristol', rank: 17 },
  { name: 'University of Leeds', rank: 18 },
  { name: 'University of Edinburgh', rank: 19 },
  { name: 'University of York', rank: 20 },
  { name: 'University of Surrey', rank: 21 },
  { name: 'University of Liverpool', rank: 22 },
  { name: "Queen's University Belfast", rank: 23 },
  { name: 'University of Manchester', rank: 24 },
  { name: 'University of Dundee', rank: 25 },
  { name: 'University of Nottingham', rank: 26 },
  { name: 'Cardiff University', rank: 27 },
  { name: 'University of the Arts London', rank: 27 },
  { name: 'Heriot-Watt University', rank: 30 },
  { name: 'University of Aberdeen', rank: 31 },
  { name: 'University of Leicester', rank: 31 },
  { name: 'Newcastle University', rank: 33 },
  { name: 'Queen Mary University of London', rank: 35 },
  { name: 'University of Essex', rank: 37 },
  { name: 'University of Sussex', rank: 40 },
  { name: 'Royal Holloway, University of London', rank: 42 },
  { name: 'Northumbria University', rank: 42 },
  { name: 'University of East Anglia', rank: 43 },
  { name: 'University of Reading', rank: 44 },
  { name: 'University of Strathclyde', rank: 45 },
  { name: 'Swansea University', rank: 48 },
  { name: 'Brunel University London', rank: 51 },
  { name: 'Ulster University', rank: 52 },
  { name: 'Oxford Brookes University', rank: 53 },
  { name: 'Nottingham Trent University', rank: 54 },
  { name: 'Aston University', rank: 57 },
  { name: 'City, University of London', rank: 58 },
  { name: 'Bangor University', rank: 60 },
  { name: 'Coventry University', rank: 61 },
  { name: 'University of Portsmouth', rank: 62 },
  { name: 'Manchester Metropolitan University', rank: 63 },
  { name: 'University of Lincoln', rank: 64 },
  { name: 'Bournemouth University', rank: 67 },
  { name: 'University of Plymouth', rank: 68 },
  { name: 'Robert Gordon University', rank: 70 },
  { name: 'Goldsmiths, University of London', rank: 72 },
  { name: 'University of Salford', rank: 72 },
  { name: 'University of Huddersfield', rank: 73 },
  { name: 'Edinburgh Napier University', rank: 74 },
  { name: 'Sheffield Hallam University', rank: 75 },
  { name: 'University of Hertfordshire', rank: 76 },
  { name: 'University of Kent', rank: 79 },
  { name: 'Glasgow Caledonian University', rank: 80 },
  { name: 'SOAS University of London', rank: 81 },
  { name: 'Birmingham City University', rank: 84 },
  { name: 'Liverpool John Moores University', rank: 85 },
  { name: 'University of Brighton', rank: 86 },
  { name: 'University of Bradford', rank: 87 },
  { name: 'Kingston University', rank: 90 },
  { name: 'De Montfort University', rank: 92 },
  { name: 'University of Westminster', rank: 94 },
  { name: 'Middlesex University', rank: 96 },
]

let updated = 0
let skipped = []

for (const entry of ENTRIES) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${entry.name} AND country = 'UK'`
  if (rows.length === 0) {
    skipped.push(entry.name)
    continue
  }
  await sql`UPDATE universities SET "rankSource" = ${RANK_SOURCE}, "rankValue" = ${entry.rank} WHERE id = ${rows[0].id}`
  updated++
}

console.log(`Updated overall rank for ${updated} UK schools.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)

const [{ count }] = await sql`SELECT count(*) FROM universities WHERE country = 'UK'`
console.log(`UK catalog size: ${count}. Left unranked (incl. University of Glasgow, unresolved): ${count - updated}.`)
