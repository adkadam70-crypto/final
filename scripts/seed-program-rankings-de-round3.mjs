// Third program-ranking pass for Germany — THE World University Rankings by
// Subject 2025, ARWU/Shanghai Global Ranking of Academic Subjects 2025, and
// more QS World University Rankings by Subject 2026 entries. Every number
// here was independently verified via WebFetch against the cited official
// source page before insertion (TUM's own press release, uni-freiburg.de,
// tu-dresden.de, biorn.org's Heidelberg writeup) — banded ranks mentioned on
// those same pages (e.g. Freiburg's Education/Medicine/CS at 101-125, TU
// Dresden's Civil Engineering at 51-100) were deliberately left out.
//
// Where a university has two rows in the same field from the same broad
// source (e.g. Heidelberg's two ARWU Biology rows, TU Dresden's two QS
// Engineering rows), the rankSource string is made sub-subject-specific so
// it doesn't collide with the field+source dedupe check and silently get
// skipped.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-de-round3.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank) {
  return Math.max(15, Math.min(99, Math.round(100 - (rank - 1) * 0.42)))
}

const DATA = [
  // name, field, rank, source, url, note
  [
    'Technical University of Munich',
    'Computer Science & IT',
    14,
    'THE World University Rankings by Subject 2025 — Computer Science',
    'https://www.timeshighereducation.com/world-university-rankings/2025/subject-ranking/computer-science',
    'World subject rank — programSelectivity is our own derived scale for comparability, not itself a published figure.',
  ],
  [
    'Technical University of Munich',
    'Engineering',
    22,
    'THE World University Rankings by Subject 2025 — Engineering',
    'https://www.timeshighereducation.com/world-university-rankings/2025/subject-ranking/engineering',
    'World subject rank (distinct from the QS Mechanical/Aeronautical/Manufacturing Engineering rank also on file for this school).',
  ],
  [
    'Technical University of Munich',
    'Science & Technology / Research',
    19,
    'THE World University Rankings by Subject 2025 — Physical Sciences',
    'https://www.timeshighereducation.com/world-university-rankings/2025/subject-ranking/physical-sciences',
    'World subject rank for Physical Sciences (chemistry, physics, maths, environmental sciences).',
  ],
  [
    'University of Freiburg',
    'Biology & Life Sciences',
    70,
    'THE World University Rankings by Subject 2025 — Life Sciences',
    'https://uni-freiburg.de/en/the-world-university-rankings-by-subject-2025-the-university-of-freiburg-among-the-top-100-worldwide-twice/',
    'World subject rank.',
  ],
  [
    'University of Freiburg',
    'Humanities',
    80,
    'THE World University Rankings by Subject 2025 — Arts & Humanities',
    'https://uni-freiburg.de/en/the-world-university-rankings-by-subject-2025-the-university-of-freiburg-among-the-top-100-worldwide-twice/',
    'World subject rank.',
  ],
  [
    'Heidelberg University',
    'Medicine & Health Sciences',
    18,
    'ARWU Global Ranking of Academic Subjects 2025 — Clinical Medicine',
    'https://biorn.org/universitat-heidelberg-outstanding-placings-in-shanghai-ranking-of-academic-subjects/',
    'World subject rank — distinct from the QS Medicine rank also on file for this school.',
  ],
  [
    'Heidelberg University',
    'Biology & Life Sciences',
    39,
    'ARWU Global Ranking of Academic Subjects 2025 — Biological Sciences',
    'https://biorn.org/universitat-heidelberg-outstanding-placings-in-shanghai-ranking-of-academic-subjects/',
    'World subject rank.',
  ],
  [
    'Heidelberg University',
    'Biology & Life Sciences',
    44,
    'ARWU Global Ranking of Academic Subjects 2025 — Human Biological Sciences',
    'https://biorn.org/universitat-heidelberg-outstanding-placings-in-shanghai-ranking-of-academic-subjects/',
    'World subject rank for the narrower Human Biological Sciences subject specifically.',
  ],
  [
    'Free University of Berlin',
    'Political Science',
    37,
    'QS World University Rankings by Subject 2026 — Politics',
    'https://www.topuniversities.com/university-subject-rankings/politics?countries=de',
    'World subject rank — programSelectivity is our own derived scale for comparability, not itself a published figure.',
  ],
  [
    'TU Dresden',
    'Engineering',
    94,
    'QS World University Rankings by Subject 2026 — Engineering and Technology',
    'https://tu-dresden.de/ing/der-bereich/news/tud-weltweit-top-im-bereich-ingenieurwissenschaften-und-technologie-renommiertes-qs-ranking-weist-erneute-spitzenposition-aus',
    'World subject rank.',
  ],
  [
    'TU Dresden',
    'Engineering',
    35,
    'QS World University Rankings by Subject 2026 — Materials Science',
    'https://tu-dresden.de/ing/der-bereich/news/tud-weltweit-top-im-bereich-ingenieurwissenschaften-und-technologie-renommiertes-qs-ranking-weist-erneute-spitzenposition-aus',
    'World subject rank for the narrower Materials Science subject specifically.',
  ],
  [
    'TU Dresden',
    'Science & Technology / Research',
    100,
    'QS World University Rankings by Subject 2026 — Physics',
    'https://tu-dresden.de/ing/der-bereich/news/tud-weltweit-top-im-bereich-ingenieurwissenschaften-und-technologie-renommiertes-qs-ranking-weist-erneute-spitzenposition-aus',
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
