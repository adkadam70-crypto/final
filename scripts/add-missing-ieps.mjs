// France — adds the 5 IEP (Institut d'études politiques / Sciences Po
// network) campuses missing from the catalog (Paris, Bordeaux, Lyon,
// Strasbourg, Toulouse already existed; Lille, Aix-en-Provence, Rennes,
// Grenoble, and Saint-Germain-en-Laye did not). Same user-approved
// exception as scripts/add-missing-iims.mjs — this is the complete,
// well-documented 10-member French IEP network with real published
// Challenges/75secondes 2026 ranks for each (see
// scripts/seed-program-rankings-fr-iep-political-science.mjs for the first 5).
//
// Usage: node --env-file=.env.local scripts/add-missing-ieps.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const REQUIREMENTS = ['Parcoursup application', 'Written exam and/or interview per IEP']
const SECTORS = ['General']
const FIELDS = ['Political Science']

const DATA = [
  ['Sciences Po Lille', 'Lille, Hauts-de-France', 'Balanced', 80, 'https://www.sciencespo-lille.eu', "One of France's 10 IEPs; strong regional and EU-affairs recruiter network given proximity to Brussels."],
  ['Sciences Po Aix-en-Provence', 'Aix-en-Provence, Provence-Alpes-Côte d\'Azur', 'Warm', 76, 'https://www.sciencespo-aix.fr', "One of France's 10 IEPs; strong Mediterranean/international-relations focus."],
  ['Sciences Po Rennes', 'Rennes, Brittany', 'Balanced', 74, 'https://www.sciencespo-rennes.fr', "One of France's 10 IEPs; strong European studies focus."],
  ['Sciences Po Grenoble', 'Grenoble, Auvergne-Rhône-Alpes', 'Cold', 73, 'https://sciencespo-grenoble.fr', "One of France's 10 IEPs."],
  ['Sciences Po Saint-Germain-en-Laye', 'Saint-Germain-en-Laye, Île-de-France', 'Balanced', 72, 'https://www.sciencespo-saintgermainenlaye.fr', "Newest of France's 10 IEPs, opened 2015 under Université Paris-Saclay."],
]

let inserted = 0
for (const [name, location, climate, selectivity, link, internship] of DATA) {
  const existing = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'FR'`
  if (existing.length > 0) { console.log(`SKIP (already exists): ${name}`); continue }
  await sql`
    INSERT INTO universities (name, country, location, climate, sectors, "baselineSelectivity", "internshipProgram", requirements, link, "academicFields")
    VALUES (${name}, 'FR', ${location}, ${climate}, ${JSON.stringify(SECTORS)}, ${selectivity}, ${internship}, ${JSON.stringify(REQUIREMENTS)}, ${link}, ${JSON.stringify(FIELDS)})
  `
  inserted++
}

console.log(`Inserted ${inserted} new IEP university rows.`)
