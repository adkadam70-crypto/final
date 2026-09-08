// US program rankings — Medicine & Health Sciences (Nursing), ranks 1-100,
// from a second real source (NursingSchoolsAlmanac.com's 2024 National
// Nursing School Rankings) independent of the U.S. News subscriber-verified
// Nursing list already seeded (seed-program-rankings-us-nursing.mjs,
// ranks 1-40).
//
// Run scripts/add-missing-universities-us-nursing.mjs FIRST. This source's
// full 100-school list also includes several graduate/professional-only
// health science centers and small single-purpose nursing colleges that
// were deliberately NOT added to the catalog (see the comment in that
// script for the full list and why) — this script will harmlessly skip
// those names rather than error.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-us-nursing-round2.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const FIELD = 'Medicine & Health Sciences'
const SOURCE = 'NursingSchoolsAlmanac.com — 2024 National Nursing School Rankings'
const SOURCE_URL = 'https://www.nursingschoolsalmanac.com/rankings/national'

function selectivityFromRank(rank) {
  return Math.max(20, Math.round(97 - (rank - 1) * 0.7))
}

const DATA = [
  ['Duke University', 1], ['Johns Hopkins University', 2], ['New York University', 3],
  ['University of Pennsylvania', 5], ['Emory University', 6], ['University of Washington', 8],
  ['University of North Carolina at Chapel Hill', 9], ['University of Pittsburgh', 12],
  ['Villanova University', 14], ['Columbia University', 15], ['University of Michigan', 17],
  ['Boston College', 21], ['Yale University', 23], ['Vanderbilt University', 24],
  ['Case Western Reserve University', 25], ['University of Florida', 26], ['University of Rochester', 27],
  ['University of Miami', 28], ['Ohio State University', 29], ['University of California, Los Angeles', 30],
  ['Georgetown University', 31], ['University of Illinois Chicago', 32], ['East Carolina University', 33],
  ['University of Alabama at Birmingham', 34], ['Samford University', 36], ['University of Utah', 37],
  ['University of Texas at Austin', 38], ['University of Minnesota Twin Cities', 39],
  ['University of Connecticut', 40], ['University of Wisconsin-Madison', 42],
  ['University of Texas at Arlington', 43], ['Drexel University', 44], ['University of Virginia', 45],
  ['University of South Carolina', 51], ['Fairfield University', 53], ['University of North Carolina at Greensboro', 55],
  ['University of Iowa', 56], ['University of Portland', 57], ['Washington State University', 58],
  ['Northeastern University', 60], ['Widener University', 63], ['Michigan State University', 64],
  ['University of Delaware', 65], ['Rutgers University-New Brunswick', 66], ['Purdue University', 69],
  ['Simmons University', 70], ['University of Kentucky', 71], ['Georgia College & State University', 73],
  ['Loma Linda University', 75], ['University of San Diego', 76], ['University of Scranton', 77],
  ['Belmont University', 78], ['Loyola University Chicago', 79], ['George Mason University', 80],
  ['Quinnipiac University', 81], ['James Madison University', 83], ['Virginia Commonwealth University', 85],
  ['University of Central Florida', 86], ['Marquette University', 87], ['University of Missouri', 88],
  ['Illinois State University', 89], ['University of Arizona', 90], ["Texas Woman's University", 91],
  ['University at Buffalo', 92], ['South Dakota State University', 93], ['Saint Louis University', 94],
  ['Gonzaga University', 95], ['California State University, Long Beach', 96], ['Regis University', 97],
  ['Adelphi University', 99], ['University of South Florida', 100],
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
        'Aggregator ranking of nursing programs specifically (NCLEX pass rates, clinical placement quality, reputation), independent methodology from the U.S. News subscriber-verified Nursing list already in this catalog — kept as a separate source rather than merged.'
      )
    `
    rankInserted++
  }
}

console.log(`Inserted ${rankInserted} program-ranking rows.`)
if (skipped.length) console.log(`Could not match (not in catalog, by design or otherwise): ${skipped.join(', ')}`)
