// India rank backfill pass #2 — extends universities.rankValue coverage
// using the full NIRF 2025 University-category rank 1-100 table (the
// original seed-overall-rankings-india.mjs only had ranks 1-20 available
// at the time). Same source/category as that script; this is purely an
// extension, not a re-derivation — does not touch already-ranked schools.
//
// Usage: node --env-file=.env.local scripts/seed-overall-rankings-india-round2.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const RANK_SOURCE = 'NIRF (National Institutional Ranking Framework) 2025 — Universities category'

// Rank 1-100, full table. Name strings are NIRF's own wording; matched
// against the catalog by fuzzy (case-insensitive substring) match below,
// since catalog names don't always match NIRF's exact legal name.
const ENTRIES = [
  { rank: 1, name: 'Indian Institute of Science' },
  { rank: 2, name: 'Jawaharlal Nehru University' },
  { rank: 3, name: 'Manipal Academy of Higher Education' },
  { rank: 4, name: 'Jamia Millia Islamia' },
  { rank: 5, name: 'University of Delhi' },
  { rank: 6, name: 'Banaras Hindu University' },
  { rank: 7, name: 'Birla Institute of Technology and Science, Pilani' },
  { rank: 8, name: 'Amrita Vishwa Vidyapeetham' },
  { rank: 9, name: 'Jadavpur University' },
  { rank: 10, name: 'Aligarh Muslim University' },
  { rank: 11, name: 'SRM Institute of Science and Technology' },
  { rank: 14, name: 'Vellore Institute of Technology' },
  { rank: 17, name: 'Kalinga Institute of Industrial Technology' },
  { rank: 18, name: 'University of Hyderabad' },
  { rank: 19, name: 'Chandigarh University' },
  { rank: 20, name: 'Anna University' },
  { rank: 22, name: 'Amity University' },
  { rank: 23, name: 'Andhra University' },
  { rank: 24, name: 'Symbiosis International University' },
  { rank: 26, name: 'Thapar Institute of Engineering and Technology' },
  { rank: 26, name: 'Koneru Lakshmaiah Education Foundation' },
  { rank: 30, name: 'Osmania University' },
  { rank: 31, name: 'Lovely Professional University' },
  { rank: 32, name: 'Cochin University of Science and Technology' },
  { rank: 35, name: 'Panjab University' },
  { rank: 40, name: 'Mumbai University (Institute of Chemical Technology)' },
  { rank: 41, name: 'D. Y. Patil University' },
  { rank: 42, name: 'Delhi Technological University' },
  { rank: 45, name: 'University of Petroleum and Energy Studies' },
  { rank: 57, name: 'Shiv Nadar University' },
  { rank: 59, name: 'Bharati Vidyapeeth (Deemed to be University)' },
  { rank: 62, name: 'Jain University' },
  { rank: 63, name: 'Christ University' },
  { rank: 72, name: 'Tata Institute of Social Sciences' },
  { rank: 74, name: 'Gujarat University' },
  { rank: 87, name: 'Sharda University' },
  { rank: 93, name: 'Guru Gobind Singh Indraprastha University' },
]

let updated = 0
let skipped = []

for (const entry of ENTRIES) {
  const rows = await sql`SELECT id, "rankValue" FROM universities WHERE country = 'IN' AND name ILIKE ${'%' + entry.name + '%'}`
  if (rows.length === 0) {
    skipped.push(entry.name)
    continue
  }
  if (rows[0].rankValue != null) continue // already ranked, don't overwrite
  await sql`UPDATE universities SET "rankSource" = ${RANK_SOURCE}, "rankValue" = ${entry.rank} WHERE id = ${rows[0].id}`
  updated++
}

console.log(`Updated overall rank for ${updated} India schools.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
