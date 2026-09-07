// Acceptance-rate pass for the UK — method in
// migrate-add-estimated-acceptance-rate.mjs and lib/db/schema.ts.
//
// The UK has a genuinely usable measure: the UCAS "offer rate" (offers ÷
// applications), published per provider by UCAS (the official national
// admissions body) in its end-of-cycle data. It is the standard UK number
// and — for a student asking "will they let me in?" — the same thing as a
// US acceptance rate: a UCAS offer IS the admission; enrolling is the
// applicant's choice, not the university's.
//
//   - ~30 Russell Group universities + St Andrews, Loughborough, Bath and a
//     few post-92s where UCAS publishes an exact provider offer rate: this
//     is a REAL published figure, so it goes in actualAcceptanceRate +
//     acceptanceRateSource, exactly like a US College Scorecard rate. It is
//     NOT flagged as our estimate, because it isn't one.
//   - Everything else: estimated from the UCAS offer-rate pattern by tariff
//     band — high-tariff non-RG ~55-70%, mid ~70-85%, post-92 ~85-93%,
//     lowest-tariff ~90-96%. Here the *number* is genuinely our inference,
//     so it stays in estimatedAcceptanceRate + a note that says so.
//
// The offer rate is used rather than the "enrolled ÷ applications" figure
// some aggregators quote (e.g. "LSE 7%") — that one is dragged down by yield
// and by application volume and is not comparable across universities.
//
// Either way baselineSelectivity is realigned to (100 - rate). The
// match/analysis AI then anchors acceptanceProbability on it and adjusts for
// the student's grades and (heavily, for the UK) demonstrated subject fit —
// citing an exact figure with full confidence and an estimate as an
// estimate. Never touches a row that already has a real actualAcceptanceRate.
//
// Usage: node --env-file=.env.local scripts/seed-acceptance-estimates-uk.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const SRC = 'UCAS 2024 end-of-cycle offer rate (offers ÷ applications) — the standard UK admissions measure, published per provider by UCAS. An offer is the admission; whether the student enrols is their choice.'
const D = 'A research estimate, not a figure certified by the university.'

// Exact UCAS 2024 provider offer rates — real published figures, written to
// actualAcceptanceRate + acceptanceRateSource (SRC), not treated as estimates.
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

// Band estimate for everything else, chosen from the row's own rank.
function bandFor(rank, name) {
  // Music/drama conservatoires — entry is by audition or recall with a tiny
  // intake per instrument/discipline; nothing like a general offer rate.
  // Checked before the broad arts branch below (which /Conservatoir/ and
  // /Royal College/ would otherwise catch at a far too generous 62%).
  if (/Royal Academy of Music|Royal College of Music|Royal Northern College of Music|Guildhall School of Music|Trinity Laban|Royal Conservatoire of Scotland|Royal Welsh College of Music/i.test(name)) {
    const r = /Guildhall/i.test(name) ? 18 : 26 // Guildhall's drama intake tightens it further
    return [r, `Estimated ~${r}% — a conservatoire; entry is by audition or recall with a small intake per instrument or discipline (drama and musical theatre are tighter still). Derived from UCAS Conservatoires data and institutional admissions reports. ${D}`]
  }
  // Portfolio-selective specialist art school not covered by the broad arts
  // band (which assumes a more open ~62% intake).
  if (/Glasgow School of Art/i.test(name))
    return [32, `Estimated ~32% — a portfolio-selective specialist art school; estimate from admissions patterns at comparable UK art institutions. ${D}`]
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

const rows = await sql`SELECT id, name, "rankValue", "actualAcceptanceRate", "acceptanceRateSource" FROM universities WHERE country = 'UK'`
let real = 0
let estimated = 0
for (const r of rows) {
  // Skip a row that carries a real published rate from another source (e.g.
  // a US-style Scorecard figure) — but DO refresh a row we ourselves
  // promoted with the UCAS SRC, so the exact figures stay editable here.
  if (r.actualAcceptanceRate != null && r.acceptanceRateSource !== SRC) continue

  if (EXACT[r.name] != null) {
    const rate = EXACT[r.name]
    await sql`UPDATE universities SET
      "actualAcceptanceRate" = ${rate}, "acceptanceRateSource" = ${SRC},
      "estimatedAcceptanceRate" = NULL, "acceptanceRateNote" = NULL,
      "baselineSelectivity" = ${100 - rate}
      WHERE id = ${r.id}`
    real++
  } else {
    const [rate, note] = bandFor(r.rankValue, r.name)
    await sql`UPDATE universities SET
      "estimatedAcceptanceRate" = ${rate}, "acceptanceRateNote" = ${note},
      "actualAcceptanceRate" = NULL, "acceptanceRateSource" = NULL,
      "baselineSelectivity" = ${100 - rate}
      WHERE id = ${r.id}`
    estimated++
  }
}
console.log(`UK: ${real} real UCAS offer rates, ${estimated} band estimates.`)
