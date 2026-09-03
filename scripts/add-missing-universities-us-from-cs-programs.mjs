// New US catalog additions — schools found while pulling live US News
// Computer Science program rankings that weren't already in our general
// top-200 catalog. Per explicit user direction: a school missing from the
// general rank list but present in a real program-specific top-N deserves a
// full catalog entry too, not to be silently skipped. Profiles below use
// well-established, stable public facts (location, founding character,
// sector, general selectivity tier) — curated, not cited to a specific
// source, same convention as every other baselineSelectivity-only entry in
// this catalog. No acceptanceRate is set unless a precise figure is
// well-established and stable; where uncertain, left null.
//
// Usage: node --env-file=.env.local scripts/add-missing-universities-us-from-cs-programs.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const SCHOOLS = [
  {
    name: 'University of California, Santa Cruz',
    location: 'Santa Cruz, CA',
    climate: 'Warm',
    sectors: ['Tech Hub', 'Research'],
    baselineSelectivity: 55,
    internshipProgram: 'Close to Silicon Valley; strong tech-internship pipeline, especially for CS/engineering majors.',
    requirements: ['SAT/ACT (test-blind, per UC systemwide policy)', 'UC application essays (PIQs)', 'Strong GPA in A-G coursework'],
    link: 'https://www.ucsc.edu',
    academicFields: ['Science & Technology / Research', 'Computer Science & IT', 'Environmental Science & Sustainability'],
  },
  {
    name: 'Rochester Institute of Technology',
    location: 'Rochester, NY',
    climate: 'Cold',
    sectors: ['Tech Hub', 'Manufacturing & Engineering Hub'],
    baselineSelectivity: 55,
    internshipProgram: 'One of the most established co-op programs in the US — 5-year co-op track with paid, full-time work terms integrated into most majors.',
    requirements: ['SAT/ACT (test-optional)', 'Common App essay', 'Strong GPA, especially in math/science for STEM majors'],
    link: 'https://www.rit.edu',
    academicFields: ['Computer Science & IT', 'Engineering', 'Arts'],
  },
  {
    name: 'University of Illinois Chicago',
    location: 'Chicago, IL',
    climate: 'Cold',
    sectors: ['Tech Hub', 'Healthcare & Biotech Hub', 'Business'],
    baselineSelectivity: 50,
    internshipProgram: 'Urban Chicago location gives strong access to healthcare, finance, and tech internships; large research hospital on campus.',
    requirements: ['SAT/ACT (test-optional)', 'Common App or Coalition App essay', 'Solid GPA in college-prep coursework'],
    link: 'https://www.uic.edu',
    academicFields: ['Computer Science & IT', 'Medicine & Health Sciences', 'Business'],
  },
  {
    name: 'Oregon State University',
    location: 'Corvallis, OR',
    climate: 'Balanced',
    sectors: ['Research', 'Manufacturing & Engineering Hub', 'Agriculture & Natural Resources'],
    baselineSelectivity: 48,
    internshipProgram: 'Strong co-op and undergraduate research placements, especially in engineering and forestry/agricultural sciences.',
    requirements: ['SAT/ACT (test-optional)', 'Personal statement', 'Solid GPA in college-prep coursework'],
    link: 'https://oregonstate.edu',
    academicFields: ['Engineering', 'Agriculture & Natural Resources', 'Environmental Science & Sustainability'],
  },
  {
    name: 'Rose-Hulman Institute of Technology',
    location: 'Terre Haute, IN',
    climate: 'Balanced',
    sectors: ['Manufacturing & Engineering Hub', 'Tech Hub'],
    baselineSelectivity: 62,
    internshipProgram: 'Small, engineering-only focus with tight faculty-to-student ratio; strong co-op and industry-sponsored senior design placements.',
    requirements: ['SAT/ACT (test-optional)', 'Strong math/science GPA and coursework rigor', 'Essay'],
    link: 'https://www.rose-hulman.edu',
    academicFields: ['Engineering', 'Computer Science & IT', 'Mathematics & Statistics'],
  },
  {
    name: 'University of California, Riverside',
    location: 'Riverside, CA',
    climate: 'Warm',
    sectors: ['Research', 'Healthcare & Biotech Hub'],
    baselineSelectivity: 42,
    internshipProgram: 'Growing biotech/medical research access via its own School of Medicine; UC-system career resources.',
    requirements: ['SAT/ACT (test-blind, per UC systemwide policy)', 'UC application essays (PIQs)', 'Solid GPA in A-G coursework'],
    link: 'https://www.ucr.edu',
    academicFields: ['Science & Technology / Research', 'Medicine & Health Sciences', 'Computer Science & IT'],
  },
  {
    name: 'United States Naval Academy',
    location: 'Annapolis, MD',
    climate: 'Balanced',
    sectors: ['Government & Policy Hub', 'Engineering'],
    baselineSelectivity: 88,
    internshipProgram: 'Not applicable in the civilian sense — a federal service academy: full tuition is government-funded in exchange for a post-graduation active-duty service commitment.',
    requirements: [
      'Congressional or other official nomination (required alongside the application)',
      'SAT/ACT',
      'Physical fitness assessment',
      'Medical examination',
      'US citizenship',
    ],
    link: 'https://www.usna.edu',
    academicFields: ['Engineering', 'Science & Technology / Research', 'Social Sciences'],
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
    INSERT INTO universities (name, country, location, climate, sectors, "baselineSelectivity", "internshipProgram", requirements, link, "academicFields")
    VALUES (
      ${s.name}, 'US', ${s.location}, ${s.climate}, ${JSON.stringify(s.sectors)}::jsonb, ${s.baselineSelectivity},
      ${s.internshipProgram}, ${JSON.stringify(s.requirements)}::jsonb, ${s.link}, ${JSON.stringify(s.academicFields)}::jsonb
    )
  `
  inserted++
}

console.log(`Inserted ${inserted} new universities.`)
if (skipped.length) console.log(`Already existed: ${skipped.join(', ')}`)
