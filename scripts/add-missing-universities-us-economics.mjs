// New US catalog additions — elite liberal arts colleges found while
// researching a real, citable undergraduate Economics program ranking
// (College Transitions' "2025 Best Colleges for Economics," a different
// real source than the U.S. News subscriber list already seeded for this
// field/for Social Sciences) that weren't already in our general catalog.
// Same standing policy as every other add-missing-universities-us-*.mjs.
//
// Usage: node --env-file=.env.local scripts/add-missing-universities-us-economics.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const SCHOOLS = [
  {
    name: 'College of the Holy Cross', location: 'Worcester, MA', climate: 'Cold',
    sectors: ['Research'],
    baselineSelectivity: 82, actualAcceptanceRate: 18,
    acceptanceRateSource: 'College of the Holy Cross 2024 admissions cycle — ~17.6% overall acceptance rate',
    internshipProgram: 'A Jesuit liberal arts college in Worcester, MA with a strong economics and pre-professional advising culture and a large, active alumni network in Boston-area finance and consulting.',
    requirements: ['SAT/ACT (test-optional)', 'Common App essay plus Holy Cross-specific supplement', 'Strong GPA and course rigor'],
    link: 'https://www.holycross.edu', academicFields: ['Economics', 'Social Sciences', 'Humanities'],
  },
  {
    name: 'Hamilton College', location: 'Clinton, NY', climate: 'Cold',
    sectors: ['Research'],
    baselineSelectivity: 86, actualAcceptanceRate: 14,
    acceptanceRateSource: 'Hamilton College Class of 2029 (2024-25 cycle) — ~13.6% overall acceptance rate',
    internshipProgram: 'Known for an open curriculum with no distribution requirements and a mandatory writing-intensive first-year program; strong undergraduate research support in economics.',
    requirements: ['SAT/ACT (test-optional)', 'Common App essay plus Hamilton-specific supplement', 'Strong GPA and course rigor'],
    link: 'https://www.hamilton.edu', academicFields: ['Economics', 'Social Sciences', 'Humanities'],
  },
  {
    name: 'Lafayette College', location: 'Easton, PA', climate: 'Cold',
    sectors: ['Research'],
    baselineSelectivity: 69, actualAcceptanceRate: 31,
    acceptanceRateSource: 'Lafayette College 2024 admissions cycle — ~31.4% overall acceptance rate',
    internshipProgram: 'An unusual combination for a small liberal arts college: a full ABET-accredited engineering division alongside its economics and humanities programs.',
    requirements: ['SAT/ACT (test-optional)', 'Common App essay plus Lafayette-specific supplement', 'Strong GPA and course rigor'],
    link: 'https://www.lafayette.edu', academicFields: ['Economics', 'Engineering', 'Social Sciences'],
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
