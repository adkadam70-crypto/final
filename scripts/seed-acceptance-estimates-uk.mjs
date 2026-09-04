// Acceptance-rate pass for the UK — method in
// migrate-add-estimated-acceptance-rate.mjs and lib/db/schema.ts.
//
// The UK has a genuinely usable measure: the UCAS "offer rate" (offers ÷
// applications), published per provider by UCAS (the official national
// admissions body) in its end-of-cycle data. It is the standard UK number
// and the closest equivalent to a US acceptance rate — so every UK row gets
// an ESTIMATE here, none is Tier 5.
//
//   - 24 Russell Group universities + St Andrews, Loughborough, Bath and a
//     few post-92s: the exact UCAS 2024 offer rate (or the widely-reported
//     figure). Source: UCAS 2024 end-of-cycle provider data, as compiled by
//     The Tab / Save the Student / university admissions pages.
//   - Everything else: estimated from the UCAS offer-rate pattern by tariff
//     band — high-tariff non-RG ~55-70%, mid ~70-85%, post-92 ~85-93%,
//     lowest-tariff ~90-96%. The note says it is a band estimate.
//
// The offer rate is used rather than the "enrolled ÷ applications" figure
// some aggregators quote (e.g. "LSE 7%") — that one is dragged down by yield
// and by application volume and is not comparable across universities.
//
// Handled exactly like every other country's estimate and like a US
// actualAcceptanceRate: estimatedAcceptanceRate is set and baselineSelectivity
// is realigned to (100 - estimate). The match/analysis AI then anchors
// acceptanceProbability on it and adjusts proportionately for the student's
// grades, tests and (heavily, for the UK) demonstrated subject fit — the
// UK country context already tells it to weight academics ~85%. Never
// touches a row with a real actualAcceptanceRate.
//
// Usage: node --env-file=.env.local scripts/seed-acceptance-estimates-uk.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const SRC = 'UCAS 2024 end-of-cycle offer rate (offers ÷ applications) — the standard UK admissions measure, published per provider by UCAS.'
const D = 'A research estimate, not a figure certified by the university.'

// Exact / well-reported UCAS 2024 offer rates.
const EXACT = {
  'University of Oxford': 20, 'London School of Economics': 21, 'University of Cambridge': 25,
  'Imperial College London': 33, 'University College London': 35, 'University of Edinburgh': 44,
  "King's College London": 44, 'University of Manchester': 58, 'University of Leeds': 60,
  'Queen Mary University of London': 65, 'University of Glasgow': 67, 'University of Bristol': 68,
  'Durham University': 68, 'University of Birmingham': 70, 'University of Nottingham': 70,
  'University of Warwick': 71, 'University of Liverpool': 73, 'Cardiff University': 73,
  "Queen's University Belfast": 74, 'University of Southampton': 77, 'University of Sheffield': 78,
  'University of York': 79, 'Newcastle University': 80, 'University of Exeter': 85,
  'University of St Andrews': 27, 'Loughborough University': 72, 'University of Bath': 62,
  'Northumbria University': 91, 'Nottingham Trent University': 91, 'Coventry University': 88,
}
const EXACT_NOTE = (r) => `Estimated ~${r}% — ${SRC} ${D}`

// Band estimate for everything else, chosen from the row's own rank.
function bandFor(rank, name) {
  // arts/specialist schools admit largely on portfolio/audition
  if (/\bArts\b|Conservatoir|Royal Agricultural|Royal College|Norwich University of the Arts|Leeds Arts|Arts University/i.test(name))
    return [62, `Estimated ~62% — a specialist arts/creative institution; admission is largely portfolio- or audition-based. Derived from UCAS offer-rate patterns for UK specialist providers. ${D}`]
  if (rank == null) return [80, `Estimated ~80% — no UCAS offer rate on file for this provider; a mid-band estimate from the UK offer-rate pattern. ${D}`]
  if (rank <= 10) return [45, `Estimated ~45% — a high-tariff UK university; band estimate from the UCAS 2024 offer-rate pattern for comparably selective providers. ${D}`]
  if (rank <= 25) return [62, `Estimated ~62% — an upper-mid-tariff UK university; band estimate from the UCAS 2024 offer-rate pattern for comparably ranked providers. ${D}`]
  if (rank <= 45) return [74, `Estimated ~74% — a mid-tariff UK university; band estimate from the UCAS 2024 offer-rate pattern for comparably ranked providers. ${D}`]
  if (rank <= 75) return [85, `Estimated ~85% — a lower-mid-tariff UK university (mostly post-92); band estimate from the UCAS 2024 offer-rate pattern for comparably ranked providers. ${D}`]
  return [92, `Estimated ~92% — a lower-tariff UK university; band estimate from the UCAS 2024 offer-rate pattern for comparably ranked providers. ${D}`]
}

const rows = await sql`SELECT id, name, "rankValue", "actualAcceptanceRate" FROM universities WHERE country = 'UK'`
let n = 0
for (const r of rows) {
  if (r.actualAcceptanceRate != null) continue
  let rate, note
  if (EXACT[r.name] != null) { rate = EXACT[r.name]; note = EXACT_NOTE(rate) }
  else { [rate, note] = bandFor(r.rankValue, r.name) }
  await sql`UPDATE universities SET "estimatedAcceptanceRate" = ${rate}, "acceptanceRateNote" = ${note}, "baselineSelectivity" = ${100 - rate} WHERE id = ${r.id}`
  n++
}
console.log(`UK: set estimated acceptance rate for ${n} universities.`)
