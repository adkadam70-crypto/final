// General/overall ranking pass for Australia — fills universities.rankSource/
// rankValue, same role as the US/India/UK scripts.
//
// Source: Times Higher Education's "Best Universities in Australia" student
// guide — chosen because, unlike the UK or US, Australia doesn't have a
// strong domestic-league-table tradition (no Complete-University-Guide or
// US-News equivalent); THE's own Australia-specific re-ranking (a genuine
// ordinal among ~37 Australian institutions, not a raw global QS/THE number)
// is the closest credible equivalent and keeps the same "ordinal among this
// country's own universities" semantics as every other country here.
//
// Ties are real and expected — THE's list bands many mid-tier Australian
// universities together (e.g. several schools tied at 14, 21, 26, 33), which
// is normal for this kind of table past the top ~10, not a data error.
//
// Gaps: University of New England and Torrens University Australia did not
// appear in THE's list at all and are left unranked (null) rather than
// guessed.
//
// Usage: node --env-file=.env.local scripts/seed-overall-rankings-au.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const RANK_SOURCE = 'Times Higher Education — Best Universities in Australia 2026'
const RANK_SOURCE_URL = 'https://www.timeshighereducation.com/student/best-universities/best-universities-australia'

const ENTRIES = [
  { name: 'University of Melbourne', rank: 1 },
  { name: 'University of Sydney', rank: 2 },
  { name: 'Monash University', rank: 3 },
  { name: 'Australian National University', rank: 4 },
  { name: 'University of New South Wales', rank: 5 },
  { name: 'University of Queensland', rank: 6 },
  { name: 'University of Adelaide', rank: 7 },
  { name: 'University of Technology Sydney', rank: 8 },
  { name: 'University of Western Australia', rank: 9 },
  { name: 'Macquarie University', rank: 10 },
  { name: 'Deakin University', rank: 11 },
  { name: 'Queensland University of Technology', rank: 11 },
  { name: 'University of Wollongong', rank: 11 },
  { name: 'Curtin University', rank: 14 },
  { name: 'Griffith University', rank: 14 },
  { name: 'La Trobe University', rank: 14 },
  { name: 'RMIT University', rank: 14 },
  { name: 'University of Newcastle', rank: 14 },
  { name: 'University of Tasmania', rank: 14 },
  { name: 'Flinders University', rank: 21 },
  { name: 'Western Sydney University', rank: 21 },
  { name: 'Edith Cowan University', rank: 23 },
  { name: 'James Cook University', rank: 23 },
  { name: 'Australian Catholic University', rank: 26 },
  { name: 'Bond University', rank: 26 },
  { name: 'Charles Darwin University', rank: 26 },
  { name: 'Murdoch University', rank: 26 },
  { name: 'Southern Cross University', rank: 26 },
  { name: 'University of Canberra', rank: 26 },
  { name: 'Federation University Australia', rank: 33 },
  { name: 'University of the Sunshine Coast', rank: 33 },
  { name: 'Victoria University', rank: 33 },
  { name: 'Charles Sturt University', rank: 36 },
]

let updated = 0
let skipped = []

for (const entry of ENTRIES) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${entry.name} AND country = 'AU'`
  if (rows.length === 0) {
    skipped.push(entry.name)
    continue
  }
  await sql`UPDATE universities SET "rankSource" = ${RANK_SOURCE}, "rankValue" = ${entry.rank} WHERE id = ${rows[0].id}`
  updated++
}

console.log(`Updated overall rank for ${updated} AU schools.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)

const [{ count }] = await sql`SELECT count(*) FROM universities WHERE country = 'AU'`
console.log(`AU catalog size: ${count}. Left unranked (incl. New England, Torrens, unresolved): ${count - updated}.`)
