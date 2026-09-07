// Catalog tranche 4 — the remaining institutions in the three smallest
// country catalogs: Australia (+4), Hong Kong (+2), Singapore (+3).
//
// These catalogs were already near-complete (AU had 39 of ~43 accredited
// universities, HK had all 8 UGC-funded plus the main self-financing set,
// SG had all 6 autonomous universities). So this tranche is deliberately
// small and picks up two things the earlier passes missed: the couple of
// genuine university-status gaps, and — for program diversity — the
// specialist creative/performing-arts institutions (NIDA, AFTRS, HKAPA)
// that admit by audition or folio rather than on grades.
//
// rankValue: every row here is left NULL. THE's "Best universities in
// Australia" guide covers 37 institutions and does not list any of these
// (verified Sept 2026); HKAPA/THEi are not in QS World; the Singapore
// private providers are not ranked. Same treatment as the other unranked
// rows in each country — an ordinal is never invented.
//
// baselineSelectivity is a curated estimate, set to (100 - the acceptance
// estimate the country's acceptance-rate pass will assign) so the two agree
// even before that pass runs. The audition schools (NIDA, AFTRS, HKAPA) are
// scored on how hard the audition/folio round is, not on grades.
//
// Acceptance rate: the three acceptance-rate passes
// (seed-acceptance-estimates-{au,hk,sg}.mjs) have been extended to classify
// every name here — an audition-based estimate for the creative schools, a
// broad-access estimate for the private providers and applied institutes.
//
// Usage: node --env-file=.env.local scripts/seed-universities-tranche4.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const REQ_AU_STD = [
  'Year 12 / ATAR or a recognised equivalent; subject prerequisites vary by course',
  'English proficiency (IELTS/TOEFL) for international applicants',
]
const REQ_AUDITION = (what) => [
  `${what} — the decisive factor, not academic results`,
  'A completed secondary education (Year 12 or equivalent)',
  'English proficiency for international applicants',
]
const REQ_HK_STD = [
  'HKDSE or an equivalent secondary qualification; some programs weigh a portfolio or relevant sub-degree study',
  'English proficiency for international applicants',
]
const REQ_SG_PRIVATE = [
  'A-Level / IB / polytechnic diploma, or the institution\'s own diploma pathway',
  'English proficiency (IELTS/TOEFL) for international applicants',
]

