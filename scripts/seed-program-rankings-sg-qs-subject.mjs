// First real program-ranking pass for Singapore. Only 16 universities in
// the catalog, and only NUS/NTU/SMU are globally subject-ranked (the rest
// are private/vocational institutions with no public subject ranking) —
// so full coverage isn't realistic, but these three are researched
// precisely via QS World University Rankings by Subject 2026.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-sg-qs-subject.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank) {
  // World subject rank, not a curated ~150-school pool — see the DE script
  // for the same reasoning. These are all very high (top-10) world ranks,
  // so even a steep scale keeps them correctly near the top of the range.
  return Math.max(15, Math.min(99, Math.round(100 - (rank - 1) * 0.42)))
}

const SOURCE = 'QS World University Rankings by Subject 2026'
const NOTE = 'World subject rank (not a country-specific pool) — programSelectivity here is our own derived scale for comparability with other rankings, not itself a published figure.'

const DATA = [
  ['National University of Singapore', 'Computer Science & IT', 4, 'https://www.topuniversities.com/university-subject-rankings/computer-science-information-systems'],
  ['National University of Singapore', 'Data Science & Analytics', 3, 'https://www.qs.com/insights/qs-world-university-ranking-subject'],
  ['National University of Singapore', 'Social Sciences', 8, 'https://www.topuniversities.com/university-subject-rankings/sociology'],
  ['Nanyang Technological University', 'Engineering', 10, 'https://www.topuniversities.com/university-subject-rankings/engineering-technology'],
  ['Nanyang Technological University', 'Communications & Media', 2, 'https://www.topuniversities.com/university-subject-rankings/communication-media-studies'],
  ['Nanyang Technological University', 'Data Science & Analytics', 4, 'https://www.qs.com/insights/qs-world-university-ranking-subject'],
  ['Nanyang Technological University', 'Computer Science & IT', 9, 'https://www.topuniversities.com/university-subject-rankings/computer-science-information-systems'],
  ['Singapore Management University', 'Law', 56, 'https://www.topuniversities.com/university-subject-rankings/law-legal-studies'],
]

let inserted = 0
const skipped = []

for (const [name, field, rank, url] of DATA) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'SG'`
  if (rows.length === 0) {
    skipped.push(`${name} (${field})`)
    continue
  }
  const universityId = rows[0].id
  const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${universityId} AND field = ${field} AND "rankSource" = ${SOURCE}`
  if (existing.length > 0) continue

  await sql`
    INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (${universityId}, ${field}, ${rank}, ${SOURCE}, ${url}, ${selectivityFromRank(rank)}, ${NOTE})
  `
  inserted++
}

console.log(`Inserted ${inserted} program-ranking rows.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
