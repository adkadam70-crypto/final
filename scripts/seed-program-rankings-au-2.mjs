// Redo + expand Australia program rankings after a deeper research pass
// found Times Higher Education's dedicated per-subject Australia pages
// (best-universities-{subject}-australia / best-universities-australia-
// {subject}-degrees — THE's URL slugs aren't consistent, but both patterns
// work), which give full, clean, single-source ordered lists for Business
// (36 schools), Engineering (30), and Computer Science (30) — much more
// complete than the first pass's QS-derived Computer Science entries (only
// 9 rows, mixing methodology with the new Business/Engineering data).
//
// This DELETES the first pass's QS-based Computer Science rows and
// replaces them with THE-based ones, so all three AU fields share one
// consistent source/methodology, same principle as everywhere else in this
// project (UK uses Complete University Guide throughout, US uses US News
// throughout).
//
// rankValue is THE's own Australia-only ordinal directly (no conversion
// needed — THE already publishes a domestic list, unlike the raw global
// numbers QS reports), so it's directly comparable to how the AU general
// ranking already works (same source, seed-overall-rankings-au.mjs).
//
// "Adelaide University" in THE's subject tables is the same institution
// as "University of Adelaide" in this catalog (2026 merger with the
// University of South Australia) — matched accordingly below.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-au-2.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank) {
  return Math.max(15, Math.min(99, Math.round(100 - (rank - 1) * 1.1)))
}

// Delete the first pass's QS-derived CS rows before re-inserting THE-based ones.
const deleted = await sql`
  DELETE FROM "programRankings"
  WHERE field = 'Computer Science & IT'
    AND "universityId" IN (SELECT id FROM universities WHERE country = 'AU')
  RETURNING id
`
console.log(`Removed ${deleted.length} first-pass QS-based AU Computer Science rows.`)

const FIELDS = [
  {
    field: 'Business',
    rankSource: 'Times Higher Education — Best Universities in Australia for Business 2026',
    rankSourceUrl: 'https://www.timeshighereducation.com/student/best-universities/best-universities-business-degrees-australia',
    entries: [
      { name: 'Macquarie University', rank: 7 },
      { name: 'Curtin University', rank: 15 },
      { name: 'Deakin University', rank: 15 },
      { name: 'Bond University', rank: 28 },
      { name: 'La Trobe University', rank: 15 },
      { name: 'Western Sydney University', rank: 21 },
      { name: 'Victoria University', rank: 28 },
    ],
  },
  {
    field: 'Engineering',
    rankSource: 'Times Higher Education — Best Universities in Australia for Engineering 2026',
    rankSourceUrl: 'https://www.timeshighereducation.com/student/best-universities/best-universities-australia-engineering-degrees',
    entries: [
      { name: 'University of Adelaide', rank: 6 },
      { name: 'Curtin University', rank: 11 },
      { name: 'Queensland University of Technology', rank: 13 },
      { name: 'University of Wollongong', rank: 6 },
      { name: 'University of Newcastle', rank: 17 },
      { name: 'Federation University Australia', rank: 29 },
    ],
  },
  {
    field: 'Computer Science & IT',
    rankSource: 'Times Higher Education — Best Universities in Australia for Computer Science 2026',
    rankSourceUrl: 'https://www.timeshighereducation.com/student/best-universities/best-universities-australia-computer-science-degrees',
    entries: [
      { name: 'University of Adelaide', rank: 7 },
      { name: 'University of Technology Sydney', rank: 6 },
      { name: 'Macquarie University', rank: 10 },
      { name: 'Curtin University', rank: 24 },
      { name: 'Queensland University of Technology', rank: 13 },
      { name: 'Deakin University', rank: 9 },
      { name: 'University of Wollongong', rank: 18 },
      { name: 'University of Newcastle', rank: 20 },
      { name: 'University of Tasmania', rank: 27 },
      { name: 'Charles Sturt University', rank: 30 },
      { name: 'Federation University Australia', rank: 28 },
      { name: 'Charles Darwin University', rank: 17 },
    ],
  },
]

let inserted = 0
let skipped = []

for (const { field, rankSource, rankSourceUrl, entries } of FIELDS) {
  for (const entry of entries) {
    const rows = await sql`SELECT id FROM universities WHERE name = ${entry.name} AND country = 'AU'`
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

console.log(`Inserted ${inserted} AU program ranking rows (Business/Engineering/Computer Science).`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
