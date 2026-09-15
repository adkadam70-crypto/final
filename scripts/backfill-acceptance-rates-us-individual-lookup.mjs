// For each US university still missing an acceptance rate, queries College
// Scorecard directly BY NAME (not the bulk predominant=2/3 pulls used
// before) — catches real schools Scorecard has data for for reasons other
// than bachelor's/associate's predominance (e.g. predominant=0/1/4). Only
// writes a real, non-null admission_rate Scorecard actually reports —
// schools with no reported rate are left alone, not guessed.
//
// Usage: node --env-file=.env.local scripts/backfill-acceptance-rates-us-individual-lookup.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)
const API_KEY = process.env.SCORECARD_API_KEY
const RATE_SOURCE = 'U.S. Department of Education College Scorecard (2024-25 data, direct name lookup)'

if (!API_KEY) {
  console.error('Set SCORECARD_API_KEY')
  process.exit(1)
}

const STOP = new Set(['the', 'of', 'and', 'at', 'a', '&', 'main', 'campus'])
function tokens(s) {
  return new Set(
    s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((t) => t && !STOP.has(t)),
  )
}
function similarity(a, b) {
  const ta = tokens(a), tb = tokens(b)
  if (ta.size === 0 || tb.size === 0) return 0
  let inter = 0
  for (const t of ta) if (tb.has(t)) inter++
  return inter / Math.min(ta.size, tb.size)
}

async function lookupScorecard(name) {
  const url = `https://api.data.gov/ed/collegescorecard/v1/schools?api_key=${API_KEY}&school.name=${encodeURIComponent(name)}&fields=school.name,latest.admissions.admission_rate.overall`
  const res = await fetch(url)
  if (!res.ok) return null
  const data = await res.json()
  const results = data.results || []
  // Best fuzzy-matched result that also has a real (non-null) admission rate.
  let best = null
  let bestScore = 0
  for (const r of results) {
    const rate = r['latest.admissions.admission_rate.overall']
    if (rate === null || rate === undefined) continue
    const score = similarity(name, r['school.name'])
    if (score > bestScore) {
      bestScore = score
      best = { name: r['school.name'], rate }
    }
  }
  return bestScore >= 0.7 ? best : null
}

const rows = await sql`
  SELECT id, name FROM universities
  WHERE country = 'US' AND "actualAcceptanceRate" IS NULL AND "estimatedAcceptanceRate" IS NULL
  ORDER BY name
`

console.log(`Checking ${rows.length} schools individually against Scorecard...`)

let updated = 0
let noData = 0

for (const row of rows) {
  let match
  try {
    match = await lookupScorecard(row.name)
  } catch (e) {
    console.log(`  Error on "${row.name}": ${e.message}`)
    await new Promise((r) => setTimeout(r, 200))
    continue
  }
  if (match) {
    const acceptanceRate = Math.round(match.rate * 100)
    const baselineSelectivity = 100 - acceptanceRate
    await sql`
      UPDATE universities
      SET "actualAcceptanceRate" = ${acceptanceRate},
          "acceptanceRateSource" = ${RATE_SOURCE},
          "baselineSelectivity" = ${baselineSelectivity}
      WHERE id = ${row.id}
    `
    updated++
    console.log(`  MATCHED: ${row.name} -> ${match.name} @ ${acceptanceRate}%`)
  } else {
    noData++
  }
  await new Promise((r) => setTimeout(r, 200))
}

console.log(`\nUpdated ${updated} schools with real Scorecard data.`)
console.log(`${noData} schools have no admission-rate data in Scorecard at all (left as-is).`)
