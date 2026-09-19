// India — adds the newer IIT campuses missing from the catalog (only 15 of
// 23 existed; the newer-generation IITs were absent entirely). Same
// user-approved exception as scripts/add-missing-iims.mjs: these are
// unambiguous, real, government-run flagship institutions, not edge cases.
// IIT Dharwad and IIT Goa are left out — neither appears in the NIRF 2024
// Engineering top 100, so there's no verified ranking source for them yet.
//
// Usage: node --env-file=.env.local scripts/add-missing-iits.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const REQUIREMENTS = ['JEE Advanced rank', 'JEE Main (qualifying)']
const SECTORS = ['Tech Hub', 'Research']
const FIELDS = ['Engineering', 'Science & Technology / Research']
const ACCEPT_NOTE = 'Estimated from JEE Advanced seat counts against India\'s ~180,000-strong qualified applicant pool — a research estimate, not a figure certified by the institute.'

const DATA = [
  ['Indian Institute of Technology Mandi', 'Mandi, Himachal Pradesh', 'Cold', 88, 3, 'https://www.iitmandi.ac.in', 'Established 2009; strong in mechatronics and materials science, growing research output.'],
  ['Indian Institute of Technology Bhubaneswar', 'Bhubaneswar, Odisha', 'Warm', 85, 4, 'https://www.iitbbs.ac.in', 'Established 2008; strong in metallurgical and materials engineering.'],
  ['Indian Institute of Technology Tirupati', 'Tirupati, Andhra Pradesh', 'Warm', 83, 4, 'https://www.iittp.ac.in', 'Established 2015; growing research output in chemical and civil engineering.'],
  ['Indian Institute of Technology Jammu', 'Jammu, Jammu and Kashmir', 'Balanced', 83, 4, 'https://www.iitjammu.ac.in', 'Established 2016; developing research base, strong regional recruiter interest.'],
  ['Indian Institute of Technology Palakkad', 'Palakkad, Kerala', 'Warm', 82, 4, 'https://www.iitpkd.ac.in', 'Established 2015; growing computer science and data science research.'],
  ['Indian Institute of Technology Bhilai', 'Bhilai, Chhattisgarh', 'Warm', 78, 5, 'https://www.iitbhilai.ac.in', 'Established 2016; newer campus with growing electrical/computer engineering programs.'],
]

let inserted = 0
for (const [name, location, climate, selectivity, estRate, link, internship] of DATA) {
  const existing = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'IN'`
  if (existing.length > 0) { console.log(`SKIP (already exists): ${name}`); continue }
  await sql`
    INSERT INTO universities (name, country, location, climate, sectors, "baselineSelectivity", "internshipProgram", requirements, link, "academicFields", "estimatedAcceptanceRate", "acceptanceRateNote")
    VALUES (${name}, 'IN', ${location}, ${climate}, ${JSON.stringify(SECTORS)}, ${selectivity}, ${internship}, ${JSON.stringify(REQUIREMENTS)}, ${link}, ${JSON.stringify(FIELDS)}, ${estRate}, ${`Estimated ~${estRate}% — ${ACCEPT_NOTE}`})
  `
  inserted++
}

console.log(`Inserted ${inserted} new IIT university rows.`)
