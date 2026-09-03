// US rank recheck pass #4 — reads live, tie-accurate 2026 U.S. News National
// Universities ranks (ranks 1-100) directly from the user's logged-in
// premium.usnews.com subscriber account and reconciles against every
// matching school already in our catalog: corrects existing rankValue where
// the real tie-band differs from what we had (mostly from the round-2
// sequential/aggregator numbers, which don't preserve US News's own ties),
// and fills in rankValue for catalog schools that had none on file yet.
// Does NOT add any new schools — schools seen live but not yet in our
// catalog (UC Merced, UC Riverside, Rutgers-Newark, Rutgers-Camden, Colorado
// School of Mines, University of Illinois Chicago, Yeshiva, RIT, UC Santa
// Cruz, Florida International) are intentionally left for a separate
// new-school-addition pass, since that requires full profile research
// (location, climate, sectors, requirements, etc.), not just a rank number.
//
// Usage: node --env-file=.env.local scripts/seed-overall-rankings-us-round4.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const RANK_SOURCE = 'U.S. News & World Report — 2026 Best National Universities (verified directly via subscriber account)'

const RANKS = [
  ['University of Michigan', 20],
  ['University of North Carolina at Chapel Hill', 26],
  ['University of California, San Diego', 29],
  ['University of Texas at Austin', 30],
  ['Georgia Institute of Technology', 32],
  ['New York University', 32],
  ['University of California, Davis', 32],
  ['University of California, Irvine', 32],
  ['Boston College', 36],
  ['Tufts University', 36],
  ['University of Illinois Urbana-Champaign', 36],
  ['University of Wisconsin-Madison', 36],
  ['University of California, Santa Barbara', 40],
  ['Ohio State University', 41],
  ['Boston University', 42],
  ['Rutgers University-New Brunswick', 42],
  ['University of Maryland, College Park', 42],
  ['University of Washington', 42],
  ['Lehigh University', 46],
  ['Northeastern University', 46],
  ['Purdue University', 46],
  ['University of Georgia', 46],
  ['University of Rochester', 46],
  ['Wake Forest University', 51],
  ['Case Western Reserve University', 51],
  ['Florida State University', 51],
  ['Texas A&M University', 51],
  ['Virginia Tech', 51],
  ['College of William & Mary', 51],
  ['Villanova University', 57],
  ['George Washington University', 59],
  ['Pennsylvania State University', 59],
  ['Santa Clara University', 59],
  ['Stony Brook University', 59],
  ['University of Minnesota Twin Cities', 59],
  ['Michigan State University', 64],
  ['North Carolina State University', 64],
  ['Rensselaer Polytechnic Institute', 64],
  ['University of Massachusetts Amherst', 64],
  ['University of Miami', 64],
  ['Brandeis University', 69],
  ['Tulane University', 69],
  ['University of Connecticut', 69],
  ['University of Pittsburgh', 69],
  ['Binghamton University', 73],
  ['Indiana University Bloomington', 73],
  ['Clemson University', 75],
  ['Syracuse University', 75],
  ['University at Buffalo', 75],
  ['Drexel University', 80],
  ['New Jersey Institute of Technology', 80],
  ['Stevens Institute of Technology', 80],
  ['Pepperdine University', 84],
  ['Worcester Polytechnic Institute', 84],
  ['American University', 88],
  ['Baylor University', 88],
  ['Howard University', 88],
  ['Marquette University', 88],
  ['Southern Methodist University', 88],
  ['University of Delaware', 88],
  ['University of South Florida', 88],
  ['Fordham University', 97],
  ['Texas Christian University', 97],
]

let updated = 0
let skipped = []

for (const [name, rank] of RANKS) {
  const rows = await sql`SELECT id, "rankValue" FROM universities WHERE name = ${name} AND country = 'US'`
  if (rows.length === 0) {
    skipped.push(name)
    continue
  }
  if (rows[0].rankValue === rank) continue
  await sql`UPDATE universities SET "rankValue" = ${rank}, "rankSource" = ${RANK_SOURCE} WHERE id = ${rows[0].id}`
  updated++
}

console.log(`Updated ${updated} rank values.`)
if (skipped.length) console.log(`Could not match (not in catalog): ${skipped.join(', ')}`)
