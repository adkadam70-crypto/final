// India — adds 3 AIIMS campuses missing from the catalog (only AIIMS Delhi
// existed), each with a verified NIRF 2024 Overall rank. Same user-approved
// exception as scripts/add-missing-iims.mjs. Other AIIMS campuses (Bhopal,
// Bhubaneswar, Raipur, Rishikesh's newer peers, etc.) are NOT added here —
// only these three appear in NIRF's Overall top-100, so only these three
// have a verified ranking source.
//
// Usage: node --env-file=.env.local scripts/add-missing-aiims.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const REQUIREMENTS = ['NEET-UG rank', "Bachelor's degree (MBBS/postgraduate programs)"]
const SECTORS = ['Research', 'General']
const FIELDS = ['Medicine & Health Sciences']

const DATA = [
  ['All India Institute of Medical Sciences, Rishikesh', 'Rishikesh, Uttarakhand', 'Cold', 90, 74, 'https://www.aiimsrishikesh.edu.in', 'Established 2012; one of the first-wave new AIIMS campuses, strong clinical and research reputation.'],
  ['All India Institute of Medical Sciences, Jodhpur', 'Jodhpur, Rajasthan', 'Warm', 88, 83, 'https://www.aiimsjodhpur.edu.in', 'Established 2012; growing research output, strong regional referral hospital.'],
  ['All India Institute of Medical Sciences, Patna', 'Patna, Bihar', 'Warm', 85, 99, 'https://www.aiimspatna.edu.in', 'Established 2012; first-wave new AIIMS campus serving eastern India.'],
]

let inserted = 0
for (const [name, location, climate, selectivity, , link, internship] of DATA) {
  const existing = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'IN'`
  if (existing.length > 0) { console.log(`SKIP (already exists): ${name}`); continue }
  await sql`
    INSERT INTO universities (name, country, location, climate, sectors, "baselineSelectivity", "internshipProgram", requirements, link, "academicFields", "estimatedAcceptanceRate", "acceptanceRateNote")
    VALUES (${name}, 'IN', ${location}, ${climate}, ${JSON.stringify(SECTORS)}, ${selectivity}, ${internship}, ${JSON.stringify(REQUIREMENTS)}, ${link}, ${JSON.stringify(FIELDS)}, 1, 'Estimated ~1% — NEET-UG-based national admission against a multi-million applicant pool for a small MBBS cohort; a research estimate, not a figure certified by the institute.')
  `
  inserted++
}

console.log(`Inserted ${inserted} new AIIMS university rows.`)
