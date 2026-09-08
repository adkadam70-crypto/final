// New US catalog additions — schools found while researching a real,
// citable undergraduate Environmental Science ranking (College Transitions'
// "2025 Best Colleges for Environmental Science") for a field that
// previously had zero program-ranking coverage in this catalog. Same
// standing policy as every other add-missing-universities-us-*.mjs script.
// Includes satRange/actRange/testPolicy on the initial insert per standing
// instruction — every new gap-fill university carries the full set of
// match-relevant fields up front, not just acceptance rate.
//
// Usage: node --env-file=.env.local scripts/add-missing-universities-us-environmental.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const TS = 'PrepScholar / BigFuture / CollegeTuitionCompare, self-reported scores of enrolled students (2024-25 cycle)'

const SCHOOLS = [
  {
    name: 'Colorado College', location: 'Colorado Springs, CO', climate: 'Cold', sectors: ['Research'],
    baselineSelectivity: 82, actualAcceptanceRate: 18,
    acceptanceRateSource: 'Colorado College 2024-25 admissions cycle — ~18.5% overall acceptance rate',
    internshipProgram: 'Runs on the "Block Plan": students take one course at a time in intensive 3.5-week blocks instead of a traditional simultaneous course load.',
    requirements: ['SAT/ACT (test-optional)', 'Common App essay plus supplement', 'Strong GPA and course rigor'],
    link: 'https://www.coloradocollege.edu', academicFields: ['Environmental Science & Sustainability', 'Humanities', 'Social Sciences'],
    satRange25: 1230, satRange75: 1460, actRange25: 29, actRange75: 33, testPolicy: 'Test-Optional',
  },
  {
    name: 'Scripps College', location: 'Claremont, CA', climate: 'Warm', sectors: ['Research'],
    baselineSelectivity: 62, actualAcceptanceRate: 38,
    acceptanceRateSource: 'Scripps College 2024-25 admissions cycle — ~38.3% overall acceptance rate',
    internshipProgram: "A women's college and one of the 7 Claremont Colleges, giving cross-registration access to Pomona, Harvey Mudd, Pitzer, and Claremont McKenna.",
    requirements: ['SAT/ACT (test-optional)', 'Common App essay plus supplement', 'Strong GPA and course rigor'],
    link: 'https://www.scrippscollege.edu', academicFields: ['Environmental Science & Sustainability', 'Humanities', 'Arts'],
    satRange25: 1440, satRange75: 1540, actRange25: 31, actRange75: 34, testPolicy: 'Test-Optional',
  },
  {
    name: 'Pitzer College', location: 'Claremont, CA', climate: 'Warm', sectors: ['Research'],
    baselineSelectivity: 75, actualAcceptanceRate: 25,
    acceptanceRateSource: 'Pitzer College 2024-25 admissions cycle — ~25.2% overall acceptance rate',
    internshipProgram: 'One of the 7 Claremont Colleges, known for a strong environmental analysis program and a social-justice-oriented curriculum.',
    requirements: ['SAT/ACT (test-optional)', 'Common App essay plus supplement', 'Strong GPA and course rigor'],
    link: 'https://www.pitzer.edu', academicFields: ['Environmental Science & Sustainability', 'Social Sciences'],
    satRange25: 1390, satRange75: 1510, actRange25: 31, actRange75: 33, testPolicy: 'Test-Optional',
  },
  {
    name: 'Dickinson College', location: 'Carlisle, PA', climate: 'Cold', sectors: ['Research'],
    baselineSelectivity: 58, actualAcceptanceRate: 42,
    acceptanceRateSource: 'Dickinson College 2024-25 admissions cycle — ~42.1% overall acceptance rate',
    internshipProgram: 'An early leader among LACs in campus sustainability (its own working farm supplies the dining hall) alongside strong study-abroad participation.',
    requirements: ['SAT/ACT (test-optional)', 'Common App essay plus supplement', 'Solid GPA and course rigor'],
    link: 'https://www.dickinson.edu', academicFields: ['Environmental Science & Sustainability', 'Humanities', 'Social Sciences'],
    satRange25: 1310, satRange75: 1460, actRange25: 30, actRange75: 33, testPolicy: 'Test-Optional',
  },
  {
    name: 'Clark University', location: 'Worcester, MA', climate: 'Cold', sectors: ['Research'],
    baselineSelectivity: 60, actualAcceptanceRate: 40,
    acceptanceRateSource: 'Clark University 2024-25 admissions cycle — ~40.4% overall acceptance rate',
    internshipProgram: 'Founded the first psychology PhD program in the US (G. Stanley Hall); also home to a well-regarded Graduate School of Geography with strong ties to its undergraduate environmental science offerings.',
    requirements: ['SAT/ACT (test-optional)', 'Common App essay plus supplement', 'Solid GPA and course rigor'],
    link: 'https://www.clarku.edu', academicFields: ['Environmental Science & Sustainability', 'Psychology', 'Social Sciences'],
    satRange25: 1288, satRange75: 1460, actRange25: 30, actRange75: 33, testPolicy: 'Test-Optional',
  },
  {
    name: 'Willamette University', location: 'Salem, OR', climate: 'Balanced', sectors: ['Government & Policy Hub'],
    baselineSelectivity: 23, actualAcceptanceRate: 77,
    acceptanceRateSource: 'Willamette University 2024-25 admissions cycle — ~77.1% overall acceptance rate',
    internshipProgram: "Located in Oregon's state capital, adjacent to the Capitol building, giving direct access to state government internships; also operates its own College of Law.",
    requirements: ['SAT/ACT (test-optional)', 'Common App essay', 'Solid GPA in college-prep coursework'],
    link: 'https://www.willamette.edu', academicFields: ['Environmental Science & Sustainability', 'Law', 'Business'],
    satRange25: 1220, satRange75: 1410, actRange25: 28, actRange75: 32, testPolicy: 'Test-Optional',
  },
  {
    name: 'Hobart and William Smith Colleges', location: 'Geneva, NY', climate: 'Cold', sectors: ['Research'],
    baselineSelectivity: 36, actualAcceptanceRate: 64,
    acceptanceRateSource: 'Hobart and William Smith Colleges 2024-25 admissions cycle — ~64% overall acceptance rate',
    internshipProgram: 'Coordinate colleges (historically Hobart for men, William Smith for women) sharing one campus on Seneca Lake in the Finger Lakes region, with a strong environmental studies program tied to the lake.',
    requirements: ['SAT/ACT (test-optional)', 'Common App essay', 'Solid GPA in college-prep coursework'],
    link: 'https://www.hws.edu', academicFields: ['Environmental Science & Sustainability', 'Humanities'],
    satRange25: 1180, satRange75: 1370, actRange25: 28, actRange75: 32, testPolicy: 'Test-Optional',
  },
  {
    name: 'Juniata College', location: 'Huntingdon, PA', climate: 'Cold', sectors: ['Research'],
    baselineSelectivity: 21, actualAcceptanceRate: 79,
    acceptanceRateSource: 'Juniata College 2024-25 admissions cycle — ~78.9% overall acceptance rate',
    internshipProgram: 'Distinctive for letting students design their own self-directed "Program of Emphasis" majors instead of choosing from a fixed list.',
    requirements: ['SAT/ACT (test-optional)', 'Common App essay', 'Solid GPA in college-prep coursework'],
    link: 'https://www.juniata.edu', academicFields: ['Environmental Science & Sustainability', 'Science & Technology / Research'],
    satRange25: 1075, satRange75: 1305, actRange25: 21, actRange75: 29, testPolicy: 'Test-Optional',
  },
  {
    name: 'SUNY College of Environmental Science and Forestry', location: 'Syracuse, NY', climate: 'Cold', sectors: ['Agriculture & Natural Resources', 'Research'],
    baselineSelectivity: 37, actualAcceptanceRate: 63,
    acceptanceRateSource: 'SUNY ESF 2024-25 admissions cycle — ~63.3% overall acceptance rate',
    internshipProgram: 'A specialized public college focused entirely on environmental science, forestry, and sustainability, sharing a campus with Syracuse University for cross-registration.',
    requirements: ['No standardized test required (test-blind)', 'Application essay', 'Solid GPA in science/math coursework'],
    link: 'https://www.esf.edu', academicFields: ['Environmental Science & Sustainability', 'Agriculture & Natural Resources', 'Engineering'],
    satRange25: 1130, satRange75: 1300, actRange25: 24, actRange75: 30, testPolicy: 'Test-Blind',
  },
  {
    name: 'University of North Carolina Wilmington', location: 'Wilmington, NC', climate: 'Warm', sectors: ['Research'],
    baselineSelectivity: 36, actualAcceptanceRate: 64,
    acceptanceRateSource: 'UNC Wilmington 2024-25 admissions cycle — ~64.2% overall acceptance rate',
    internshipProgram: "Coastal North Carolina campus with a well-regarded marine biology and coastal environmental science program, drawing on the Atlantic and Cape Fear River estuary directly.",
    requirements: ['SAT/ACT (test-optional)', 'Application essay', 'Solid GPA in college-prep coursework'],
    link: 'https://uncw.edu', academicFields: ['Environmental Science & Sustainability', 'Business', 'Social Sciences'],
    satRange25: 1230, satRange75: 1340, actRange25: 24, actRange75: 29, testPolicy: 'Test-Optional',
  },
  {
    name: 'University of North Carolina Asheville', location: 'Asheville, NC', climate: 'Balanced', sectors: ['Research'],
    baselineSelectivity: 8, actualAcceptanceRate: 92,
    acceptanceRateSource: 'UNC Asheville 2024-25 admissions cycle — ~91.9% overall acceptance rate',
    internshipProgram: "North Carolina's designated public liberal arts university, in the Blue Ridge Mountains, with a strong environmental studies program tied to the surrounding Appalachian ecology.",
    requirements: ['SAT/ACT (test-optional)', 'Application essay', 'Solid GPA in college-prep coursework'],
    link: 'https://www.unca.edu', academicFields: ['Environmental Science & Sustainability', 'Humanities'],
    satRange25: 1170, satRange75: 1360, actRange25: 23, actRange75: 29, testPolicy: 'Test-Optional',
  },
  {
    name: "St. Mary's College of Maryland", location: "St. Mary's City, MD", climate: 'Balanced', sectors: ['Research'],
    baselineSelectivity: 31, actualAcceptanceRate: 69,
    acceptanceRateSource: "St. Mary's College of Maryland 2024-25 admissions cycle — ~68.6% overall acceptance rate",
    internshipProgram: "Maryland's public honors college for the liberal arts, on a small waterfront campus on the Chesapeake Bay, giving direct field access for its environmental studies program.",
    requirements: ['SAT/ACT (test-optional)', 'Application essay', 'Solid GPA in college-prep coursework'],
    link: 'https://www.smcm.edu', academicFields: ['Environmental Science & Sustainability', 'Humanities'],
    satRange25: 1163, satRange75: 1320, actRange25: 26, actRange75: 31, testPolicy: 'Test-Optional',
  },
  {
    name: 'University of Vermont', location: 'Burlington, VT', climate: 'Cold', sectors: ['Research'],
    baselineSelectivity: 35, actualAcceptanceRate: 65,
    acceptanceRateSource: 'University of Vermont 2024-25 admissions cycle — ~65.3% overall acceptance rate',
    internshipProgram: 'Nationally known for its Rubenstein School of Environment and Natural Resources; Burlington location gives strong access to Lake Champlain field research and Vermont’s sustainability-focused economy.',
    requirements: ['SAT/ACT (test-optional)', 'Common App essay', 'Solid GPA in college-prep coursework'],
    link: 'https://www.uvm.edu', academicFields: ['Environmental Science & Sustainability', 'Medicine & Health Sciences', 'Agriculture & Natural Resources'],
    satRange25: 1290, satRange75: 1440, actRange25: 30, actRange75: 32, testPolicy: 'Test-Optional',
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
      ${s.actualAcceptanceRate ?? null}, ${s.acceptanceRateSource ?? null},
      ${s.satRange25}, ${s.satRange75}, ${s.actRange25}, ${s.actRange75}, ${TS}, ${s.testPolicy}
    )
  `
  inserted++
}

console.log(`Inserted ${inserted} new universities.`)
if (skipped.length) console.log(`Already existed: ${skipped.join(', ')}`)
