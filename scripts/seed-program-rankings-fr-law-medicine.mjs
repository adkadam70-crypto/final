// France — Thotis 2026 rankings for Law and Medicine faculties, matched by
// exact normalized name against the existing catalog only.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-fr-law-medicine.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const SRC = {
  law: ['Law', 'Thotis Classement des Universités en Droit 2026', 'https://thotismedia.com/classement-droit/', 36],
  med: ['Medicine & Health Sciences', 'Thotis Classement des Universités en Médecine 2026', 'https://thotismedia.com/classement-thotis-universites-medecine/', 33],
}

const DATA = {
  law: [
    ["Paris-Panthéon-Assas University", 1],
    ["Université Panthéon-Sorbonne (Paris I)", 2],
    ["Université de Strasbourg", 4],
    ["CY Cergy Paris University", 5],
    ["Université Paris-Saclay", 6],
    ["University of Bordeaux", 7],
    ["Université de Lorraine", 8],
    ["Université Paris-Est Créteil", 9],
    ["Paris Nanterre University", 10],
    ["Université Bourgogne - Franche-Comté", 11],
    ["Université Jean Moulin Lyon 3", 12],
    ["Université Côte d'Azur", 13],
    ["Aix-Marseille University", 14],
    ["Université d'Orléans", 15],
    ["University of Rennes", 16],
    ["Université de Montpellier", 17],
    ["Université Grenoble Alpes", 18],
    ["Toulouse Capitole University", 19],
    ["Université de Bretagne Occidentale", 20],
    ["University of Lille", 21],
    ["Nantes Université", 22],
    ["Université Lumière Lyon 2", 23],
    ["Université Polytechnique Hauts-de-France", 24],
    ["University of Perpignan", 25],
    ["University of Poitiers", 26],
    ["University of Caen Normandy", 27],
    ["University of Toulon", 28],
    ["University of Reims Champagne-Ardenne", 29],
    ["University of Tours", 30],
    ["University of Franche-Comté", 31],
    ["Université Clermont Auvergne", 32],
    ["University of Pau and the Adour Region", 33],
    ["Université de Limoges", 34],
    ["University of Rouen Normandie", 35],
    ["Université de Picardie Jules-Verne", 36],
  ],
  med: [
    ["Université Paris Cité", 1],
    ["Université Paris-Saclay", 2],
    ["Claude Bernard University Lyon 1", 3],
    ["Sorbonne University", 4],
    ["Université de Montpellier", 5],
    ["Toulouse III – Paul Sabatier University", 6],
    ["University of Lille", 7],
    ["Nantes Université", 8],
    ["Aix-Marseille University", 9],
    ["University of Bordeaux", 10],
    ["Université Sorbonne Paris Nord", 11],
    ["Université Rennes I", 12],
    ["Université Bourgogne - Franche-Comté", 13],
    ["Université de Strasbourg", 14],
    ["Université Clermont Auvergne", 15],
    ["Université Paris-Est Créteil", 16],
    ["Université Jean Monnet", 17],
    ["Université Grenoble Alpes", 18],
    ["Université Côte d'Azur", 19],
    ["University of Tours", 20],
    ["Université de Lorraine", 21],
    ["Université de Franche Comté", 22],
    ["Université de Limoges", 23],
    ["University of Rouen Normandie", 24],
    ["Université de Poitiers", 25],
    ["Université de Bretagne Occidentale", 26],
    ["Université de Picardie Jules-Verne", 27],
    ["University of Caen Normandy", 28],
    ["University of Angers", 30],
    ["Université Catholique de Lille", 31],
    ["Université de Reims Champagne-Ardenne", 32],
    ["University of La Réunion", 33],
  ],
}

let inserted = 0
const skipped = []

for (const [key, rows] of Object.entries(DATA)) {
  const [field, source, url, poolSize] = SRC[key]
  for (const [name, rank] of rows) {
    const found = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'FR'`
    if (found.length === 0) {
      skipped.push(`${name} (${key})`)
      continue
    }
    const universityId = found[0].id
    const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${universityId} AND field = ${field} AND "rankSource" = ${source}`
    if (existing.length > 0) continue
    await sql`
      INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
      VALUES (${universityId}, ${field}, ${rank}, ${source}, ${url}, ${selectivityFromRank(rank, poolSize)}, 'Thotis independent ranking based on employer reputation and outcomes data, not an official government ranking.')
    `
    inserted++
  }
}

console.log(`Inserted ${inserted} program-ranking rows.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
