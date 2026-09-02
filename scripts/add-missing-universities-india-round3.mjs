// Third India missing-university hunt — found while cross-referencing
// NIRF program lists (GITAM kept appearing across Pharmacy/Law/Dental
// lists despite not being in the catalog at all). Each confirmed real
// and independently verified via NIRF's own site and/or Wikipedia.
//
// Manipal University Jaipur and Chitkara University get a REAL rankValue
// (NIRF University category) — distinct institutions from the catalog's
// existing "Manipal Academy of Higher Education" (Manipal, Karnataka
// campus) and unrelated to anything else already present. Presidency
// University Bangalore is likewise distinct from the catalog's existing
// "Presidency University, Kolkata" (a different, older public
// institution) — same name, two real, unrelated universities.
//
// Usage: node --env-file=.env.local scripts/add-missing-universities-india-round3.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const SCHOOLS = [
  {
    name: 'GITAM (Deemed to be University)',
    location: 'Visakhapatnam, Andhra Pradesh',
    climate: 'Warm',
    sectors: ['Manufacturing & Engineering Hub'],
    baselineSelectivity: 25,
    internshipProgram: 'Deemed university (est. 1980) with campuses in Visakhapatnam, Hyderabad, and Bengaluru; NIRF-ranked 101-150 band for Engineering',
    requirements: ['GAT (GITAM Admission Test) or JEE/NEET score', 'Class 12 board qualification'],
    link: 'https://www.gitam.edu/',
    academicFields: ['Engineering', 'Medicine & Health Sciences', 'Business'],
    rankValue: null,
  },
  {
    name: 'Manipal University Jaipur',
    location: 'Jaipur, Rajasthan',
    climate: 'Warm',
    sectors: ['Manufacturing & Engineering Hub'],
    baselineSelectivity: 35,
    internshipProgram: "Part of the wider Manipal group but a distinct university from Manipal Academy of Higher Education; NIRF-ranked #58 overall, #58 University, #58 Engineering, #81 Management, #32 Law",
    requirements: ['MUJEE (own entrance test) or JEE score', 'Class 12 board qualification'],
    link: 'https://jaipur.manipal.edu/',
    academicFields: ['Engineering', 'Business', 'Law'],
    rankValue: 58,
    rankSource: 'NIRF (National Institutional Ranking Framework) 2025 — Universities category',
  },
  {
    name: 'Chitkara University',
    location: 'Rajpura, Punjab',
    climate: 'Warm',
    sectors: ['Manufacturing & Engineering Hub'],
    baselineSelectivity: 33,
    internshipProgram: 'NIRF-ranked #78 University, #89 Engineering, #78 Management, #38 Architecture — strong across multiple categories',
    requirements: ['CUCET (own entrance test) or JEE score', 'Class 12 board qualification'],
    link: 'https://www.chitkara.edu.in/',
    academicFields: ['Engineering', 'Business', 'Architecture & Design'],
    rankValue: 78,
    rankSource: 'NIRF (National Institutional Ranking Framework) 2025 — Universities category',
  },
  {
    name: 'Presidency University, Bangalore',
    location: 'Bengaluru, Karnataka',
    climate: 'Balanced',
    sectors: ['Manufacturing & Engineering Hub'],
    baselineSelectivity: 22,
    internshipProgram: "Private university (distinct from the older public Presidency University, Kolkata); NIRF-ranked 201-300 band Engineering, 101-125 band Management",
    requirements: ['PUEE (own entrance test) or JEE/CAT score', 'Class 12 board qualification'],
    link: 'https://presidencyuniversity.in/',
    academicFields: ['Engineering', 'Business'],
    rankValue: null,
  },
  {
    name: 'Mahindra University',
    location: 'Hyderabad, Telangana',
    climate: 'Warm',
    sectors: ['Manufacturing & Engineering Hub'],
    baselineSelectivity: 28,
    internshipProgram: 'Part of the Mahindra Group, strong industry-linked engineering placements; NIRF-ranked 101-150 band Engineering',
    requirements: ['MEEE (own entrance test) or JEE score', 'Class 12 board qualification'],
    link: 'https://mahindrauniversity.edu.in/',
    academicFields: ['Engineering', 'Business'],
    rankValue: null,
  },
  {
    name: 'Woxsen University',
    location: 'Hyderabad, Telangana',
    climate: 'Warm',
    sectors: ['Business'],
    baselineSelectivity: 30,
    internshipProgram: 'Est. 2014; schools of Business, Technology, Art & Design, Law, Liberal Arts, and Architecture on a 200-acre residential campus',
    requirements: ['Own entrance test / merit-based', 'Class 12 board qualification'],
    link: 'https://woxsen.edu.in/',
    academicFields: ['Business', 'Law', 'Architecture & Design'],
    rankValue: null,
  },
  {
    name: 'GD Goenka University',
    location: 'Gurugram, Haryana',
    climate: 'Warm',
    sectors: ['Business'],
    baselineSelectivity: 18,
    internshipProgram: 'Est. 2013 by the GD Goenka Group; Delhi-NCR based, broad undergraduate program mix',
    requirements: ['Own entrance test / merit-based', 'Class 12 board qualification'],
    link: 'https://www.gdgoenkauniversity.com/',
    academicFields: ['Business', 'Engineering'],
    rankValue: null,
  },
  {
    name: 'Parul University',
    location: 'Vadodara, Gujarat',
    climate: 'Warm',
    sectors: ['Healthcare & Biotech Hub'],
    baselineSelectivity: 15,
    internshipProgram: 'One of the largest private universities in India by enrollment (70,000+ students); NAAC A++ accredited',
    requirements: ['PUCET (own entrance test)', 'Class 12 board qualification'],
    link: 'https://paruluniversity.ac.in/',
    academicFields: ['Medicine & Health Sciences', 'Engineering', 'Business'],
    rankValue: null,
  },
  {
    name: 'VIT Bhopal University',
    location: 'Sehore, Madhya Pradesh',
    climate: 'Balanced',
    sectors: ['Manufacturing & Engineering Hub'],
    baselineSelectivity: 25,
    internshipProgram: "Part of the VIT group (distinct campus from the catalog's Vellore and Chennai VIT campuses); est. 2017, 250-acre campus",
    requirements: ['VITEEE (own entrance test) or JEE score', 'Class 12 board qualification'],
    link: 'https://bhopal.vit.ac.in/',
    academicFields: ['Engineering', 'Computer Science & IT'],
    rankValue: null,
  },
  {
    name: 'Ahmedabad University',
    location: 'Ahmedabad, Gujarat',
    climate: 'Warm',
    sectors: ['Research'],
    baselineSelectivity: 32,
    internshipProgram: 'Est. 2009 by the Ahmedabad Education Society; liberal-education model across six schools spanning humanities, sciences, engineering, and management',
    requirements: ['Own entrance test / merit-based', 'Class 12 board qualification'],
    link: 'https://ahduni.edu.in/',
    academicFields: ['Humanities', 'Engineering', 'Business'],
    rankValue: null,
  },
]

let inserted = 0
let skipped = []

for (const school of SCHOOLS) {
  const existing = await sql`SELECT id FROM universities WHERE name = ${school.name} AND country = 'IN'`
  if (existing.length > 0) {
    skipped.push(school.name)
    continue
  }

  const [row] = await sql`
    INSERT INTO universities (
      name, country, location, climate, sectors, "baselineSelectivity",
      "internshipProgram", requirements, link, "academicFields",
      "rankValue", "rankSource"
    )
    VALUES (
      ${school.name}, 'IN', ${school.location}, ${school.climate},
      ${JSON.stringify(school.sectors)}::jsonb, ${school.baselineSelectivity},
      ${school.internshipProgram}, ${JSON.stringify(school.requirements)}::jsonb,
      ${school.link}, ${JSON.stringify(school.academicFields)}::jsonb,
      ${school.rankValue ?? null}, ${school.rankSource ?? null}
    )
    RETURNING id
  `
  console.log(`Added ${school.name} (IN), id ${row.id}`)
  inserted++
}

console.log(`\nInserted ${inserted} missing universities.`)
if (skipped.length) console.log(`Already existed, skipped: ${skipped.join(', ')}`)
