// New US catalog additions — the 6 schools flagged as "real, spotted via
// program rankings, but not yet added" from the earlier program-ranking
// passes (Business, Nursing, Economics). University of Maryland, Baltimore
// was investigated and deliberately excluded: it's an almost entirely
// graduate/professional campus (978 total enrollment, no acceptance rate or
// SAT/ACT range published, not ranked in National Universities) — same
// not-a-fit reasoning as Homi Bhabha National Institute or Oregon Health &
// Science University elsewhere in this catalog.
//
// All acceptance rates, SAT/ACT ranges, test policies, and general ranks
// verified live via each school's own US News profile page (subscriber
// session).
//
// Usage: node --env-file=.env.local scripts/add-missing-universities-us-round2.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const RANK_SOURCE = 'U.S. News & World Report — 2026 Best National Universities (verified directly via subscriber account)'
const LAC_RANK_SOURCE = 'U.S. News & World Report — 2026 Best National Liberal Arts Colleges (verified directly via subscriber account)'
const RATE_SOURCE = 'U.S. News & World Report — 2026 Best Colleges (verified directly via subscriber account)'
const TEST_SOURCE = 'U.S. News & World Report — 2026 Best Colleges (verified directly via subscriber account)'

const SCHOOLS = [
  {
    name: 'Williams College',
    location: 'Williamstown, MA',
    climate: 'Cold',
    sectors: ['Research'],
    baselineSelectivity: null, // derived from real acceptanceRate below
    acceptanceRate: 8,
    rankValue: 1,
    rankSource: LAC_RANK_SOURCE, // a Liberal Arts College, not National Universities — real, just a different US News list
    satRange: [1490, 1570],
    actRange: [34, 35],
    testPolicy: 'Test-Optional',
    internshipProgram: 'Small, elite liberal arts college with strong alumni networks into finance, consulting, and academia; renowned economics department.',
    requirements: ['SAT/ACT (test-optional)', 'Common App essay', 'Strong academic record across a broad liberal arts curriculum'],
    link: 'https://www.williams.edu',
    academicFields: ['Social Sciences', 'Humanities', 'Arts', 'Environmental Science & Sustainability'],
  },
  {
    name: 'University of Alabama at Birmingham',
    location: 'Birmingham, AL',
    climate: 'Warm',
    sectors: ['Healthcare & Biotech Hub', 'Research'],
    baselineSelectivity: null,
    acceptanceRate: 88,
    rankValue: 132,
    rankSource: RANK_SOURCE,
    satRange: [1210, 1450],
    actRange: [23, 30],
    testPolicy: 'Test-Optional',
    internshipProgram: 'Anchored by UAB Medicine, one of the largest academic medical centers in the US — strong biomedical research and clinical exposure for undergrads.',
    requirements: ['SAT/ACT (test-optional)', 'Common App essay', 'Solid GPA in college-prep coursework'],
    link: 'https://www.uab.edu',
    academicFields: ['Medicine & Health Sciences', 'Science & Technology / Research'],
  },
  {
    name: 'Indiana University Indianapolis',
    location: 'Indianapolis, IN',
    climate: 'Cold',
    sectors: ['Healthcare & Biotech Hub', 'Business'],
    baselineSelectivity: null,
    acceptanceRate: 76,
    rankValue: 192,
    rankSource: RANK_SOURCE,
    satRange: [1030, 1240],
    actRange: [21, 29],
    testPolicy: 'Test-Optional',
    internshipProgram: 'Urban Indianapolis campus with strong health-sciences and business internship access, home to the IU School of Medicine.',
    requirements: ['SAT/ACT (test-optional)', 'Common App essay', 'Solid GPA in college-prep coursework'],
    link: 'https://indianapolis.iu.edu',
    academicFields: ['Medicine & Health Sciences', 'Business'],
  },
  {
    name: 'University of Massachusetts Boston',
    location: 'Boston, MA',
    climate: 'Cold',
    sectors: ['Business', 'Research'],
    baselineSelectivity: null,
    acceptanceRate: 84,
    rankValue: 213,
    rankSource: RANK_SOURCE,
    satRange: [1100, 1290],
    actRange: [24, 30],
    testPolicy: 'Test-Optional',
    internshipProgram: 'Urban Boston/harbor-front campus with strong access to the city\'s finance, healthcare, and biotech internship market.',
    requirements: ['SAT/ACT (test-optional)', 'Common App essay', 'Solid GPA in college-prep coursework'],
    link: 'https://www.umb.edu',
    academicFields: ['Business', 'Social Sciences'],
  },
  {
    name: 'The Catholic University of America',
    location: 'Washington, DC',
    climate: 'Balanced',
    sectors: ['Government & Policy Hub'],
    baselineSelectivity: null,
    acceptanceRate: 83,
    rankValue: 169,
    rankSource: RANK_SOURCE,
    satRange: [1100, 1350],
    actRange: [23, 30],
    testPolicy: 'Test-Blind',
    internshipProgram: 'Washington, DC location gives strong access to government, policy, and law-adjacent internships; notable School of Architecture and Planning.',
    requirements: ['SAT/ACT (test-blind — not considered in admissions)', 'Common App essay', 'Solid GPA in college-prep coursework'],
    link: 'https://www.catholic.edu',
    academicFields: ['Humanities', 'Social Sciences', 'Architecture & Design', 'Engineering'],
  },
  {
    name: 'University of San Francisco',
    location: 'San Francisco, CA',
    climate: 'Warm',
    sectors: ['Tech Hub', 'Business'],
    baselineSelectivity: null,
    acceptanceRate: 62,
    rankValue: 110,
    rankSource: RANK_SOURCE,
    satRange: [1190, 1390],
    actRange: [25, 30],
    testPolicy: 'Test-Optional',
    internshipProgram: 'San Francisco location gives direct access to the Bay Area tech and startup internship market.',
    requirements: ['SAT/ACT (test-optional)', 'Common App essay', 'Solid GPA in college-prep coursework'],
    link: 'https://www.usfca.edu',
    academicFields: ['Business', 'Computer Science & IT', 'Social Sciences'],
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
  const baselineSelectivity = 100 - s.acceptanceRate
  await sql`
    INSERT INTO universities (
      name, country, location, climate, sectors, "baselineSelectivity",
      "internshipProgram", requirements, link, "academicFields",
      "actualAcceptanceRate", "acceptanceRateSource",
      "rankValue", "rankSource",
      "satRange25", "satRange75", "actRange25", "actRange75", "testScoreSource", "testPolicy"
    )
    VALUES (
      ${s.name}, 'US', ${s.location}, ${s.climate}, ${JSON.stringify(s.sectors)}::jsonb, ${baselineSelectivity},
      ${s.internshipProgram}, ${JSON.stringify(s.requirements)}::jsonb, ${s.link}, ${JSON.stringify(s.academicFields)}::jsonb,
      ${s.acceptanceRate}, ${RATE_SOURCE},
      ${s.rankValue}, ${s.rankSource},
      ${s.satRange[0]}, ${s.satRange[1]}, ${s.actRange[0]}, ${s.actRange[1]}, ${TEST_SOURCE}, ${s.testPolicy}
    )
  `
  inserted++
}

console.log(`Inserted ${inserted} new universities.`)
if (skipped.length) console.log(`Already existed: ${skipped.join(', ')}`)
console.log('Deliberately excluded: University of Maryland, Baltimore (graduate/professional-only campus, no undergraduate admissions data).')
