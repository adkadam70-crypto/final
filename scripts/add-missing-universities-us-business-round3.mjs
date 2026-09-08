// New US catalog addition — Bentley University, found while researching a
// real, citable undergraduate Business program ranking (College
// Transitions' "2026 Best Colleges for Business," a second independent
// source alongside the existing U.S. News subscriber-verified Business
// list) that wasn't already in our general catalog. Same standing policy
// as every other add-missing-universities-us-*.mjs script.
//
// Includes satRange/actRange/testPolicy on the initial insert per standing
// instruction: every new gap-fill university should carry the full set of
// match-relevant fields up front.
//
// Usage: node --env-file=.env.local scripts/add-missing-universities-us-business-round3.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const s = {
  name: 'Bentley University', location: 'Waltham, MA', climate: 'Cold',
  sectors: ['Business'],
  baselineSelectivity: 55, actualAcceptanceRate: 45,
  acceptanceRateSource: 'Bentley University 2024-25 admissions cycle — ~45% overall acceptance rate',
  internshipProgram: "A business-only university in Waltham, MA, part of Boston's Route 128 tech/finance corridor, with mandatory internship/co-op components built into most majors.",
  requirements: ['SAT/ACT (test-optional)', 'Common App essay', 'Strong GPA in college-prep coursework'],
  link: 'https://www.bentley.edu', academicFields: ['Business'],
  satRange25: 1280, satRange75: 1430, actRange25: 28, actRange75: 31,
  testScoreSource: 'PrepScholar / BigFuture, self-reported scores of enrolled students (2024-25 cycle)',
  testPolicy: 'Test-Optional',
}

const existing = await sql`SELECT id FROM universities WHERE name = ${s.name} AND country = 'US'`
if (existing.length > 0) {
  console.log('Already exists, id', existing[0].id)
  process.exit(0)
}

const [row] = await sql`
  INSERT INTO universities (
    name, country, location, climate, sectors, "baselineSelectivity", "internshipProgram",
    requirements, link, "academicFields", "actualAcceptanceRate", "acceptanceRateSource",
    "satRange25", "satRange75", "actRange25", "actRange75", "testScoreSource", "testPolicy"
  )
  VALUES (
    ${s.name}, 'US', ${s.location}, ${s.climate}, ${JSON.stringify(s.sectors)}::jsonb, ${s.baselineSelectivity},
    ${s.internshipProgram}, ${JSON.stringify(s.requirements)}::jsonb, ${s.link}, ${JSON.stringify(s.academicFields)}::jsonb,
    ${s.actualAcceptanceRate}, ${s.acceptanceRateSource},
    ${s.satRange25}, ${s.satRange75}, ${s.actRange25}, ${s.actRange75}, ${s.testScoreSource}, ${s.testPolicy}
  )
  RETURNING id
`
console.log('Added Bentley University, id', row.id)
