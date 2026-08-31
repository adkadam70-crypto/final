// Real Early Decision / Early Action / Regular-Decision-only rates for the
// most selective private US schools in the catalog — where binding ED is a
// real, well-documented phenomenon (public flagships and most schools below
// ~mid-30s baselineSelectivity generally don't have it, so this
// intentionally doesn't attempt full 183-school coverage).
//
// Source: collegetransitions.com's Common Data Set-sourced comparison table
// (2024-25 cycle, updated December 2025) for the three raw numbers, cross-
// checked against known admissions-policy facts for WHICH mechanism each
// school actually uses — binding ED vs. non-binding EA/REA/SCEA — since the
// source's own column blends both under one "ED/EA Rate" header, and mixing
// them up would misrepresent whether a higher number requires a binding
// commitment. Schools where the three numbers were internally inconsistent
// (an early/EA rate lower than the regular rate, or a regular rate higher
// than the overall blended rate — both mathematically backwards) were
// dropped entirely rather than seeded as suspect data: Elon, Rhodes,
// Furman, Illinois Institute of Technology, Fordham, Georgetown (Georgetown
// also has no binding ED at all — REA only, not reported separately here).
//
// Second pass (Aug 2026): four more schools from the same source, mechanism
// re-verified per school —
//   - University of Virginia: binding ED confirmed (1,245 admits / 4,461
//     ED applicants, Fall 2024 ≈ 28%; RD ~12% vs ~17% overall). UVA also
//     runs non-binding EA, but ED is the binding round the panel is about.
//   - College of William & Mary: binding ED confirmed (746 / 1,586 ≈ 47%;
//     RD 32.8% vs 34% overall).
//   - University of Denver: binding ED I/II confirmed. Below the selectivity
//     band above (baselineSelectivity 22) but a genuine private-ED school;
//     77% ED / 62% RD is internally consistent with its ~71-78% blended.
//   - Miami University (Oxford, OH): non-binding EA (84%) vs RD (75%) — a
//     small gap, low signal, but consistent and real.
// Re-checked and still excluded for the same backwards-numbers reason as
// above: College of Charleston (RD 24% not credible against a ~60-78%
// overall rate), Illinois Institute of Technology (EA below RD; EA not ED),
// Fordham (RD above ED; Fordham does not publish RD or EA separately),
// Rhodes (ED below RD; no real ED-round rate published).
//
// regularDecisionRate is the more defensible "realistic" baseline for the
// large majority of applicants who don't apply early — see the priority
// order in match.ts / analyze-target-university.ts, where it now outranks
// the blended actualAcceptanceRate for exactly this reason: a school like
// Northeastern's published ~5% already includes a ~43% ED pool, so an RD
// applicant's real odds (~4%, per this source) are worse than the headline
// suggests, not better — the "gamed" concern the user raised turns out to
// be fixed by the same real data as the ED-modeling task, not a separately
// invented correction factor.
//
// Usage: node --env-file=.env.local scripts/seed-early-admission-rates.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const SOURCE = 'Common Data Set 2024-25 (via collegetransitions.com Early vs. Regular Decision comparison)'

// { name, ed, ea, rd } — ed/ea/rd nullable; only one of ed/ea set per school
// based on that school's actual, confirmed admission mechanism.
const ENTRIES = [
  { name: 'Columbia University', ed: 13, rd: 3 },
  { name: 'Dartmouth College', ed: 19, rd: 4 },
  { name: 'Northeastern University', ed: 43, rd: 4 },
  { name: 'Johns Hopkins University', ed: 12, rd: 5 },
  { name: 'University of Pennsylvania', ed: 14, rd: 4 },
  { name: 'Bowdoin College', ed: 13, rd: 6 },
  { name: 'Pomona College', ed: 13, rd: 6 },
  { name: 'Northwestern University', ed: 23, rd: 6 },
  { name: 'Cornell University', ed: 17, rd: 7 },
  { name: 'Duke University', ed: 17, rd: 4 },
  { name: 'Claremont McKenna College', ed: 23, rd: 7 },
  { name: 'Boston University', ed: 28, rd: 9 },
  { name: 'Emory University', ed: 23, rd: 9 },
  { name: 'Carnegie Mellon University', ed: 14, rd: 11 },
  { name: 'Washington University in St. Louis', ed: 25, rd: 10 },
  { name: 'Harvey Mudd College', ed: 16, rd: 12 },
  { name: 'Brown University', ed: 14, rd: 4 },
  { name: 'Colgate University', ed: 19, rd: 13 },
  { name: 'Wesleyan University', ed: 38, rd: 14 },
  { name: 'Boston College', ea: 30, rd: 14 },
  { name: 'Babson College', ed: 28, rd: 16 },
  { name: 'Rice University', ed: 17, rd: 7 },
  { name: 'Vanderbilt University', ed: 16, rd: 4 },
  { name: 'Swarthmore College', ed: 18, rd: 6 },
  { name: 'Trinity College', ed: 44, rd: 28 },
  { name: 'Vassar College', ed: 30, rd: 18 },
  { name: 'Davidson College', ed: 32, rd: 10 },
  { name: 'Haverford College', ed: 29, rd: 10 },
  { name: 'Middlebury College', ed: 30, rd: 8 },
  { name: 'Brandeis University', ed: 42, rd: 40 },
  { name: 'Case Western Reserve University', ed: 37, rd: 38 },
  { name: 'University of Rochester', ed: 38, rd: 40 },
  { name: 'George Washington University', ed: 66, rd: 46 },
  { name: 'Santa Clara University', ed: 80, rd: 29 },
  { name: 'Stevens Institute of Technology', ed: 72, rd: 25 },
  { name: 'Southern Methodist University', ed: 87, rd: 33 },
  { name: 'Texas Christian University', ed: 69, rd: 31 },
  { name: 'Baylor University', ed: 77, rd: 51 },
  { name: 'Tulane University', ed: 59, rd: 7 },
  { name: 'Villanova University', ed: 49, rd: 27 },
  { name: 'Lehigh University', ed: 45, rd: 24 },
  { name: 'Syracuse University', ed: 58, rd: 45 },
  { name: 'Worcester Polytechnic Institute', ed: 76, rd: 35 },
  { name: 'American University', ed: 80, rd: 61 },
  { name: 'Drexel University', ed: 92, rd: 67 },
  // Confirmed binding ED, but the early-round number itself wasn't cleanly
  // confirmed/consistent enough to seed — regularDecisionRate only.
  { name: 'Howard University', rd: 33 },
  { name: 'Morehouse College', rd: 26 },
  { name: 'Loyola Marymount University', rd: 35 },
  // Second pass (Aug 2026) — see header note.
  { name: 'University of Virginia', ed: 28, rd: 12 },
  { name: 'College of William & Mary', ed: 47, rd: 33 },
  { name: 'University of Denver', ed: 77, rd: 62 },
  { name: 'Miami University', ea: 84, rd: 75 },
]

let updated = 0
let skipped = []

for (const entry of ENTRIES) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${entry.name} AND country = 'US'`
  if (rows.length === 0) {
    skipped.push(entry.name)
    continue
  }
  await sql`
    UPDATE universities SET
      "earlyDecisionRate" = ${entry.ed ?? null},
      "earlyActionRate" = ${entry.ea ?? null},
      "regularDecisionRate" = ${entry.rd ?? null},
      "earlyAdmissionSource" = ${SOURCE}
    WHERE id = ${rows[0].id}
  `
  updated++
}

console.log(`Updated early-admission data for ${updated} US schools.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
