// India — adds 10 National Law Universities missing from the catalog
// entirely (real, government-run flagship law schools with published NIRF
// 2024 Law category ranks). Same user-approved exception as
// scripts/add-missing-iims.mjs. "National Law University, Cuttack" is NOT
// added — it's the same institution as the already-existing "National Law
// University Odisha" (Cuttack is that university's city).
//
// Usage: node --env-file=.env.local scripts/add-missing-nlus.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const REQUIREMENTS = ['CLAT score', "Bachelor's degree or Class 12 (per program)"]
const SECTORS = ['General']
const FIELDS = ['Law']

const DATA = [
  ['Dr. Ram Manohar Lohiya National Law University', 'Lucknow, Uttar Pradesh', 'Warm', 88, 20, 'https://www.rmlnlu.ac.in', 'Established 2005; among the more established second-generation NLUs.'],
  ['National Law Institute University, Bhopal', 'Bhopal, Madhya Pradesh', 'Warm', 87, 21, 'https://www.nliu.ac.in', 'Established 1997; one of the earlier NLUs after NLSIU Bangalore and NALSAR.'],
  ['National University of Study and Research in Law', 'Ranchi, Jharkhand', 'Warm', 78, 22, 'https://www.nusrlranchi.ac.in', 'Established 2010; developing placement record.'],
  ['The Rajiv Gandhi National University of Law', 'Patiala, Punjab', 'Balanced', 80, 24, 'https://www.rgnul.ac.in', 'Established 2006; strong regional recruiter base in Punjab/NCR corridor.'],
  ['National Law University and Judicial Academy', 'Guwahati, Assam', 'Warm', 76, 27, 'https://www.nluassam.ac.in', 'Established 2009; serves as the main NLU for northeast India.'],
  ['Maharashtra National Law University Mumbai', 'Mumbai, Maharashtra', 'Warm', 82, 31, 'https://www.mnlumumbai.edu.in', 'Established 2014; strong Mumbai corporate-law recruiter access.'],
  ['Chanakya National Law University', 'Patna, Bihar', 'Warm', 79, 31, 'https://www.cnlu.ac.in', 'Established 2006.'],
  ['Maharashtra National Law University, Nagpur', 'Nagpur, Maharashtra', 'Warm', 76, 34, 'https://www.nlunagpur.ac.in', 'Established 2016; newer NLU with developing placement record.'],
  ['National University of Advanced Legal Studies', 'Kochi, Kerala', 'Warm', 78, 38, 'https://www.nuals.ac.in', 'Established 2005.'],
  ['Damodaram Sanjivayya National Law University', 'Visakhapatnam, Andhra Pradesh', 'Warm', 75, 39, 'https://www.dsnlu.ac.in', 'Established 2008.'],
]

let inserted = 0
for (const [name, location, climate, selectivity, , link, internship] of DATA) {
  const existing = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'IN'`
  if (existing.length > 0) { console.log(`SKIP (already exists): ${name}`); continue }
  await sql`
    INSERT INTO universities (name, country, location, climate, sectors, "baselineSelectivity", "internshipProgram", requirements, link, "academicFields")
    VALUES (${name}, 'IN', ${location}, ${climate}, ${JSON.stringify(SECTORS)}, ${selectivity}, ${internship}, ${JSON.stringify(REQUIREMENTS)}, ${link}, ${JSON.stringify(FIELDS)})
  `
  inserted++
}

console.log(`Inserted ${inserted} new NLU university rows.`)
