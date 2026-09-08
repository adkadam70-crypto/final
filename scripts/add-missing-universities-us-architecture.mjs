// New US catalog additions — schools found while researching a real,
// citable undergraduate Architecture & Design program ranking (Architect
// Magazine's "Top 10 Undergraduate Architecture Schools in the U.S.") that
// weren't already in our general top-200 US catalog. Per standing policy: a
// school missing from the general list but present in a real program-
// specific top-N still deserves a full catalog entry, not to be silently
// skipped (same convention as add-missing-universities-us-from-cs-programs.mjs
// and add-atlas-skilltech.mjs).
//
// Acceptance rates below are real, currently-published overall-university
// figures (not architecture-program-specific rates, which are usually much
// lower — e.g. Cooper Union's architecture school alone admits ~4%, but its
// university-wide rate across all three schools is ~11%; this DB models
// admission to the UNIVERSITY, matching every other row's convention).
// SCI-Arc is the one exception: it's a small, independent, architecture-only
// school with no clean published overall acceptance rate, so its
// baselineSelectivity is a curated estimate only, same discipline as every
// other estimate-only row in this catalog.
//
// Usage: node --env-file=.env.local scripts/add-missing-universities-us-architecture.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const SCHOOLS = [
  {
    name: 'California Polytechnic State University, San Luis Obispo',
    location: 'San Luis Obispo, CA',
    climate: 'Warm',
    sectors: ['Manufacturing & Engineering Hub', 'Research'],
    baselineSelectivity: 69,
    actualAcceptanceRate: 31,
    acceptanceRateSource: 'Cal Poly SLO 2024-25 admissions cycle — ~31% overall undergraduate acceptance rate (21,416 admits of 68,371 applicants)',
    internshipProgram: 'Polytechnic "learn by doing" model built around mandatory hands-on studio and lab work, with a strong industry co-op pipeline into California architecture, engineering, and agriculture employers.',
    requirements: [
      'SAT/ACT (test-optional, CSU systemwide policy)',
      'CSU application with Personal Insight Questions',
      'Supplemental portfolio required for Architecture program admission',
      'Strong GPA in A-G coursework',
    ],
    link: 'https://www.calpoly.edu',
    academicFields: ['Architecture & Design', 'Engineering', 'Agriculture & Natural Resources'],
  },
  {
    name: 'The Cooper Union for the Advancement of Science and Art',
    location: 'New York, NY',
    climate: 'Cold',
    sectors: ['Tech Hub', 'Creative Hub'],
    baselineSelectivity: 89,
    actualAcceptanceRate: 11,
    acceptanceRateSource: 'Cooper Union Fall 2025 entering class — ~11% overall acceptance rate across all three schools (cooper.edu First-Year Profile)',
    internshipProgram: 'Every admitted student receives a large merit scholarship covering most of tuition; small, studio-based NYC campus with direct access to major architecture, art, and engineering firms citywide.',
    requirements: [
      'SAT/ACT (test-optional)',
      'Common App essay',
      'Architecture: Home Test (a take-home creative project)',
      'Highly competitive GPA and course rigor',
    ],
    link: 'https://cooper.edu',
    academicFields: ['Architecture & Design', 'Engineering', 'Arts'],
  },
  {
    name: 'Pratt Institute',
    location: 'Brooklyn, NY',
    climate: 'Cold',
    sectors: ['Creative Hub'],
    baselineSelectivity: 27,
    actualAcceptanceRate: 73,
    acceptanceRateSource: 'Pratt Institute 2024-25 admissions cycle — ~73% overall acceptance rate (6,195 admits of 8,457 applicants)',
    internshipProgram: 'Brooklyn/NYC location gives direct access to major architecture, design, and art firms; studio courses are built around an ongoing industry-critique culture.',
    requirements: [
      'SAT/ACT (test-optional)',
      'Portfolio required for Architecture, Art, and Design programs',
      'Common App essay',
    ],
    link: 'https://www.pratt.edu',
    academicFields: ['Architecture & Design', 'Arts'],
  },
  {
    name: 'Rhode Island School of Design',
    location: 'Providence, RI',
    climate: 'Cold',
    sectors: ['Creative Hub'],
    baselineSelectivity: 79,
    actualAcceptanceRate: 21,
    acceptanceRateSource: 'RISD 2024-25 admissions cycle — ~21% overall acceptance rate',
    internshipProgram: 'Cross-registration agreement with neighboring Brown University; strong industry ties in architecture, industrial design, and fine arts through ongoing studio crits and visiting critics.',
    requirements: [
      'SAT/ACT (optional)',
      'Portfolio (12-20 pieces of creative work)',
      'Two RISD-specific essays',
    ],
    link: 'https://www.risd.edu',
    academicFields: ['Architecture & Design', 'Arts'],
  },
  {
    name: 'Southern California Institute of Architecture',
    location: 'Los Angeles, CA',
    climate: 'Warm',
    sectors: ['Creative Hub'],
    baselineSelectivity: 55,
    internshipProgram: 'Independent, architecture-only school in downtown LA’s Arts District, with close ties to the city’s experimental architecture and design practice community.',
    requirements: [
      'Portfolio',
      'Personal statement',
      'No standardized test requirement',
    ],
    link: 'https://www.sciarc.edu',
    academicFields: ['Architecture & Design'],
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
