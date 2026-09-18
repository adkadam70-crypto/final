// Extends India NIRF coverage with the 2024 edition (distinct from the 2025
// NIRF rows already seeded) across Pharmacy, Dental, Engineering, and
// Management — sourced from a Gemini research batch. Pharmacy (ranks
// 30-50, collegedekho.com) and Engineering (ranks 50-65, buddy4study.com)
// were independently re-verified via WebFetch and matched Gemini's numbers
// exactly, row for row. Dental (collegementor.com) and Management
// (shiksha.com) could not be re-fetched this round — one page didn't
// render its table content, the other returned 403 — so those two
// categories rely on this batch's proven accuracy elsewhere rather than a
// fresh per-row check; flagged in their notes.
//
// Several candidate rows were deliberately dropped as unsafe name matches:
// "SVKM's Dr. Bhanuben Nanavati College of Pharmacy" is a different
// specific college from "SVKM's Narsee Monjee Institute of Management
// Studies" (same parent trust, different institution) — matching it to
// NMIMS would be exactly the kind of cross-institution false positive
// caught earlier this session. Same logic for "Manav Rachna International
// Institute of Research and Studies" vs. the catalog's separate "Manav
// Rachna University" entity. A large number of other candidates (IIT
// Bhubaneswar, IIT Tirupati, IIT Jammu, IIT Palakkad, IISST, several named
// business schools) simply aren't in this catalog at all and were skipped
// rather than guessed onto a similarly-named entry.
//
// Two Dental rows map to a parent institution's name because the specific
// dental college is a real constituent of that parent (Chettinad Dental
// College under Chettinad Academy of Research and Education; Bharati
// Vidyapeeth Dental College under Bharati Vidyapeeth) — flagged in notes.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-in-nirf2024.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize = 100) {
  return Math.max(20, Math.min(97, Math.round(97 - (rank - 1) * (77 / poolSize))))
}

const PHARM_SOURCE = 'NIRF (National Institutional Ranking Framework) 2024 — Pharmacy category'
const PHARM_URL = 'https://www.collegedekho.com/articles/top-50-nirf-ranked-pharmacy-colleges-2024/'
const PHARM_NOTE = 'NIRF 2024 Pharmacy-category rank (distinct edition from the 2025 Pharmacy rows already on file) — shown under our broader Medicine & Health Sciences field. Verified directly against the cited page.'

const DENTAL_SOURCE = 'NIRF (National Institutional Ranking Framework) 2024 — Dental category'
const DENTAL_URL = 'https://www.collegementor.com/blogs/nirf-india-rankings-2024-list-of-top-40-dental-institutes-in-india'
const DENTAL_NOTE_BASE = 'NIRF 2024 Dental-category rank — shown under our broader Medicine & Health Sciences field. Not independently re-fetched this round (source page did not render); relying on this batch\'s proven accuracy on its other categories.'

const ENG_SOURCE = 'NIRF (National Institutional Ranking Framework) 2024 — Engineering category'
const ENG_URL = 'https://www.buddy4study.com/article/nirf-list-of-engineering-colleges-2024'
const ENG_NOTE = 'NIRF 2024 Engineering-category rank. Verified directly against the cited page.'

const MGMT_SOURCE = 'NIRF (National Institutional Ranking Framework) 2024 — Management category'
const MGMT_URL = 'https://www.shiksha.com/mba/articles/nirf-ranking-2024-top-mba-colleges-in-india-blogId-174803'
const MGMT_NOTE = 'NIRF 2024 Management-category rank — shown under our broader Business field. Not independently re-fetched this round (source page returned 403); relying on this batch\'s proven accuracy on its other categories.'

