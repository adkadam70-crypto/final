// Backfills real acceptance rates for US universities that are 2-year/
// associate's-predominant institutions (community colleges, technical
// colleges, etc.) — these were missed by the original backfill because
// that only pulled bachelor's-predominant (degrees_awarded.predominant=3)
// Scorecard data. This pulls the associate's-predominant slice
// (predominant=2, see /tmp/scorecard/associates.json) and matches against
// the same fuzzy token-overlap logic as the bachelor's round.
//
// Usage: node --env-file=.env.local scripts/backfill-acceptance-rates-us-associates.mjs

import { neon } from '@neondatabase/serverless'
import fs from 'fs'

const sql = neon(process.env.DATABASE_URL)
const RATE_SOURCE = 'U.S. Department of Education College Scorecard (2024-25 data, associate\'s-predominant)'

const STOP = new Set(['the', 'of', 'and', 'at', 'a', '&', 'main', 'campus'])
function tokens(s) {
  return new Set(
    s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((t) => t && !STOP.has(t)),
  )
}

function bestMatch(name, scorecardEntries) {
  const ctoks = tokens(name)
  if (ctoks.size === 0) return null
  let best = null
  let bestRatio = 0
  for (const entry of scorecardEntries) {
    const rate = entry['latest.admissions.admission_rate.overall']
    if (rate === null || rate === undefined) continue
    const etoks = entry._tokens
    let inter = 0
    for (const t of ctoks) if (etoks.has(t)) inter++
    const ratio = inter / Math.min(ctoks.size, etoks.size)
    if (ratio > bestRatio) {
      bestRatio = ratio
      best = entry
    }
  }
  return bestRatio >= 0.85 ? best : null
}

const associates = JSON.parse(fs.readFileSync('/tmp/scorecard/associates.json', 'utf8'))
for (const e of associates) e._tokens = tokens(e['school.name'] || '')

const rows = await sql`
  SELECT id, name FROM universities
  WHERE country = 'US' AND "actualAcceptanceRate" IS NULL AND "estimatedAcceptanceRate" IS NULL
`

let updated = 0
let noMatch = 0

for (const row of rows) {
  const match = bestMatch(row.name, associates)
  if (!match) {
    noMatch++
    continue
  }
  const acceptanceRate = Math.round(match['latest.admissions.admission_rate.overall'] * 100)
  const baselineSelectivity = 100 - acceptanceRate
  await sql`
    UPDATE universities
    SET "actualAcceptanceRate" = ${acceptanceRate},
        "acceptanceRateSource" = ${RATE_SOURCE},
        "baselineSelectivity" = ${baselineSelectivity}
    WHERE id = ${row.id}
  `
  updated++
}

console.log(`Backfilled real acceptance rates for ${updated} associate's-predominant universities.`)
console.log(`No confident match for ${noMatch} universities (left as-is).`)
