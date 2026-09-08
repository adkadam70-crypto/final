// New US catalog additions — engineering-focused schools found while
// researching a real, citable undergraduate Mechanical Engineering program
// ranking (College Transitions' "Best Colleges for Mechanical Engineering")
// used as a representative Engineering-field list, independent of the U.S.
// News subscriber list already seeded for this field. Weren't already in
// our general catalog. Same standing policy as every other
// add-missing-universities-us-*.mjs script.
//
// Usage: node --env-file=.env.local scripts/add-missing-universities-us-engineering.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const SCHOOLS = [
  {
    name: 'Franklin W. Olin College of Engineering', location: 'Needham, MA', climate: 'Cold',
    sectors: ['Tech Hub', 'Manufacturing & Engineering Hub'],
    baselineSelectivity: 75, actualAcceptanceRate: 25,
    acceptanceRateSource: 'Olin College of Engineering 2024 admissions cycle — ~25.2% overall acceptance rate',
    internshipProgram: 'A tiny, engineering-only college (about 350 students total) built around project-based learning instead of traditional lectures; every student gets significant merit aid.',
    requirements: ['SAT/ACT (test-optional)', 'Candidate’s Weekend interview/portfolio process', 'Strong math/science GPA and coursework rigor'],
    link: 'https://www.olin.edu', academicFields: ['Engineering', 'Computer Science & IT'],
  },
  {
    name: 'United States Military Academy', location: 'West Point, NY', climate: 'Cold',
    sectors: ['Government & Policy Hub', 'Manufacturing & Engineering Hub'],
    baselineSelectivity: 88, actualAcceptanceRate: 12,
    acceptanceRateSource: 'United States Military Academy (West Point) 2024-25 admissions cycle — ~12.45% overall acceptance rate',
    internshipProgram: 'A federal service academy: full tuition is government-funded in exchange for a post-graduation active-duty service commitment, not a civilian internship model.',
    requirements: [
      'Congressional or other official nomination (required alongside the application)',
      'SAT/ACT', 'Physical fitness assessment', 'Medical examination', 'US citizenship',
    ],
    link: 'https://www.westpoint.edu', academicFields: ['Engineering', 'Science & Technology / Research', 'Social Sciences'],
  },
  {
    name: 'Colorado School of Mines', location: 'Golden, CO', climate: 'Cold',
    sectors: ['Manufacturing & Engineering Hub', 'Research'],
    baselineSelectivity: 39, actualAcceptanceRate: 61,
    acceptanceRateSource: 'Colorado School of Mines 2024 admissions cycle — ~60.7% overall acceptance rate',
    internshipProgram: 'A public engineering-focused research university specializing in mining, energy, and materials engineering, with deep ties to Colorado’s energy and mining industry for internships.',
    requirements: ['SAT/ACT (test-optional)', 'Application essay', 'Strong math/science GPA and coursework rigor'],
    link: 'https://www.mines.edu', academicFields: ['Engineering', 'Science & Technology / Research'],
  },
  {
    name: 'Clarkson University', location: 'Potsdam, NY', climate: 'Cold',
    sectors: ['Manufacturing & Engineering Hub'],
    baselineSelectivity: 23, actualAcceptanceRate: 77,
    acceptanceRateSource: 'Clarkson University 2024-25 admissions cycle — ~77.4% overall acceptance rate',
    internshipProgram: 'A small, engineering-focused private university in upstate NY with a strong co-op/internship placement track record relative to its size.',
    requirements: ['SAT/ACT (test-optional)', 'Common App essay', 'Solid GPA in college-prep coursework'],
    link: 'https://www.clarkson.edu', academicFields: ['Engineering', 'Business'],
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
