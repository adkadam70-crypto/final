// US rank backfill pass #2 — extends universities.rankValue coverage from
// the original top-24 (seed-overall-rankings-us.mjs) through rank 50, and
// adds 2 real, well-known schools found missing from the catalog while
// cross-referencing this range (UC Irvine, UC Santa Barbara).
//
// Source: U.S. News & World Report 2026 Best National Universities, via a
// secondary aggregator (Ivy Coach) that republishes the same US News
// methodology as a clean SEQUENTIAL ordinal rather than preserving US
// News's own tie-bands. Deliberately does NOT touch the existing top-24
// (which use the original tie-preserving US News numbers, e.g. Yale tied
// at #4) to avoid mixing two different tie-handling conventions for the
// same schools — only applies to schools ranked 25-50 that had no rank on
// file at all.
//
// Usage: node --env-file=.env.local scripts/seed-overall-rankings-us-round2.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const RANK_SOURCE = 'U.S. News & World Report — 2026 Best National Universities (sequential reading via Ivy Coach)'

const NEW_SCHOOLS = [
  { name: 'University of California, Irvine', rank: 34, location: 'Irvine, CA', climate: 'Warm', sectors: ['Tech Hub', 'Research'], baselineSelectivity: 55, internshipProgram: 'Strong biotech and Orange County tech-corridor internship access.', requirements: ['SAT/ACT (test-optional)', 'UC application essays (PIQs)', 'Strong GPA in A-G coursework'], link: 'https://uci.edu', academicFields: ['Science & Technology / Research', 'Medicine & Health Sciences'] },
  { name: 'University of California, Santa Barbara', rank: 39, location: 'Santa Barbara, CA', climate: 'Warm', sectors: ['Research'], baselineSelectivity: 50, internshipProgram: 'Strong materials-science and marine-biology research placements.', requirements: ['SAT/ACT (test-optional)', 'UC application essays (PIQs)', 'Strong GPA in A-G coursework'], link: 'https://www.ucsb.edu', academicFields: ['Science & Technology / Research', 'Environmental Science & Sustainability'] },
]

const RANK_UPDATES = [
  { name: 'University of North Carolina at Chapel Hill', rank: 25 },
  { name: 'University of Virginia', rank: 26 },
  { name: 'University of Southern California', rank: 27 },
  { name: 'University of California, San Diego', rank: 28 },
  { name: 'University of Florida', rank: 29 },
  { name: 'University of Texas at Austin', rank: 30 },
  { name: 'Georgia Institute of Technology', rank: 31 },
  { name: 'New York University', rank: 32 },
  { name: 'University of California, Davis', rank: 33 },
  { name: 'University of California, Irvine', rank: 34 },
  { name: 'Boston College', rank: 35 },
  { name: 'Tufts University', rank: 36 },
  { name: 'University of Illinois Urbana-Champaign', rank: 37 },
  { name: 'University of Wisconsin-Madison', rank: 38 },
  { name: 'University of California, Santa Barbara', rank: 39 },
  { name: 'Ohio State University', rank: 40 },
  { name: 'Boston University', rank: 41 },
  { name: 'Rutgers University-New Brunswick', rank: 42 },
  { name: 'University of Maryland, College Park', rank: 43 },
  { name: 'University of Washington', rank: 44 },
  { name: 'University of Rochester', rank: 45 },
  { name: 'Lehigh University', rank: 46 },
  { name: 'Northeastern University', rank: 47 },
  { name: 'Purdue University', rank: 48 },
  { name: 'University of Georgia', rank: 49 },
  { name: 'Wake Forest University', rank: 50 },
]

let inserted = 0
for (const school of NEW_SCHOOLS) {
  const existing = await sql`SELECT id FROM universities WHERE name = ${school.name} AND country = 'US'`
  if (existing.length > 0) continue
  const [row] = await sql`
    INSERT INTO universities (
      name, country, location, climate, sectors, "baselineSelectivity",
      "internshipProgram", requirements, link, "academicFields",
      "rankSource", "rankValue"
    )
    VALUES (
      ${school.name}, 'US', ${school.location}, ${school.climate},
      ${JSON.stringify(school.sectors)}::jsonb, ${school.baselineSelectivity},
      ${school.internshipProgram}, ${JSON.stringify(school.requirements)}::jsonb,
      ${school.link}, ${JSON.stringify(school.academicFields)}::jsonb,
      ${RANK_SOURCE}, ${school.rank}
    )
    RETURNING id
  `
  console.log(`Added ${school.name} (US), id ${row.id}`)
  inserted++
}

let updated = 0
let skipped = []
for (const entry of RANK_UPDATES) {
  const rows = await sql`SELECT id, "rankValue" FROM universities WHERE name = ${entry.name} AND country = 'US'`
  if (rows.length === 0) {
    skipped.push(entry.name)
    continue
  }
  if (rows[0].rankValue != null) continue // already ranked by the new-school insert above
  await sql`UPDATE universities SET "rankSource" = ${RANK_SOURCE}, "rankValue" = ${entry.rank} WHERE id = ${rows[0].id}`
  updated++
}

console.log(`\nInserted ${inserted} new US schools, updated rank for ${updated} existing US schools.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
