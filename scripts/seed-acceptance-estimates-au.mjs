// Acceptance-rate pass for Australia — method in
// migrate-add-estimated-acceptance-rate.mjs and lib/db/schema.ts.
//
// Australian universities do NOT publish an institution-wide acceptance rate.
// Undergraduate admission is against a published ATAR (or equivalent
// "Selection Rank") cut-off per course: if you clear the cut-off and any
// prerequisites, you are almost always offered a place. So the honest
// framing is a cut-off, not a rate — and that is what the note says.
//
// Where a real published offer-rate signal exists it is used AS a real rate:
// Victorian universities report a VTAC domestic first-preference offer rate
// (Melbourne and Monash ~71%), published by the Victorian Tertiary Admissions
// Centre — so those two go in actualAcceptanceRate + acceptanceRateSource,
// not estimatedAcceptanceRate. For every other AU university the number is a
// Tier-4 band from where admissions-data aggregators cluster, cross-checked —
// treated cautiously because those aggregator numbers often mix undergraduate/
// postgraduate and domestic/international streams — so it stays an estimate.
//
//   - Group of Eight: ~45-70% (more competitive courses well below that)
//   - mid-tier universities: ~75-88%
//   - regional / newer universities: ~88-95%
//
// Realigns baselineSelectivity to (100 - estimate). Never touches a row with
// a real actualAcceptanceRate.
//
// Usage: node --env-file=.env.local scripts/seed-acceptance-estimates-au.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const D = "A research estimate — Australian universities admit against a published ATAR/Selection-Rank cut-off per course and do not publish an institution-wide acceptance rate."

// Real published figure for the two Victorian Go8 universities.
const VTAC_SRC = 'VTAC domestic first-preference offer rate (offers ÷ first-preference applications), published by the Victorian Tertiary Admissions Centre. Counts applicants who ranked this university first; an offer is the admission.'
const VTAC_NAMES = new Set(['University of Melbourne', 'Monash University'])

const EST = {
  'University of Melbourne': 71,
  'Monash University': 71,
  'University of Sydney': 45,
  'University of New South Wales': 48,
  'Australian National University': 50,
  'University of Queensland': 55,
  'University of Western Australia': 65,
  'University of Adelaide': 65,
  'University of Technology Sydney': 70,
  'Macquarie University': 75,
  'Queensland University of Technology': 78,
  'RMIT University': 78,
  'University of Wollongong': 80,
  'Curtin University': 82,
  'Deakin University': 82,
  'University of Newcastle': 82,
  'Griffith University': 84,
  'La Trobe University': 85,
  'University of Tasmania': 88,
  'University of Canberra': 85,
  'Flinders University': 85,
  'Western Sydney University': 88,
  'Swinburne University of Technology': 88,
  'James Cook University': 88,
  'Bond University': 75,
  'University of Notre Dame Australia': 82,
}

const rows = await sql`SELECT id, name, "rankValue", "actualAcceptanceRate", "acceptanceRateSource" FROM universities WHERE country = 'AU'`
let real = 0
let estimated = 0
for (const r of rows) {
  if (r.actualAcceptanceRate != null && r.acceptanceRateSource !== VTAC_SRC) continue

  let rate = EST[r.name]
  if (rate == null) rate = r.rankValue != null && r.rankValue <= 20 ? 82 : 92

  if (VTAC_NAMES.has(r.name)) {
    await sql`UPDATE universities SET
      "actualAcceptanceRate" = ${rate}, "acceptanceRateSource" = ${VTAC_SRC},
      "estimatedAcceptanceRate" = NULL, "acceptanceRateNote" = NULL,
      "baselineSelectivity" = ${100 - rate}
      WHERE id = ${r.id}`
    real++
  } else {
    const note = `Estimated ~${rate}% — band estimate for a university at this tier. ${D}`
    await sql`UPDATE universities SET
      "estimatedAcceptanceRate" = ${rate}, "acceptanceRateNote" = ${note},
      "actualAcceptanceRate" = NULL, "acceptanceRateSource" = NULL,
      "baselineSelectivity" = ${100 - rate}
      WHERE id = ${r.id}`
    estimated++
  }
}
console.log(`Australia: ${real} real VTAC offer rates, ${estimated} band estimates.`)
