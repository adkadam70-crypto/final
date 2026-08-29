// Global (cross-country) ranking pass — QS World University Rankings 2026,
// top 20. Scope is deliberately capped at 20: "globally ranked" only reads
// as a credible, recognizable claim to a general audience at roughly this
// tier — past ~30 it stops meaning anything to most people, and verifying
// each entry individually (the same discipline used everywhere else this
// session) gets expensive fast past a clean top-20/25 list.
//
// Cross-checked: an initial search summary implied Harvard/Cambridge sat at
// #4/#5, but a directly-quoted complete list put Oxford at #4 — verified
// via a second independent search (including ox.ac.uk itself) before using
// it. Three entries in the real top 20 (ETH Zurich #7, Peking #14, Tsinghua
// #17) aren't in any of our six countries and are skipped.
//
// DISPLAY ONLY — see lib/db/schema.ts comment on globalRankValue. Never
// referenced by the match/analysis AI prompts.
//
// Usage: node --env-file=.env.local scripts/seed-global-rankings.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const SOURCE = 'QS World University Rankings 2026'

const ENTRIES = [
  { name: 'Massachusetts Institute of Technology', country: 'US', rank: 1 },
  { name: 'Imperial College London', country: 'UK', rank: 2 },
  { name: 'Stanford University', country: 'US', rank: 3 },
  { name: 'University of Oxford', country: 'UK', rank: 4 },
  { name: 'Harvard University', country: 'US', rank: 5 },
  { name: 'University of Cambridge', country: 'UK', rank: 6 },
  { name: 'National University of Singapore', country: 'SG', rank: 8 },
  { name: 'University College London', country: 'UK', rank: 9 },
  { name: 'California Institute of Technology', country: 'US', rank: 10 },
  { name: 'University of Hong Kong', country: 'HK', rank: 11 },
  { name: 'Nanyang Technological University', country: 'SG', rank: 12 },
  { name: 'University of Chicago', country: 'US', rank: 13 },
  { name: 'University of Pennsylvania', country: 'US', rank: 15 },
  { name: 'Cornell University', country: 'US', rank: 16 },
  { name: 'University of California, Berkeley', country: 'US', rank: 18 },
  { name: 'University of Melbourne', country: 'AU', rank: 19 },
  { name: 'University of New South Wales', country: 'AU', rank: 20 },
]

let updated = 0
let skipped = []

for (const entry of ENTRIES) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${entry.name} AND country = ${entry.country}`
  if (rows.length === 0) {
    skipped.push(`${entry.name} (${entry.country})`)
    continue
  }
  await sql`UPDATE universities SET "globalRankValue" = ${entry.rank}, "globalRankSource" = ${SOURCE} WHERE id = ${rows[0].id}`
  updated++
}

console.log(`Updated global rank for ${updated} schools across ${new Set(ENTRIES.map(e => e.country)).size} countries.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
