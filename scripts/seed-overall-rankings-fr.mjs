// General/overall ranking pass for France — universities.rankSource/rankValue,
// same ordinal-among-this-country's-own-institutions semantics as every other
// country here.
//
// Source: Times Higher Education's "Best universities in France" student
// guide (2026) — chosen for the same reason as Germany and Australia: France
// has no single domestic 1-to-N table that spans both universities and
// grandes écoles (the strong French rankings — L'Étudiant, L'Usine Nouvelle —
// are per-sector: engineering schools OR business schools, not one combined
// list). THE's France ordering of ~48 institutions is the closest credible
// combined equivalent. The per-sector French rankings go into programRankings
// via seed-program-rankings-fr.mjs (Engineering, Business), exactly where the
// US/India/UK subject rankings live.
//
// Umbrella vs component: THE ranks the federated entities (PSL, Institut
// Polytechnique de Paris) rather than their famous component schools
// (École Polytechnique, ENS-PSL, Mines Paris). So the umbrella row carries
// the THE rank; the component rows keep rankValue NULL here and instead get
// their real standing from programRankings (e.g. École Polytechnique is #1
// in L'Étudiant's engineering ranking). This is the honest mapping — THE
// genuinely did not rank the components separately.
//
// globalRankValue is deliberately NOT set for French rows: the global-rank
// pass caps at QS top 20, and France's best (PSL, ~QS #24) sits past it.
//
// Tranche 1: the THE-France entries that exist after seed-universities-fr.mjs.
// More get filled as tranche 2 adds the regional universities and the wider
// grandes-écoles set. Aix-Marseille University did not appear in the THE
// France student-guide list pulled for this pass and is left NULL rather
// than guessed — revisit if a cleaner source turns up.
//
// Usage: node --env-file=.env.local scripts/seed-overall-rankings-fr.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const RANK_SOURCE = 'Times Higher Education — Best Universities in France 2026'
const RANK_SOURCE_URL = 'https://www.timeshighereducation.com/student/best-universities/best-universities-france'

// Full THE France ordering, mapped to whichever catalog rows exist (across
// seed-universities-fr.mjs and seed-universities-fr-2.mjs). THE positions not
// listed here are institutions not (yet) in the catalog — e.g. Université de
// Bretagne Occidentale (#29), Université Polytechnique Hauts-de-France (#44).
const ENTRIES = [
  { name: 'PSL University', rank: 1 },
  { name: 'Institut Polytechnique de Paris', rank: 2 },
  { name: 'Université Paris-Saclay', rank: 3 },
  { name: 'Sorbonne University', rank: 4 },
  { name: 'Université Paris Cité', rank: 5 },
  { name: 'École Normale Supérieure de Lyon', rank: 6 },
  { name: 'Université Grenoble Alpes', rank: 7 },
  { name: 'IMT Atlantique', rank: 8 },
  { name: 'Institut Agro', rank: 9 },
  { name: 'University of Montpellier', rank: 10 },
  { name: 'University of Bordeaux', rank: 11 },
  { name: 'University of Toulouse', rank: 12 },
  { name: 'Centrale Nantes', rank: 13 },
  { name: 'Claude Bernard University Lyon 1', rank: 14 },
  { name: 'Mines Saint-Étienne', rank: 15 },
  { name: 'Nantes Université', rank: 17 },
  { name: 'Sciences Po', rank: 18 },
  { name: 'Université Côte d\'Azur', rank: 19 },
  { name: 'University of Lille', rank: 20 },
  { name: 'University of Rennes', rank: 21 },
  { name: 'Arts et Métiers', rank: 22 },
  { name: 'École Centrale de Lyon', rank: 23 },
  { name: 'INSA Lyon', rank: 26 },
  { name: 'Panthéon-Sorbonne University', rank: 28 },
  { name: 'University of Western Brittany', rank: 29 },
  { name: 'CY Cergy Paris University', rank: 30 },
  { name: 'University of Angers', rank: 32 },
  { name: 'University of Clermont Auvergne', rank: 33 },
  { name: 'University of Savoie Mont Blanc', rank: 34 },
  { name: 'University of Tours', rank: 35 },
  { name: 'University of Poitiers', rank: 36 },
  { name: 'University of Orléans', rank: 37 },
  { name: 'University of Reims Champagne-Ardenne', rank: 38 },
  { name: 'University of Rouen Normandie', rank: 39 },
  { name: 'Université de Technologie de Compiègne', rank: 40 },
  { name: 'INSA Strasbourg', rank: 42 },
  { name: 'Paris Nanterre University', rank: 43 },
  { name: 'Université Polytechnique Hauts-de-France', rank: 44 },
  { name: 'Sorbonne Nouvelle University', rank: 45 },
  { name: 'University of La Rochelle', rank: 46 },
  { name: 'University of Pau and the Adour Region', rank: 47 },
  { name: 'Université de Technologie de Troyes', rank: 48 },
]

let updated = 0
const skipped = []

for (const e of ENTRIES) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${e.name} AND country = 'FR'`
  if (rows.length === 0) { skipped.push(e.name); continue }
  await sql`UPDATE universities SET "rankSource" = ${RANK_SOURCE}, "rankValue" = ${e.rank} WHERE id = ${rows[0].id}`
  updated++
}

console.log(`Set overall rank for ${updated} French institutions.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
