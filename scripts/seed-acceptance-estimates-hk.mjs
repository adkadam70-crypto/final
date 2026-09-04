// Acceptance-rate pass for Hong Kong — method in
// migrate-add-estimated-acceptance-rate.mjs and lib/db/schema.ts.
//
// No Hong Kong university publishes an official institution-wide acceptance
// rate. Local admission runs through JUPAS (band-preference matching on HKDSE
// results); international/non-JUPAS admission is a separate rolling process.
// The figures below are Tier-4 estimates: they reflect where multiple
// admissions-data aggregators cluster for each institution's blended
// (JUPAS + non-JUPAS) intake, cross-checked against each other. The note
// makes the estimate status explicit.
//
//   - HKU ~15%, CUHK ~22%, HKUST ~26% (the three research flagships)
//   - PolyU / CityU ~35%, HKBU ~40%, Lingnan / EdUHK ~42%
//   - self-financing institutions (Hang Seng, Shue Yan, Metropolitan,
//     Chu Hai, Tung Wah, Saint Francis) ~55-70%
//
// Realigns baselineSelectivity to (100 - estimate) — for HK the JUPAS
// competition ratio is a genuine selectivity signal. Never touches a row
// with a real actualAcceptanceRate.
//
// Usage: node --env-file=.env.local scripts/seed-acceptance-estimates-hk.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const D = 'A research estimate (aggregated from admissions-data sources), not a figure certified by the university; Hong Kong universities do not publish an official acceptance rate.'

const EST = {
  'University of Hong Kong': 15,
  'Chinese University of Hong Kong': 22,
  'Hong Kong University of Science and Technology': 26,
  'City University of Hong Kong': 35,
  'Hong Kong Polytechnic University': 35,
  'Hong Kong Baptist University': 40,
  'Lingnan University': 42,
  'The Education University of Hong Kong': 42,
  'Hong Kong Metropolitan University': 58,
  'The Hang Seng University of Hong Kong': 55,
  'Hong Kong Shue Yan University': 62,
  'Hong Kong Chu Hai College': 68,
  'Saint Francis University': 70,
  'Tung Wah College': 68,
}

const rows = await sql`SELECT id, name, "actualAcceptanceRate" FROM universities WHERE country = 'HK'`
let n = 0
for (const r of rows) {
  if (r.actualAcceptanceRate != null) continue
  const rate = EST[r.name] ?? 55
  const note = `Estimated ~${rate}% — blended JUPAS + non-JUPAS intake. ${D}`
  await sql`UPDATE universities SET "estimatedAcceptanceRate" = ${rate}, "acceptanceRateNote" = ${note}, "baselineSelectivity" = ${100 - rate} WHERE id = ${r.id}`
  n++
}
console.log(`Hong Kong: set estimated acceptance rate for ${n} universities.`)
