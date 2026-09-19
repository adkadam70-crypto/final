// Germany — EduRank.org citation-based subject rankings for Business and
// Engineering, matched by exact normalized name against the existing
// catalog only.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-de-edurank-business-eng.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const NOTE = 'EduRank.org citation-based subject ranking (research output/citation counts), not an admissions-selectivity metric — programSelectivity is our own derived scale for comparability, not itself a published figure.'

const SRC = {
  biz: ['Business', 'EduRank.org Citation-Based Subject Ranking 2026 — Business (Germany)', 'https://edurank.org/business/de/', 100],
  eng: ['Engineering', 'EduRank.org Citation-Based Subject Ranking 2026 — Engineering (Germany)', 'https://edurank.org/engineering/de/', 100],
}

const DATA = {
  biz: [
    ['RWTH Aachen University', 1], ['Technical University of Munich', 2], ['University of Hamburg', 3], ['Karlsruhe Institute of Technology', 5],
    ['Technical University of Berlin', 7], ['Heidelberg University', 8], ['University of Bonn', 9], ['University of Stuttgart', 10],
    ['Free University of Berlin', 11], ['University of Erlangen-Nuremberg', 13], ['University of Mannheim', 14], ['Humboldt University of Berlin', 16],
    ['TU Dortmund University', 17], ['University of Freiburg', 18], ['University of Cologne', 19], ['University of Duisburg-Essen', 20],
    ['University of Göttingen', 21], ['Ruhr University Bochum', 22], ['University of Tübingen', 23], ['University of Bremen', 24],
    ['University of Münster', 25], ['Kiel University', 26], ['University of Potsdam', 30], ['University of Konstanz', 32],
    ['Johannes Gutenberg University Mainz', 33], ['Saarland University', 34], ['University of Würzburg', 35], ['University of Kassel', 37],
    ['University of Marburg', 42], ['Leuphana University of Lüneburg', 45], ['University of Augsburg', 46], ['University of Regensburg', 47],
    ['University of Bayreuth', 49], ['Martin Luther University of Halle-Wittenberg', 50], ['University of Wuppertal', 52],
    ['Hamburg University of Technology', 53], ['University of Siegen', 55], ['WHU – Otto Beisheim School of Management', 56],
    ['University of Rostock', 57], ['University of Hohenheim', 58], ['Chemnitz University of Technology', 59], ['University of Trier', 60],
    ['University of Bamberg', 61], ['University of Passau', 63], ['Berlin School of Economics and Law', 64], ['University of Lübeck', 71],
    ['University of Greifswald', 74], ['Catholic University of Eichstätt-Ingolstadt', 75], ['Witten/Herdecke University', 76],
    ['Clausthal University of Technology', 77], ['Darmstadt University of Applied Sciences', 78], ['Hertie School of Governance', 79],
    ['Bauhaus-University Weimar', 80], ['German Sport University Cologne', 81], ['ESMT Berlin', 85], ['University of Hildesheim', 86],
    ['Zeppelin University', 87], ['University of Erfurt', 88], ['Munich University of Applied Sciences', 92], ['Hamburg University of Applied Sciences', 93],
    ['Reutlingen University', 96], ['Pforzheim University', 98], ['Folkwang University of the Arts', 99],
  ],
  eng: [
    ['Technical University of Munich', 1], ['RWTH Aachen University', 2], ['Karlsruhe Institute of Technology', 3],
    ['University of Erlangen-Nuremberg', 4], ['Heidelberg University', 5], ['University of Stuttgart', 7], ['University of Hamburg', 8],
    ['Technical University of Berlin', 9], ['Ruhr University Bochum', 11], ['University of Göttingen', 12], ['University of Freiburg', 13],
    ['University of Münster', 15], ['University of Bonn', 16], ['University of Tübingen', 17], ['Free University of Berlin', 18],
    ['Johannes Gutenberg University Mainz', 19], ['University of Würzburg', 22], ['TU Dortmund University', 24], ['Humboldt University of Berlin', 25],
    ['University of Duisburg-Essen', 26], ['University of Cologne', 27], ['Kiel University', 28], ['Martin Luther University of Halle-Wittenberg', 32],
    ['University of Bremen', 33], ['University of Regensburg', 34], ['University of Marburg', 35], ['Saarland University', 36],
    ['University of Bayreuth', 37], ['University of Konstanz', 43], ['University of Potsdam', 44], ['University of Rostock', 45],
    ['Hamburg University of Technology', 48], ['Chemnitz University of Technology', 49], ['University of Wuppertal', 52], ['University of Kassel', 53],
    ['University of Augsburg', 54], ['Clausthal University of Technology', 55], ['University of Siegen', 57], ['University of Lübeck', 59],
    ['University of Hohenheim', 60], ['Darmstadt University of Applied Sciences', 63], ['University of Greifswald', 64], ['University of Mannheim', 65],
    ['Folkwang University of the Arts', 69], ['Bauhaus-University Weimar', 70], ['University of Trier', 73], ['University of Passau', 74],
    ['Munich University of Applied Sciences', 75], ['Witten/Herdecke University', 77], ['Leuphana University of Lüneburg', 78],
    ['Karlsruhe University of Applied Sciences', 80], ['University of Bamberg', 82], ['Hamburg University of Applied Sciences', 83],
    ['German Sport University Cologne', 84], ['University of Hildesheim', 86], ['Münster University of Applied Sciences', 87],
    ['Stuttgart University of Applied Sciences', 89], ['Catholic University of Eichstätt-Ingolstadt', 91], ['Reutlingen University', 93],
    ['Offenburg University of Applied Sciences', 96], ['Deggendorf Institute of Technology', 97], ['Esslingen University of Applied Sciences', 98],
    ['Berlin School of Economics and Law', 99],
  ],
}

let inserted = 0
const skipped = []

for (const [key, rows] of Object.entries(DATA)) {
  const [field, source, url, poolSize] = SRC[key]
  for (const [name, rank] of rows) {
    const found = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'DE'`
    if (found.length === 0) {
      skipped.push(`${name} (${key})`)
      continue
    }
    const universityId = found[0].id
    const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${universityId} AND field = ${field} AND "rankSource" = ${source}`
    if (existing.length > 0) continue
    await sql`
      INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
      VALUES (${universityId}, ${field}, ${rank}, ${source}, ${url}, ${selectivityFromRank(rank, poolSize)}, ${NOTE})
    `
    inserted++
  }
}

console.log(`Inserted ${inserted} program-ranking rows.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
