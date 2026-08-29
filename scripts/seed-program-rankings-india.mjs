// Program-specific rankings for India — NIRF 2025, Engineering and
// Management categories. This is the clearest real-world instance yet of
// exactly what the founder described: IITs and IIMs rank far higher in
// their specific category than they would in NIRF's general "Universities"
// list (most don't appear there at all — they're evaluated separately by
// design). IIT Delhi shows up in BOTH lists below, which is expected and
// fine — a school can have more than one program-specific ranking row.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-india.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank) {
  return Math.max(15, Math.min(99, Math.round(100 - (rank - 1) * 1.1)))
}

const ENGINEERING_SOURCE = 'NIRF (National Institutional Ranking Framework) 2025 — Engineering category'
const ENGINEERING_URL = 'https://news.careers360.com/nirf-engineering-ranking-2025-architecture-iit-madras-hyderabad-guwahati-roorkee-nit-calicut-delhi-bombay-kanpur-changes-position'
const ENGINEERING_ENTRIES = [
  { name: 'Indian Institute of Technology Madras', rank: 1 },
  { name: 'Indian Institute of Technology Delhi', rank: 2 },
  { name: 'Indian Institute of Technology Bombay', rank: 3 },
  { name: 'Indian Institute of Technology Kanpur', rank: 4 },
  { name: 'Indian Institute of Technology Kharagpur', rank: 5 },
  { name: 'Indian Institute of Technology Roorkee', rank: 6 },
  { name: 'Indian Institute of Technology Hyderabad', rank: 7 },
  { name: 'National Institute of Technology Tiruchirappalli', rank: 9 },
  { name: 'Indian Institute of Technology (BHU) Varanasi', rank: 10 },
]

const MANAGEMENT_SOURCE = 'NIRF (National Institutional Ranking Framework) 2025 — Management category'
const MANAGEMENT_URL = 'https://news.careers360.com/nirf-ranking-2025-management-iim-ahmedabad-holds-first-position-iit-delhi-in-top-5-mba-institutes-b-school-bangalore-kozhikode'
const MANAGEMENT_ENTRIES = [
  { name: 'Indian Institute of Management Ahmedabad', rank: 1 },
  { name: 'Indian Institute of Management Bangalore', rank: 2 },
  { name: 'Indian Institute of Technology Delhi', rank: 4 },
  { name: 'Indian Institute of Management Calcutta', rank: 7 },
]

async function seed(field, source, url, entries) {
  let inserted = 0
  let skipped = []
  for (const entry of entries) {
    const rows = await sql`SELECT id, "academicFields" FROM universities WHERE name = ${entry.name} AND country = 'IN'`
    if (rows.length === 0) {
      skipped.push(entry.name)
      continue
    }
    const universityId = rows[0].id
    const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${universityId} AND field = ${field}`
    if (existing.length > 0) {
      console.log(`Skipping ${entry.name} (${field}) — already has a ranking row.`)
      continue
    }
    await sql`
      INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
      VALUES (${universityId}, ${field}, ${entry.rank}, ${source}, ${url}, ${selectivityFromRank(entry.rank)}, 'NIRF is India''s official government ranking (Ministry of Education).')
    `
    const currentFields = rows[0].academicFields || []
    if (!currentFields.includes(field)) {
      await sql`UPDATE universities SET "academicFields" = ${JSON.stringify([...currentFields, field])}::jsonb WHERE id = ${universityId}`
    }
    inserted++
  }
  console.log(`${field}: inserted ${inserted}.${skipped.length ? ` Could not match: ${skipped.join(', ')}` : ''}`)
}

await seed('Engineering', ENGINEERING_SOURCE, ENGINEERING_URL, ENGINEERING_ENTRIES)
await seed('Business', MANAGEMENT_SOURCE, MANAGEMENT_URL, MANAGEMENT_ENTRIES)
