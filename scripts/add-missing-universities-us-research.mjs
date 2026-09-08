// New US catalog additions — schools found while researching a real
// Science & Technology / Research-adjacent source (College Transitions'
// "Colleges with the Best Undergraduate Research Programs") for a field
// that previously had zero program-ranking coverage in this catalog.
// Includes satRange/actRange/testPolicy on the initial insert.
//
// Usage: node --env-file=.env.local scripts/add-missing-universities-us-research.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const TS = 'PrepScholar / BigFuture / CollegeTuitionCompare, self-reported scores of enrolled students (2024-25 cycle)'

const SCHOOLS = [
  {
    name: 'The College of New Jersey', location: 'Ewing, NJ', climate: 'Cold', sectors: ['Research'],
    baselineSelectivity: 38, actualAcceptanceRate: 62,
    acceptanceRateSource: 'The College of New Jersey 2024-25 admissions cycle — ~62.3% overall acceptance rate',
    internshipProgram: "New Jersey's designated selective public liberal-arts-style college, with strong per-capita undergraduate research funding and psychology/digital-humanities research labs.",
    requirements: ['SAT/ACT (test-optional)', 'Application essay', 'Solid GPA in college-prep coursework'],
    link: 'https://www.tcnj.edu', academicFields: ['Science & Technology / Research', 'Education'],
    satRange25: 1140, satRange75: 1340, actRange25: 26, actRange75: 31, testPolicy: 'Test-Optional',
  },
  {
    name: 'College of Wooster', location: 'Wooster, OH', climate: 'Cold', sectors: ['Research'],
    baselineSelectivity: 40, actualAcceptanceRate: 60,
    acceptanceRateSource: 'College of Wooster 2024-25 admissions cycle — ~59.5% overall acceptance rate',
    internshipProgram: 'Unusual among LACs for requiring every single senior to complete a year-long, faculty-mentored Independent Study thesis regardless of major.',
    requirements: ['SAT/ACT (test-optional)', 'Common App essay', 'Solid GPA in college-prep coursework'],
    link: 'https://www.wooster.edu', academicFields: ['Science & Technology / Research', 'Humanities'],
    satRange25: 1220, satRange75: 1460, actRange25: 27, actRange75: 33, testPolicy: 'Test-Optional',
  },
  {
    name: 'Lawrence University', location: 'Appleton, WI', climate: 'Cold', sectors: ['Research'],
    baselineSelectivity: 36, actualAcceptanceRate: 64,
    acceptanceRateSource: 'Lawrence University 2024-25 admissions cycle — ~63.9% overall acceptance rate',
    internshipProgram: 'Combines a liberal arts college with a fully integrated conservatory of music, letting students pursue a research-intensive science or humanities major alongside serious conservatory-level music training.',
    requirements: ['SAT/ACT (test-optional)', 'Common App essay', 'Solid GPA in college-prep coursework'],
    link: 'https://www.lawrence.edu', academicFields: ['Science & Technology / Research', 'Arts'],
    satRange25: 1240, satRange75: 1420, actRange25: 24, actRange75: 31, testPolicy: 'Test-Optional',
  },
  {
    name: 'St. Lawrence University', location: 'Canton, NY', climate: 'Cold', sectors: ['Research'],
    baselineSelectivity: 46, actualAcceptanceRate: 54,
    acceptanceRateSource: 'St. Lawrence University 2024-25 admissions cycle — ~54.3% overall acceptance rate',
    internshipProgram: 'A North Country NY liberal arts college with a strong undergraduate research culture in the sciences and environmental studies, aided by its rural Adirondack-adjacent setting.',
    requirements: ['SAT/ACT (test-optional)', 'Common App essay', 'Solid GPA in college-prep coursework'],
    link: 'https://www.stlawu.edu', academicFields: ['Science & Technology / Research', 'Environmental Science & Sustainability'],
    satRange25: 1255, satRange75: 1420, actRange25: 30, actRange75: 33, testPolicy: 'Test-Optional',
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
      requirements, link, "academicFields", "actualAcceptanceRate", "acceptanceRateSource",
      "satRange25", "satRange75", "actRange25", "actRange75", "testScoreSource", "testPolicy"
    )
    VALUES (
      ${s.name}, 'US', ${s.location}, ${s.climate}, ${JSON.stringify(s.sectors)}::jsonb, ${s.baselineSelectivity},
      ${s.internshipProgram}, ${JSON.stringify(s.requirements)}::jsonb, ${s.link}, ${JSON.stringify(s.academicFields)}::jsonb,
      ${s.actualAcceptanceRate}, ${s.acceptanceRateSource},
      ${s.satRange25}, ${s.satRange75}, ${s.actRange25}, ${s.actRange75}, ${TS}, ${s.testPolicy}
    )
  `
  inserted++
}

console.log(`Inserted ${inserted} new universities.`)
if (skipped.length) console.log(`Already existed: ${skipped.join(', ')}`)
