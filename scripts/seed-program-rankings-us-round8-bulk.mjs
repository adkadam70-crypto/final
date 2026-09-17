// Continuation of the round 6-7 bulk aggregate-list approach — six more
// College Factual "Top Ranked" major lists (Nursing, Environmental Science,
// Computer Science, Communications, Criminal Justice, History, Architecture,
// Agriculture), cross-matched by exact normalized name against the
// zero-coverage gap list. Criminal Justice and Agriculture turned out to be
// especially fruitful — a lot of regional/technical-focused public
// universities in the gap list have real, citable rankings in exactly those
// two majors that never surfaced in the more "prestige" lists used so far.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-us-round8-bulk.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank) {
  return Math.max(15, Math.min(99, Math.round(100 - (rank - 1) * 1.1)))
}

const SRC = {
  nursing: ['College Factual — 2026 Best Nursing Schools', 'https://www.collegefactual.com/majors/health-care-professions/nursing/rankings/top-ranked/'],
  envsci: ['College Factual — 2026 Best Environmental Science Schools (Top 50)', 'https://www.collegefactual.com/majors/natural-resources-conservation/natural-resources-conservation/environmental-science/rankings/top-ranked/'],
  cs: ['College Factual — 2026 Best Computer Science Schools (Top 50)', 'https://www.collegefactual.com/majors/computer-information-sciences/computer-science/rankings/top-ranked/'],
  comm: ['College Factual — 2026 Best Communication & Media Studies Schools (Top 50)', 'https://www.collegefactual.com/majors/communication-journalism-media/communication-media-studies/rankings/top-ranked/'],
  crimjustice: ['College Factual — 2026 Best Criminal Justice Schools (Top 50)', 'https://www.collegefactual.com/majors/protective-security-safety-services/criminal-justice-and-corrections/criminal-justice/rankings/top-ranked/'],
  history: ['College Factual — 2026 Best History Schools (Top 50)', 'https://www.collegefactual.com/majors/history/history/rankings/top-ranked/'],
  arch: ['College Factual — 2026 Best Architecture Schools (Top 50)', 'https://www.collegefactual.com/majors/architecture-and-related-services/general-architecture/architecture/rankings/top-ranked/'],
  agri: ['College Factual — 2026 Best Agriculture Schools (Top 50)', 'https://www.collegefactual.com/majors/agriculture-ag-operations/general-agriculture/agriculture/rankings/top-ranked/'],
}

