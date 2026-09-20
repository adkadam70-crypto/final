// USA — adds 6 well-known HBCUs missing from the catalog entirely
// (Florida A&M, Delaware State, Virginia State, Clark Atlanta, Lincoln
// University PA, University of the District of Columbia), each with a
// published 2026 HBCU ranking. Same user-approved exception pattern used
// for India's IIMs/IITs/NLUs — real, accredited, well-known institutions,
// not edge cases.
//
// Usage: node --env-file=.env.local scripts/add-missing-hbcus.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const DATA = [
  ['Florida A&M University', 'Tallahassee, Florida', 'Warm', 78, 5, 'https://www.famu.edu', 'The highest-rated public HBCU for seven consecutive years; strong pharmacy, journalism, and business programs.'],
  ['Delaware State University', 'Dover, Delaware', 'Balanced', 68, 10, 'https://www.desu.edu', 'Land-grant HBCU with strong aviation and STEM programs.'],
  ['Virginia State University', 'Petersburg, Virginia', 'Warm', 65, 11, 'https://www.vsu.edu', 'Land-grant HBCU, one of the first fully state-supported four-year HBCUs.'],
  ['Clark Atlanta University', 'Atlanta, Georgia', 'Warm', 68, 16, 'https://www.cau.edu', 'Part of the Atlanta University Center consortium alongside Morehouse and Spelman.'],
  ['Lincoln University', 'Lincoln University, Pennsylvania', 'Balanced', 62, 18, 'https://www.lincoln.edu', "The nation's first degree-granting HBCU, founded 1854."],
  ['University of the District of Columbia', 'Washington, D.C.', 'Balanced', 55, 18, 'https://www.udc.edu', "The only public HBCU in Washington, D.C., and the nation's only urban land-grant university."],
]

const REQUIREMENTS = ["High school diploma or equivalent", "Standardized test scores (test-optional at most)"]
const SECTORS = ['General']
const FIELDS = ['Science & Technology / Research']

let inserted = 0
for (const [name, location, climate, selectivity, , link, internship] of DATA) {
  const existing = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'US'`
  if (existing.length > 0) { console.log(`SKIP (already exists): ${name}`); continue }
  await sql`
    INSERT INTO universities (name, country, location, climate, sectors, "baselineSelectivity", "internshipProgram", requirements, link, "academicFields")
    VALUES (${name}, 'US', ${location}, ${climate}, ${JSON.stringify(SECTORS)}, ${selectivity}, ${internship}, ${JSON.stringify(REQUIREMENTS)}, ${link}, ${JSON.stringify(FIELDS)})
  `
  inserted++
}

console.log(`Inserted ${inserted} new HBCU university rows.`)
