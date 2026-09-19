// Germany — EduRank.org citation-based subject rankings for Computer Science
// and Medicine, matched by exact normalized name against the existing
// catalog only.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-de-edurank-cs-medicine.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const NOTE = 'EduRank.org citation-based subject ranking (research output/citation counts), not an admissions-selectivity metric — programSelectivity is our own derived scale for comparability, not itself a published figure.'

const SRC = {
  cs: ['Computer Science & IT', 'EduRank.org Citation-Based Subject Ranking 2026 — Computer Science (Germany)', 'https://edurank.org/cs/de/', 100],
  med: ['Medicine & Health Sciences', 'EduRank.org Citation-Based Subject Ranking 2026 — Medicine (Germany)', 'https://edurank.org/medicine/de/', 100],
}

const DATA = {
  cs: [
    ['Technical University of Munich', 1], ['Heidelberg University', 2], ['University of Munich', 3], ['RWTH Aachen University', 4],
    ['University of Hamburg', 5], ['University of Freiburg', 6], ['Karlsruhe Institute of Technology', 7], ['University of Erlangen-Nuremberg', 8],
    ['University of Tübingen', 9], ['University of Bonn', 10], ['Goethe University of Frankfurt am Main', 11], ['University of Göttingen', 12],
    ['Technical University of Berlin', 13], ['Dresden University of Technology', 14], ['Darmstadt University of Technology', 15],
    ['Ruhr University Bochum', 17], ['University of Stuttgart', 18], ['Free University of Berlin', 19], ['Humboldt University of Berlin', 20],
    ['Heinrich Heine University of Düsseldorf', 21], ['TU Dortmund University', 22], ['University of Cologne', 23], ['University of Würzburg', 24],
    ['Johannes Gutenberg University Mainz', 25], ['University of Münster', 26], ['Saarland University', 27], ['University of Leipzig', 28],
    ['Kiel University', 29], ['University of Ulm', 30], ['Friedrich Schiller University of Jena', 31], ['University of Duisburg-Essen', 32],
    ['University of Bremen', 33], ['University of Bielefeld', 34], ['University of Marburg', 35], ['Otto von Guericke University of Magdeburg', 36],
    ['University of Potsdam', 37], ['Braunschweig University of Technology', 38], ['Leibniz University of Hanover', 39],
    ['University of Lübeck', 40], ['University of Konstanz', 41], ['University of Regensburg', 43], ['University of Giessen', 44],
    ['University of Mannheim', 45], ['Technical University of Kaiserslautern', 46], ['University of Paderborn', 47], ['University of Rostock', 48],
    ['Carl von Ossietzky University of Oldenburg', 49], ['Martin Luther University of Halle-Wittenberg', 50], ['University of Bayreuth', 51],
    ['Hamburg University of Technology', 52], ['University of Kassel', 53], ['Jacobs University Bremen', 54], ['University of Augsburg', 55],
    ['University of Wuppertal', 56], ['University of Siegen', 57], ['Osnabrück University', 58], ['Chemnitz University of Technology', 59],
    ['Ilmenau University of Technology', 60], ['Munich University of the Federal Armed Forces', 61], ['University of Trier', 62],
    ['University of Passau', 63], ['University of Greifswald', 64], ['University of Hohenheim', 65], ['University of Koblenz-Landau', 66],
    ['Darmstadt University of Applied Sciences', 67], ['University of Hagen', 68], ['Aachen University of Applied Sciences', 69],
    ['University of Bamberg', 70], ['Clausthal University of Technology', 71], ['Leuphana University of Lüneburg', 72],
    ['Brandenburg University of Technology Cottbus - Senftenberg', 73], ['Witten/Herdecke University', 74], ['Freiberg University of Technology', 75],
    ['Bauhaus-University Weimar', 76], ['University of Hildesheim', 77], ['University of Veterinary Medicine Hannover', 78],
    ['University of the Federal Armed Forces Hamburg', 79], ['German Sport University Cologne', 80], ['Munich University of Applied Sciences', 81],
    ['WHU – Otto Beisheim School of Management', 82], ['Catholic University of Eichstätt-Ingolstadt', 83], ['Folkwang University of the Arts', 84],
    ['Hamburg University of Applied Sciences', 85], ['University of Erfurt', 86], ['Cologne University of Applied Sciences', 87],
    ['TH Bingen University of Applied Sciences', 88], ['Karlsruhe University of Applied Sciences', 89], ['Merseburg University of Applied Sciences', 90],
    ['European University Viadrina', 91], ['Berlin School of Economics and Law', 92], ['Mainz University of Applied Sciences', 93],
    ['Berlin Technical University of Applied Sciences', 94], ['Frankfurt University of Applied Sciences', 95],
    ['University of Applied Science Koblenz', 96], ['Berlin University of Applied Sciences', 97], ['Reutlingen University', 98],
    ['EBS University for business and law', 99], ['Zeppelin University', 100],
  ],
  med: [
    ['Heidelberg University', 1], ['Charité - Medical University of Berlin', 2], ['University of Munich', 3], ['University of Hamburg', 4],
    ['Hannover Medical School', 5], ['Goethe University of Frankfurt am Main', 6], ['Heinrich Heine University of Düsseldorf', 7],
    ['Johannes Gutenberg University Mainz', 8], ['Technical University of Munich', 9], ['University of Tübingen', 10],
    ['University of Erlangen-Nuremberg', 11], ['University of Freiburg', 12], ['University of Cologne', 13], ['Free University of Berlin', 14],
    ['University of Bonn', 15], ['University of Göttingen', 16], ['University of Lübeck', 17], ['University of Würzburg', 18],
    ['University of Münster', 19], ['RWTH Aachen University', 20], ['Humboldt University of Berlin', 21], ['University of Ulm', 22],
    ['University of Marburg', 23], ['University of Leipzig', 24], ['University of Giessen', 25], ['Dresden University of Technology', 26],
    ['Ruhr University Bochum', 27], ['Kiel University', 28], ['University of Regensburg', 29], ['Saarland University', 30],
    ['University of Duisburg-Essen', 31], ['Friedrich Schiller University of Jena', 32], ['Martin Luther University of Halle-Wittenberg', 33],
    ['Otto von Guericke University of Magdeburg', 34], ['University of Rostock', 35], ['Karlsruhe Institute of Technology', 36],
    ['University of Greifswald', 37], ['Witten/Herdecke University', 38], ['University of Stuttgart', 39], ['University of Bielefeld', 40],
    ['University of Konstanz', 41], ['Technical University of Berlin', 42], ['University of Bremen', 43],
    ['University of Veterinary Medicine Hannover', 44], ['University of Hohenheim', 45], ['Braunschweig University of Technology', 46],
    ['TU Dortmund University', 47], ['University of Potsdam', 48], ['University of Mannheim', 49], ['Leibniz University of Hanover', 50],
    ['Darmstadt University of Technology', 51], ['Carl von Ossietzky University of Oldenburg', 52], ['University of Bayreuth', 53],
    ['German Sport University Cologne', 54], ['Technical University of Kaiserslautern', 55], ['Osnabrück University', 56],
    ['Aachen University of Applied Sciences', 57], ['University of Trier', 58], ['University of Kassel', 59], ['University of Wuppertal', 60],
    ['Chemnitz University of Technology', 61], ['University of Augsburg', 62], ['University of Paderborn', 63], ['Hamburg University of Technology', 64],
    ['Munich University of the Federal Armed Forces', 65], ['University of Bamberg', 66], ['University of Siegen', 67],
    ['Darmstadt University of Applied Sciences', 68], ['University of Koblenz-Landau', 69], ['Jacobs University Bremen', 70],
    ['Leuphana University of Lüneburg', 71], ['Mainz University of Applied Sciences', 72], ['Ilmenau University of Technology', 73],
    ['University of Hagen', 74], ['Freiberg University of Technology', 75], ['Clausthal University of Technology', 76],
    ['Munich University of Applied Sciences', 77], ['Heilbronn University of Applied Sciences', 78],
    ['University of Applied Sciences Düsseldorf', 79], ['University of Erfurt', 80], ['Brandenburg University of Technology Cottbus - Senftenberg', 81],
    ['University of Hildesheim', 82], ['Hamburg University of Applied Sciences', 83], ['Folkwang University of the Arts', 84],
    ['TH Bingen University of Applied Sciences', 85], ['Catholic University of Eichstätt-Ingolstadt', 86], ['Fulda University of Applied Sciences', 87],
    ['University of Passau', 88], ['Hannover University of Applied Sciences', 89], ['University of the Federal Armed Forces Hamburg', 90],
    ['University of Applied Sciences Landshut', 91], ['Ludwigshafen University of Business and Society', 92],
    ['Weihenstephan-Triesdorf University of Applied Sciences', 93], ['Cologne University of Applied Sciences', 94],
    ['Furtwangen University of Applied Sciences', 95], ['European University Viadrina', 96], ['Kempten University of Applied Sciences', 97],
    ['University of Applied Science Koblenz', 98], ['Merseburg University of Applied Sciences', 99],
    ['Berlin Technical University of Applied Sciences', 100],
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
