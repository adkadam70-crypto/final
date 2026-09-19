// Germany — EduRank.org overall institutional ranking (research
// citation-based), matched by exact normalized name against the existing
// catalog only. General/overall ranking, not subject-specific, so filed
// under "Science & Technology / Research" — same convention already used
// for other general institutional rankings in this table.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-de-edurank-overall.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const FIELD = 'Science & Technology / Research'
const SOURCE = 'EduRank.org Citation-Based Overall Ranking 2026 — Germany'
const URL = 'https://edurank.org/geo/de/'
const NOTE = 'EduRank.org citation-based overall institutional ranking (research output/citation counts, not subject-specific), not an admissions-selectivity metric — programSelectivity is our own derived scale for comparability, not itself a published figure.'

const DATA = [
  ['Heidelberg University', 1], ['Technical University of Munich', 3], ['University of Hamburg', 4], ['University of Tübingen', 5],
  ['Free University of Berlin', 6], ['University of Bonn', 7], ['University of Göttingen', 8], ['Humboldt University of Berlin', 9],
  ['University of Freiburg', 10], ['University of Cologne', 11], ['RWTH Aachen University', 12], ['University of Erlangen-Nuremberg', 13],
  ['Karlsruhe Institute of Technology', 15], ['University of Münster', 16], ['Johannes Gutenberg University Mainz', 18],
  ['Technical University of Berlin', 19], ['University of Würzburg', 20], ['Ruhr University Bochum', 21], ['Kiel University', 23],
  ['University of Stuttgart', 24], ['University of Marburg', 25], ['Saarland University', 29], ['University of Duisburg-Essen', 31],
  ['Martin Luther University of Halle-Wittenberg', 33], ['University of Bremen', 35], ['University of Regensburg', 36],
  ['University of Konstanz', 39], ['University of Rostock', 40], ['TU Dortmund University', 41], ['University of Potsdam', 42],
  ['University of Bayreuth', 44], ['University of Mannheim', 46], ['University of Greifswald', 48], ['University of Hohenheim', 50],
  ['University of Lübeck', 51], ['University of Kassel', 52], ['University of Augsburg', 53], ['University of Wuppertal', 54],
  ['Chemnitz University of Technology', 55], ['University of Trier', 57], ['University of Siegen', 59], ['Hamburg University of Technology', 62],
  ['University of Bamberg', 63], ['Munich University of Applied Sciences', 64], ['Witten/Herdecke University', 68],
  ['Leuphana University of Lüneburg', 69], ['Clausthal University of Technology', 70], ['Darmstadt University of Applied Sciences', 71],
  ['University of Passau', 72], ['Bauhaus-University Weimar', 75], ['German Sport University Cologne', 76],
  ['Folkwang University of the Arts', 77], ['Hamburg University of Applied Sciences', 81], ['University of Erfurt', 82],
  ['University of Hildesheim', 83], ['Catholic University of Eichstätt-Ingolstadt', 87], ['Berlin School of Economics and Law', 90],
  ['Münster University of Applied Sciences', 91], ['WHU – Otto Beisheim School of Management', 92],
  ['Weihenstephan-Triesdorf University of Applied Sciences', 93], ['Frankfurt University of Applied Sciences', 95],
  ['Hertie School of Governance', 96], ['Stuttgart University of Applied Sciences', 98], ['Berlin University of the Arts', 100],
]

let inserted = 0
const skipped = []

for (const [name, rank] of DATA) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'DE'`
  if (rows.length === 0) {
    skipped.push(name)
    continue
  }
  const universityId = rows[0].id
  const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${universityId} AND field = ${FIELD} AND "rankSource" = ${SOURCE}`
  if (existing.length > 0) continue
  await sql`
    INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (${universityId}, ${FIELD}, ${rank}, ${SOURCE}, ${URL}, ${selectivityFromRank(rank, 100)}, ${NOTE})
  `
  inserted++
}

console.log(`Inserted ${inserted} program-ranking rows.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
