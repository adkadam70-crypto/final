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
  // IPEDS/Scorecard appends a campus qualifier ("-Main Campus", "at Raleigh",
  // etc.) that this catalog's simpler names don't carry — found via a second,
  // full-key pass after a real API key removed the DEMO_KEY row cap and
  // exposed ~35 more true matches hiding behind this naming difference.
  'purdue university': 'purdue university-main campus',
  'pennsylvania state university': 'pennsylvania state university-main campus',
  'university of maryland college park': 'university of maryland-college park',
  'colorado state university': 'colorado state university-fort collins',
  'indiana university bloomington': 'indiana university-bloomington',
  'university of oklahoma': 'university of oklahoma-norman campus',
  'university of missouri': 'university of missouri-columbia',
  'university of south carolina': 'university of south carolina-columbia',
  'north carolina state university': 'north carolina state university at raleigh',
  'university of pittsburgh': 'university of pittsburgh-pittsburgh campus',
  'university of new mexico': 'university of new mexico-main campus',
  'tulane university': 'tulane university of louisiana',
  'southern illinois university carbondale': 'southern illinois university-carbondale',
  'california state university long beach': 'california state university-long beach',
  'arizona state university': 'arizona state university campus immersion',
  'ohio state university': 'ohio state university-main campus',
  'university of minnesota twin cities': 'university of minnesota-twin cities',
  'university of tennessee knoxville': 'university of tennessee-knoxville',
  'california polytechnic state university san luis obispo': 'california polytechnic state university-san luis obispo',
  'university of massachusetts amherst': 'university of massachusetts-amherst',
  'virginia tech': 'virginia polytechnic institute and state university',
  'kent state university': 'kent state university at kent',
  'university of cincinnati': 'university of cincinnati-main campus',
  'california state university fullerton': 'california state university-fullerton',
  'university of nevada reno': 'university of nevada-reno',
  'university of virginia': 'university of virginia-main campus',
  'miami university': 'miami university-oxford',
  'university of washington': 'university of washington-seattle campus',
  'oklahoma state university': 'oklahoma state university-main campus',
  'georgia institute of technology': 'georgia institute of technology-main campus',
  'university of michigan': 'university of michigan-ann arbor',
  'north dakota state university': 'north dakota state university-main campus',
  'texas a&m university': 'texas a&m university-college station',
  'louisiana state university': 'louisiana state university and agricultural & mechanical college',
  'embry-riddle aeronautical university': 'embry-riddle aeronautical university-daytona beach',
  // Scorecard's own name drops the accent.
  'san josé state university': 'san jose state university',
}

function normalize(name) {
  const base = name
    .toLowerCase()
    .replace(/^the\s+/, '')
    .replace(/[.,]/g, '')
    // Scorecard separates "University of California" from the campus name
    // with a hyphen, not a comma — the comma is already stripped above, so
    // match either a hyphen or whitespace here (both sides funnel through
    // this same function, so it's applied uniformly).
    .replace(/\buniversity of california[\s-]+/, 'uc ')
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
