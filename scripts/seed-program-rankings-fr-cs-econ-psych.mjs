// France — EduRank.org citation-based Computer Science, Economics, and
// Psychology subject rankings, matched by corrected name against the
// existing catalog only.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-fr-cs-econ-psych.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const NOTE = 'EduRank.org citation-based subject ranking (research output/citation counts), not an admissions-selectivity metric — programSelectivity is our own derived scale for comparability, not itself a published figure.'

const SRC = {
  cs: ['Computer Science & IT', 'EduRank.org Citation-Based Subject Ranking 2026 — Computer Science (France)', 'https://edurank.org/cs/fr/', 100],
  econ: ['Economics', 'EduRank.org Citation-Based Subject Ranking 2026 — Economics (France)', 'https://edurank.org/economics/fr/', 100],
  psych: ['Psychology', 'EduRank.org Citation-Based Subject Ranking 2026 — Psychology (France)', 'https://edurank.org/psychology/fr/', 100],
}

const DATA = {
  cs: [
    ["Sorbonne University", 1],
    ["Claude Bernard University Lyon 1", 2],
    ["Toulouse III – Paul Sabatier University", 3],
    ["Université Paris Sud (Paris XI)", 4],
    ["Université Grenoble Alpes", 5],
    ["University of Bordeaux", 6],
    ["École Normale Supérieure – PSL", 7],
    ["University of Montpellier", 8],
    ["Aix-Marseille University", 9],
    ["University of Lille", 10],
    ["École Polytechnique", 11],
    ["Télécom Paris", 14],
    ["Université de Nice-Sophia Antipolis", 15],
    ["École Normale Supérieure de Lyon", 16],
    ["Université Denis Diderot (Paris VII)", 17],
    ["University of Burgundy", 18],
    ["Grenoble INP", 19],
    ["Université René Descartes (Paris V)", 20],
    ["University of Clermont Auvergne", 22],
    ["Arts et Métiers", 23],
    ["University of Rouen Normandie", 24],
    ["University of Caen Normandy", 25],
    ["Université Paris-Dauphine – PSL", 27],
    ["Université Paris-Est Créteil", 28],
    ["CentraleSupélec", 29],
    ["University of Western Brittany", 32],
    ["INSA Lyon", 33],
    ["Université François Rabelais de Tours", 34],
    ["École normale supérieure Paris-Saclay", 35],
    ["University of Poitiers", 36],
    ["University of Angers", 37],
    ["Institut National Polytechnique de Toulouse", 38],
    ["University of Franche-Comté", 39],
    ["Université Panthéon-Sorbonne (Paris I)", 40],
    ["Sciences Po", 44],
    ["University of Limoges", 47],
    ["Centrale Lille", 48],
    ["Paris Nanterre University", 49],
    ["École Centrale de Lyon", 55],
    ["Université Sorbonne-Nouvelle (Paris III)", 66],
    ["Institut National des Sciences Appliquées de Rennes", 71],
    ["ESSEC Business School", 72],
    ["HEC Paris", 73],
    ["emlyon business school", 75],
    ["Centrale Nantes", 59],
    ["Institut National des Sciences Appliquées de Rouen", 65],
    ["University of Rennes 2", 90],
    ["KEDGE Business School", 93],
    ["Université Panthéon-Assas (Paris II)", 94],
    ["Université Paul Valéry (Montpellier III)", 96],
    ["SKEMA Business School", 97],
    ["EDHEC Business School", 100],
    ["Université de Lorraine", 12],
    ["Université de Strasbourg", 13],
    ["Nantes Université", 21],
    ["Université de Picardie Jules-Verne", 31],
  ],
  econ: [
    ["Sorbonne University", 1],
    ["Sciences Po", 2],
    ["Université Panthéon-Sorbonne (Paris I)", 3],
    ["Université Paris-Dauphine – PSL", 4],
    ["École Polytechnique", 5],
    ["Claude Bernard University Lyon 1", 6],
    ["University of Montpellier", 7],
    ["Toulouse III – Paul Sabatier University", 8],
    ["University of Lille", 9],
    ["Aix-Marseille University", 10],
    ["Université Grenoble Alpes", 11],
    ["Université Paris Sud (Paris XI)", 12],
    ["École Normale Supérieure – PSL", 13],
    ["HEC Paris", 14],
    ["University of Bordeaux", 15],
    ["Paris Nanterre University", 18],
    ["Université de Nice-Sophia Antipolis", 19],
    ["ESSEC Business School", 20],
    ["University of Clermont Auvergne", 21],
    ["EDHEC Business School", 23],
    ["emlyon business school", 25],
    ["Université Paris-Est Créteil", 27],
    ["University of Burgundy", 28],
    ["Arts et Métiers", 30],
    ["École Normale Supérieure de Lyon", 31],
    ["Université Denis Diderot (Paris VII)", 32],
    ["Université Panthéon-Assas (Paris II)", 36],
    ["Grenoble École de Management", 37],
    ["Université René Descartes (Paris V)", 39],
    ["SKEMA Business School", 40],
    ["KEDGE Business School", 41],
    ["École normale supérieure Paris-Saclay", 42],
    ["Télécom Paris", 44],
    ["Audencia", 47],
    ["University of Angers", 49],
    ["University of Western Brittany", 50],
    ["University of Caen Normandy", 51],
    ["University of Limoges", 52],
    ["University of Franche-Comté", 56],
    ["Grenoble INP", 57],
    ["University of Poitiers", 58],
    ["Université Paris-Est Marne-la-Vallée", 62],
    ["CentraleSupélec", 64],
    ["INSA Lyon", 65],
    ["ESCP Business School", 66],
    ["Institut National Polytechnique de Toulouse", 69],
    ["INSA Toulouse", 70],
    ["Université Jean Moulin Lyon 3", 73],
    ["Université Sorbonne-Nouvelle (Paris III)", 79],
    ["Centrale Nantes", 80],
    ["University of Corsica Pascal Paoli", 98],
    ["Université de Lorraine", 16],
    ["Université de Strasbourg", 17],
    ["Nantes Université", 33],
    ["Université de Picardie Jules-Verne", 63],
  ],
  psych: [
    ["Sorbonne University", 1],
    ["Claude Bernard University Lyon 1", 2],
    ["University of Bordeaux", 3],
    ["Aix-Marseille University", 4],
    ["University of Montpellier", 5],
    ["Université Grenoble Alpes", 6],
    ["Université Paris Sud (Paris XI)", 7],
    ["Université René Descartes (Paris V)", 8],
    ["University of Lille", 9],
    ["Toulouse III – Paul Sabatier University", 10],
    ["University of Rouen Normandie", 12],
    ["École Normale Supérieure – PSL", 14],
    ["University of Caen Normandy", 15],
    ["Université Paris-Est Créteil", 16],
    ["Université Denis Diderot (Paris VII)", 17],
    ["Université François Rabelais de Tours", 18],
    ["University of Burgundy", 19],
    ["Université de Nice-Sophia Antipolis", 20],
    ["University of Clermont Auvergne", 21],
    ["École Polytechnique", 24],
    ["University of Angers", 25],
    ["University of Poitiers", 26],
    ["Sciences Po", 29],
    ["Paris Nanterre University", 31],
    ["Université Paris-Dauphine – PSL", 32],
    ["École Normale Supérieure de Lyon", 33],
    ["Télécom Paris", 34],
    ["University of Western Brittany", 35],
    ["University of Franche-Comté", 37],
    ["Université Panthéon-Sorbonne (Paris I)", 38],
    ["Grenoble INP", 39],
    ["University of Limoges", 40],
    ["INSA Lyon", 41],
    ["Université de Nimes", 50],
    ["École normale supérieure Paris-Saclay", 51],
    ["ESCP Business School", 53],
    ["ESSEC Business School", 54],
    ["École des Ponts ParisTech", 55],
    ["HEC Paris", 56],
    ["emlyon business school", 58],
    ["CentraleSupélec", 64],
    ["KEDGE Business School", 69],
    ["University of Rennes 2", 68],
    ["INSA Toulouse", 78],
    ["Centrale Lille", 82],
    ["Université Panthéon-Assas (Paris II)", 83],
    ["École Centrale de Lyon", 84],
    ["SKEMA Business School", 88],
    ["Université Jean Moulin Lyon 3", 91],
    ["Centrale Nantes", 93],
    ["Institut National des Sciences Appliquées de Rennes", 97],
    ["Université de Strasbourg", 11],
    ["Université de Lorraine", 13],
    ["Université de Picardie Jules-Verne", 22],
    ["Nantes Université", 23],
  ],
}

let inserted = 0
for (const [key, rows] of Object.entries(DATA)) {
  const [field, source, url, pool] = SRC[key]
  for (const [name, rank] of rows) {
    const r = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'FR'`
    if (r.length === 0) { console.log('not found:', name); continue }
    const id = r[0].id
    const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${id} AND field = ${field} AND "rankSource" = ${source}`
    if (existing.length > 0) continue
    await sql`
      INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
      VALUES (${id}, ${field}, ${rank}, ${source}, ${url}, ${selectivityFromRank(rank, pool)}, ${NOTE})
    `
    inserted++
  }
}
console.log(`Inserted ${inserted} rows.`)
