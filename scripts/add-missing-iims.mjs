// India — adds the ~15 IIM (Indian Institute of Management) campuses that
// are real, nationally-run flagship business schools but were entirely
// missing from the catalog (only Ahmedabad, Bangalore, Calcutta, Indore,
// and Tiruchirappalli existed). User-approved exception to the
// no-new-universities rule for this session, given these are unambiguous,
// well-known, government-run institutions, not edge cases.
//
// Usage: node --env-file=.env.local scripts/add-missing-iims.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const REQUIREMENTS = ["CAT score", "Bachelor's degree (postgraduate program)"]
const SECTORS = ['Finance Capital']
const FIELDS = ['Business']
const ACCEPT_NOTE = 'Estimated from CAT (Common Admission Test) percentile cutoffs and seat counts against India\'s large national applicant pool (typically 2+ lakh CAT takers/year) — a research estimate, not a figure certified by the institute.'

const DATA = [
  ['Indian Institute of Management Kozhikode', 'Kozhikode, Kerala', 'Warm', 96, 2, 'https://www.iimk.ac.in', 'Established 1996; consistently ranked among India\'s top IIMs, strong finance and consulting placement.'],
  ['Indian Institute of Management Lucknow', 'Lucknow, Uttar Pradesh', 'Warm', 97, 2, 'https://www.iiml.ac.in', 'Established 1984, among the oldest IIMs after Ahmedabad/Calcutta/Bangalore; strong marketing and general management placement.'],
  ['Indian Institute of Management Shillong', 'Shillong, Meghalaya', 'Cold', 88, 4, 'https://www.iimshillong.ac.in', 'Established 2007; growing reputation in northeast India, strong regional recruiter base.'],
  ['Indian Institute of Management Rohtak', 'Rohtak, Haryana', 'Warm', 87, 4, 'https://www.iimrohtak.ac.in', 'Established 2010, part of the second wave of IIMs; NCR-adjacent recruiter access.'],
  ['Indian Institute of Management Raipur', 'Raipur, Chhattisgarh', 'Warm', 86, 5, 'https://www.iimraipur.ac.in', 'Established 2010; central-India business hub placement base.'],
  ['Indian Institute of Management Ranchi', 'Ranchi, Jharkhand', 'Warm', 86, 5, 'https://www.iimranchi.ac.in', 'Established 2010; strong mining/PSU-sector recruiter ties given regional industry.'],
  ['Indian Institute of Management Udaipur', 'Udaipur, Rajasthan', 'Warm', 87, 4, 'https://www.iimu.ac.in', 'Established 2011; known for entrepreneurship and analytics specializations.'],
  ['Indian Institute of Management Kashipur', 'Kashipur, Uttarakhand', 'Balanced', 85, 5, 'https://www.iimkashipur.ac.in', 'Established 2011; growing analytics and rural management focus.'],
  ['Indian Institute of Management Visakhapatnam', 'Visakhapatnam, Andhra Pradesh', 'Warm', 80, 6, 'https://www.iimv.ac.in', 'Established 2015; port-city location gives logistics/maritime-sector recruiter access.'],
  ['Indian Institute of Management Nagpur', 'Nagpur, Maharashtra', 'Warm', 80, 6, 'https://www.iimnagpur.ac.in', 'Established 2015; central-India logistics-hub placement base.'],
  ['Indian Institute of Management Bodh Gaya', 'Bodh Gaya, Bihar', 'Warm', 76, 7, 'https://www.iimbg.ac.in', 'Established 2015; newer campus, smaller cohort, developing recruiter base.'],
  ['Indian Institute of Management Jammu', 'Jammu, Jammu and Kashmir', 'Balanced', 78, 6, 'https://www.iimj.ac.in', 'Established 2016; developing recruiter base, growing analytics program.'],
  ['Indian Institute of Management Amritsar', 'Amritsar, Punjab', 'Warm', 79, 6, 'https://www.iimamritsar.ac.in', 'Established 2015; growing regional recruiter base in Punjab/NCR corridor.'],
  ['Indian Institute of Management Sambalpur', 'Sambalpur, Odisha', 'Warm', 75, 7, 'https://www.iimsambalpur.ac.in', 'Established 2015; newer campus, developing placement record.'],
  ['Indian Institute of Management Sirmaur', 'Sirmaur, Himachal Pradesh', 'Cold', 74, 7, 'https://www.iimsirmaur.ac.in', 'Established 2015; newest and smallest IIM cohort, developing placement record.'],
]

let inserted = 0
for (const [name, location, climate, selectivity, estRate, link, internship] of DATA) {
  const existing = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'IN'`
  if (existing.length > 0) { console.log(`SKIP (already exists): ${name}`); continue }
  await sql`
    INSERT INTO universities (name, country, location, climate, sectors, "baselineSelectivity", "internshipProgram", requirements, link, "academicFields", "estimatedAcceptanceRate", "acceptanceRateNote")
    VALUES (${name}, 'IN', ${location}, ${climate}, ${JSON.stringify(SECTORS)}, ${selectivity}, ${internship}, ${JSON.stringify(REQUIREMENTS)}, ${link}, ${JSON.stringify(FIELDS)}, ${estRate}, ${`Estimated ~${estRate}% — ${ACCEPT_NOTE}`})
  `
  inserted++
}

console.log(`Inserted ${inserted} new IIM university rows.`)
