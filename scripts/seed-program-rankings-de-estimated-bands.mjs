// Adds the "estimated from a published band" rows that earlier rounds
// this session deliberately excluded (Goethe Frankfurt, Leibniz Hannover,
// Ruhr Bochum, Bayreuth, Potsdam) — but transparently, not silently. Each
// rankSource string here has "(estimated from band X–Y)" baked directly
// into it, which the UI surfaces as the hover-tooltip source citation on
// the rank badge (see components/university-card.tsx) — so a user sees
// exactly that this is a derived midpoint, not a number the ranking body
// itself published, the same honesty pattern the schema already uses for
// estimatedAcceptanceRate/acceptanceRateNote.
//
// The rankValue is the arithmetic median of the published band (e.g.
// 101-150 -> 125). This is real information (a school's real
// rank sits somewhere in a real published band) presented at reduced
// precision, not an invented number — the distinction from the earlier
// "Bonn Computer Science 95" fabrication is that this batch's actual bands
// were confirmed real, and we're now labeling the derived figure as such
// rather than dressing it up as an exact published rank.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-de-estimated-bands.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank) {
  return Math.max(10, Math.min(90, Math.round(95 - (rank - 1) * 0.15)))
}

const NOTE = 'programSelectivity is our own derived scale for comparability, not itself a published figure. Rank value is the midpoint of the published band, not an exact figure the ranking body itself published.'

const DATA = [
  ['Goethe University Frankfurt', 'Political Science', 88, 'ARWU Global Ranking of Academic Subjects 2025 — Political Science (estimated from band 76–100)', 'https://www.shanghairanking.com/rankings/gras/2025/RS0301'],
  ['Goethe University Frankfurt', 'Finance', 125, 'ARWU Global Ranking of Academic Subjects 2025 — Finance (estimated from band 101–150)', 'https://www.shanghairanking.com/rankings/gras/2025/RS0503'],
  ['Goethe University Frankfurt', 'Humanities', 138, 'THE World University Rankings by Subject 2026 — Arts & Humanities (estimated from band 126–150)', 'https://www.timeshighereducation.com/world-university-rankings/2026/subject-ranking/arts-and-humanities'],

  ['Leibniz University Hannover', 'Engineering', 225, 'THE World University Rankings by Subject 2026 — Engineering (estimated from band 201–250)', 'https://www.timeshighereducation.com/world-university-rankings/2026/subject-ranking/engineering'],
  ['Leibniz University Hannover', 'Engineering', 275, 'QS World University Rankings by Subject 2024 — Materials Science (estimated from band 251–300)', 'https://yocket.com/universities/leibniz-university-of-hannover-2894/rankings'],
  ['Leibniz University Hannover', 'Economics', 425, 'QS World University Rankings by Subject 2024 — Economics (estimated from band 401–450)', 'https://yocket.com/universities/leibniz-university-of-hannover-2894/rankings'],

  ['Ruhr University Bochum', 'Mathematics & Statistics', 63, 'ARWU Global Ranking of Academic Subjects 2026 — Statistics (estimated from band 51–75)', 'https://www.shanghairanking.com/universities/university-of-bochum'],
  ['Ruhr University Bochum', 'Engineering', 88, 'ARWU Global Ranking of Academic Subjects 2026 — Metallurgical Engineering (estimated from band 76–100)', 'https://www.shanghairanking.com/universities/university-of-bochum'],
  ['Ruhr University Bochum', 'Psychology', 88, 'ARWU Global Ranking of Academic Subjects 2026 — Psychology (estimated from band 76–100)', 'https://www.shanghairanking.com/universities/university-of-bochum'],
  ['Ruhr University Bochum', 'Engineering', 125, 'ARWU Global Ranking of Academic Subjects 2026 — Telecommunication Engineering (estimated from band 101–150)', 'https://www.shanghairanking.com/universities/university-of-bochum'],
  ['Ruhr University Bochum', 'Science & Technology / Research', 175, 'ARWU Global Ranking of Academic Subjects 2026 — Chemistry (estimated from band 151–200)', 'https://www.shanghairanking.com/universities/university-of-bochum'],

  ['University of Bayreuth', 'Environmental Science & Sustainability', 125, 'ARWU Global Ranking of Academic Subjects 2025 — Earth Sciences (estimated from band 101–150)', 'https://collegedunia.com/germany/university/629-university-of-bayreuth-bayreuth/ranking'],
  ['University of Bayreuth', 'Business', 163, 'THE World University Rankings by Subject 2026 — Business and Economics (estimated from band 151–175)', 'https://collegedunia.com/germany/university/629-university-of-bayreuth-bayreuth/ranking'],
  ['University of Bayreuth', 'Engineering', 275, 'THE World University Rankings by Subject 2026 — Engineering (estimated from band 251–300)', 'https://collegedunia.com/germany/university/629-university-of-bayreuth-bayreuth/ranking'],

  ['University of Potsdam', 'Political Science', 88, 'ARWU Global Ranking of Academic Subjects 2024 — Public Administration (estimated from band 76–100)', 'https://www.collegebatch.com/study-abroad/713-university-of-potsdam-in-potsdam-brandenburg-germany'],
  ['University of Potsdam', 'Psychology', 113, 'THE World University Rankings by Subject 2025 — Psychology (estimated from band 101–125)', 'https://www.collegebatch.com/study-abroad/713-university-of-potsdam-in-potsdam-brandenburg-germany'],
  ['University of Potsdam', 'Education', 125, 'ARWU Global Ranking of Academic Subjects 2024 — Education (estimated from band 101–150)', 'https://www.collegebatch.com/study-abroad/713-university-of-potsdam-in-potsdam-brandenburg-germany'],
  ['University of Potsdam', 'Humanities', 163, 'THE World University Rankings by Subject 2025 — Arts & Humanities (estimated from band 151–175)', 'https://www.collegebatch.com/study-abroad/713-university-of-potsdam-in-potsdam-brandenburg-germany'],
  ['University of Potsdam', 'Biology & Life Sciences', 188, 'THE World University Rankings by Subject 2025 — Life Sciences (estimated from band 176–200)', 'https://www.collegebatch.com/study-abroad/713-university-of-potsdam-in-potsdam-brandenburg-germany'],
]

let inserted = 0
const skipped = []

for (const [name, field, rank, source, url] of DATA) {
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
    VALUES (${universityId}, ${field}, ${rank}, ${source}, ${url}, ${selectivityFromRank(rank)}, ${NOTE})
  `
  inserted++
}

console.log(`Inserted ${inserted} program-ranking rows.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
