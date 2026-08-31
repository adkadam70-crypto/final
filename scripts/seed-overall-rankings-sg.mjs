// General/overall ranking pass for Singapore — fills universities.rankSource/
// rankValue, same role as the US/India/UK/AU scripts.
//
// Source: QS World University Rankings 2026. Unlike UK/AU, Singapore has no
// domestic league table at all, so this derives a Singapore-only ORDINAL
// (1-5) from each school's real QS global position — not the raw global
// number itself — for the same reason as everywhere else in this pass: a
// "Top 50" preference threshold must mean the same kind of thing ("top N in
// this country's own landscape") regardless of which country a student
// targets, and Singapore's own institutions being globally elite (NUS #8,
// NTU #12) would otherwise trivially blow past a raw-number comparison in a
// way a domestic-only rank wouldn't.
//
// The 5 ranked schools here are Singapore's five public autonomous
// universities plus SUTD (also public) — genuinely close to the full
// "serious" landscape our catalog has for this country. The remaining 3
// catalog entries (James Cook University Singapore, Singapore Institute of
// Management, PSB Academy) are private, EduTrust-certified institutions that
// don't participate in QS/THE at all — left unranked (null) rather than
// forcing a fabricated position onto a fundamentally different category of
// institution.
//
// Usage: node --env-file=.env.local scripts/seed-overall-rankings-sg.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const ENTRIES = [
  { name: 'National University of Singapore', rank: 1, source: 'QS World University Rankings 2026 — #8 globally, #1 among Singapore institutions' },
  { name: 'Nanyang Technological University', rank: 2, source: 'QS World University Rankings 2026 — #12 globally, #2 among Singapore institutions' },
  { name: 'Singapore Management University', rank: 3, source: 'QS World University Rankings 2026 — #511 globally, #3 among Singapore institutions' },
  { name: 'Singapore University of Technology and Design', rank: 4, source: 'QS World University Rankings 2026 — #519 globally, #4 among Singapore institutions' },
  { name: 'Singapore Institute of Technology', rank: 5, source: "QS World University Rankings 2026 — ~#801 band globally, #5 among Singapore institutions; Singapore's fifth publicly-funded autonomous university" },
]

const RANK_SOURCE_URL = 'https://www.topuniversities.com/world-university-rankings?countries=sg&region=Asia'

let updated = 0
let skipped = []

for (const entry of ENTRIES) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${entry.name} AND country = 'SG'`
  if (rows.length === 0) {
    skipped.push(entry.name)
    continue
  }
  await sql`UPDATE universities SET "rankSource" = ${entry.source}, "rankValue" = ${entry.rank} WHERE id = ${rows[0].id}`
  updated++
}

console.log(`Updated overall rank for ${updated} SG schools.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)

const [{ count }] = await sql`SELECT count(*) FROM universities WHERE country = 'SG'`
console.log(`SG catalog size: ${count}. Left unranked (private/non-QS institutions): ${count - updated}.`)
