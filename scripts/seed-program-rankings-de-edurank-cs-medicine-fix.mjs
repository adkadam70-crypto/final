// Germany — fix-up pass for seed-program-rankings-de-edurank-cs-medicine.mjs:
// re-matches the rows that failed exact-name lookup using the catalog's
// actual stored name variants, matched against the existing catalog only.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-de-edurank-cs-medicine-fix.mjs

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
    ['Ludwig Maximilian University of Munich', 3], ['Goethe University Frankfurt', 11], ['TU Dresden', 14],
    ['Technical University of Darmstadt', 15], ['Heinrich Heine University Düsseldorf', 21], ['Leipzig University', 28],
    ['Ulm University', 30], ['Friedrich Schiller University Jena', 31], ['Bielefeld University', 34],
    ['Otto von Guericke University Magdeburg', 36], ['TU Braunschweig', 38], ['Leibniz University Hannover', 39],
    ['Justus Liebig University Giessen', 44], ['University of Kaiserslautern-Landau', 46], ['Paderborn University', 47],
    ['University of Oldenburg', 49], ['University of Osnabrück', 58], ['Technische Universität Ilmenau', 60],
    ['Universität der Bundeswehr München', 61], ['Universität Koblenz-Landau', 66], ['FernUniversität in Hagen', 68],
    ['FH Aachen', 69], ['Brandenburg University of Technology Cottbus–Senftenberg', 73], ['TU Bergakademie Freiberg', 75],
    ['Tierärztliche Hochschule Hannover', 78], ['Universität der Bundeswehr Hamburg', 79], ['TH Köln', 87],
    ['Fachhochschule Bingen', 88], ['Fachhochschule Merseburg', 90], ['European University Viadrina Frankfurt (Oder)', 91],
    ['Fachhochschule Mainz', 93], ['Berliner Hochschule für Technik', 94], ['Fachhochschule Koblenz', 96],
    ['EBS University', 99],
  ],
  med: [
    ['Charité – Universitätsmedizin Berlin', 2], ['Ludwig Maximilian University of Munich', 3], ['Medizinische Hochschule Hannover', 5],
    ['Goethe University Frankfurt', 6], ['Heinrich Heine University Düsseldorf', 7], ['Ulm University', 22], ['Leipzig University', 24],
    ['Justus Liebig University Giessen', 25], ['TU Dresden', 26], ['Friedrich Schiller University Jena', 32],
    ['Otto von Guericke University Magdeburg', 34], ['Bielefeld University', 40], ['Tierärztliche Hochschule Hannover', 44],
    ['TU Braunschweig', 46], ['Leibniz University Hannover', 50], ['Technical University of Darmstadt', 51],
    ['University of Oldenburg', 52], ['University of Kaiserslautern-Landau', 55], ['University of Osnabrück', 56],
    ['FH Aachen', 57], ['Paderborn University', 63], ['Universität der Bundeswehr München', 65], ['Universität Koblenz-Landau', 69],
    ['Fachhochschule Mainz', 72], ['Technische Universität Ilmenau', 73], ['FernUniversität in Hagen', 74],
    ['TU Bergakademie Freiberg', 75], ['Fachhochschule Heilbronn, Hochschule für Technik und Wirtschaft', 78],
    ['Hochschule Düsseldorf', 79], ['Brandenburg University of Technology Cottbus–Senftenberg', 81], ['Fachhochschule Bingen', 85],
    ['Hannover University of Applied Sciences and Arts', 89], ['Universität der Bundeswehr Hamburg', 90],
    ['Fachhochschule Landshut, Hochschule für Wirtschaft - Sozialwesen - Technik', 91],
    ['Hochschule für Wirtschaft und Gesellschaft Ludwigshafen', 92], ['TH Köln', 94], ['Furtwangen University', 95],
    ['European University Viadrina Frankfurt (Oder)', 96], ['Fachhochschule Koblenz', 98], ['Fachhochschule Merseburg', 99],
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
