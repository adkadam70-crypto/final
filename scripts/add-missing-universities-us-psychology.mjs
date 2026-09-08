// New US catalog additions — elite liberal arts colleges found while
// researching a real, citable undergraduate Psychology program ranking
// (College Transitions' "2026 Best Colleges for Psychology," a different
// real source than the U.S. News subscriber list already seeded for this
// field) that weren't already in our general top-200 US catalog. Same
// standing policy as every other add-missing-universities-us-*.mjs script:
// a school missing from the general list but present in a real
// program-specific top-N still gets a full catalog entry.
//
// This batch specifically surfaced a systematic gap: several small, highly
// selective liberal-arts colleges (no graduate research output, so they're
// invisible to research-output-driven rankings like QS) are nonetheless
// top-50 nationally for undergraduate psychology specifically. Profile data
// follows the same convention as the existing Amherst/Williams/Swarthmore/
// Pomona/Harvey Mudd LAC rows already in the catalog: sectors = ['Research'].
//
// Usage: node --env-file=.env.local scripts/add-missing-universities-us-psychology.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const SCHOOLS = [
  {
    name: 'Barnard College',
    location: 'New York, NY',
    climate: 'Cold',
    sectors: ['Research'],
    baselineSelectivity: 91,
    actualAcceptanceRate: 9,
    acceptanceRateSource: 'Barnard College 2024-25 admissions cycle — ~8.84% overall acceptance rate',
    internshipProgram: 'A women’s college affiliated with Columbia University in NYC — students can cross-register for Columbia courses and use Columbia’s career center alongside Barnard’s own, with direct access to NYC’s internship market.',
    requirements: ['SAT/ACT (test-optional)', 'Common App essay plus Barnard-specific supplement', 'Strong GPA and course rigor'],
    link: 'https://barnard.edu',
    academicFields: ['Psychology', 'Social Sciences', 'Humanities', 'Arts'],
  },
  {
    name: 'Wellesley College',
    location: 'Wellesley, MA',
    climate: 'Cold',
    sectors: ['Research'],
    baselineSelectivity: 86,
    actualAcceptanceRate: 14,
    acceptanceRateSource: 'Wellesley College 2024-25 admissions cycle — ~14% overall acceptance rate',
    internshipProgram: 'A women’s college with cross-registration access to MIT and the wider twelve-college Boston-area consortium, plus a strong alumnae career network.',
    requirements: ['SAT/ACT (test-optional)', 'Common App essay plus Wellesley-specific supplement', 'Strong GPA and course rigor'],
    link: 'https://www.wellesley.edu',
    academicFields: ['Psychology', 'Social Sciences', 'Humanities'],
  },
  {
    name: 'Bates College',
    location: 'Lewiston, ME',
    climate: 'Cold',
    sectors: ['Research'],
    baselineSelectivity: 87,
    actualAcceptanceRate: 13,
    acceptanceRateSource: 'Bates College 2024-25 admissions cycle — ~13.3% overall acceptance rate',
    internshipProgram: 'A small Maine liberal arts college requiring a senior thesis in most majors, with a dedicated short (January) term often used for independent study, research, or an internship.',
    requirements: ['SAT/ACT (test-optional)', 'Common App essay plus Bates-specific supplement', 'Strong GPA and course rigor'],
    link: 'https://www.bates.edu',
    academicFields: ['Psychology', 'Social Sciences', 'Humanities', 'Environmental Science & Sustainability'],
  },
  {
    name: 'Carleton College',
    location: 'Northfield, MN',
    climate: 'Cold',
    sectors: ['Research'],
    baselineSelectivity: 80,
    actualAcceptanceRate: 20,
    acceptanceRateSource: 'Carleton College 2024-25 admissions cycle — ~20.4% overall acceptance rate',
    internshipProgram: 'A Minnesota liberal arts college known for an unusually strong undergraduate-research culture, including comprehensive exams and faculty-mentored research in most majors.',
    requirements: ['SAT/ACT (test-optional)', 'Common App essay plus Carleton-specific supplement', 'Strong GPA and course rigor'],
    link: 'https://www.carleton.edu',
    academicFields: ['Psychology', 'Social Sciences', 'Humanities', 'Mathematics & Statistics'],
  },
  {
    name: 'Smith College',
    location: 'Northampton, MA',
    climate: 'Cold',
    sectors: ['Research'],
    baselineSelectivity: 79,
    actualAcceptanceRate: 21,
    acceptanceRateSource: 'Smith College 2024-25 admissions cycle — ~21% overall acceptance rate',
    internshipProgram: 'One of very few women’s colleges with its own ABET-accredited engineering program; part of the Five College Consortium (with Amherst, Hampshire, Mount Holyoke, and UMass Amherst) for cross-registration.',
    requirements: ['SAT/ACT (test-optional)', 'Common App essay plus Smith-specific supplement', 'Strong GPA and course rigor'],
    link: 'https://www.smith.edu',
    academicFields: ['Psychology', 'Social Sciences', 'Engineering'],
  },
  {
    name: 'Colby College',
    location: 'Waterville, ME',
    climate: 'Cold',
    sectors: ['Research'],
    baselineSelectivity: 93,
    actualAcceptanceRate: 7,
    acceptanceRateSource: 'Colby College 2024-25 admissions cycle — ~7.1% overall acceptance rate',
    internshipProgram: 'DavisConnects funds an internship, research placement, or global experience for essentially every student who wants one, regardless of personal or financial networks.',
    requirements: ['SAT/ACT (test-optional)', 'Common App essay plus Colby-specific supplement', 'Strong GPA and course rigor'],
    link: 'https://www.colby.edu',
    academicFields: ['Psychology', 'Social Sciences', 'Humanities', 'Environmental Science & Sustainability'],
  },
  {
    name: 'Skidmore College',
    location: 'Saratoga Springs, NY',
    climate: 'Cold',
    sectors: ['Research', 'Creative Hub'],
    baselineSelectivity: 79,
    actualAcceptanceRate: 21,
    acceptanceRateSource: 'Skidmore College 2024-25 admissions cycle — ~21.1% overall acceptance rate',
    internshipProgram: 'Strong studio-art and design culture alongside its liberal-arts curriculum; active internship placement through its Career Development Center, aided by proximity to the Albany/Capital Region job market.',
    requirements: ['SAT/ACT (test-optional)', 'Common App essay plus Skidmore-specific supplement', 'Strong GPA and course rigor'],
    link: 'https://www.skidmore.edu',
    academicFields: ['Psychology', 'Social Sciences', 'Arts'],
  },
  {
    name: 'Connecticut College',
    location: 'New London, CT',
    climate: 'Cold',
    sectors: ['Research'],
    baselineSelectivity: 63,
    actualAcceptanceRate: 37,
    acceptanceRateSource: 'Connecticut College 2024-25 admissions cycle — ~37% overall acceptance rate',
    internshipProgram: 'Coastal Connecticut campus with an interdisciplinary general-education curriculum ("Connections") that emphasizes off-campus and experiential learning alongside coursework.',
    requirements: ['SAT/ACT (test-optional)', 'Common App essay plus Connecticut College-specific supplement', 'Strong GPA and course rigor'],
    link: 'https://www.conncoll.edu',
    academicFields: ['Psychology', 'Social Sciences', 'Humanities'],
  },
  {
    name: 'Grinnell College',
    location: 'Grinnell, IA',
    climate: 'Cold',
    sectors: ['Research'],
    baselineSelectivity: 86,
    actualAcceptanceRate: 14,
    acceptanceRateSource: 'Grinnell College 2024-25 admissions cycle — ~14.5% overall acceptance rate',
    internshipProgram: 'One of the largest per-student endowments of any US college, funding competitive (not guaranteed) stipends that offset the cost of unpaid summer internships and research.',
    requirements: ['SAT/ACT (test-optional)', 'Common App essay plus Grinnell-specific supplement', 'Strong GPA and course rigor'],
    link: 'https://www.grinnell.edu',
    academicFields: ['Psychology', 'Social Sciences', 'Humanities', 'Mathematics & Statistics'],
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
