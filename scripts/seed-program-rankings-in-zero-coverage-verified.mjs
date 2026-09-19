// Adds 7 verified rows targeting India's zero-coverage universities.
// XLRI, NIMHANS, and Manipal MCODS confirmed via official nirfindia.org /
// institutional pages directly. AMU, Jadavpur, Jamia Millia Islamia, and
// O.P. Jindal Global confirmed via independent news searches after their
// original cited sources (Times of India, Shiksha, Hindustan Times) were
// blocked from direct fetch — each claim corroborated by a fresh,
// independent search rather than trusted on the batch's word alone.
//
// Rejected from the same batch: IIIT-Delhi, Jamia Engineering, and
// Banasthali's Engineering claims (all cited solely to a Scribd document
// that only shows a landing page, not readable content — same failure
// mode as two PDFs rejected in prior rounds). IIIT Bangalore's Engineering
// claim (its own page shows only 2021 data, not 2024). Koneru Lakshmaiah's
// two claims (cited solely to a Reddit thread this tool cannot fetch).
// RV College, BMS College, PES University, SASTRA, DAIICT, Indian
// Statistical Institute, and University of Calcutta's claims all rested on
// low-tier SEO aggregator sites (collegechoice.in, getintocampus.com,
// indeduconsultancy.com, freejobalert.com, betterstudy.in) that were not
// independently verified this round.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-in-zero-coverage-verified.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize = 100) {
  return Math.max(20, Math.min(97, Math.round(97 - (rank - 1) * (77 / poolSize))))
}

const DATA = [
  [
    'Xavier Labour Relations Institute (XLRI)',
    'Business',
    9,
    'NIRF (National Institutional Ranking Framework) 2024 — Management category',
    'https://www.nirfindia.org/Rankings/2024/ManagementRanking.html',
    'NIRF 2024 Management-category rank, confirmed directly against the official nirfindia.org page.',
  ],
  [
    'National Institute of Mental Health and Neurosciences',
    'Medicine & Health Sciences',
    4,
    'NIRF (National Institutional Ranking Framework) 2024 — Medical category',
    'https://www.nirfindia.org/Rankings/2024/MedicalRanking.html',
    'NIRF 2024 Medical-category rank, confirmed directly against the official nirfindia.org page.',
  ],
  [
    'Manipal Academy of Higher Education',
    'Medicine & Health Sciences',
    2,
    'NIRF (National Institutional Ranking Framework) 2024 — Dental category',
    'https://www.manipal.edu/mcods-manipal/about-mcods/ranking.html',
    'NIRF 2024 Dental-category rank (Manipal College of Dental Sciences), confirmed directly against the institution\'s own page — shown under our broader Medicine & Health Sciences field.',
  ],
  [
    'Aligarh Muslim University',
    'Medicine & Health Sciences',
    18,
    'NIRF (National Institutional Ranking Framework) 2024 — Dental category',
    'https://medicaldialogues.in/news/education/nirf-2024-here-are-ups-medical-dental-colleges-this-year-133989',
    'NIRF 2024 Dental-category rank — bonus find alongside the Medical rank confirmed for this school. AMU already had a Medical row from an earlier round; this adds the separate Dental category.',
  ],
  [
    'Jadavpur University',
    'Engineering',
    12,
    'NIRF (National Institutional Ranking Framework) 2024 — Engineering category',
    'https://www.shiksha.com/news/engineering-jadavpur-university-slipped-to-12th-rank-in-nirf-engineering-ranking-check-ranking-in-other-categories-blogId-174991',
    'NIRF 2024 Engineering-category rank, confirmed via independent search after the direct URL was blocked from fetching.',
  ],
  [
    'Jamia Millia Islamia',
    'Medicine & Health Sciences',
    8,
    'NIRF (National Institutional Ranking Framework) 2024 — Dental category',
    'https://timesofindia.indiatimes.com/education/news/nirf-2024-check-the-top-10-dental-colleges-of-india/articleshow/112516637.cms',
    'NIRF 2024 Dental-category rank, confirmed via independent search after the direct URL was blocked from fetching.',
  ],
  [
    'O.P. Jindal Global University',
    'Law',
    72,
    'QS World University Rankings by Subject 2024 — Law and Legal Studies',
    'https://www.hindustantimes.com/education/news/qs-world-university-rankings-o-p-jindal-global-university-ranked-number-one-law-school-in-india-72nd-globally-101712924419869.html',
    'World subject rank (also #1 in India, per the same source) — first real data point for this university.',
  ],
]

let inserted = 0
const skipped = []

for (const [name, field, rank, source, url, note] of DATA) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'IN'`
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
