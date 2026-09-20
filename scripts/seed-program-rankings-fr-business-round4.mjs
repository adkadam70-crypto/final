// France — EduRank.org citation-based Business subject ranking, matched
// by exact/corrected name against the existing catalog only.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-fr-business-round4.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const FIELD = 'Business'
const SOURCE = 'EduRank.org Citation-Based Subject Ranking 2026 — Business (France)'
const URL = 'https://edurank.org/business/fr/'
const NOTE = 'EduRank.org citation-based subject ranking (research output/citation counts), not an admissions-selectivity metric — programSelectivity is our own derived scale for comparability, not itself a published figure.'
const POOL = 100

const DATA = [
    ["Sorbonne University", 1],
    ["Claude Bernard University Lyon 1", 2],
    ["Université Grenoble Alpes", 3],
    ["Toulouse III – Paul Sabatier University", 5],
    ["University of Lille", 6],
    ["Université Paris-Dauphine – PSL", 7],
    ["École Polytechnique", 8],
    ["Université Paris Sud (Paris XI)", 9],
    ["University of Montpellier", 10],
    ["Université Panthéon-Sorbonne (Paris I)", 11],
    ["University of Bordeaux", 12],
    ["Sciences Po", 13],
    ["Aix-Marseille University", 14],
    ["École Normale Supérieure – PSL", 15],
    ["HEC Paris", 16],
    ["ESSEC Business School", 18],
    ["emlyon business school", 21],
    ["CentraleSupélec", 22],
    ["Nantes Université", 23],
    ["University of Clermont Auvergne", 24],
    ["University of Burgundy", 25],
    ["Grenoble INP", 26],
    ["Paris Nanterre University", 27],
    ["EDHEC Business School", 29],
    ["École Normale Supérieure de Lyon", 30],
    ["Centrale Lille", 31],
    ["Université Paris-Est Créteil", 32],
    ["KEDGE Business School", 33],
    ["Télécom Paris", 34],
    ["Université de Picardie Jules-Verne", 35],
    ["ESCP Business School", 36],
    ["INSA Lyon", 38],
    ["University of Caen Normandy", 39],
    ["Audencia", 41],
    ["SKEMA Business School", 42],
    ["University of Western Brittany", 43],
    ["University of Poitiers", 44],
    ["École des Ponts ParisTech", 45],
    ["École normale supérieure Paris-Saclay", 46],
    ["Université François Rabelais de Tours", 47],
    ["University of Limoges", 48],
    ["Institut National Polytechnique de Toulouse", 49],
    ["University of Franche-Comté", 50],
    ["Université Denis Diderot (Paris VII)", 52],
    ["Centrale Nantes", 56],
    ["University of Angers", 59],
    ["Université d'Evry Val d'Essonne", 61],
    ["University of Rouen Normandie", 64],
    ["University of Savoie Mont Blanc", 66],
    ["University of Reims Champagne-Ardenne", 67],
    ["Université Panthéon-Assas (Paris II)", 68],
    ["Lille Catholic University", 69],
    ["University of Pau and the Adour Region", 70],
    ["University of Le Havre Normandy", 73],
    ["University of Toulon", 74],
    ["INSA Toulouse", 76],
    ["Université Jean Moulin Lyon 3", 78],
    ["École Centrale de Lyon", 81],
    ["NEOMA Business School", 83],
    ["University of La Rochelle", 88],
    ["INSA Rouen Normandie", 97],
]

let inserted = 0
for (const [name, rank] of DATA) {
  const r = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'FR'`
  if (r.length === 0) { console.log('not found:', name); continue }
  const id = r[0].id
  const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${id} AND field = ${FIELD} AND "rankSource" = ${SOURCE}`
  if (existing.length > 0) continue
  await sql`
    INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (${id}, ${FIELD}, ${rank}, ${SOURCE}, ${URL}, ${selectivityFromRank(rank, POOL)}, ${NOTE})
  `
  inserted++
}
console.log(`Inserted ${inserted} rows.`)
