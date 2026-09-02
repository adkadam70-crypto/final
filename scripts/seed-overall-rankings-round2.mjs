// Rank backfill pass #2 — closes gaps in universities.rankValue found while
// auditing catalog coverage toward a real "Top 200" per country (the
// preferredRank filter in match.ts needs a real rankValue to work against).
// Same per-country source conventions as the original seed-overall-rankings-*
// scripts; only touches schools that were previously unranked.
//
// AU: Times Higher Education — Best Universities in Australia 2026 (same
// source as seed-overall-rankings-au.mjs). University of New England and
// Torrens University Australia remain deliberately unranked — confirmed
// (again) absent from THE's list, not an oversight.
//
// SG: Singapore University of Social Sciences (SUSS) has no QS World
// position but does have a real QS Asia University Rankings 2026 position
// (#=627 in Asia) — used to place it at Singapore rank #6, directly below
// Singapore Institute of Technology's QS World band. James Cook University
// Singapore, PSB Academy, and Singapore Institute of Management remain
// deliberately unranked (private, non-QS institutions, per the existing
// script's documented decision).
//
// HK: The Hang Seng University of Hong Kong has a real QS Asia University
// Rankings 2026 position (#157 in the Greater China sub-region) — added at
// HK rank #10. The Education University of Hong Kong remains deliberately
// unranked (confirmed absent from QS World/Asia, per the existing script).
//
// UK: University of Glasgow — resolvable this time via a direct single-page
// fetch (Complete University Guide 2027, rank 29); the original script left
// it null after two inconsistent bulk-table reads.
//
// Usage: node --env-file=.env.local scripts/seed-overall-rankings-round2.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const ENTRIES = [
  { name: 'Central Queensland University', country: 'AU', rank: 26, source: 'Times Higher Education — Best Universities in Australia 2026' },
  { name: 'Swinburne University of Technology', country: 'AU', rank: 14, source: 'Times Higher Education — Best Universities in Australia 2026' },
  { name: 'University of Southern Queensland', country: 'AU', rank: 23, source: 'Times Higher Education — Best Universities in Australia 2026' },
  { name: 'University of Notre Dame Australia', country: 'AU', rank: 37, source: 'Times Higher Education — Best Universities in Australia 2026' },

  { name: 'Singapore University of Social Sciences', country: 'SG', rank: 6, source: 'QS Asia University Rankings 2026 — #=627 in Asia (no QS World position), #6 among Singapore institutions' },

  { name: 'The Hang Seng University of Hong Kong', country: 'HK', rank: 10, source: 'QS Asia University Rankings 2026 — #157 in the Greater China sub-region, #10 among Hong Kong institutions' },

  { name: 'University of Glasgow', country: 'UK', rank: 29, source: 'The Complete University Guide 2027 — UK league table' },
]

let updated = 0
let skipped = []

for (const entry of ENTRIES) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${entry.name} AND country = ${entry.country}`
  if (rows.length === 0) {
    skipped.push(entry.name)
    continue
  }
  await sql`UPDATE universities SET "rankSource" = ${entry.source}, "rankValue" = ${entry.rank} WHERE id = ${rows[0].id}`
  updated++
}

console.log(`Updated overall rank for ${updated} schools.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
