// Backfills real acceptance rates for US universities that currently have
// actualAcceptanceRate = null (the bulk Hipolabs/Wikipedia additions, which
// only had real name+link, not admissions data) — using the same College
// Scorecard pull already fetched in fetch-scorecard.mjs (cached at
// /tmp/scorecard/rich.json). Matches by fuzzy token-overlap (not exact
// string), same convention as seed-universities-us-scorecard-round1.mjs,
// since Scorecard names carry "The"/"-Main Campus" noise that breaks exact
// matching. Only updates rows that get a real match with a real published
// admission_rate — leaves everything else alone (still null, not guessed).
//
// Usage: node --env-file=.env.local scripts/backfill-acceptance-rates-us-bulk.mjs

import { neon } from '@neondatabase/serverless'
import fs from 'fs'

const sql = neon(process.env.DATABASE_URL)
const RATE_SOURCE = 'U.S. Department of Education College Scorecard (2024-25 data)'

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

const rich = JSON.parse(fs.readFileSync('/tmp/scorecard/rich.json', 'utf8'))
for (const e of rich) e._tokens = tokens(e['school.name'] || '')

const rows = await sql`
  SELECT id, name FROM universities
  WHERE country = 'US' AND "actualAcceptanceRate" IS NULL
`

let updated = 0
let noMatch = 0

for (const row of rows) {
  const match = bestMatch(row.name, rich)
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

console.log(`Backfilled real acceptance rates for ${updated} universities.`)
console.log(`No confident Scorecard match for ${noMatch} universities (left as-is).`)
