// Missing-university audit — first confirmed batch, cross-checked against a
// second source before adding (Wikipedia's country-level university list,
// or multiple independent acceptance-rate aggregators, per school — see the
// inline note on each one). Two get a REAL, multi-source-confirmed
// actualAcceptanceRate (RPI, San José State); the rest get a curated
// baselineSelectivity estimate only, same discipline as ATLAS SkillTech.
//
// India: Plaksha University — a real, notable new tech-focused private
// university (est. 2021, Mohali) that came up independently in research on
// notable private Indian universities not yet in the catalog; a 65% accept
// rate is reported consistently across several admissions-data aggregators
// (not a single government source, so kept as a curated estimate, not
// actualAcceptanceRate).
//
// Australia: cross-checked the full 41-institution Wikipedia list against
// the catalog and found 3 real, ranked (per THE's AU subject tables used
// elsewhere this session) gaps — Central Queensland University, Swinburne
// University of Technology, University of Southern Queensland. (Two
// smaller/niche private institutions, Avondale University and the
// theological University of Divinity / Australian University of Theology,
// were also found missing but deliberately not added — narrower fit for
// this catalog's general-academic scope.)
//
// Singapore: Singapore University of Social Sciences (SUSS) — Singapore's
// 6th public autonomous university, confirmed real and missing. Worth
// flagging: SUSS's primary admissions track is for working adults (2+ years
// experience, 21+) alongside a smaller direct-entry pathway for
// polytechnic/JC graduates — a different profile than every other school in
// this catalog. Included because it's a real, notable public university a
// student might search for, with the caveat noted in requirements.
//
// Hong Kong: The Hang Seng University of Hong Kong (HSUHK) — a real,
// AACSB-accredited private university (its School of Business holds
// accreditation shared by only ~6% of business schools worldwide), missing
// from a catalog that already covers all 8 UGC-funded HK institutions.
//
// US: Rensselaer Polytechnic Institute and San José State University — both
// confirmed missing via a direct name search, both real, well-known
// universities with consistent acceptance rates across multiple sources
// (RPI ~65%, SJSU ~85%).
//
// Usage: node --env-file=.env.local scripts/add-missing-universities.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const SCHOOLS = [
  {
    name: 'Plaksha University',
    country: 'IN',
    location: 'Mohali, Punjab',
    climate: 'Warm',
    sectors: ['Tech Hub'],
    baselineSelectivity: 35,
    internshipProgram: 'Founded by 75+ tech industry leaders; strong placement with firms like McKinsey and BCG (~₹20 LPA average)',
    requirements: ['JEE Main, SAT, or ACT score', 'Personal interview', 'Holistic multi-round evaluation'],
    link: 'https://plaksha.edu.in/',
    academicFields: ['Computer Science & IT', 'Engineering'],
  },
  {
    name: 'Central Queensland University',
    country: 'AU',
    location: 'Rockhampton, Queensland',
    climate: 'Warm',
    sectors: ['Research'],
    baselineSelectivity: 35,
    internshipProgram: 'Graduate Guarantee scheme — internship or career support if no job secured after graduating',
    requirements: ['ATAR or equivalent (flexible/equity entry pathways available)', 'English proficiency for international applicants'],
    link: 'https://www.cqu.edu.au/',
    academicFields: ['Business', 'Engineering', 'Medicine & Health Sciences'],
  },
  {
    name: 'Swinburne University of Technology',
    country: 'AU',
    location: 'Melbourne, Victoria',
    climate: 'Cold',
    sectors: ['Tech Hub'],
    baselineSelectivity: 30,
    internshipProgram: 'Strong industry-linked placements in engineering, design, and technology',
    requirements: ['ATAR (course-dependent; ATAR-free Early Entry Program available)', 'English proficiency for international applicants'],
    link: 'https://www.swinburne.edu.au/',
    academicFields: ['Computer Science & IT', 'Engineering', 'Business', 'Arts'],
  },
  {
    name: 'University of Southern Queensland',
    country: 'AU',
    location: 'Toowoomba, Queensland',
    climate: 'Warm',
    sectors: ['Research'],
    baselineSelectivity: 30,
    internshipProgram: 'Regional employer partnerships across business, education, and engineering',
    requirements: ['ATAR around 70 or equivalent', 'English proficiency for international applicants'],
    link: 'https://www.unisq.edu.au/',
    academicFields: ['Business', 'Engineering', 'Education'],
  },
  {
    name: 'Singapore University of Social Sciences',
    country: 'SG',
    location: 'Clementi, Singapore',
    climate: 'Warm',
    sectors: ['Government & Policy Hub', 'Business'],
    baselineSelectivity: 30,
    internshipProgram: 'Applied, industry-linked curriculum in social sciences, business, and law',
    requirements: [
      'Holistic 4-stage selection (essay, cognitive test, group discussion, interview) for direct-entry applicants',
      "Note: SUSS's primary track is for working adults (2+ years' experience, age 21+) alongside a smaller polytechnic/JC direct-entry pathway",
    ],
    link: 'https://www.suss.edu.sg/',
    academicFields: ['Social Sciences', 'Business', 'Law'],
  },
  {
    name: 'The Hang Seng University of Hong Kong',
    country: 'HK',
    location: 'Sha Tin, Hong Kong',
    climate: 'Warm',
    sectors: ['Finance Capital'],
    baselineSelectivity: 28,
    internshipProgram: 'AACSB-accredited School of Business (a distinction held by ~6% of business schools worldwide)',
    requirements: ['HKDSE or equivalent qualifying examination results', 'English proficiency for international applicants'],
    link: 'https://www.hsu.edu.hk/',
    academicFields: ['Business', 'Communications & Media', 'Humanities'],
  },
  {
    name: 'Rensselaer Polytechnic Institute',
    country: 'US',
    location: 'Troy, NY',
    climate: 'Cold',
    sectors: ['Tech Hub'],
    baselineSelectivity: 35,
    actualAcceptanceRate: 65,
    acceptanceRateSource: 'School-reported admissions data, 2025-26 cycle (Class of 2029)',
    internshipProgram: 'Strong engineering/tech co-op and research pipeline; notable startup and robotics ecosystem',
    requirements: ['SAT/ACT (test-optional)', 'Common App essays'],
    link: 'https://www.rpi.edu/',
    academicFields: ['Engineering', 'Computer Science & IT', 'Science & Technology / Research'],
  },
  {
    name: 'San José State University',
    country: 'US',
    location: 'San Jose, CA',
    climate: 'Warm',
    sectors: ['Tech Hub'],
    baselineSelectivity: 15,
    actualAcceptanceRate: 85,
    acceptanceRateSource: 'School-reported admissions data, 2025-26 cycle',
    internshipProgram: 'Silicon Valley location gives direct access to major tech-industry internships',
    requirements: ['SAT/ACT (test-optional)', 'Common App / Cal State Apply essays'],
    link: 'https://www.sjsu.edu/',
    academicFields: ['Computer Science & IT', 'Engineering', 'Business'],
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
      "internshipProgram", requirements, link, "academicFields",
      "actualAcceptanceRate", "acceptanceRateSource"
    )
    VALUES (
      ${school.name}, ${school.country}, ${school.location}, ${school.climate},
      ${JSON.stringify(school.sectors)}::jsonb, ${school.baselineSelectivity},
      ${school.internshipProgram}, ${JSON.stringify(school.requirements)}::jsonb,
      ${school.link}, ${JSON.stringify(school.academicFields)}::jsonb,
      ${school.actualAcceptanceRate ?? null}, ${school.acceptanceRateSource ?? null}
    )
    RETURNING id
  `
  console.log(`Added ${school.name} (${school.country}), id ${row.id}`)
  inserted++
}

console.log(`\nInserted ${inserted} missing universities.`)
if (skipped.length) console.log(`Already existed, skipped: ${skipped.join(', ')}`)
