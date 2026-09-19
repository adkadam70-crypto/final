// Fourteenth Germany pass — WirtschaftsWoche (WiWo) HR-Manager Ranking
// 2024, a real German-specific recruiter-survey ranking, DISTINCT from
// the fabricated batch rejected in round13. That batch cited a paywalled
// URL with no visible content; this data was instead cross-verified
// across multiple independent real sources: LMU's own economics
// department press release, University of Cologne's own law faculty page,
// EBS University's own press release, a direct fetch of WiWo's real
// (non-paywalled) Jura and Informatik articles, and multiple converging
// WebSearch results giving matching percentages for the BWL (Business)
// top 10.
//
// One claim from the "corrected" batch was caught and dropped even after
// the resourcing improved: "Goethe University Frankfurt, Law, rank 5" —
// the real WiWo Jura article shows the actual #5/#6 spots went to Bonn and
// Bayreuth, not Goethe. Also dropped: "Freie Universität Berlin, Computer
// Science & IT, rank 5" (only the top 4 CS positions could be confirmed)
// and every Fachhochschule-specific Engineering claim (Electrical/
// Mechanical/Industrial for HTW Berlin, Reutlingen, Frankfurt UAS, etc.)
// — none of those specific numbers could be independently verified.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-de-round14-wiwo-verified.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank) {
  // Small country-specific top-10 pool (not a ~1000-school world list) — a
  // flatter, higher-floor scale than the world-subject-rank formula used
  // elsewhere in this file's siblings.
  return Math.max(60, Math.min(98, Math.round(98 - (rank - 1) * 3)))
}

const BWL_SRC = 'WirtschaftsWoche HR-Manager Ranking 2024 — Betriebswirtschaftslehre (BWL/Business)'
const BWL_URL = 'https://www.wiwo.de/erfolg/hochschule/hochschulranking-2024-das-sind-die-besten-unis-und-fhs-fuer-bwl-studenten/29850780.html'
const BWL_NOTE = 'Real German-specific HR-recruiter survey rank (483 HR managers surveyed), not a world-subject rank — programSelectivity is our own derived scale for comparability.'

const CS_SRC = 'WirtschaftsWoche HR-Manager Ranking 2024 — Informatik (Computer Science)'
const CS_URL = 'https://www.wiwo.de/erfolg/hochschule/hochschulranking-2024-das-sind-die-besten-unis-fuer-informatik-/29845466.html'
const CS_NOTE = 'Real German-specific HR-recruiter survey rank, not a world-subject rank — programSelectivity is our own derived scale for comparability.'

const LAW_SRC = 'WirtschaftsWoche HR-Manager Ranking 2024 — Jura (Law)'
const LAW_URL = 'https://www.wiwo.de/erfolg/hochschule/hochschulranking-2024-das-sind-die-besten-unis-fuer-jura/29850018.html'
const LAW_NOTE = 'Real German-specific HR-recruiter survey rank, not a world-subject rank — programSelectivity is our own derived scale for comparability.'

const DATA = [
  // Business (BWL) top 10 — universities
  ['Ludwig Maximilian University of Munich', 'Business', 1, BWL_SRC, BWL_URL, BWL_NOTE],
  ['Humboldt University of Berlin', 'Business', 2, BWL_SRC, BWL_URL, BWL_NOTE],
  ['Frankfurt School of Finance & Management', 'Business', 3, BWL_SRC, BWL_URL, BWL_NOTE],
  ['Free University of Berlin', 'Business', 4, BWL_SRC, BWL_URL, BWL_NOTE],
  ['Goethe University Frankfurt', 'Business', 5, BWL_SRC, BWL_URL, BWL_NOTE],
  ['University of Mannheim', 'Business', 6, BWL_SRC, BWL_URL, BWL_NOTE],
  ['University of Cologne', 'Business', 7, BWL_SRC, BWL_URL, BWL_NOTE],
  ['EBS University', 'Business', 8, BWL_SRC, BWL_URL, BWL_NOTE],
  ['RWTH Aachen University', 'Business', 9, BWL_SRC, BWL_URL, BWL_NOTE],
  ['University of Hamburg', 'Business', 10, BWL_SRC, BWL_URL, BWL_NOTE],

  // Computer Science & IT — confirmed top 4 universities + top FH
  ['Technical University of Berlin', 'Computer Science & IT', 1, CS_SRC, CS_URL, CS_NOTE],
  ['Technical University of Munich', 'Computer Science & IT', 2, CS_SRC, CS_URL, CS_NOTE],
  ['RWTH Aachen University', 'Computer Science & IT', 3, CS_SRC, CS_URL, CS_NOTE],
  ['Humboldt University of Berlin', 'Computer Science & IT', 4, CS_SRC, CS_URL, CS_NOTE],
  ['HTW Berlin', 'Computer Science & IT', 1, CS_SRC, CS_URL, `${CS_NOTE} Rank is among Fachhochschulen/Universities of Applied Sciences specifically, a separate pool from the university ranks above.`],

  // Law (Jura) — confirmed top 4
  ['Ludwig Maximilian University of Munich', 'Law', 1, LAW_SRC, LAW_URL, LAW_NOTE],
  ['Humboldt University of Berlin', 'Law', 2, LAW_SRC, LAW_URL, LAW_NOTE],
  ['Free University of Berlin', 'Law', 3, LAW_SRC, LAW_URL, LAW_NOTE],
  ['University of Cologne', 'Law', 4, LAW_SRC, LAW_URL, LAW_NOTE],
]

let inserted = 0
const skipped = []

for (const [name, field, rank, source, url, note] of DATA) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'DE'`
  if (rows.length === 0) {
    skipped.push(`${name} (${field})`)
    continue
  }
  const universityId = rows[0].id
  const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${universityId} AND field = ${field} AND "rankSource" = ${source}`
  if (existing.length > 0) continue

  await sql`
    INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (${universityId}, ${field}, ${rank}, ${source}, ${url}, ${selectivityFromRank(rank)}, ${note})
  `
  inserted++
}

console.log(`Inserted ${inserted} program-ranking rows.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
