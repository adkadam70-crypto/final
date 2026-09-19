// Large India expansion pass — official NIRF 2024 rankings fetched directly
// from nirfindia.org (Engineering, Management, Pharmacy, Architecture, Law,
// Agriculture, and the University-category rankings), matched against
// every currently zero-coverage university in the catalog. Every rank here
// comes straight from an nirfindia.org page fetch, not a secondary source.
//
// A few candidate matches were deliberately dropped as unsafe: "College of
// Engineering, Trivandrum" (Architecture #18) matched over a dozen
// unrelated "College of Engineering" entries with no way to disambiguate,
// and "Manipal University, Jaipur" incorrectly fuzzy-matched to "Sikkim
// Manipal University of Health, Medical and Technological Sciences" — a
// different institution entirely.
//
// Field mapping: Engineering->Engineering, Management->Business,
// Pharmacy/Dental->Medicine & Health Sciences, Architecture->Architecture
// & Design, Law->Law, Agriculture->Agriculture & Natural Resources,
// University category (NIRF's general "University" ranking, not tied to
// one subject) -> Science & Technology / Research, consistent with how
// NIRF's Research-category rows were mapped earlier this session.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-in-nirf-2024-massive.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize = 100) {
  return Math.max(20, Math.min(97, Math.round(97 - (rank - 1) * (77 / poolSize))))
}

function src(category) {
  return `NIRF (National Institutional Ranking Framework) 2024 — ${category} category`
}
function url(category) {
  return `https://www.nirfindia.org/Rankings/2024/${category}Ranking.html`
}

const NOTE = 'NIRF 2024 rank, fetched directly from nirfindia.org.'
const NOTE_UNIV = 'NIRF 2024 University-category rank (general institutional ranking, not subject-specific) — shown under our broader Science & Technology / Research field.'

