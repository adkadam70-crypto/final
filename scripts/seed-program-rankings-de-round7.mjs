// Seventh Germany program-ranking pass. Only the rows a batch explicitly
// marked "(Exact)" were considered — the same batch's "(Est. from band)"
// rows were rejected wholesale: taking the mathematical median of a
// published band (e.g. "401-450" -> 425) and presenting it as a specific
// sourced rank is a fabricated citation, not a real data point, no
// different in kind from the "Bonn Computer Science 95" fabrication caught
// earlier this session.
//
// Leibniz Hannover, TU Dortmund, and Potsdam's exact claims were verified
// via WebFetch and matched precisely. Fetching TU Dortmund's actual page
// also surfaced two more real exact numbers not in the batch (Biological
// Sciences, Physics) — added those too. Goethe Frankfurt's two claims
// (Philosophy, Law) were dropped: the cited page 403'd on every fetch
// attempt this session, and Philosophy specifically already has a
// conflicting number (#38 vs #45) from an earlier round that was never
// resolved.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-de-round7.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank) {
  return Math.max(10, Math.min(99, Math.round(100 - (rank - 1) * 0.15)))
}

const YOCKET_DORTMUND = 'https://yocket.com/universities/technical-university-of-dortmund-2906/rankings'

const DATA = [
  [
    'Leibniz University Hannover',
    'Science & Technology / Research',
    248,
    'QS World University Rankings by Subject 2024 — Natural Sciences',
    'https://yocket.com/universities/leibniz-university-of-hannover-2894/rankings',
    'World subject rank — programSelectivity is our own derived scale for comparability, not itself a published figure.',
  ],
  ['TU Dortmund University', 'Architecture & Design', 201, 'QS World University Rankings by Subject 2024 — Architecture', YOCKET_DORTMUND, 'World subject rank.'],
  [
    'TU Dortmund University',
    'Engineering',
    251,
    'QS World University Rankings by Subject 2024 — Mechanical and Aeronautical Engineering',
    YOCKET_DORTMUND,
    'World rank for the narrower Mechanical/Aeronautical Engineering subject specifically.',
  ],
  [
    'TU Dortmund University',
    'Engineering',
    313,
    'QS World University Rankings by Subject 2024 — Engineering (general)',
    YOCKET_DORTMUND,
    'World subject rank.',
  ],
  ['TU Dortmund University', 'Mathematics & Statistics', 401, 'QS World University Rankings by Subject 2024 — Mathematics', YOCKET_DORTMUND, 'World subject rank.'],
  ['TU Dortmund University', 'Computer Science & IT', 251, 'THE World University Rankings by Subject 2024 — Computer Science', YOCKET_DORTMUND, 'World subject rank.'],
  ['TU Dortmund University', 'Biology & Life Sciences', 601, 'QS World University Rankings by Subject 2024 — Biological Sciences', YOCKET_DORTMUND, 'World subject rank.'],
  ['TU Dortmund University', 'Science & Technology / Research', 251, 'QS World University Rankings by Subject 2024 — Physics', YOCKET_DORTMUND, 'World subject rank.'],
  [
    'University of Potsdam',
    'Science & Technology / Research',
    302,
    'QS World University Rankings by Subject 2025 — Natural Sciences',
    'https://www.collegebatch.com/study-abroad/713-university-of-potsdam-in-potsdam-brandenburg-germany',
    'World subject rank.',
  ],
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
