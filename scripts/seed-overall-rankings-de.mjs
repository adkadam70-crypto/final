// General/overall ranking pass for Germany — fills universities.rankSource/
// rankValue, same role and semantics as the US/India/UK/AU scripts (an
// ordinal among that country's OWN universities, not a raw global number).
//
// Source: Times Higher Education's "Best universities in Germany" student
// guide (2026), for the same reason it was used for Australia — Germany has
// no domestic 1-to-N league table (CHE / ZEIT is tier-grouped per subject,
// not ranked), and THE's Germany-specific ordering of ~55 institutions is
// the closest credible equivalent. Cross-checked against QS World 2026
// (which ranks ~16 German universities): the two agree on the top cluster
// (TUM #1, LMU #2, Heidelberg #3) with the expected mid-table reshuffling
// between a research-reputation list (QS) and a teaching+research+industry
// list (THE). THE's ordering is used as the ordinal of record.
//
// globalRankValue is deliberately NOT set for German rows: the global-rank
// pass (seed-global-rankings.mjs) caps at QS top 20 because "globally
// ranked" stops being a meaningful claim to a general audience past there,
// and Germany's best (TUM, QS #28) already sits past that cap.
//
// THE ranks 1-55 — every German university THE's Germany guide covers.
// Ranks 1-50 correspond to seed-universities-de.mjs; ranks 51-55 to
// seed-universities-de-2.mjs. Every other German row (added in tranche 2)
// keeps rankValue NULL — there is no citable ordinal past THE's ~55, and
// guessing one would break the "ordinal among this country's own
// universities, from a named source" contract every country here follows.
// Ties in THE's list past the top ~40 are real and expected.
//
// Usage: node --env-file=.env.local scripts/seed-overall-rankings-de.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const RANK_SOURCE = 'Times Higher Education — Best Universities in Germany 2026'
const RANK_SOURCE_URL = 'https://www.timeshighereducation.com/student/best-universities/best-universities-germany'

const ENTRIES = [
  { name: 'Technical University of Munich', rank: 1 },
  { name: 'Ludwig Maximilian University of Munich', rank: 2 },
  { name: 'Heidelberg University', rank: 3 },
  { name: 'Humboldt University of Berlin', rank: 4 },
  { name: 'Charité – Universitätsmedizin Berlin', rank: 5 },
  { name: 'RWTH Aachen University', rank: 6 },
  { name: 'University of Bonn', rank: 7 },
  { name: 'University of Tübingen', rank: 8 },
  { name: 'Free University of Berlin', rank: 9 },
  { name: 'University of Göttingen', rank: 10 },
  { name: 'University of Hamburg', rank: 11 },
  { name: 'University of Freiburg', rank: 12 },
  { name: 'Technical University of Berlin', rank: 13 },
  { name: 'University of Cologne', rank: 14 },
  { name: 'Karlsruhe Institute of Technology', rank: 15 },
  { name: 'TU Dresden', rank: 16 },
  { name: 'University of Würzburg', rank: 17 },
  { name: 'University of Münster', rank: 18 },
  { name: 'Friedrich Schiller University Jena', rank: 19 },
  { name: 'Goethe University Frankfurt', rank: 20 },
  { name: 'University of Erlangen-Nuremberg', rank: 21 },
  { name: 'University of Mannheim', rank: 22 },
  { name: 'University of Potsdam', rank: 23 },
  { name: 'Heinrich Heine University Düsseldorf', rank: 24 },
  { name: 'Ruhr University Bochum', rank: 25 },
  { name: 'Technical University of Darmstadt', rank: 26 },
  { name: 'Ulm University', rank: 27 },
  { name: 'University of Konstanz', rank: 28 },
  { name: 'University of Stuttgart', rank: 29 },
  { name: 'Johannes Gutenberg University Mainz', rank: 30 },
  { name: 'University of Bayreuth', rank: 31 },
  { name: 'University of Bremen', rank: 32 },
  { name: 'University of Duisburg-Essen', rank: 33 },
  { name: 'University of Hohenheim', rank: 34 },
  { name: 'Justus Liebig University Giessen', rank: 35 },
  { name: 'Leibniz University Hannover', rank: 36 },
  { name: 'Kiel University', rank: 37 },
  { name: 'Leuphana University of Lüneburg', rank: 38 },
  { name: 'University of Greifswald', rank: 39 },
  { name: 'University of Marburg', rank: 40 },
  { name: 'University of Regensburg', rank: 41 },
  { name: 'Constructor University', rank: 42 },
  { name: 'Hamburg University of Technology', rank: 43 },
  { name: 'Saarland University', rank: 44 },
  { name: 'TU Dortmund University', rank: 45 },
  { name: 'University of Kaiserslautern-Landau', rank: 46 },
  { name: 'University of Siegen', rank: 47 },
  { name: 'Otto von Guericke University Magdeburg', rank: 48 },
  { name: 'Paderborn University', rank: 49 },
  { name: 'TU Braunschweig', rank: 50 },
  { name: 'University of Passau', rank: 51 },
  { name: 'University of Wuppertal', rank: 52 },
  { name: 'FernUniversität in Hagen', rank: 53 },
  { name: 'Technische Universität Ilmenau', rank: 54 },
  { name: 'TU Bergakademie Freiberg', rank: 55 },
]

let updated = 0
const skipped = []

for (const e of ENTRIES) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${e.name} AND country = 'DE'`
  if (rows.length === 0) { skipped.push(e.name); continue }
  await sql`UPDATE universities SET "rankSource" = ${RANK_SOURCE}, "rankValue" = ${e.rank} WHERE id = ${rows[0].id}`
  updated++
}

console.log(`Set overall rank for ${updated} German universities.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
