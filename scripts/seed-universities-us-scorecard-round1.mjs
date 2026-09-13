// Bulk US catalog expansion sourced directly from the U.S. Dept of
// Education College Scorecard API (bachelor's-predominant, operating
// institutions) — see fetch-scorecard.mjs for the raw pull.
//
// Filtered to: not already in the catalog (token-overlap name matching, not
// exact string match — Scorecard names carry "The"/"-Main Campus"/campus
// suffixes that a naive exact match would treat as new schools when they're
// really duplicates), not for-profit, student body 500-45,000 (excludes
// tiny/niche and excludes online-heavy mega-institutions like SNHU/Liberty/
// GCU/WGU, which don't fit this app's "which real campus should I apply to"
// use case even though they're real accredited schools), and a real,
// published overall admission rate (no rate = no entry this round).
//
// acceptanceRate/link are real Scorecard fields. climate/sectors/
// internshipProgram/requirements/academicFields are NOT individually
// sourced per school (unlike the hand-researched top-tier entries
// elsewhere in this catalog) — they're reasonable, honest defaults for a
// comprehensive four-year US university, not fabricated specifics. Good
// enough for this catalog's "real target/safety school" role; can be
// hand-upgraded later the way earlier rounds did for higher-profile schools.
//
// Usage: node --env-file=.env.local scripts/seed-universities-us-scorecard-round1.mjs

import { neon } from '@neondatabase/serverless'
import fs from 'fs'

const sql = neon(process.env.DATABASE_URL)
const RATE_SOURCE = 'U.S. Department of Education College Scorecard (2024-25 data)'

const batch = JSON.parse(fs.readFileSync('/tmp/gen/us_batch1.json', 'utf8'))

let inserted = 0
let skipped = []

for (const s of batch) {
  const existing = await sql`SELECT id FROM universities WHERE name = ${s.name} AND country = 'US'`
  if (existing.length > 0) {
    skipped.push(s.name)
    continue
  }
  await sql`
    INSERT INTO universities (
      name, country, location, climate, sectors, "baselineSelectivity",
      "internshipProgram", requirements, link, "academicFields",
      "actualAcceptanceRate", "acceptanceRateSource"
    )
    VALUES (
      ${s.name}, 'US', ${s.location}, ${s.climate}, ${JSON.stringify(s.sectors)}::jsonb, ${s.baselineSelectivity},
      ${s.internshipProgram}, ${JSON.stringify(s.requirements)}::jsonb, ${s.link}, ${JSON.stringify(s.academicFields)}::jsonb,
      ${s.acceptanceRate}, ${RATE_SOURCE}
    )
  `
  inserted++
}

console.log(`Inserted ${inserted} new US universities.`)
if (skipped.length) console.log(`Already existed (skipped): ${skipped.join(', ')}`)
