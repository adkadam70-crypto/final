// General/overall ranking pass for India — NIRF (National Institutional
// Ranking Framework), "Universities" category, 2025 edition (the 2026
// edition had not been published as of this run — confirmed via search,
// not assumed). NIRF is India's official government ranking (Ministry of
// Education), arguably the single most credible source available for this
// country. Note: IITs/IIMs/AIIMS are NOT in this "Universities" category —
// NIRF ranks them separately under Engineering/Management/Medical, which is
// its own real instance of "differs by program" and is handled in
// seed-program-rankings-india.mjs, not here.
//
// Usage: node --env-file=.env.local scripts/seed-overall-rankings-india.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const RANK_SOURCE = 'NIRF (National Institutional Ranking Framework) 2025 — Universities category'
const RANK_SOURCE_URL = 'https://news.careers360.com/nirf-ranking-2025-university-iisc-bangalore-top-jnu-mahe-manipal-bits-pilani-du-amrita-vishwa-vidyapeetham-amu-jamia-millia'

const ENTRIES = [
  { name: 'Indian Institute of Science', rank: 1 },
  { name: 'Jawaharlal Nehru University', rank: 2 },
  { name: 'Manipal Academy of Higher Education', rank: 3 },
  { name: 'Jamia Millia Islamia', rank: 4 },
  { name: 'University of Delhi', rank: 5 },
  { name: 'Banaras Hindu University', rank: 6 },
  { name: 'Birla Institute of Technology and Science, Pilani', rank: 7 },
  { name: 'Amrita Vishwa Vidyapeetham', rank: 8 },
  { name: 'Jadavpur University', rank: 9 },
  { name: 'Aligarh Muslim University', rank: 10 },
  { name: 'SRM Institute of Science and Technology', rank: 11 },
  { name: 'Vellore Institute of Technology', rank: 14 },
  { name: 'Kalinga Institute of Industrial Technology', rank: 17 },
  { name: 'University of Hyderabad', rank: 18 },
  { name: 'Chandigarh University', rank: 19 },
  { name: 'Anna University', rank: 20 },
]

let updated = 0
let skipped = []

for (const entry of ENTRIES) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${entry.name} AND country = 'IN'`
  if (rows.length === 0) {
    skipped.push(entry.name)
    continue
  }
  await sql`UPDATE universities SET "rankSource" = ${RANK_SOURCE}, "rankValue" = ${entry.rank} WHERE id = ${rows[0].id}`
  updated++
}

console.log(`Updated overall rank for ${updated} India schools.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
