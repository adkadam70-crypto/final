// US program rankings — Law, ranks 1-50, from a real undergraduate Pre-Law
// source (College Transitions' "2026 Best Colleges for Pre-Law") — distinct
// from the existing "Law" rows in this catalog, which are sourced from U.S.
// News's graduate/JD law-school rankings, not an undergraduate pre-law
// signal. Kept under the same field tag since this app matches students to
// undergraduate institutions and "Law" here means "how well this school
// prepares/positions a student for law school," which the pre-law list
// measures directly.
//
// Run scripts/add-missing-universities-us-prelaw.mjs FIRST — Reed College
// is not yet in the general catalog; this script skips any name it can't
// match.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-us-prelaw.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const FIELD = 'Law'
const SOURCE = 'College Transitions — 2026 Best Colleges for Pre-Law'
const SOURCE_URL = 'https://www.collegetransitions.com/blog/best-colleges-for-pre-law/'

function selectivityFromRank(rank) {
  return Math.max(50, Math.round(98 - (rank - 1) * 0.9))
}

const DATA = [
  ['Yale University', 1], ['Harvard University', 2], ['Amherst College', 3], ['Georgetown University', 4],
  ['Princeton University', 5], ['Dartmouth College', 6], ['Stanford University', 7], ['Claremont McKenna College', 8],
  ['Duke University', 9], ['Williams College', 10], ['Swarthmore College', 11], ['University of Pennsylvania', 12],
  ['University of Chicago', 13], ['Brown University', 14], ['Pomona College', 15], ['Cornell University', 16],
  ['New York University', 17], ['Columbia University', 18], ['Haverford College', 19], ['Wellesley College', 20],
  ['University of California, Berkeley', 21], ['Northwestern University', 22], ['Washington and Lee University', 23],
  ['University of Virginia', 24], ['Brandeis University', 25], ['Colgate University', 26], ['Wesleyan University', 27],
  ['Vanderbilt University', 28], ['George Washington University', 29], ['Bowdoin College', 30], ['Tufts University', 31],
  ['Rice University', 32], ['Emory University', 33], ['College of William & Mary', 34],
  ['Washington University in St. Louis', 35], ['University of Notre Dame', 36], ['Vassar College', 37],
  ['University of Michigan', 38], ['University of California, Los Angeles', 39], ['American University', 40],
  ['Barnard College', 41], ['Davidson College', 42], ['Boston College', 43], ['Hamilton College', 44],
  ['Grinnell College', 45], ['Carleton College', 46], ['Reed College', 47], ['Wake Forest University', 48],
  ['University of North Carolina at Chapel Hill', 49], ['Morehouse College', 50],
]

let rankInserted = 0
let skipped = []

for (const [name, rank] of DATA) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'US'`
  if (rows.length === 0) {
    skipped.push(name)
    continue
  }
  const universityId = rows[0].id

  const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${universityId} AND field = ${FIELD} AND "rankSource" = ${SOURCE}`
  if (existing.length === 0) {
    await sql`
      INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
      VALUES (
        ${universityId}, ${FIELD}, ${rank}, ${SOURCE}, ${SOURCE_URL},
        ${selectivityFromRank(rank)},
        'Undergraduate pre-law placement/advising ranking, distinct in kind from the graduate law-school rankings that make up the existing "Law" rows in this catalog — both describe legitimate but different things about a school named "Law" strength, kept as separate sources.'
      )
    `
    rankInserted++
  }
}

console.log(`Inserted ${rankInserted} program-ranking rows.`)
if (skipped.length) console.log(`Could not match (not in catalog): ${skipped.join(', ')}`)
