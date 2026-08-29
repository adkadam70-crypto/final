// Real, government-sourced overall acceptance rates from the U.S. Dept of
// Education's College Scorecard API (api.data.gov/ed/collegescorecard) —
// this is what the founder originally asked for at the start of this whole
// thread: actual published admit rates instead of a curated/estimated
// selectivity number. Where a match is found, baselineSelectivity is
// REPLACED with 100 - (real admit rate), and acceptanceRateSource is set so
// the AI (and anyone reading the DB) can tell "real published rate" apart
// from "internal estimate" — those are not the same kind of fact and
// shouldn't be presented with equal confidence.
//
// Data pull was capped by api.data.gov's public DEMO_KEY rate limit at ~900
// of ~1,947 total US bachelor's-degree-granting institutions (see
// /tmp/scorecard/combined.json, fetched via scripts/fetch-scorecard.sh-style
// curl loop, not checked into the repo). A registered (free, instant) API
// key would remove that cap for a future, more complete pass.
//
// Usage: node --env-file=.env.local scripts/seed-actual-acceptance-rates.mjs

import { neon } from '@neondatabase/serverless'
import fs from 'fs'

const sql = neon(process.env.DATABASE_URL)

const SOURCE = 'U.S. Dept of Education College Scorecard (official federal data)'

// A handful of known official-IPEDS-name vs. common-name mismatches found
// while checking the unmatched list — not guessed, confirmed present in the
// fetched batch under this exact alternate name.
const NAME_ALIASES = {
  'columbia university': 'columbia university in the city of new york',
}

function normalize(name) {
  const base = name
    .toLowerCase()
    .replace(/^the\s+/, '')
    .replace(/[.,]/g, '')
    .replace(/\buniversity of california,?\s*/, 'uc ')
    .replace(/--/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
  return NAME_ALIASES[base] ?? base
}

const scorecard = JSON.parse(fs.readFileSync('/tmp/scorecard/combined.json', 'utf8'))
const byNormalizedName = new Map()
for (const row of scorecard) {
  const name = row['school.name']
  const rate = row['latest.admissions.admission_rate.overall']
  if (!name || rate == null) continue
  byNormalizedName.set(normalize(name), rate)
}

const catalog = await sql`SELECT id, name FROM universities WHERE country = 'US'`

let updated = 0
let unmatched = []
for (const u of catalog) {
  const rate = byNormalizedName.get(normalize(u.name))
  if (rate == null) {
    unmatched.push(u.name)
    continue
  }
  const acceptanceRatePct = Math.round(rate * 100)
  const derivedSelectivity = Math.max(1, Math.min(99, 100 - acceptanceRatePct))
  await sql`
    UPDATE universities
    SET "baselineSelectivity" = ${derivedSelectivity}, "actualAcceptanceRate" = ${acceptanceRatePct}, "acceptanceRateSource" = ${SOURCE}
    WHERE id = ${u.id}
  `
  updated++
}

console.log(`Updated ${updated} of ${catalog.length} US schools with real acceptance-rate data.`)
console.log(`Unmatched (${unmatched.length}) — either not in the ~900-row Scorecard batch fetched, or a name-format mismatch:`)
console.log(unmatched.slice(0, 40).join(', ') + (unmatched.length > 40 ? `, ... (${unmatched.length - 40} more)` : ''))
