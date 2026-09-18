// Second program-ranking pass for Germany, widening beyond the first 5
// schools (see scripts/seed-program-rankings-de-qs-subject.mjs for why CHE
// can't be used and why QS/THE subject ranks are world-scale, not a
// Germany-only pool). Same QS World University Rankings by Subject 2026
// source, three more subjects: Computer Science & IT, Engineering
// (Mechanical/Aeronautical/Manufacturing subject specifically — flagged in
// notes, not a general-Engineering figure), Business (WHU, a pure business
// school), and Economics (Cologne). Numbers verified via WebSearch against
// topuniversities.com / xuanxiao.org QS mirror / official university press
// pages (uni-mannheim.de, wiso.uni-koeln.de) before insertion — several
// candidate numbers that only appeared once, or conflicted across sources
// (e.g. TUM's Natural Sciences/CS rank was reported inconsistently), were
// deliberately left out rather than guessed.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-de-round2.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank) {
  return Math.max(15, Math.min(99, Math.round(100 - (rank - 1) * 0.42)))
}

const CS_SOURCE = 'QS World University Rankings by Subject 2026'
const CS_URL = 'https://www.topuniversities.com/university-subject-rankings/computer-science-information-systems'
const CS_NOTE = 'World subject rank (not a country-specific pool) — programSelectivity here is our own derived scale for comparability with other rankings, not itself a published figure.'

const ENG_URL = 'https://www.topuniversities.com/university-subject-rankings/engineering-mechanical-aeronautical-manufacturing'
const ENG_NOTE = 'World rank for the Mechanical, Aeronautical & Manufacturing Engineering QS subject specifically, not a general Engineering figure — shown here under our broader Engineering field for comparability.'

const DATA = [
  // Computer Science & IT
  ['Ludwig Maximilian University of Munich', 'Computer Science & IT', 89, CS_SOURCE, CS_URL, CS_NOTE],
  ['Technical University of Berlin', 'Computer Science & IT', 96, CS_SOURCE, CS_URL, CS_NOTE],
  ['Karlsruhe Institute of Technology', 'Computer Science & IT', 110, CS_SOURCE, CS_URL, CS_NOTE],
  ['RWTH Aachen University', 'Computer Science & IT', 122, CS_SOURCE, CS_URL, CS_NOTE],
  ['Humboldt University of Berlin', 'Computer Science & IT', 136, CS_SOURCE, CS_URL, CS_NOTE],
  ['Heidelberg University', 'Computer Science & IT', 165, CS_SOURCE, CS_URL, CS_NOTE],
  ['Technical University of Darmstadt', 'Computer Science & IT', 171, CS_SOURCE, CS_URL, CS_NOTE],
  ['University of Bonn', 'Computer Science & IT', 197, CS_SOURCE, CS_URL, CS_NOTE],
  // Engineering (Mechanical/Aeronautical/Manufacturing subject)
  ['Technical University of Munich', 'Engineering', 19, CS_SOURCE, ENG_URL, ENG_NOTE],
  ['RWTH Aachen University', 'Engineering', 25, CS_SOURCE, ENG_URL, ENG_NOTE],
  ['Karlsruhe Institute of Technology', 'Engineering', 32, CS_SOURCE, ENG_URL, ENG_NOTE],
  // Business
  [
    'WHU – Otto Beisheim School of Management',
    'Business',
    22,
    CS_SOURCE,
    'https://www.topuniversities.com/university-subject-rankings/business-management-studies',
    'WHU is a dedicated private business school (no other faculties) — this is its overall Business and Management Studies world rank.',
  ],
  // Economics
  [
    'University of Cologne',
    'Economics',
    193,
    CS_SOURCE,
    'https://www.topuniversities.com/university-subject-rankings/economics-econometrics',
    'World subject rank — programSelectivity here is our own derived scale for comparability, not itself a published figure.',
  ],
]

let inserted = 0
const skipped = []

for (const [name, field, rank, source, url, note] of DATA) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'DE'`
  if (rows.length === 0) {
    skipped.push(`${name} (${field})`)
    continue
  }
  const universityId = rows[0].id
  const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${universityId} AND field = ${field} AND "rankSource" = ${source}`
  if (existing.length > 0) continue

  await sql`
    INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (${universityId}, ${field}, ${rank}, ${source}, ${url}, ${selectivityFromRank(rank)}, ${note})
  `
  inserted++
}

console.log(`Inserted ${inserted} program-ranking rows.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