const UNIVERSITIES = [
  // --- Australia ---
  { name: 'University of Divinity', country: 'AU', location: 'Melbourne, Victoria', climate: 'Balanced', sectors: ['Research'], baselineSelectivity: 15, internshipProgram: 'Australia\'s specialist university for theology, philosophy and ministry — a federation of teaching colleges across several Christian traditions; strong in classics, ethics, spiritual care and chaplaincy placements.', requirements: ['Year 12 / ATAR or equivalent; many programs also admit mature-age and pathway students', 'English proficiency for international applicants'], link: 'https://www.divinity.edu.au/', academicFields: ['Humanities', 'Education', 'Social Sciences'] },
  { name: 'Avondale University', country: 'AU', location: 'Cooranbong, New South Wales', climate: 'Warm', sectors: ['Research', 'Healthcare & Biotech Hub'], baselineSelectivity: 20, internshipProgram: 'A small Seventh-day Adventist university north of Sydney; nursing, education, ministry and arts with a strong teaching-practicum and clinical-placement focus.', requirements: ['Year 12 / ATAR or equivalent; portfolio or interview for some programs', 'English proficiency for international applicants'], link: 'https://www.avondale.edu.au/', academicFields: ['Medicine & Health Sciences', 'Education', 'Humanities', 'Science & Technology / Research'] },
  { name: 'National Institute of Dramatic Art', country: 'AU', location: 'Sydney, New South Wales', climate: 'Warm', sectors: ['Creative Hub'], baselineSelectivity: 96, internshipProgram: 'Australia\'s national drama school (NIDA); acting, directing, design, technical theatre, props and screen, with admission by audition or portfolio and a very small intake per discipline.', requirements: REQ_AUDITION('Audition or portfolio and interview'), link: 'https://www.nida.edu.au/', academicFields: ['Arts', 'Communications & Media'] },
  { name: 'Australian Film Television and Radio School', country: 'AU', location: 'Sydney, New South Wales', climate: 'Warm', sectors: ['Creative Hub'], baselineSelectivity: 90, internshipProgram: 'The Commonwealth\'s national screen and broadcast school (AFTRS); directing, cinematography, producing, editing, sound and radio, with a small folio-and-interview-selected intake.', requirements: REQ_AUDITION('Creative folio, written responses and an interview'), link: 'https://www.aftrs.edu.au/', academicFields: ['Arts', 'Communications & Media'] },

  // --- Hong Kong ---
  { name: 'The Hong Kong Academy for Performing Arts', country: 'HK', location: 'Wan Chai, Hong Kong', climate: 'Warm', sectors: ['Creative Hub'], baselineSelectivity: 80, internshipProgram: 'Hong Kong\'s flagship performing-arts institution (HKAPA); dance, drama, music, Chinese opera, film and television, and theatre and entertainment arts, with audition- or portfolio-based admission. QS ranks it among Asia\'s top performing-arts schools.', requirements: REQ_AUDITION('Audition, interview or portfolio'), link: 'https://www.hkapa.edu/', academicFields: ['Arts', 'Communications & Media'] },
  { name: 'Technological and Higher Education Institute of Hong Kong', country: 'HK', location: 'Tsing Yi / Chai Wan, Hong Kong', climate: 'Warm', sectors: ['Manufacturing & Engineering Hub', 'Creative Hub'], baselineSelectivity: 45, internshipProgram: 'A degree-granting member of Hong Kong\'s Vocational Training Council (THEi); applied degrees in engineering, environmental studies, design, hospitality and health sciences, taught with a heavy industry-placement component.', requirements: REQ_HK_STD, link: 'https://www.thei.edu.hk/', academicFields: ['Engineering', 'Environmental Science & Sustainability', 'Architecture & Design', 'Medicine & Health Sciences'] },

  // --- Singapore ---
  { name: 'Curtin Singapore', country: 'SG', location: 'Singapore', climate: 'Warm', sectors: ['Business', 'Tech Hub'], baselineSelectivity: 30, internshipProgram: 'The Singapore campus of Curtin University (Australia); business, communications, IT and engineering degrees on the same curriculum as Perth, on a three-trimester calendar.', requirements: ['A-Level / IB / polytechnic diploma, or a recognised foundation program', 'English proficiency (IELTS/TOEFL) for international applicants'], link: 'https://curtin.edu.sg/', academicFields: ['Business', 'Communications & Media', 'Computer Science & IT', 'Engineering'] },
  { name: 'Kaplan Higher Education Academy', country: 'SG', location: 'Singapore', climate: 'Warm', sectors: ['Business', 'Tech Hub'], baselineSelectivity: 20, internshipProgram: 'One of Singapore\'s largest private education providers; delivers bachelor\'s degrees from partner universities in the UK, Ireland and Australia across business, IT, communications and hospitality.', requirements: REQ_SG_PRIVATE, link: 'https://www.kaplan.com.sg/', academicFields: ['Business', 'Computer Science & IT', 'Communications & Media'] },
  { name: 'Management Development Institute of Singapore', country: 'SG', location: 'Singapore', climate: 'Warm', sectors: ['Business', 'Healthcare & Biotech Hub'], baselineSelectivity: 20, internshipProgram: 'Singapore\'s oldest not-for-profit professional institute (est. 1956, "MDIS"); delivers foreign-partner bachelor\'s degrees in business, engineering, life sciences, media and psychology.', requirements: REQ_SG_PRIVATE, link: 'https://www.mdis.edu.sg/', academicFields: ['Business', 'Engineering', 'Psychology', 'Communications & Media'] },
]

let inserted = 0
const skipped = []

for (const u of UNIVERSITIES) {
  const existing = await sql`SELECT id FROM universities WHERE name = ${u.name} AND country = ${u.country}`
  if (existing.length > 0) { skipped.push(u.name); continue }
  const [row] = await sql`
    INSERT INTO universities (
      name, country, location, climate, sectors, "baselineSelectivity",
      "internshipProgram", requirements, link, "academicFields"
    ) VALUES (
      ${u.name}, ${u.country}, ${u.location}, ${u.climate},
      ${JSON.stringify(u.sectors)}::jsonb, ${u.baselineSelectivity},
      ${u.internshipProgram}, ${JSON.stringify(u.requirements)}::jsonb,
      ${u.link}, ${JSON.stringify(u.academicFields)}::jsonb
    ) RETURNING id`
  console.log(`Added ${u.name} (${u.country}), id ${row.id}`)
  inserted++
}

console.log(`\nInserted ${inserted} institutions (tranche 4: AU/HK/SG).`)
if (skipped.length) console.log(`Already existed, skipped: ${skipped.join(', ')}`)
