// Backfills real SAT/ACT ranges for US universities missing them, from the
// same College Scorecard source (see /tmp/scorecard/testscores.json, pulled
// with the SAT/ACT percentile fields). Composite SAT = critical_reading +
// math 25th/75th percentiles (Scorecard reports the two sections
// separately, not a combined score). Only writes when Scorecard has a real
// number for that field — leaves testScoreSource/testPolicy null otherwise,
// never fabricated. testPolicy is NOT set here (Scorecard doesn't expose a
// clean test-optional/required flag) — a null score range already
// communicates "not on file" correctly per this schema's own convention.
//
// Usage: node --env-file=.env.local scripts/backfill-test-scores-us-bulk.mjs

import { neon } from '@neondatabase/serverless'
import fs from 'fs'

const sql = neon(process.env.DATABASE_URL)
const TEST_SOURCE = 'U.S. Department of Education College Scorecard (2024-25 data)'

const STOP = new Set(['the', 'of', 'and', 'at', 'a', '&', 'main', 'campus'])
function tokens(s) {
  return new Set(
    s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((t) => t && !STOP.has(t)),
  )
}

function bestMatch(name, entries) {
  const ctoks = tokens(name)
  if (ctoks.size === 0) return null
  let best = null
  let bestRatio = 0
  for (const entry of entries) {
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

const raw = JSON.parse(fs.readFileSync('/tmp/scorecard/testscores.json', 'utf8'))
for (const e of raw) e._tokens = tokens(e['school.name'] || '')

const rows = await sql`
  SELECT id, name FROM universities
  WHERE country = 'US' AND "satRange25" IS NULL AND "actRange25" IS NULL
`

let updated = 0
let noMatch = 0
let noScoreData = 0

for (const row of rows) {
  const match = bestMatch(row.name, raw)
  if (!match) {
    noMatch++
    continue
  }
  const cr25 = match['latest.admissions.sat_scores.25th_percentile.critical_reading']
  const cr75 = match['latest.admissions.sat_scores.75th_percentile.critical_reading']
  const m25 = match['latest.admissions.sat_scores.25th_percentile.math']
  const m75 = match['latest.admissions.sat_scores.75th_percentile.math']
  const act25 = match['latest.admissions.act_scores.25th_percentile.cumulative']
  const act75 = match['latest.admissions.act_scores.75th_percentile.cumulative']

  const satRange25 = cr25 != null && m25 != null ? cr25 + m25 : null
  const satRange75 = cr75 != null && m75 != null ? cr75 + m75 : null
  const actRange25 = act25 != null ? act25 : null
  const actRange75 = act75 != null ? act75 : null

  if (satRange25 == null && actRange25 == null) {
    noScoreData++
    continue
  }

  await sql`
    UPDATE universities
    SET "satRange25" = ${satRange25},
        "satRange75" = ${satRange75},
        "actRange25" = ${actRange25},
        "actRange75" = ${actRange75},
        "testScoreSource" = ${TEST_SOURCE}
    WHERE id = ${row.id}
  `
  updated++
}

console.log(`Backfilled real SAT/ACT ranges for ${updated} universities.`)
console.log(`No confident Scorecard match for ${noMatch} universities.`)
console.log(`Matched but no published score data for ${noScoreData} universities.`)
