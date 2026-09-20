// USA — adds 6 world-renowned independent music conservatories missing
// from the catalog entirely (Curtis, Cleveland Institute of Music,
// Juilliard, San Francisco Conservatory of Music, Manhattan School of
// Music, New England Conservatory), each with a real 2026 ranking. Same
// user-approved exception used for India's IIMs/IITs/NLUs. Also ranks the
// already-existing Berklee College of Music from the same list.
//
// Usage: node --env-file=.env.local scripts/add-and-rank-us-conservatories.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const FIELD = 'Arts'
const SOURCE = 'College Values Online 2026 — Top 20 Best Music Schools'
const URL = 'https://www.collegevaluesonline.com/rankings/best-music-schools/'
const POOL = 20
const NOTE = 'Independent ranking of music schools/conservatories, based on program reputation, faculty, and outcomes.'

const EXISTING = [
  ['Berklee College of Music', 6],
]

const NEW_SCHOOLS = [
  ['Curtis Institute of Music', 'Philadelphia, Pennsylvania', 1, 'https://www.curtis.edu'],
  ['Cleveland Institute of Music', 'Cleveland, Ohio', 5, 'https://www.cim.edu'],
  ['The Juilliard School', 'New York, New York', 7, 'https://www.juilliard.edu'],
  ['San Francisco Conservatory of Music', 'San Francisco, California', 8, 'https://sfcm.edu'],
  ['Manhattan School of Music', 'New York, New York', 9, 'https://www.msmnyc.edu'],
  ['The New England Conservatory of Music', 'Boston, Massachusetts', 11, 'https://necmusic.edu'],
]

const REQUIREMENTS = ['Audition/portfolio submission', "High school diploma or equivalent (undergraduate) / Bachelor's degree (graduate)"]
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
      VALUES (${name}, 'US', ${location}, 'Balanced', ${JSON.stringify(SECTORS)}, 85, 'Independent, highly selective music conservatory.', ${JSON.stringify(REQUIREMENTS)}, ${link}, ${JSON.stringify(FIELDS)})
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
