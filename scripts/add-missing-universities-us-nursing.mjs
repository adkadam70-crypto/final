// New US catalog additions — schools found while researching a real,
// citable national Nursing ranking (NursingSchoolsAlmanac.com's 2024
// National Nursing School Rankings, a 100-school numbered list) that
// weren't already in our general top-200 US catalog. Same standing policy
// as every other add-missing-universities-us-*.mjs script.
//
// Deliberately excludes several names from that source list that don't fit
// this catalog's model of a general undergraduate-admitting university:
// graduate/professional-only health science centers with no real freshman
// admissions process (e.g. UCSF, Rush University, Oregon Health & Science
// University, the various "University of Texas Health Science Center at
// ___" campuses, Medical University of South Carolina, University of
// Nebraska Medical Center, University of Kansas Medical Center, UMass
// Medical School, University of Tennessee Health Science Center, University
// of Arkansas for Medical Sciences, SUNY Downstate) and small single-purpose
// nursing colleges with very narrow enrollment (Allen College, Mount Carmel
// College of Nursing, Saint Anthony College of Nursing, Goldfarb School of
// Nursing, Samuel Merritt University, Chamberlain University, West Coast
// University). Loma Linda University is also excluded: no acceptance-rate
// data could be found anywhere, and there's no other credible basis here
// for a curated selectivity estimate, so it's left out rather than guessed.
//
// Usage: node --env-file=.env.local scripts/add-missing-universities-us-nursing.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const SCHOOLS = [
  {
    name: 'Fairfield University', location: 'Fairfield, CT', climate: 'Cold',
    sectors: ['Healthcare & Biotech Hub', 'Business'],
    baselineSelectivity: 75, actualAcceptanceRate: 25,
    acceptanceRateSource: 'Fairfield University 2025 admissions cycle (Class of 2029) — ~25% overall acceptance rate',
    internshipProgram: 'Fairfield, CT campus about an hour from NYC; strong clinical placement network for nursing students and internship access to the NYC/Westport corporate corridor for business majors.',
    requirements: ['SAT/ACT (test-optional)', 'Common App essay', 'Strong GPA in college-prep coursework'],
    link: 'https://www.fairfield.edu', academicFields: ['Medicine & Health Sciences', 'Business'],
  },
  {
    name: 'Samford University', location: 'Birmingham, AL', climate: 'Warm',
    sectors: ['Healthcare & Biotech Hub'],
    baselineSelectivity: 18, actualAcceptanceRate: 82,
    acceptanceRateSource: 'Samford University Fall 2024 admissions cycle — ~82.4% overall acceptance rate',
    internshipProgram: 'Birmingham, AL location gives strong clinical placement access for nursing and pharmacy students through the city’s major hospital systems (UAB, Children’s of Alabama).',
    requirements: ['SAT/ACT (test-optional)', 'Common App essay', 'Solid GPA in college-prep coursework'],
    link: 'https://www.samford.edu', academicFields: ['Medicine & Health Sciences', 'Business', 'Law'],
  },
  {
    name: 'Widener University', location: 'Chester, PA', climate: 'Cold',
    sectors: ['Healthcare & Biotech Hub'],
    baselineSelectivity: 29, actualAcceptanceRate: 71,
    acceptanceRateSource: 'Widener University 2024-25 admissions cycle — ~71% overall acceptance rate',
    internshipProgram: 'Chester, PA campus near Philadelphia gives access to a large regional hospital network for nursing clinical placements; Widener also operates its own law schools.',
    requirements: ['SAT/ACT (test-optional)', 'Common App essay', 'Solid GPA in college-prep coursework'],
    link: 'https://www.widener.edu', academicFields: ['Medicine & Health Sciences', 'Engineering', 'Law'],
  },
  {
    name: 'Simmons University', location: 'Boston, MA', climate: 'Cold',
    sectors: ['Healthcare & Biotech Hub'],
    baselineSelectivity: 30, actualAcceptanceRate: 70,
    acceptanceRateSource: 'Simmons University 2024-25 admissions cycle — ~70% overall acceptance rate',
    internshipProgram: 'Boston campus in the Fenway academic district gives direct access to the city’s major teaching hospitals for nursing and health-science clinical placements.',
    requirements: ['SAT/ACT (test-optional)', 'Common App essay', 'Solid GPA in college-prep coursework'],
    link: 'https://www.simmons.edu', academicFields: ['Medicine & Health Sciences', 'Business', 'Social Sciences'],
  },
  {
    name: 'University of Portland', location: 'Portland, OR', climate: 'Balanced',
    sectors: ['Healthcare & Biotech Hub'],
    baselineSelectivity: 22, actualAcceptanceRate: 78,
    acceptanceRateSource: 'University of Portland Fall 2024 admissions cycle — ~78.3% overall acceptance rate',
    internshipProgram: 'A Catholic Holy Cross university with a well-regarded nursing school and strong clinical placement ties across the Portland, OR hospital network.',
    requirements: ['SAT/ACT (test-optional)', 'Common App essay', 'Solid GPA in college-prep coursework'],
    link: 'https://www.up.edu', academicFields: ['Medicine & Health Sciences', 'Engineering', 'Business'],
  },
  {
    name: 'Quinnipiac University', location: 'Hamden, CT', climate: 'Cold',
    sectors: ['Healthcare & Biotech Hub'],
    baselineSelectivity: 28, actualAcceptanceRate: 72,
    acceptanceRateSource: 'Quinnipiac University 2024-25 admissions cycle — ~72% overall acceptance rate',
    internshipProgram: 'Hamden, CT campus with its own School of Nursing and a separate School of Law, plus proximity to New Haven and NYC for internship access.',
    requirements: ['SAT/ACT (test-optional)', 'Common App essay', 'Solid GPA in college-prep coursework'],
    link: 'https://www.qu.edu', academicFields: ['Medicine & Health Sciences', 'Law', 'Business'],
  },
  {
    name: 'University of Scranton', location: 'Scranton, PA', climate: 'Cold',
    sectors: ['Healthcare & Biotech Hub'],
    baselineSelectivity: 19, actualAcceptanceRate: 81,
    acceptanceRateSource: 'University of Scranton 2024-25 admissions cycle — ~81.2% overall acceptance rate',
    internshipProgram: 'A Jesuit university in northeastern Pennsylvania with a well-established nursing program and regional hospital clinical partnerships.',
    requirements: ['SAT/ACT (test-optional)', 'Common App essay', 'Solid GPA in college-prep coursework'],
    link: 'https://www.scranton.edu', academicFields: ['Medicine & Health Sciences', 'Business'],
  },
  {
    name: 'James Madison University', location: 'Harrisonburg, VA', climate: 'Balanced',
    sectors: ['Research'],
    baselineSelectivity: 29, actualAcceptanceRate: 71,
    acceptanceRateSource: 'James Madison University 2024-25 admissions cycle — ~71.5% overall acceptance rate',
    internshipProgram: 'Large Virginia public university in the Shenandoah Valley with a well-regarded School of Nursing and a nationally strong College of Education.',
    requirements: ['SAT/ACT (optional)', 'Common App essay', 'Strong GPA in college-prep coursework'],
    link: 'https://www.jmu.edu', academicFields: ['Medicine & Health Sciences', 'Business', 'Education'],
  },
  {
    name: 'Virginia Commonwealth University', location: 'Richmond, VA', climate: 'Balanced',
    sectors: ['Healthcare & Biotech Hub', 'Government & Policy Hub'],
    baselineSelectivity: 7, actualAcceptanceRate: 93,
    acceptanceRateSource: 'Virginia Commonwealth University 2024-25 admissions cycle — ~92.7% overall acceptance rate',
    internshipProgram: 'Anchored by the VCU Medical Center, one of the largest academic medical centers in the region, plus a nationally top-ranked VCUarts program and Richmond’s state-capital job market.',
    requirements: ['SAT/ACT (test-optional)', 'Common App essay', 'Solid GPA in college-prep coursework'],
    link: 'https://www.vcu.edu', academicFields: ['Medicine & Health Sciences', 'Arts', 'Business'],
  },
  {
    name: 'Georgia College & State University', location: 'Milledgeville, GA', climate: 'Warm',
    sectors: ['Government & Policy Hub'],
    baselineSelectivity: 12, actualAcceptanceRate: 88,
    acceptanceRateSource: 'Georgia College & State University 2024 admissions cycle — ~88% overall acceptance rate',
    internshipProgram: 'Georgia’s designated public liberal arts university, with a well-regarded nursing program and a small, residential campus culture.',
    requirements: ['SAT/ACT (test-optional)', 'Application essay', 'Solid GPA in college-prep coursework'],
    link: 'https://www.gcsu.edu', academicFields: ['Medicine & Health Sciences', 'Business', 'Humanities'],
  },
  {
    name: 'University of North Carolina at Greensboro', location: 'Greensboro, NC', climate: 'Balanced',
    sectors: ['Research'],
    baselineSelectivity: 12, actualAcceptanceRate: 88,
    acceptanceRateSource: 'UNC Greensboro 2024 admissions cycle — ~88.5% overall acceptance rate',
    internshipProgram: 'Part of the UNC System, with a well-established nursing school and regional hospital clinical partnerships across the Piedmont Triad.',
    requirements: ['SAT/ACT (test-optional)', 'Application essay', 'Solid GPA in college-prep coursework'],
    link: 'https://www.uncg.edu', academicFields: ['Medicine & Health Sciences', 'Business', 'Education'],
  },
  {
    name: "Texas Woman's University", location: 'Denton, TX', climate: 'Warm',
    sectors: ['Healthcare & Biotech Hub'],
    baselineSelectivity: 4, actualAcceptanceRate: 96,
    acceptanceRateSource: "Texas Woman's University 2024 admissions cycle — ~96.1% overall acceptance rate",
    internshipProgram: "Now coeducational but historically a women's university; operates one of the largest nursing programs in the US across multiple Texas campuses (Denton, Dallas, Houston).",
    requirements: ['SAT/ACT (test-optional)', 'Application essay', 'Solid GPA in college-prep coursework'],
    link: 'https://twu.edu', academicFields: ['Medicine & Health Sciences'],
  },
  {
    name: 'South Dakota State University', location: 'Brookings, SD', climate: 'Cold',
    sectors: ['Agriculture & Natural Resources', 'Research'],
    baselineSelectivity: 2, actualAcceptanceRate: 98,
    acceptanceRateSource: 'South Dakota State University 2024 admissions cycle — ~98.3% overall acceptance rate',
    internshipProgram: "South Dakota's land-grant university, with a well-regarded College of Nursing alongside strong agriculture and engineering programs.",
    requirements: ['SAT/ACT (optional)', 'Solid GPA in college-prep coursework'],
    link: 'https://www.sdstate.edu', academicFields: ['Medicine & Health Sciences', 'Agriculture & Natural Resources', 'Engineering'],
  },
  {
    name: 'Gonzaga University', location: 'Spokane, WA', climate: 'Cold',
    sectors: ['Research'],
    baselineSelectivity: 20, actualAcceptanceRate: 80,
    acceptanceRateSource: 'Gonzaga University 2024-25 admissions cycle — ~79.6% overall acceptance rate',
    internshipProgram: 'A Jesuit university best known nationally for basketball, with a well-regarded nursing school and its own School of Law.',
    requirements: ['SAT/ACT (test-optional)', 'Common App essay', 'Solid GPA in college-prep coursework'],
    link: 'https://www.gonzaga.edu', academicFields: ['Medicine & Health Sciences', 'Business', 'Law'],
  },
  {
    name: 'Regis University', location: 'Denver, CO', climate: 'Cold',
    sectors: ['Healthcare & Biotech Hub'],
    baselineSelectivity: 13, actualAcceptanceRate: 86,
    acceptanceRateSource: 'Regis University 2024-25 admissions cycle — ~86.5% overall acceptance rate',
    internshipProgram: 'A Jesuit university in Denver with a well-established nursing and health-professions college, drawing on the city’s hospital network for clinical placements.',
    requirements: ['SAT/ACT (test-optional)', 'Application essay', 'Solid GPA in college-prep coursework'],
    link: 'https://www.regis.edu', academicFields: ['Medicine & Health Sciences', 'Business'],
  },
  {
    name: 'Adelphi University', location: 'Garden City, NY', climate: 'Cold',
    sectors: ['Healthcare & Biotech Hub'],
    baselineSelectivity: 34, actualAcceptanceRate: 66,
    acceptanceRateSource: 'Adelphi University 2024-25 admissions cycle — ~65.9% overall acceptance rate',
    internshipProgram: 'Long Island, NY campus with a long-established nursing school and a historically prominent psychology PhD program; close enough to NYC for internship access.',
    requirements: ['SAT/ACT (test-optional)', 'Common App essay', 'Solid GPA in college-prep coursework'],
    link: 'https://www.adelphi.edu', academicFields: ['Medicine & Health Sciences', 'Psychology', 'Business'],
  },
  {
    name: 'Thomas Jefferson University', location: 'Philadelphia, PA', climate: 'Cold',
    sectors: ['Healthcare & Biotech Hub'],
    baselineSelectivity: 19, actualAcceptanceRate: 81,
    acceptanceRateSource: 'Thomas Jefferson University 2024-25 admissions cycle — ~81% overall acceptance rate',
    internshipProgram: 'Formed from the merger of Thomas Jefferson University and Philadelphia University; combines a major academic medical center with the design/textile heritage of its Kanbar College, giving undergraduates access to both clinical and design-industry placements in Philadelphia.',
    requirements: ['SAT/ACT (test-optional)', 'Common App essay', 'Solid GPA in college-prep coursework'],
    link: 'https://www.jefferson.edu', academicFields: ['Medicine & Health Sciences', 'Architecture & Design'],
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
