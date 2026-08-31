// Second pass expanding ED/EA/RD coverage beyond the initial 48 schools
// (scripts/seed-early-admission-rates.mjs). Same discipline: every entry
// here has an independently-confirmed admission mechanism (binding ED vs.
// non-binding EA/REA/SCEA) and a real, current-cycle number — not an
// "industry estimate."
//
// Deliberately NOT included, and why (so this isn't mistaken for an
// oversight later):
// - Harvard, Princeton, Stanford: withheld their early-round numbers this
//   cycle; only stale (2-4 year old) figures exist, which would misrepresent
//   how selective they are RIGHT NOW next to schools with current data.
// - Caltech: only a vague "under 5%, negligible difference from RD" is
//   published — no real percentage to store.
// - University of Chicago: round-specific rates are explicitly "industry
//   estimates" per every source checked (20-30% combined ED, 2-3% RD) —
//   UChicago itself doesn't publish them.
// - Georgetown, NYU, Spelman: real early-round *mechanism* confirmed, but
//   no reliable current-cycle *rate* found (or, for Spelman, two secondary
//   sources gave conflicting numbers with no way to tell which round each
//   refers to).
// - Wake Forest: stopped publishing this breakdown after the Class of 2025;
//   the only ED figure available (34.49%, Class of 2024) is now several
//   admissions cycles stale next to a current ~18% overall rate that has
//   moved a lot since then — pairing them would manufacture a gap that's
//   really just the passage of time, not the ED mechanism.
// - Belmont, University of San Diego, Pepperdine: confirmed to either have
//   no meaningful ED/RD gap (San Diego: RD already ≈ overall) or no
//   published rate at all (Belmont EA-only with no split rate; Pepperdine
//   publishes nothing verifiable for any early round).
// - Elon, Rhodes College, Furman, Illinois Institute of Technology, Fordham:
//   Elon confirmed not to differentiate rates publicly at all; the other
//   four still show internally-inconsistent or directly-conflicting numbers
//   across every source checked (Fordham specifically: one source says ED
//   admits at a LOWER rate than the overall pool, another says dramatically
//   higher — no way to tell which, if either, is current and accurate).
//
// Usage: node --env-file=.env.local scripts/seed-early-admission-rates-2.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const SOURCE_ED = 'Common Data Set 2024-25 (via collegetransitions.com Early vs. Regular Decision comparison)'
const SOURCE_NEWS = 'School-reported admissions data, most recent published cycle (2025-26)'

// { name, ed, ea, rd, source }
const ENTRIES = [
  // Confirmed binding ED — reused from the original collegetransitions.com
  // fetch (same batch/source as the first 48), mechanism independently
  // confirmed via each school's own admissions pages this round.
  { name: 'Bucknell University', ed: 55, rd: 26, source: SOURCE_ED },
  { name: 'Occidental College', ed: 48, rd: 44, source: SOURCE_ED },

  // Confirmed non-binding EA/REA/SCEA, real current-cycle rates, sourced
  // directly to each school's own reporting or press coverage of it.
  { name: 'Yale University', ea: 11, source: `${SOURCE_NEWS} — Single-Choice Early Action, 779 of 7,140 applicants (Class of 2030)` },
  { name: 'Massachusetts Institute of Technology', ea: 6, source: `${SOURCE_NEWS} — non-restrictive Early Action, 655 of 11,883 applicants (Class of 2030)` },
  { name: 'University of Notre Dame', ea: 12, source: `${SOURCE_NEWS} — Restrictive Early Action, 1,617 of 13,711 applicants (Class of 2030)` },
  { name: 'University of Southern California', ea: 10, source: `${SOURCE_NEWS} — Early Action (Class of 2030)` },

  // Confirmed binding ED with a real, same-cycle Regular-Decision-only or
  // non-ED rate alongside it.
  { name: 'Tufts University', ed: 32, rd: 9, source: `${SOURCE_NEWS} — Class of 2028 cycle (most recent published ED-vs-rest split)` },
  { name: 'University of Miami', ed: 44, rd: 18, source: `${SOURCE_NEWS} — ED is Class of 2029; the 18% non-ED figure is the closest published split, from the adjacent Class of 2028 cycle (Miami's Common Data Set reports Early Action and Regular Decision together, not separately)` },
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
      "earlyAdmissionSource" = ${entry.source}
    WHERE id = ${rows[0].id}
  `
  updated++
}

console.log(`Updated early-admission data for ${updated} more US schools.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)

const [{ count }] = await sql`SELECT count(*) FROM universities WHERE country = 'US' AND "earlyAdmissionSource" IS NOT NULL`
console.log(`Total US schools with ED/EA/RD data now: ${count} of 183.`)
