// India — adds School of Planning and Architecture Bhopal and Vijayawada,
// missing from the catalog (only Delhi existed). All 3 SPAs are separate,
// independently-run central institutions (not campuses of one), each with
// a published NIRF 2024 Architecture category rank. Same user-approved
// exception as scripts/add-missing-iims.mjs.
//
// Usage: node --env-file=.env.local scripts/add-missing-spas.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const REQUIREMENTS = ['NATA/JEE (Paper 2) score', "Class 12 (undergraduate) or Bachelor's degree (postgraduate)"]
const SECTORS = ['General']
const FIELDS = ['Architecture & Design']

const DATA = [
  ['School of Planning and Architecture, Bhopal', 'Bhopal, Madhya Pradesh', 'Warm', 78, 12, 'https://spabhopal.ac.in', 'Established 2008; one of India\'s three central SPAs, alongside Delhi and Vijayawada.'],
  ['School of Planning and Architecture, Vijayawada', 'Vijayawada, Andhra Pradesh', 'Warm', 76, 16, 'https://spav.ac.in', 'Established 2008; one of India\'s three central SPAs.'],
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

console.log(`Inserted ${inserted} new SPA university rows.`)
