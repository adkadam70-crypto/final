// New US catalog addition — Reed College, found while researching a real,
// citable undergraduate Pre-Law ranking (College Transitions' "2026 Best
// Colleges for Pre-Law") that wasn't already in our general catalog. Same
// standing policy as every other add-missing-universities-us-*.mjs script.
//
// Includes satRange/actRange/testPolicy on the initial insert (not just
// acceptance rate) per explicit instruction: every new gap-fill university
// should carry the full set of match-relevant fields up front, not just the
// baseline profile.
//
// Usage: node --env-file=.env.local scripts/add-missing-universities-us-prelaw.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const s = {
  name: 'Reed College', location: 'Portland, OR', climate: 'Balanced',
  sectors: ['Research'],
  baselineSelectivity: 75, actualAcceptanceRate: 25,
  acceptanceRateSource: 'Reed College 2024-25 admissions cycle — ~24.6% overall acceptance rate',
  internshipProgram: 'A rigorous, discussion-based humanities and "great books"-style curriculum with a required senior thesis; a strong record of graduates going on to top law schools and PhD programs relative to its size.',
  requirements: ['SAT/ACT (test-optional)', 'Common App essay plus Reed-specific supplement', 'Strong GPA and course rigor'],
  link: 'https://www.reed.edu', academicFields: ['Law', 'Humanities', 'Social Sciences'],
  satRange25: 1290, satRange75: 1520, actRange25: 30, actRange75: 34,
  testScoreSource: 'CollegeTuitionCompare, self-reported scores of enrolled students (2024-25 cycle)',
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
console.log('Added Reed College, id', row.id)