// [name-as-it-appears-in-our-catalog, field, rank, category]
const DATA = [
  // Engineering
  ['Vellore Institute of Technology, Chennai', 'Engineering', 11, 'Engineering'],
  ['Sathyabama Institute of Science and Technology', 'Engineering', 66, 'Engineering'],
  ['PSG College of Technology', 'Engineering', 67, 'Engineering'],
  ['National Institute of Technology Meghalaya', 'Engineering', 68, 'Engineering'],
  ['Visvesvaraya Technological University', 'Engineering', 69, 'Engineering'],
  ['National Institute of Technology Raipur', 'Engineering', 71, 'Engineering'],
  ['Maulana Azad National Institute of Technology Bhopal', 'Engineering', 72, 'Engineering'],
  ['COEP Technological University', 'Engineering', 77, 'Engineering'],
  ['National Institute of Technology Kurukshetra', 'Engineering', 81, 'Engineering'],
  ['National Institute of Technology Agartala', 'Engineering', 82, 'Engineering'],
  ['Indraprastha Institute of Information Technology Delhi', 'Engineering', 85, 'Engineering'],
  ['Indian Institute of Information Technology Allahabad', 'Engineering', 87, 'Engineering'],
  ['Jawaharlal Nehru Technological University', 'Engineering', 88, 'Engineering'],
  ["Vignan's Foundation for Science, Technology, and Research", 'Engineering', 91, 'Engineering'],
  ['Jain University', 'Engineering', 95, 'Engineering'],
  ['National Institute of Technology Puducherry', 'Engineering', 97, 'Engineering'],

  // Management -> Business
  ['Babasaheb Bhimrao Ambedkar University', 'Business', 86, 'Management'],
  ['Pandit Deendayal Energy University', 'Business', 89, 'Management'],
  ['Tezpur University', 'Business', 95, 'Management'],
  ['Krea University', 'Business', 99, 'Management'],

  // Pharmacy -> Medicine & Health Sciences
  ['Babasaheb Bhimrao Ambedkar University', 'Medicine & Health Sciences', 21, 'Pharmacy'],
  ['Annamalai University', 'Medicine & Health Sciences', 27, 'Pharmacy'],
  ['Central University of Rajasthan', 'Medicine & Health Sciences', 29, 'Pharmacy'],
  ['Mohan Lal Sukhadia University', 'Medicine & Health Sciences', 59, 'Pharmacy'],
  ['Kumaun University', 'Medicine & Health Sciences', 62, 'Pharmacy'],
  ['Acharya Nagarjuna University', 'Medicine & Health Sciences', 63, 'Pharmacy'],
  ['Anurag University', 'Medicine & Health Sciences', 71, 'Pharmacy'],
  ['Kakatiya University', 'Medicine & Health Sciences', 88, 'Pharmacy'],

  // Architecture
  ['National Institute of Technology Hamirpur', 'Architecture & Design', 32, 'Architecture'],

  // Agriculture
  ['Assam Agricultural University', 'Agriculture & Natural Resources', 14, 'Agriculture'],
  ['Tamil Nadu Veterinary and Animal Sciences University', 'Agriculture & Natural Resources', 17, 'Agriculture'],
  ['West Bengal University of Animal and Fishery Sciences', 'Agriculture & Natural Resources', 28, 'Agriculture'],
  ['Central Agricultural University', 'Agriculture & Natural Resources', 31, 'Agriculture'],

  // University category -> Science & Technology / Research
  ['Calcutta University', 'Science & Technology / Research', 18, 'University'],
  ['Kerala University', 'Science & Technology / Research', 21, 'University'],
  ['Savitribai Phule Pune University', 'Science & Technology / Research', 23, 'University'],
  ['Bharathiar University', 'Science & Technology / Research', 26, 'University'],
  ['Symbiosis International University', 'Science & Technology / Research', 31, 'University'],
  ['Bharathidasan University', 'Science & Technology / Research', 36, 'University'],
  ['Mahatma Gandhi University, Kottayam', 'Science & Technology / Research', 37, 'University'],
  ['University of Madras', 'Science & Technology / Research', 39, 'University'],
  ['Gauhati University', 'Science & Technology / Research', 40, 'University'],
  ['Osmania University', 'Science & Technology / Research', 43, 'University'],
  ['University of Kashmir', 'Science & Technology / Research', 45, 'University'],
  ['Alagappa University', 'Science & Technology / Research', 47, 'University'],
  ['University of Jammu', 'Science & Technology / Research', 50, 'University'],
  ['Mysore University', 'Science & Technology / Research', 54, 'University'],
  ['Periyar University', 'Science & Technology / Research', 56, 'University'],
  ['Shiv Nadar University', 'Science & Technology / Research', 62, 'University'],
  ['Madurai Kamaraj University', 'Science & Technology / Research', 63, 'University'],
  ['NITTE', 'Science & Technology / Research', 66, 'University'],
  ["Vignan's Foundation for Science, Technology, and Research", 'Science & Technology / Research', 72, 'University'],
  ['Bharath Institute of Higher Education and Research', 'Science & Technology / Research', 73, 'University'],
  ['Gujarat University', 'Science & Technology / Research', 76, 'University'],
  ['Mizoram University', 'Science & Technology / Research', 77, 'University'],
  ['Bangalore University', 'Science & Technology / Research', 81, 'University'],
  ['Sri Venkateswara University', 'Science & Technology / Research', 87, 'University'],
  ['University of Agricultural Sciences, Dharwad', 'Science & Technology / Research', 90, 'University'],
  ['Avinashilingam Institute for Home Science and Higher Education for Women', 'Science & Technology / Research', 98, 'University'],
  ['Central University of Tamil Nadu', 'Science & Technology / Research', 99, 'University'],
]

let inserted = 0
const skipped = []
const universitiesTouched = new Set()

for (const [name, field, rank, category] of DATA) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'IN'`
  if (rows.length === 0) {
    skipped.push(`${name} (${field}/${category})`)
    continue
  }
  const universityId = rows[0].id
  const source = src(category)
  const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${universityId} AND field = ${field} AND "rankSource" = ${source}`
  if (existing.length > 0) continue

  const note = category === 'University' ? NOTE_UNIV : NOTE
  await sql`
    INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (${universityId}, ${field}, ${rank}, ${source}, ${url(category)}, ${selectivityFromRank(rank, 100)}, ${note})
  `
  inserted++
  universitiesTouched.add(universityId)
}

console.log(`Inserted ${inserted} program-ranking rows across ${universitiesTouched.size} universities.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
