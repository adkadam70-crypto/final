// Germany — EduRank.org citation-based subject rankings for Law and
// Psychology, matched by exact normalized name against the existing
// catalog only.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-de-edurank-law-psych.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const NOTE = 'EduRank.org citation-based subject ranking (research output/citation counts), not an admissions-selectivity metric — programSelectivity is our own derived scale for comparability, not itself a published figure.'

const SRC = {
  law: ['Law', 'EduRank.org Citation-Based Subject Ranking 2026 — Law (Germany)', 'https://edurank.org/liberal-arts/law/de/', 100],
  psych: ['Psychology', 'EduRank.org Citation-Based Subject Ranking 2026 — Psychology (Germany)', 'https://edurank.org/psychology/de/', 100],
}

const DATA = {
  law: [
    ["Heidelberg University", 1],
    ["University of Hamburg", 2],
    ["Ludwig Maximilian University of Munich", 3],
    ["Goethe University Frankfurt", 4],
    ["Technical University of Munich", 5],
    ["Free University of Berlin", 6],
    ["University of Bonn", 7],
    ["University of Göttingen", 8],
    ["RWTH Aachen University", 9],
    ["Humboldt University of Berlin", 10],
    ["University of Freiburg", 11],
    ["University of Cologne", 12],
    ["University of Erlangen-Nuremberg", 13],
    ["Technical University of Berlin", 14],
    ["Karlsruhe Institute of Technology", 15],
    ["TU Dresden", 16],
    ["University of Mannheim", 17],
    ["University of Tübingen", 18],
    ["University of Münster", 19],
    ["University of Bremen", 20],
    ["Ruhr University Bochum", 21],
    ["Technical University of Darmstadt", 22],
    ["Johannes Gutenberg University Mainz", 23],
    ["University of Konstanz", 24],
    ["Leipzig University", 25],
    ["Bielefeld University", 26],
    ["University of Duisburg-Essen", 27],
    ["Charité – Universitätsmedizin Berlin", 28],
    ["Heinrich Heine University Düsseldorf", 29],
    ["University of Stuttgart", 30],
    ["University of Marburg", 31],
    ["Kiel University", 32],
    ["TU Dortmund University", 33],
    ["Friedrich Schiller University Jena", 34],
    ["University of Würzburg", 35],
    ["Leibniz University Hannover", 36],
    ["University of Potsdam", 37],
    ["Justus Liebig University Giessen", 38],
    ["Saarland University", 39],
    ["University of Kassel", 40],
    ["Ulm University", 41],
    ["University of Regensburg", 42],
    ["Martin Luther University of Halle-Wittenberg", 43],
    ["TU Braunschweig", 44],
    ["Leuphana University of Lüneburg", 45],
    ["University of Bayreuth", 46],
    ["University of Oldenburg", 47],
    ["University of Osnabrück", 48],
    ["Otto von Guericke University Magdeburg", 49],
    ["Paderborn University", 50],
    ["Medizinische Hochschule Hannover", 51],
    ["University of Hohenheim", 52],
    ["University of Kaiserslautern-Landau", 53],
    ["University of Bamberg", 54],
    ["University of Augsburg", 55],
    ["University of Siegen", 56],
    ["University of Trier", 57],
    ["University of Wuppertal", 58],
    ["University of Rostock", 59],
    ["Witten/Herdecke University", 60],
    ["University of Passau", 61],
    ["University of Lübeck", 62],
    ["Chemnitz University of Technology", 63],
    ["FernUniversität in Hagen", 64],
    ["Universität Koblenz-Landau", 65],
    ["University of Erfurt", 66],
    ["Hamburg University of Technology", 67],
    ["WHU – Otto Beisheim School of Management", 68],
    ["Hertie School of Governance", 70],
    ["Universität der Bundeswehr München", 71],
    ["University of Greifswald", 72],
    ["Berlin School of Economics and Law", 73],
    ["European University Viadrina Frankfurt (Oder)", 74],
    ["Darmstadt University of Applied Sciences", 75],
    ["Universität der Bundeswehr Hamburg", 76],
    ["Catholic University of Eichstätt-Ingolstadt", 77],
    ["German Sport University Cologne", 78],
    ["Technische Universität Ilmenau", 79],
    ["Brandenburg University of Technology Cottbus–Senftenberg", 81],
    ["Clausthal University of Technology", 82],
    ["Bauhaus-University Weimar", 83],
    ["EBS University", 84],
    ["Hamburg University of Applied Sciences", 85],
    ["TU Bergakademie Freiberg", 86],
    ["University of Hildesheim", 87],
    ["Zeppelin University", 88],
    ["ESMT Berlin", 89],
    ["FH Aachen", 90],
    ["Fachhochschule Merseburg", 91],
    ["Munich University of Applied Sciences", 93],
    ["Fachhochschule Mainz", 96],
    ["Reutlingen University", 97],
    ["Folkwang University of the Arts", 99],
    ["TH Köln", 100],
  ],
  psych: [
    ["Heidelberg University", 1],
    ["Ludwig Maximilian University of Munich", 2],
    ["Charité – Universitätsmedizin Berlin", 3],
    ["University of Hamburg", 4],
    ["Technical University of Munich", 5],
    ["University of Freiburg", 6],
    ["University of Tübingen", 7],
    ["Goethe University Frankfurt", 8],
    ["Heinrich Heine University Düsseldorf", 9],
    ["Johannes Gutenberg University Mainz", 10],
    ["Free University of Berlin", 11],
    ["University of Göttingen", 12],
    ["University of Erlangen-Nuremberg", 13],
    ["University of Bonn", 14],
    ["Medizinische Hochschule Hannover", 15],
    ["University of Cologne", 16],
    ["Humboldt University of Berlin", 17],
    ["University of Münster", 18],
    ["University of Würzburg", 19],
    ["RWTH Aachen University", 20],
    ["Ruhr University Bochum", 21],
    ["Leipzig University", 22],
    ["Ulm University", 23],
    ["University of Marburg", 24],
    ["University of Lübeck", 25],
    ["TU Dresden", 26],
    ["Justus Liebig University Giessen", 27],
    ["University of Duisburg-Essen", 28],
    ["Saarland University", 29],
    ["University of Regensburg", 30],
    ["Friedrich Schiller University Jena", 31],
    ["Kiel University", 32],
    ["Otto von Guericke University Magdeburg", 33],
    ["Bielefeld University", 34],
    ["University of Konstanz", 35],
    ["Karlsruhe Institute of Technology", 36],
    ["Technical University of Berlin", 37],
    ["Martin Luther University of Halle-Wittenberg", 38],
    ["University of Rostock", 39],
    ["University of Mannheim", 40],
    ["University of Bremen", 41],
    ["University of Potsdam", 42],
    ["University of Stuttgart", 43],
    ["Technical University of Darmstadt", 44],
    ["TU Dortmund University", 45],
    ["University of Greifswald", 46],
    ["Witten/Herdecke University", 47],
    ["University of Oldenburg", 48],
    ["University of Trier", 49],
    ["University of Osnabrück", 50],
    ["TU Braunschweig", 51],
    ["Leibniz University Hannover", 52],
    ["University of Kassel", 53],
    ["University of Kaiserslautern-Landau", 54],
    ["University of Bayreuth", 55],
    ["University of Augsburg", 56],
    ["University of Bamberg", 57],
    ["Tierärztliche Hochschule Hannover", 58],
    ["German Sport University Cologne", 59],
    ["Leuphana University of Lüneburg", 60],
    ["University of Hohenheim", 61],
    ["Chemnitz University of Technology", 62],
    ["Universität Koblenz-Landau", 63],
    ["University of Wuppertal", 64],
    ["Paderborn University", 65],
    ["University of Siegen", 67],
    ["Hamburg University of Technology", 68],
    ["Universität der Bundeswehr München", 69],
    ["Technische Universität Ilmenau", 70],
    ["FH Aachen", 71],
    ["FernUniversität in Hagen", 72],
    ["University of Erfurt", 73],
    ["University of Passau", 74],
    ["University of Hildesheim", 75],
    ["Darmstadt University of Applied Sciences", 76],
    ["Catholic University of Eichstätt-Ingolstadt", 77],
    ["Universität der Bundeswehr Hamburg", 78],
    ["European University Viadrina Frankfurt (Oder)", 79],
    ["WHU – Otto Beisheim School of Management", 80],
    ["Fachhochschule Mainz", 81],
    ["Brandenburg University of Technology Cottbus–Senftenberg", 82],
    ["Bauhaus-University Weimar", 83],
    ["TU Bergakademie Freiberg", 84],
    ["Hamburg University of Applied Sciences", 85],
    ["Clausthal University of Technology", 86],
    ["Fachhochschule Bingen", 87],
    ["Zeppelin University", 88],
    ["TH Köln", 90],
    ["Berlin School of Economics and Law", 91],
    ["Folkwang University of the Arts", 92],
    ["Bielefeld University of Applied Sciences and Arts", 93],
    ["Munich University of Applied Sciences", 95],
    ["Hertie School of Governance", 96],
    ["ESMT Berlin", 97],
    ["Fachhochschule Koblenz", 99],
    ["Furtwangen University", 100],
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
