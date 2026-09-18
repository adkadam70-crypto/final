// First real program-ranking pass for Germany. Germany turned out to have
// no broad numeric-friendly public source the way College Factual (US) or
// NIRF (India) do: CHE (Germany's own domestic ranking, published with
// DIE ZEIT) is explicitly multidimensional by design — it deliberately
// does NOT combine criteria into a single score/rank, so it can't populate
// a rankValue field at all. QS/THE subject rankings DO publish real
// numeric world ranks, but only cover Germany's ~30-50 globally competitive
// research universities (often in wide bands like "101-150" for the rest),
// not the long tail of Fachhochschulen that make up most of the 441 DE
// schools in this catalog. This round seeds the precise (non-banded)
// numeric data points found via research — a real but modest start,
// not comprehensive coverage the way US/India now have.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-de-qs-subject.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank) {
  // QS subject ranks here are WORLD ranks (~1400+ ranked universities
  // globally), not a curated ~50-150 school pool like the US-News-style
  // lists used elsewhere — the standard formula would floor near-instantly.
  // Scaled against a ~200-rank "meaningfully selective" ceiling instead.
  return Math.max(15, Math.min(99, Math.round(100 - (rank - 1) * 0.42)))
}

const SOURCE = 'QS World University Rankings by Subject 2026'
const NOTE = 'World subject rank (not a country-specific pool) — programSelectivity here is our own derived scale for comparability with other rankings, not itself a published figure.'

const DATA = [
  ['Heidelberg University', 'Medicine & Health Sciences', 36, 'https://www.topuniversities.com/university-subject-rankings/medicine'],
  ['Ludwig Maximilian University of Munich', 'Medicine & Health Sciences', 43, 'https://www.topuniversities.com/university-subject-rankings/medicine'],
  ['Charité – Universitätsmedizin Berlin', 'Medicine & Health Sciences', 51, 'https://www.topuniversities.com/university-subject-rankings/medicine'],
  ['Humboldt University of Berlin', 'Law', 37, 'https://www.topuniversities.com/university-subject-rankings/law-legal-studies'],
  ['Ludwig Maximilian University of Munich', 'Law', 42, 'https://www.topuniversities.com/university-subject-rankings/law-legal-studies'],
  ['University of Mannheim', 'Business', 105, 'https://www.topuniversities.com/university-subject-rankings/business-management-studies'],
]

let inserted = 0
const skipped = []

for (const [name, field, rank, url] of DATA) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'DE'`
  if (rows.length === 0) {
    skipped.push(`${name} (${field})`)
    continue
  }
  const universityId = rows[0].id
  const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${universityId} AND field = ${field} AND "rankSource" = ${SOURCE}`
  if (existing.length > 0) continue

  await sql`
    INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (${universityId}, ${field}, ${rank}, ${SOURCE}, ${url}, ${selectivityFromRank(rank)}, ${NOTE})
  `
  inserted++
}

console.log(`Inserted ${inserted} program-ranking rows.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
