// Germany — EduRank.org citation-based Economics subject ranking, matched
// by exact normalized name against the existing catalog only.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-de-edurank-economics.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const FIELD = 'Economics'
const SOURCE = 'EduRank.org Citation-Based Subject Ranking 2026 — Economics (Germany)'
const URL = 'https://edurank.org/economics/de/'
const NOTE = 'EduRank.org citation-based subject ranking (research output/citation counts), not an admissions-selectivity metric — programSelectivity is our own derived scale for comparability, not itself a published figure.'
const POOL = 100

const DATA = [
    ["Goethe University Frankfurt", 1],
    ["University of Hamburg", 2],
    ["Ludwig Maximilian University of Munich", 3],
    ["University of Bonn", 4],
    ["Heidelberg University", 5],
    ["Technical University of Munich", 6],
    ["Humboldt University of Berlin", 7],
    ["Free University of Berlin", 8],
    ["University of Mannheim", 9],
    ["University of Göttingen", 10],
    ["University of Cologne", 11],
    ["RWTH Aachen University", 12],
    ["Karlsruhe Institute of Technology", 13],
    ["Technical University of Berlin", 14],
    ["University of Erlangen-Nuremberg", 15],
    ["University of Freiburg", 16],
    ["University of Tübingen", 17],
    ["Bielefeld University", 18],
    ["University of Bremen", 19],
    ["Kiel University", 20],
    ["Ruhr University Bochum", 21],
    ["University of Duisburg-Essen", 22],
    ["TU Dresden", 23],
    ["University of Konstanz", 24],
    ["TU Dortmund University", 25],
    ["University of Münster", 26],
    ["University of Stuttgart", 27],
    ["Heinrich Heine University Düsseldorf", 28],
    ["Johannes Gutenberg University Mainz", 29],
    ["Technical University of Darmstadt", 30],
    ["Leibniz University Hannover", 31],
    ["Charité – Universitätsmedizin Berlin", 32],
    ["Leipzig University", 33],
    ["Justus Liebig University Giessen", 34],
    ["Leuphana University of Lüneburg", 35],
    ["University of Würzburg", 36],
    ["Friedrich Schiller University Jena", 37],
    ["University of Potsdam", 38],
    ["University of Marburg", 39],
    ["University of Regensburg", 40],
    ["University of Hohenheim", 41],
    ["Otto von Guericke University Magdeburg", 42],
    ["University of Kassel", 43],
    ["University of Bayreuth", 44],
    ["University of Oldenburg", 45],
    ["Ulm University", 46],
    ["TU Braunschweig", 47],
    ["University of Augsburg", 48],
    ["Saarland University", 49],
    ["Paderborn University", 50],
    ["University of Trier", 51],
    ["University of Kaiserslautern-Landau", 52],
    ["University of Osnabrück", 53],
    ["Martin Luther University of Halle-Wittenberg", 54],
    ["WHU – Otto Beisheim School of Management", 55],
    ["University of Wuppertal", 56],
    ["Medizinische Hochschule Hannover", 57],
    ["University of Bamberg", 58],
    ["University of Siegen", 59],
    ["University of Rostock", 61],
    ["University of Lübeck", 62],
    ["Hamburg University of Technology", 63],
    ["Chemnitz University of Technology", 64],
    ["Hertie School of Governance", 65],
    ["Witten/Herdecke University", 66],
    ["University of Passau", 67],
    ["Universität der Bundeswehr Hamburg", 68],
    ["European University Viadrina Frankfurt (Oder)", 69],
    ["FernUniversität in Hagen", 70],
    ["University of Greifswald", 72],
    ["Berlin School of Economics and Law", 73],
    ["University of Erfurt", 74],
    ["TU Bergakademie Freiberg", 75],
    ["Universität der Bundeswehr München", 76],
    ["Darmstadt University of Applied Sciences", 77],
    ["Universität Koblenz-Landau", 78],
    ["Technische Universität Ilmenau", 79],
    ["Catholic University of Eichstätt-Ingolstadt", 80],
    ["Brandenburg University of Technology Cottbus–Senftenberg", 81],
    ["EBS University", 82],
    ["TH Köln", 83],
    ["ESMT Berlin", 85],
    ["Zeppelin University", 86],
    ["Clausthal University of Technology", 87],
    ["Hamburg University of Applied Sciences", 89],
    ["University of Hildesheim", 90],
    ["Folkwang University of the Arts", 91],
    ["FH Aachen", 92],
    ["German Sport University Cologne", 93],
    ["Deutsche Universität für Verwaltungswissenschaften Speyer", 94],
    ["Munich University of Applied Sciences", 96],
    ["Bauhaus-University Weimar", 97],
    ["Fachhochschule Flensburg", 98],
    ["Pforzheim University", 100],
]

let inserted = 0
const skipped = []

for (const [name, rank] of DATA) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'DE'`
  if (rows.length === 0) { skipped.push(name); continue }
  const universityId = rows[0].id
  const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${universityId} AND field = ${FIELD} AND "rankSource" = ${SOURCE}`
  if (existing.length > 0) continue
  await sql`
    INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (${universityId}, ${FIELD}, ${rank}, ${SOURCE}, ${URL}, ${selectivityFromRank(rank, POOL)}, ${NOTE})
  `
  inserted++
}

console.log(`Inserted ${inserted} program-ranking rows.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
