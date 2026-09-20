// USA — Tribal Colleges and Universities 2026 ranking. Ranks the 11
// already-existing catalog rows, then adds the 19 real, accredited TCUs
// missing from the catalog entirely (same user-approved exception used for
// India's IIMs/IITs/NLUs), and ranks those too.
//
// Usage: node --env-file=.env.local scripts/seed-and-add-us-tribal-colleges.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const FIELD = 'Science & Technology / Research'
const SOURCE = 'Tribal Colleges Ranking 2026'
const URL = 'https://www.collegevaluesonline.com/rankings/tribal-colleges/'
const POOL = 30
const NOTE = 'Overall Tribal College/University institutional ranking, not subject-specific.'

const EXISTING = [
  ['Salish Kootenai College', 1],
  ['Haskell Indian Nations University', 2],
  ['Chief Dull Knife College', 3],
  ['Aaniiih Nakoda College', 6],
  ['Ilisagvik College', 7],
  ['Southwestern Indian Polytechnic Institute', 12],
  ['Little Big Horn College', 20],
  ['Saginaw Chippewa Tribal College', 23],
  ['Stone Child College', 24],
  ['Leech Lake Tribal College', 26],
  ['Sisseton Wahpeton College', 27],
]

const NEW_SCHOOLS = [
  ['Fond du Lac Tribal and Community College', 'Cloquet, Minnesota', 4],
  ['College of the Muscogee Nation', 'Okmulgee, Oklahoma', 5],
  ['Turtle Mountain Community College', 'Belcourt, North Dakota', 8],
  ['College of Menominee Nation', 'Keshena, Wisconsin', 9],
  ['Bay Mills Community College', 'Brimley, Michigan', 10],
  ['Nebraska Indian Community College', 'Macy, Nebraska', 11],
  ['Cankdeska Cikana Community College', 'Fort Totten, North Dakota', 13],
  ['Northwest Indian College', 'Bellingham, Washington', 14],
  ["Tohono O'odham Community College", 'Sells, Arizona', 15],
  ['Navajo Technical University', 'Crownpoint, New Mexico', 16],
  ['Fort Peck Community College', 'Poplar, Montana', 17],
  ['Blackfeet Community College', 'Browning, Montana', 18],
  ['United Tribes Technical College', 'Bismarck, North Dakota', 19],
  ['Sitting Bull College', 'Fort Yates, North Dakota', 21],
  ['Diné College', 'Tsaile, Arizona', 22],
  ['Sinte Gleska University', 'Mission, South Dakota', 25],
  ['White Earth Tribal and Community College', 'Mahnomen, Minnesota', 28],
  ['Oglala Lakota College', 'Kyle, South Dakota', 29],
  ['Nueta Hidatsa Sahnish College', 'New Town, North Dakota', 30],
]

const REQUIREMENTS = ['High school diploma or equivalent', 'Open admission at most Tribal Colleges and Universities']
const SECTORS = ['General']
const FIELDS = ['Science & Technology / Research']

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
for (const [name, location, rank] of NEW_SCHOOLS) {
  const existing = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'US'`
  let id
  if (existing.length > 0) {
    id = existing[0].id
  } else {
    const [row] = await sql`
      INSERT INTO universities (name, country, location, climate, sectors, "baselineSelectivity", "internshipProgram", requirements, link, "academicFields")
      VALUES (${name}, 'US', ${location}, 'Balanced', ${JSON.stringify(SECTORS)}, 50, 'Tribal College/University serving Native American and Indigenous students, chartered by its respective tribal nation.', ${JSON.stringify(REQUIREMENTS)}, 'https://www.aihec.org', ${JSON.stringify(FIELDS)})
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
