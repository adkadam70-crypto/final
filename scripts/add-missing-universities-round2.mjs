// Second missing-university audit pass, triggered by a user search for "DY
// Patil University" (India) returning nothing. Cross-checked catalog
// coverage against official/authoritative full lists per country:
// uniRank's 39-school Australia A-Z list, Singapore's 7 publicly-funded
// universities, Hong Kong's self-financed-university list, and well-known
// Indian private/deemed universities that repeatedly surface as notable
// gaps. Each entry below is real and independently confirmed; acceptance
// rate is a curated estimate (baselineSelectivity only) unless a
// governmental/institutional source is cited.
//
// Usage: node --env-file=.env.local scripts/add-missing-universities-round2.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const SCHOOLS = [
  {
    name: 'University of Notre Dame Australia',
    country: 'AU',
    location: 'Fremantle, Western Australia',
    climate: 'Warm',
    sectors: ['Healthcare & Biotech Hub'],
    baselineSelectivity: 22,
    internshipProgram: 'Clinical placements across 8 affiliated teaching hospitals/clinical schools in NSW and Victoria; strong nursing, medicine, and education practicum pipeline',
    requirements: ['ATAR or equivalent (holistic/mission-based entry criteria for some programs)', 'English proficiency for international applicants'],
    link: 'https://www.notredame.edu.au/',
    academicFields: ['Medicine & Health Sciences', 'Education', 'Law'],
  },
  {
    name: 'University of the Arts Singapore',
    country: 'SG',
    location: 'Bras Basah, Singapore',
    climate: 'Warm',
    sectors: ['Creative Hub'],
    baselineSelectivity: 40,
    internshipProgram: "Singapore's newest (2024) and only dedicated arts university, formed from LASALLE College of the Arts and Nanyang Academy of Fine Arts; strong industry links across design, fine art, and performing arts",
    requirements: ['Portfolio/audition (programme-dependent)', 'Personal statement', 'English proficiency for international applicants'],
    link: 'https://uas.edu.sg/',
    academicFields: ['Arts', 'Communications & Media'],
  },
  {
    name: 'Saint Francis University',
    country: 'HK',
    location: 'Tseung Kwan O, Hong Kong',
    climate: 'Warm',
    sectors: ['Healthcare & Biotech Hub'],
    baselineSelectivity: 25,
    internshipProgram: "Hong Kong's first Catholic university (renamed from Caritas Institute of Higher Education, granted university title January 2024); strong nursing and social-work practicum placements",
    requirements: ['HKDSE or equivalent qualifying examination results', 'English proficiency for international applicants'],
    link: 'https://www.sfu.edu.hk/',
    academicFields: ['Medicine & Health Sciences', 'Social Sciences'],
  },
  {
    name: 'Hong Kong Chu Hai College',
    country: 'HK',
    location: 'Tuen Mun, Hong Kong',
    climate: 'Warm',
    sectors: ['Business'],
    baselineSelectivity: 22,
    internshipProgram: 'Long-established (1947-founded lineage) private college with journalism, business, and law programs geared toward the local Hong Kong market',
    requirements: ['HKDSE or equivalent qualifying examination results', 'English proficiency for international applicants'],
    link: 'https://www.chuhai.edu.hk/',
    academicFields: ['Business', 'Law', 'Communications & Media'],
  },
  {
    name: 'Tung Wah College',
    country: 'HK',
    location: 'Ho Man Tin, Hong Kong',
    climate: 'Warm',
    sectors: ['Healthcare & Biotech Hub'],
    baselineSelectivity: 22,
    internshipProgram: 'Backed by the Tung Wah Group of Hospitals; strong nursing and health-sciences clinical placement network',
    requirements: ['HKDSE or equivalent qualifying examination results', 'English proficiency for international applicants'],
    link: 'https://www.twc.edu.hk/',
    academicFields: ['Medicine & Health Sciences'],
  },
  {
    name: 'D. Y. Patil University',
    country: 'IN',
    location: 'Navi Mumbai, Maharashtra',
    climate: 'Warm',
    sectors: ['Healthcare & Biotech Hub'],
    baselineSelectivity: 35,
    internshipProgram: 'Deemed university (est. 2003) with global research collaborations (incl. Harvard, WHO); best known for medicine, dentistry, and health sciences',
    requirements: ['NEET/CET or programme-specific entrance score', 'Class 12 board qualification'],
    link: 'https://dypatil.edu/',
    academicFields: ['Medicine & Health Sciences', 'Business'],
  },
  {
    name: 'Bharati Vidyapeeth (Deemed to be University)',
    country: 'IN',
    location: 'Pune, Maharashtra',
    climate: 'Balanced',
    sectors: ['Healthcare & Biotech Hub'],
    baselineSelectivity: 25,
    internshipProgram: 'Large multi-campus deemed university (Pune/Mumbai/Delhi/Navi Mumbai) spanning medicine, engineering, management, and law',
    requirements: ['Programme-specific entrance exam (CET/NEET/own entrance test)', 'Class 12 board qualification'],
    link: 'http://www.bharatividyapeeth.edu/',
    academicFields: ['Medicine & Health Sciences', 'Engineering', 'Business'],
  },
  {
    name: 'Sharda University',
    country: 'IN',
    location: 'Greater Noida, Uttar Pradesh',
    climate: 'Warm',
    sectors: ['Tech Hub'],
    baselineSelectivity: 20,
    internshipProgram: "UGC-recognised private university (est. 2009), one of Delhi-NCR's largest international-student populations across engineering, medicine, and business",
    requirements: ['SUAT (Sharda University Admission Test) or equivalent', 'Class 12 board qualification'],
    link: 'https://www.sharda.ac.in/',
    academicFields: ['Engineering', 'Medicine & Health Sciences', 'Business'],
  },
  {
    name: 'Galgotias University',
    country: 'IN',
    location: 'Greater Noida, Uttar Pradesh',
    climate: 'Warm',
    sectors: ['Tech Hub'],
    baselineSelectivity: 18,
    internshipProgram: 'One of the largest private universities in Uttar Pradesh by enrollment (40,000+ students); strong placement cell across engineering and management',
    requirements: ['GEAT (Galgotias Engineering Admission Test) or equivalent', 'Class 12 board qualification'],
    link: 'https://www.galgotiasuniversity.edu.in/',
    academicFields: ['Engineering', 'Business', 'Computer Science & IT'],
  },
  {
    name: 'Bennett University',
    country: 'IN',
    location: 'Greater Noida, Uttar Pradesh',
    climate: 'Warm',
    sectors: ['Tech Hub'],
    baselineSelectivity: 30,
    internshipProgram: 'Founded by The Times Group (2016); strong media/journalism pipeline plus engineering and management, NAAC A+ accredited',
    requirements: ['BUCET (Bennett University Common Entrance Test), JEE, or SAT score', 'Class 12 board qualification'],
    link: 'https://www.bennett.edu.in/',
    academicFields: ['Engineering', 'Business', 'Communications & Media'],
  },
  {
    name: 'University of Petroleum and Energy Studies',
    country: 'IN',
    location: 'Dehradun, Uttarakhand',
    climate: 'Balanced',
    sectors: ['Manufacturing & Engineering Hub'],
    baselineSelectivity: 32,
    internshipProgram: "Ranked nationally in NIRF for Law, Management, and Engineering; known for energy-sector and core-engineering industry ties",
    requirements: ['UPESEAT (own entrance test), JEE, or CUET score', 'Class 12 board qualification'],
    link: 'https://www.upes.ac.in/',
    academicFields: ['Engineering', 'Business', 'Law'],
  },
  {
    name: 'Koneru Lakshmaiah Education Foundation',
    country: 'IN',
    location: 'Vaddeswaram, Andhra Pradesh',
    climate: 'Warm',
    sectors: ['Tech Hub'],
    baselineSelectivity: 30,
    internshipProgram: 'Deemed university (est. 1980 as an engineering college); strong regional engineering and CS placement record in South India',
    requirements: ['KLEEE (own entrance test) or JEE score', 'Class 12 board qualification'],
    link: 'https://www.kluniversity.in/',
    academicFields: ['Engineering', 'Computer Science & IT'],
  },
]

let inserted = 0
let skipped = []

for (const school of SCHOOLS) {
  const existing = await sql`SELECT id FROM universities WHERE name = ${school.name} AND country = ${school.country}`
  if (existing.length > 0) {
    skipped.push(school.name)
    continue
  }

  const [row] = await sql`
    INSERT INTO universities (
      name, country, location, climate, sectors, "baselineSelectivity",
      "internshipProgram", requirements, link, "academicFields"
    )
    VALUES (
      ${school.name}, ${school.country}, ${school.location}, ${school.climate},
      ${JSON.stringify(school.sectors)}::jsonb, ${school.baselineSelectivity},
      ${school.internshipProgram}, ${JSON.stringify(school.requirements)}::jsonb,
      ${school.link}, ${JSON.stringify(school.academicFields)}::jsonb
    )
    RETURNING id
  `
  console.log(`Added ${school.name} (${school.country}), id ${row.id}`)
  inserted++
}

console.log(`\nInserted ${inserted} missing universities.`)
if (skipped.length) console.log(`Already existed, skipped: ${skipped.join(', ')}`)
