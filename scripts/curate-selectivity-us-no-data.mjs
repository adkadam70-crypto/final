// For US universities with no real (actual or estimated) acceptance rate,
// replaces the flat baselineSelectivity=60 placeholder with a
// category-differentiated curated estimate, using real signals already on
// file from College Scorecard (degree level predominantly awarded,
// enrollment size) rather than a per-school guess. Per the schema's own
// documented convention, baselineSelectivity is allowed to be "a curated
// overall estimate, not sourced" — this is that, done thoughtfully instead
// of leaving every such school at an identical flat number regardless of
// type. Crucially: acceptanceRateNote is set on every row this touches, so
// the UI can tell a student directly "this is a general estimate for this
// kind of school, not a researched figure" — never presented as equivalent
// to a real published rate.
//
// Categories (based on real, verifiable signals, not invented per-school):
//   - Scorecard-confirmed 2-year/associate's-predominant -> high-acceptance
//     estimate (most 2-year colleges are near-open-admission in reality)
//   - Scorecard-confirmed small bachelor's-predominant (<1,500 students)
//     -> moderate-high acceptance (typical of small non-flagship colleges)
//   - Scorecard-confirmed larger bachelor's-predominant -> moderate
//   - No Scorecard record found at all -> moderate-high (these are
//     disproportionately non-traditional/unrated schools in practice)
//
// Usage: node --env-file=.env.local scripts/curate-selectivity-us-no-data.mjs

import { neon } from '@neondatabase/serverless'
import fs from 'fs'

const sql = neon(process.env.DATABASE_URL)
const NOTE_2YEAR = 'No official acceptance rate on file. This is a 2-year/associate\'s-focused institution — selectivity shown is a general estimate for that category (most are broadly accessible admission), not a researched figure for this specific school.'
const NOTE_SMALL_4YEAR = 'No official acceptance rate on file. Selectivity shown is a general estimate for a smaller, non-flagship four-year institution, not a researched figure for this specific school.'
const NOTE_LARGE_4YEAR = 'No official acceptance rate on file. Selectivity shown is a general estimate, not a researched figure for this specific school.'
const NOTE_UNKNOWN = 'No official acceptance rate on file, and this school does not appear in the U.S. Dept of Education College Scorecard dataset. Selectivity shown is a general placeholder estimate, not a researched figure.'

const STOP = new Set(['the', 'of', 'and', 'at', 'a', '&', 'main', 'campus'])
function tokens(s) {
  return new Set(s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((t) => t && !STOP.has(t)))
}
function bestMatch(name, entries) {
  const ctoks = tokens(name)
  if (ctoks.size === 0) return null
  let best = null, bestRatio = 0
  for (const e of entries) {
    let inter = 0
    for (const t of ctoks) if (e._tokens.has(t)) inter++
    const ratio = inter / Math.min(ctoks.size, e._tokens.size)
    if (ratio > bestRatio) { bestRatio = ratio; best = e }
  }
  return bestRatio >= 0.85 ? best : null
}

const bachelors = JSON.parse(fs.readFileSync('/tmp/scorecard/rich.json', 'utf8'))
const associates = JSON.parse(fs.readFileSync('/tmp/scorecard/associates.json', 'utf8'))
for (const e of bachelors) e._tokens = tokens(e['school.name'] || '')
for (const e of associates) e._tokens = tokens(e['school.name'] || '')

const rows = await sql`
  SELECT id, name FROM universities
  WHERE country = 'US' AND "actualAcceptanceRate" IS NULL AND "estimatedAcceptanceRate" IS NULL
`

let n2year = 0, nSmall4yr = 0, nLarge4yr = 0, nUnknown = 0

for (const row of rows) {
  const assocMatch = bestMatch(row.name, associates)
  const bachMatch = !assocMatch ? bestMatch(row.name, bachelors) : null

  let selectivity, note
  if (assocMatch) {
    selectivity = 15 // ~85% typical acceptance for 2-year institutions
    note = NOTE_2YEAR
    n2year++
  } else if (bachMatch) {
    const size = bachMatch['latest.student.size']
    if (size && size < 1500) {
      selectivity = 35 // ~65% typical for small non-flagship 4-year
      note = NOTE_SMALL_4YEAR
      nSmall4yr++
    } else {
      selectivity = 45 // ~55% typical for larger, still-non-selective 4-year
      note = NOTE_LARGE_4YEAR
      nLarge4yr++
    }
  } else {
    selectivity = 35
    note = NOTE_UNKNOWN
    nUnknown++
  }

  await sql`
    UPDATE universities
    SET "baselineSelectivity" = ${selectivity},
        "acceptanceRateNote" = ${note}
    WHERE id = ${row.id}
  `
}

console.log(`Done. 2-year-category: ${n2year}, small 4-year: ${nSmall4yr}, larger 4-year: ${nLarge4yr}, unmatched/unknown: ${nUnknown}`)
console.log(`Total updated: ${n2year + nSmall4yr + nLarge4yr + nUnknown}`)
