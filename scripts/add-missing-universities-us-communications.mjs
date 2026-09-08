// New US catalog additions — schools found while researching a real,
// citable undergraduate Journalism/Communications program ranking (College
// Transitions' "2025 Best Colleges for Journalism") that weren't already in
// our general top-200 US catalog. Same standing policy as
// add-missing-universities-us-architecture.mjs: a school missing from the
// general list but present in a real program-specific top-N still gets a
// full catalog entry.
//
// Usage: node --env-file=.env.local scripts/add-missing-universities-us-communications.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const SCHOOLS = [
  {
    name: 'Emerson College',
    location: 'Boston, MA',
    climate: 'Cold',
    sectors: ['Creative Hub'],
    baselineSelectivity: 49,
    actualAcceptanceRate: 51,
    acceptanceRateSource: 'Emerson College 2024-25 admissions cycle — ~51% overall acceptance rate (5,325 admits of 10,378 applicants)',
    internshipProgram: 'Boston campus plus a full satellite campus in Los Angeles (Emerson Los Angeles), giving a strong two-coast pipeline into media, film, and journalism internships.',
    requirements: [
      'SAT/ACT (test-optional)',
      'Common App essay',
      'Supplemental essay on creative/media interest',
    ],
    link: 'https://www.emerson.edu',
    academicFields: ['Communications & Media', 'Arts'],
  },
  {
    name: 'Hofstra University',
    location: 'Hempstead, NY',
    climate: 'Cold',
    sectors: ['Creative Hub', 'Business'],
    baselineSelectivity: 32,
    actualAcceptanceRate: 68,
    acceptanceRateSource: 'Hofstra University 2024-25 admissions cycle — ~68% overall acceptance rate',
    internshipProgram: 'Long Island location roughly 25 miles from Manhattan gives strong access to media, journalism, finance, and law internships in NYC.',
    requirements: [
      'SAT/ACT (test-optional)',
      'Common App essay',
    ],
    link: 'https://www.hofstra.edu',
    academicFields: ['Communications & Media', 'Business'],
  },
]

let inserted = 0
let skipped = []

for (const s of SCHOOLS) {
  const existing = await sql`SELECT id FROM universities WHERE name = ${s.name} AND country = 'US'`
  if (existing.length > 0) {
    skipped.push(s.name)
    continue
  }
  await sql`
    INSERT INTO universities (
      name, country, location, climate, sectors, "baselineSelectivity", "internshipProgram",
      requirements, link, "academicFields", "actualAcceptanceRate", "acceptanceRateSource"
    )
    VALUES (
      ${s.name}, 'US', ${s.location}, ${s.climate}, ${JSON.stringify(s.sectors)}::jsonb, ${s.baselineSelectivity},
      ${s.internshipProgram}, ${JSON.stringify(s.requirements)}::jsonb, ${s.link}, ${JSON.stringify(s.academicFields)}::jsonb,
      ${s.actualAcceptanceRate ?? null}, ${s.acceptanceRateSource ?? null}
    )
  `
  inserted++
}

console.log(`Inserted ${inserted} new universities.`)
if (skipped.length) console.log(`Already existed: ${skipped.join(', ')}`)