// [name in our catalog, field, rank, sourceKey]
const DATA = [
  // Nursing -> Medicine & Health Sciences
  ['California State University, Fullerton', 'Medicine & Health Sciences', 9, 'nursing'],
  ['San Jose State University', 'Medicine & Health Sciences', 10, 'nursing'],
  ['CUNY Graduate School and University Center', 'Medicine & Health Sciences', 13, 'nursing'],
  ['University of the Pacific', 'Medicine & Health Sciences', 24, 'nursing'],

  // Environmental Science -> Environmental Science & Sustainability
  ['University of Dayton', 'Environmental Science & Sustainability', 10, 'envsci'],
  ['Drake University', 'Environmental Science & Sustainability', 12, 'envsci'],
  ['San Jose State University', 'Environmental Science & Sustainability', 14, 'envsci'],
  ['Chapman University', 'Environmental Science & Sustainability', 22, 'envsci'],
  ['California State University, Fullerton', 'Environmental Science & Sustainability', 30, 'envsci'],
  ['Xavier University', 'Environmental Science & Sustainability', 33, 'envsci'],
  ['Miami University', 'Environmental Science & Sustainability', 36, 'envsci'],
  ['Sonoma State University', 'Environmental Science & Sustainability', 41, 'envsci'],
  ['University of Wisconsin-Platteville', 'Environmental Science & Sustainability', 45, 'envsci'],

  // Computer Science -> Computer Science & IT
  ['Milwaukee School of Engineering', 'Computer Science & IT', 27, 'cs'],
  ['Miami University', 'Computer Science & IT', 39, 'cs'],
  ['San Jose State University', 'Computer Science & IT', 47, 'cs'],

  // Communications -> Communications & Media
  ['Chapman University', 'Communications & Media', 25, 'comm'],
  ['San Jose State University', 'Communications & Media', 34, 'comm'],

  // Criminal Justice -> Law
  ['University of Nevada, Reno', 'Law', 6, 'crimjustice'],
  ['CUNY John Jay College of Criminal Justice', 'Law', 9, 'crimjustice'],
  ['Grand Valley State University', 'Law', 14, 'crimjustice'],
  ['Aurora University', 'Law', 17, 'crimjustice'],
  ['University of New Haven', 'Law', 18, 'crimjustice'],
  ['Roger Williams University', 'Law', 23, 'crimjustice'],
  ['Robert Morris University', 'Law', 24, 'crimjustice'],
  ['Ferris State University', 'Law', 25, 'crimjustice'],
  ['Western Illinois University', 'Law', 26, 'crimjustice'],
  ['University of Louisville', 'Law', 31, 'crimjustice'],
  ['Texas State University', 'Law', 32, 'crimjustice'],
  ['The Citadel', 'Law', 33, 'crimjustice'],
  ['Norwich University', 'Law', 37, 'crimjustice'],
  ['Stevenson University', 'Law', 40, 'crimjustice'],
  ['Abilene Christian University', 'Law', 42, 'crimjustice'],
  ['Salem State University', 'Law', 44, 'crimjustice'],
  ['Lynn University', 'Law', 45, 'crimjustice'],
  ['Kean University', 'Law', 46, 'crimjustice'],
  ['Pace University', 'Law', 49, 'crimjustice'],

  // History -> Humanities
  ['Trinity University', 'Humanities', 37, 'history'],
  ['Creighton University', 'Humanities', 38, 'history'],
  ['Towson University', 'Humanities', 42, 'history'],
  ['Union College', 'Humanities', 49, 'history'],

  // Architecture -> Architecture & Design
  ['University of North Carolina at Charlotte', 'Architecture & Design', 35, 'arch'],
  ['Kean University', 'Architecture & Design', 39, 'arch'],
  ['Mississippi State University', 'Architecture & Design', 41, 'arch'],
  ['Howard University', 'Architecture & Design', 43, 'arch'],
  ['Benedictine College', 'Architecture & Design', 45, 'arch'],
  ['Ball State University', 'Architecture & Design', 50, 'arch'],

  // Agriculture -> Agriculture & Natural Resources
  ['Western Illinois University', 'Agriculture & Natural Resources', 14, 'agri'],
  ['Texas State University', 'Agriculture & Natural Resources', 27, 'agri'],
  ['Oklahoma State University', 'Agriculture & Natural Resources', 28, 'agri'],
  ['Stephen F Austin State University', 'Agriculture & Natural Resources', 30, 'agri'],
  ['Tennessee Technological University', 'Agriculture & Natural Resources', 31, 'agri'],
  ['Fort Hays State University', 'Agriculture & Natural Resources', 35, 'agri'],
  ['Truman State University', 'Agriculture & Natural Resources', 39, 'agri'],
  ['University of Nevada, Reno', 'Agriculture & Natural Resources', 41, 'agri'],
  ['Dickinson State University', 'Agriculture & Natural Resources', 47, 'agri'],
  ['McNeese State University', 'Agriculture & Natural Resources', 49, 'agri'],
  ['Tarleton State University', 'Agriculture & Natural Resources', 50, 'agri'],
]

const NOTE = 'Peer-assessment or composite ranking, not an admissions-selectivity metric directly — programSelectivity here is our own derived scale for comparability with other rankings, not itself a published figure.'

let inserted = 0
const skipped = []

for (const [name, field, rank, sourceKey] of DATA) {
  const [source, url] = SRC[sourceKey]
  const rows = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'US'`
  if (rows.length === 0) {
    skipped.push(`${name} (${field})`)
    continue
  }
  const universityId = rows[0].id
  const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${universityId} AND field = ${field} AND "rankSource" = ${source}`
  if (existing.length > 0) continue

  await sql`
    INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (${universityId}, ${field}, ${rank}, ${source}, ${url}, ${selectivityFromRank(rank)}, ${NOTE})
  `
  inserted++
}

console.log(`Inserted ${inserted} program-ranking rows.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
