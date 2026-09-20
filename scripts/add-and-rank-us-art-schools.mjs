// USA — "100 Best Art Schools" 2026 ranking (empowerly.com). Ranks the
// confirmed existing catalog matches, then adds well-known, accredited,
// independently-chartered art schools missing from the catalog entirely
// (same user-approved exception used for India's IIMs/IITs/NLUs and the
// Tribal Colleges round) and ranks those too. University art DEPARTMENTS
// (e.g. "UCLA School of the Arts and Architecture") are deliberately
// excluded — those are not separate institutions from the already-catalog
// university.
//
// Usage: node --env-file=.env.local scripts/add-and-rank-us-art-schools.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const FIELD = 'Arts'
const SOURCE = '100 Best Art Schools & Colleges in the US 2026 (Empowerly)'
const URL = 'https://empowerly.com/majors/arts/the-best-art-schools-in-the-us/'
const POOL = 100
const NOTE = 'Independent ranking of standalone art & design colleges, based on program reputation, faculty, and outcomes.'

const EXISTING = [
  ['School of the Art Institute of Chicago', 2],
  ['Maryland Institute College of Arts', 8],
  ['Savannah College of Art and Design', 9],
  ['California College of the Arts', 20],
  ['Lesley University', 35],
  ['Pratt Institute', 7],
  ['The Cooper Union for the Advancement of Science and Art', 18],
  ['Minneapolis College of Art and Design', 26],
]

const NEW_SCHOOLS = [
  ['Parsons School of Design', 'New York, New York', 10, 'https://www.newschool.edu/parsons/'],
  ['School of Visual Arts', 'New York, New York', 11, 'https://www.sva.edu'],
  ['Art Center College of Design', 'Pasadena, California', 12, 'https://www.artcenter.edu'],
  ['Otis College of Art and Design', 'Los Angeles, California', 14, 'https://www.otis.edu'],
  ['Ringling College of Art and Design', 'Sarasota, Florida', 15, 'https://www.ringling.edu'],
  ['Massachusetts College of Art and Design', 'Boston, Massachusetts', 19, 'https://massart.edu'],
  ['Cleveland Institute of Art', 'Cleveland, Ohio', 25, 'https://www.cia.edu'],
  ['Kansas City Art Institute', 'Kansas City, Missouri', 27, 'https://kcai.edu'],
  ['Pacific Northwest College of Art', 'Portland, Oregon', 28, 'https://www.pnca.edu'],
  ['Fashion Institute of Technology', 'New York, New York', 30, 'https://www.fitnyc.edu'],
  ['Cornish College of the Arts', 'Seattle, Washington', 32, 'https://www.cornish.edu'],
  ['Moore College of Art & Design', 'Philadelphia, Pennsylvania', 37, 'https://moore.edu'],
  ['Columbus College of Art & Design', 'Columbus, Ohio', 40, 'https://www.ccad.edu'],
  ['Montserrat College of Art', 'Beverly, Massachusetts', 44, 'https://www.montserrat.edu'],
  ['Memphis College of Art', 'Memphis, Tennessee', 48, 'https://mca.edu'],
  ['Rocky Mountain College of Art and Design', 'Lakewood, Colorado', 51, 'https://www.rmcad.edu'],
  ['Art Academy of Cincinnati', 'Cincinnati, Ohio', 57, 'https://www.artacademy.edu'],
  ['College for Creative Studies', 'Detroit, Michigan', 59, 'https://www.collegeforcreativestudies.edu'],
]

const REQUIREMENTS = ['Portfolio submission', 'High school diploma or equivalent (undergraduate) / Bachelor\'s degree (graduate)']
const SECTORS = ['Creative Hub']
const FIELDS = ['Arts']

let rankedExisting = 0
for (const [name, rank] of EXISTING) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'US'`
  if (rows.length === 0) { console.log('not found:', name); continue }
  const id = rows[0].id
  const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${id} AND field = ${FIELD} AND "rankSource" = ${SOURCE}`
  if (existing.length > 0) continue
  await sql`
    INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (${id}, ${FIELD}, ${rank}, ${SOURCE}, ${URL}, ${selectivityFromRank(rank, POOL)}, ${NOTE})
  `
  rankedExisting++
}

let inserted = 0
let rankedNew = 0
for (const [name, location, rank, link] of NEW_SCHOOLS) {
  const existing = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'US'`
  let id
  if (existing.length > 0) {
    id = existing[0].id
  } else {
    const [row] = await sql`
      INSERT INTO universities (name, country, location, climate, sectors, "baselineSelectivity", "internshipProgram", requirements, link, "academicFields")
      VALUES (${name}, 'US', ${location}, 'Balanced', ${JSON.stringify(SECTORS)}, 65, 'Independent, accredited art and design college.', ${JSON.stringify(REQUIREMENTS)}, ${link}, ${JSON.stringify(FIELDS)})
      RETURNING id
    `
    id = row.id
    inserted++
  }
  await sql`
    INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (${id}, ${FIELD}, ${rank}, ${SOURCE}, ${URL}, ${selectivityFromRank(rank, POOL)}, ${NOTE})
  `
  rankedNew++
}

console.log(`Ranked ${rankedExisting} existing rows. Inserted ${inserted} new university rows, ranked ${rankedNew} of them.`)
