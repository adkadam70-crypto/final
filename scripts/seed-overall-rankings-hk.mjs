// General/overall ranking pass for Hong Kong — fills universities.rankSource/
// rankValue, same role as the other seed-overall-rankings-*.mjs scripts.
//
// Source: QS World University Rankings 2026 for the 5 schools that place in
// the QS World table (HKU, CUHK, HKUST, PolyU, CityU); QS Asia University
// Rankings 2026 for the 4 that only place in QS's broader regional table
// (Baptist, Shue Yan, Lingnan, Metropolitan). Same reasoning as Singapore:
// rankValue is a Hong-Kong-only ORDINAL (1-9), not the raw global/regional
// number, so a "Top 50" threshold means the same thing across countries.
// Hong Kong's 10-school catalog is close to the territory's entire real
// university landscape (8 UGC-funded + these 2 self-financing ones), so this
// ordinal is close to an absolute fact, not an artifact of catalog curation.
//
// The Education University of Hong Kong could not be resolved to a QS
// position in either table after checking and is deliberately left unranked
// (null) rather than guessed.
//
// Usage: node --env-file=.env.local scripts/seed-overall-rankings-hk.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const ENTRIES = [
  { name: 'University of Hong Kong', rank: 1, source: 'QS World University Rankings 2026 — #11 globally, #1 among Hong Kong institutions' },
  { name: 'Chinese University of Hong Kong', rank: 2, source: 'QS World University Rankings 2026 — #32 globally, #2 among Hong Kong institutions' },
  { name: 'Hong Kong University of Science and Technology', rank: 3, source: 'QS World University Rankings 2026 — #44 globally, #3 among Hong Kong institutions' },
  { name: 'Hong Kong Polytechnic University', rank: 4, source: 'QS World University Rankings 2026 — #54 globally, #4 among Hong Kong institutions' },
  { name: 'City University of Hong Kong', rank: 5, source: 'QS World University Rankings 2026 — #63 globally, #5 among Hong Kong institutions' },
  { name: 'Hong Kong Baptist University', rank: 6, source: 'QS Asia University Rankings 2026 — #53 in Asia, #6 among Hong Kong institutions' },
  { name: 'Hong Kong Shue Yan University', rank: 7, source: 'QS Asia University Rankings 2026 — #360 in Asia (top-ranked private university in Hong Kong), #7 among Hong Kong institutions' },
  { name: 'Lingnan University', rank: 8, source: 'QS Asia University Rankings 2026 — #581 in Asia, #8 among Hong Kong institutions' },
  { name: 'Hong Kong Metropolitan University', rank: 9, source: 'QS Asia University Rankings 2026 — #781-790 band in Asia, #9 among Hong Kong institutions' },
]

const RANK_SOURCE_URL = 'https://www.topuniversities.com/asia-university-rankings?countries=hk'

let updated = 0
let skipped = []

for (const entry of ENTRIES) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${entry.name} AND country = 'HK'`
  if (rows.length === 0) {
    skipped.push(entry.name)
    continue
  }
  await sql`UPDATE universities SET "rankSource" = ${entry.source}, "rankValue" = ${entry.rank} WHERE id = ${rows[0].id}`
  updated++
}

console.log(`Updated overall rank for ${updated} HK schools.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)

const [{ count }] = await sql`SELECT count(*) FROM universities WHERE country = 'HK'`
console.log(`HK catalog size: ${count}. Left unranked (Education University of HK, unresolved): ${count - updated}.`)