const DATA = [
  // Pharmacy -> Medicine & Health Sciences
  ['Shoolini University of Biotechnology and Management Sciences', 'Medicine & Health Sciences', 30, PHARM_SOURCE, PHARM_URL, PHARM_NOTE],
  ['Sri Ramachandra Institute of Higher Education and Research', 'Medicine & Health Sciences', 31, PHARM_SOURCE, PHARM_URL, PHARM_NOTE],
  ['Birla Institute of Technology, Ranchi', 'Medicine & Health Sciences', 32, PHARM_SOURCE, PHARM_URL, PHARM_NOTE],
  ['Andhra University', 'Medicine & Health Sciences', 34, PHARM_SOURCE, PHARM_URL, `${PHARM_NOTE} Maps to "AU College of Pharmaceutical Sciences", a constituent college of Andhra University.`],
  ['Nirma University', 'Medicine & Health Sciences', 37, PHARM_SOURCE, PHARM_URL, PHARM_NOTE],
  ['Dibrugarh University', 'Medicine & Health Sciences', 43, PHARM_SOURCE, PHARM_URL, PHARM_NOTE],
  ['Maharaja Sayajirao University of Baroda', 'Medicine & Health Sciences', 44, PHARM_SOURCE, PHARM_URL, PHARM_NOTE],
  ['Integral University', 'Medicine & Health Sciences', 45, PHARM_SOURCE, PHARM_URL, PHARM_NOTE],
  ['Punjabi University Patiala', 'Medicine & Health Sciences', 46, PHARM_SOURCE, PHARM_URL, PHARM_NOTE],
  ['Parul University', 'Medicine & Health Sciences', 47, PHARM_SOURCE, PHARM_URL, PHARM_NOTE],
  ['Galgotias University', 'Medicine & Health Sciences', 50, PHARM_SOURCE, PHARM_URL, PHARM_NOTE],

  // Dental -> Medicine & Health Sciences
  ['Chettinad Academy of Research and Education', 'Medicine & Health Sciences', 33, DENTAL_SOURCE, DENTAL_URL, `${DENTAL_NOTE_BASE} Maps to "Chettinad Dental College and Research Institute", a constituent of this academy.`],
  ['Bharati Vidyapeeth (Deemed to be University)', 'Medicine & Health Sciences', 36, DENTAL_SOURCE, DENTAL_URL, `${DENTAL_NOTE_BASE} Maps to "Bharati Vidyapeeth Dental College and Hospital, Pune", a constituent of this university.`],

  // Engineering
  ['Lovely Professional University', 'Engineering', 50, ENG_SOURCE, ENG_URL, ENG_NOTE],
  ['Graphic Era University', 'Engineering', 52, ENG_SOURCE, ENG_URL, ENG_NOTE],
  ['Saveetha Institute of Medical and Technical Sciences', 'Engineering', 53, ENG_SOURCE, ENG_URL, ENG_NOTE],
  ['National Institute of Technology Patna', 'Engineering', 55, ENG_SOURCE, ENG_URL, ENG_NOTE],
  ['Manipal Institute of Technology', 'Engineering', 56, ENG_SOURCE, ENG_URL, ENG_NOTE],
  ['Netaji Subhas University of Technology', 'Engineering', 57, ENG_SOURCE, ENG_URL, ENG_NOTE],
  ['Sardar Vallabhbhai National Institute of Technology', 'Engineering', 59, ENG_SOURCE, ENG_URL, ENG_NOTE],
  ['Motilal Nehru National Institute of Technology Allahabad', 'Engineering', 60, ENG_SOURCE, ENG_URL, ENG_NOTE],
  ['Manipal University Jaipur', 'Engineering', 65, ENG_SOURCE, ENG_URL, ENG_NOTE],

  // Management -> Business
  ['National Institute of Technology Tiruchirappalli', 'Business', 51, MGMT_SOURCE, MGMT_URL, MGMT_NOTE],
  ['Chitkara University', 'Business', 54, MGMT_SOURCE, MGMT_URL, MGMT_NOTE],
  ['Christ University', 'Business', 60, MGMT_SOURCE, MGMT_URL, MGMT_NOTE],
  ['Siksha O Anusandhan', 'Business', 62, MGMT_SOURCE, MGMT_URL, MGMT_NOTE],
  ['Guru Gobind Singh Indraprastha University', 'Business', 65, MGMT_SOURCE, MGMT_URL, MGMT_NOTE],
  ['Kalinga Institute of Industrial Technology', 'Business', 67, MGMT_SOURCE, MGMT_URL, MGMT_NOTE],
  ['Malaviya National Institute of Technology Jaipur', 'Business', 68, MGMT_SOURCE, MGMT_URL, MGMT_NOTE],
  ['Anna University', 'Business', 69, MGMT_SOURCE, MGMT_URL, MGMT_NOTE],
  ['Aligarh Muslim University', 'Business', 70, MGMT_SOURCE, MGMT_URL, MGMT_NOTE],
]

let inserted = 0
const skipped = []

for (const [name, field, rank, source, url, note] of DATA) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'IN'`
  if (rows.length === 0) {
    skipped.push(`${name} (${field})`)
    continue
  }
  const universityId = rows[0].id
  const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${universityId} AND field = ${field} AND "rankSource" = ${source}`
  if (existing.length > 0) continue

  await sql`
    INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (${universityId}, ${field}, ${rank}, ${source}, ${url}, ${selectivityFromRank(rank, 100)}, ${note})
  `
  inserted++
}

console.log(`Inserted ${inserted} program-ranking rows.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
