// Final batch closing out the 57 India institution-level-only universities:
// adds genuine subject-specific data for the last 6 that had none, and fixes
// one real institution-level data error found while researching (D. Y.
// Patil University, Navi Mumbai had a rank that actually belongs to the
// Pune campus of the same name — a name-collision false match from earlier
// research).
//
// Every figure below was confirmed via direct WebFetch of the cited URL
// (not just a search snippet), except SASTRA Law (11th) and D. Y. Patil
// Navi Mumbai's Engineering band, which were cross-referenced across
// multiple independent search results per the site's verification standard.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-in-remaining6-round1.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

// National-category NIRF ranks (Engineering/Law/Pharmacy/Management/Medical/
// Dental), typically out of 200-300 ranked institutions — same formula used
// throughout the India NIRF batches this session.
function selectivityNational(rank) {
  return Math.max(10, Math.min(90, Math.round(95 - (rank - 1) * 0.15)))
}
// The Week's subject-specific Best Colleges lists (Arts/Commerce/Science),
// each only ~10-50 colleges deep, so a much steeper curve so top ranks
// don't all clamp to the same ceiling.
function selectivityCollegeList(rank) {
  return Math.max(10, Math.min(99, Math.round(100 - (rank - 1) * 1.6)))
}

const BAND_NOTE = (band) =>
  `Rank is an estimate: derived as the midpoint of NIRF 2025's published "${band}" band for this category, which is itself real and verified — not a precise single figure. programSelectivity is our own derived scale for comparability.`

const ROWS = [
  // ---- SASTRA Deemed University (id=392) ----
  {
    universityId: 392,
    field: 'Engineering',
    rankValue: 40,
    rankSource: 'NIRF (National Institutional Ranking Framework) 2025 — Engineering category',
    rankSourceUrl: 'https://www.collegesearch.in/articles/nirf-shanmugha-arts-science-technology--research-academy-rank-40-engineering-2025',
    programSelectivity: selectivityNational(40),
    notes: null,
  },
  {
    universityId: 392,
    field: 'Law',
    rankValue: 11,
    rankSource: 'NIRF (National Institutional Ranking Framework) 2025 — Law category',
    rankSourceUrl: 'https://law.careers360.com/articles/nirf-2025-law-rankings-a-look-at-top-law-colleges-and-their-placements',
    programSelectivity: selectivityNational(11),
    notes: 'Cross-referenced across multiple independent sources (not a single primary fetch); SASTRA is cited as the best-ranked private law college in Tamil Nadu at this position.',
  },
  // ---- GITAM (Deemed to be University) (id=444) — official GITAM announcement ----
  {
    universityId: 444,
    field: 'Medicine & Health Sciences',
    rankValue: 33,
    rankSource: 'NIRF (National Institutional Ranking Framework) 2025 — Pharmacy category',
    rankSourceUrl: 'https://x.com/GITAMUniversity/status/1972892596126249436',
    programSelectivity: selectivityNational(33),
    notes: 'NIRF ranks this as "Pharmacy" — mapped here to Medicine & Health Sciences since Pharmacy has no dedicated ACADEMIC_FIELDS bucket.',
  },
  {
    universityId: 444,
    field: 'Law',
    rankValue: 38,
    rankSource: 'NIRF (National Institutional Ranking Framework) 2025 — Law category',
    rankSourceUrl: 'https://x.com/GITAMUniversity/status/1972892596126249436',
    programSelectivity: selectivityNational(38),
    notes: null,
  },
  {
    universityId: 444,
    field: 'Business',
    rankValue: 113,
    rankSource: 'NIRF (National Institutional Ranking Framework) 2025 — Management category (estimated from band 101–125)',
    rankSourceUrl: 'https://x.com/GITAMUniversity/status/1972892596126249436',
    programSelectivity: selectivityNational(113),
    notes: BAND_NOTE('101-125'),
  },
  {
    universityId: 444,
    field: 'Engineering',
    rankValue: 125,
    rankSource: 'NIRF (National Institutional Ranking Framework) 2025 — Engineering category (estimated from band 101–150)',
    rankSourceUrl: 'https://x.com/GITAMUniversity/status/1972892596126249436',
    programSelectivity: selectivityNational(125),
    notes: BAND_NOTE('101-150'),
  },
  // ---- Sri Balaji Vidyapeeth (id=482) — official SBV press release ----
  {
    universityId: 482,
    field: 'Medicine & Health Sciences',
    rankValue: 23,
    rankSource: 'NIRF (National Institutional Ranking Framework) 2025 — Dental category (Mahatma Gandhi P.G. Institute of Dental Sciences)',
    rankSourceUrl: 'https://sbvu.ac.in/sbvpress/fourth-ranked-jipmer-mgmcri-in-nirfs-top-50-medical-colleges/',
    programSelectivity: selectivityNational(23),
    notes: 'Rank is for SBV\'s constituent dental institute, Mahatma Gandhi P.G. Institute of Dental Sciences, not the parent university as a single entity.',
  },
  {
    universityId: 482,
    field: 'Medicine & Health Sciences',
    rankValue: 42,
    rankSource: 'NIRF (National Institutional Ranking Framework) 2025 — Medical category (Mahatma Gandhi Medical College and Research Institute)',
    rankSourceUrl: 'https://sbvu.ac.in/sbvpress/fourth-ranked-jipmer-mgmcri-in-nirfs-top-50-medical-colleges/',
    programSelectivity: selectivityNational(42),
    notes: 'Rank is for SBV\'s constituent medical college, MGMCRI, not the parent university as a single entity. A second, higher-selectivity Dental-category row also exists for this university/field — the match query surfaces whichever has higher programSelectivity.',
  },
  // ---- D. Y. Patil University, Navi Mumbai (id=414) ----
  {
    universityId: 414,
    field: 'Engineering',
    rankValue: 250,
    rankSource: 'NIRF (National Institutional Ranking Framework) 2025 — Engineering category (estimated from band 201–300)',
    rankSourceUrl: 'https://www.careers360.com/university/dr-dy-patil-university-navi-mumbai',
    programSelectivity: selectivityNational(250),
    notes: BAND_NOTE('201-300'),
  },
  // ---- Hindu College, Delhi (id=252) — The Week 2025 Best Colleges ----
  {
    universityId: 252,
    field: 'Arts',
    rankValue: 3,
    rankSource: "The Week 2025 Best Colleges in India — Arts category",
    rankSourceUrl: 'https://www.admissionson.com/the-week-best-colleges-in-india-2025/',
    programSelectivity: selectivityCollegeList(3),
    notes: 'A separate, genuinely subject-differentiated ranking (distinct methodology from NIRF\'s single "College" category) — not to be confused with this college\'s NIRF institution-level rank of 1.',
  },
  {
    universityId: 252,
    field: 'Accounting',
    rankValue: 4,
    rankSource: "The Week 2025 Best Colleges in India — Commerce category (mapped to Accounting)",
    rankSourceUrl: 'https://www.admissionson.com/the-week-best-colleges-in-india-2025/',
    programSelectivity: selectivityCollegeList(4),
    notes: '"Commerce" is mapped to Accounting, matching this dataset\'s established convention for undergraduate commerce programs.',
  },
  {
    universityId: 252,
    field: 'Science & Technology / Research',
    rankValue: 6,
    rankSource: "The Week 2025 Best Colleges in India — Science category",
    rankSourceUrl: 'https://www.admissionson.com/the-week-best-colleges-in-india-2025/',
    programSelectivity: selectivityCollegeList(6),
    notes: null,
  },
  // ---- St. Stephen's College, Delhi (id=124) — The Week 2025 Best Colleges ----
  {
    universityId: 124,
    field: 'Arts',
    rankValue: 2,
    rankSource: "The Week 2025 Best Colleges in India — Arts category",
    rankSourceUrl: 'https://www.admissionson.com/the-week-best-colleges-in-india-2025/',
    programSelectivity: selectivityCollegeList(2),
    notes: 'A separate, genuinely subject-differentiated ranking (distinct methodology from NIRF\'s single "College" category) — not to be confused with this college\'s NIRF institution-level rank of 5.',
  },
  {
    universityId: 124,
    field: 'Science & Technology / Research',
    rankValue: 1,
    rankSource: "The Week 2025 Best Colleges in India — Science category",
    rankSourceUrl: 'https://www.admissionson.com/the-week-best-colleges-in-india-2025/',
    programSelectivity: selectivityCollegeList(1),
    notes: null,
  },
]

let inserted = 0
for (const row of ROWS) {
  const existing = await sql`
    SELECT id FROM "programRankings"
    WHERE "universityId" = ${row.universityId} AND field = ${row.field} AND "rankSource" = ${row.rankSource}
  `
  if (existing.length > 0) continue
  await sql`
    INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (${row.universityId}, ${row.field}, ${row.rankValue}, ${row.rankSource}, ${row.rankSourceUrl}, ${row.programSelectivity}, ${row.notes})
  `
  inserted++
}
console.log(`Inserted ${inserted}/${ROWS.length} program-ranking rows.`)

// Fix the D. Y. Patil University, Navi Mumbai institution-level rank: 41 was
// a false match belonging to the Pune campus (Dr. D. Y. Patil Vidyapeeth),
// a different, separate institution. Confirmed #91 via two independent
// direct fetches (collegedekho.com, careers360.com's own aggregator text).
const fixResult = await sql`
  UPDATE universities
  SET "rankValue" = 91,
      "rankSource" = 'NIRF (National Institutional Ranking Framework) 2025 — Universities category'
  WHERE id = 414 AND name = 'D. Y. Patil University'
  RETURNING id, name, "rankValue"
`
console.log('Fixed institution-level rank:', JSON.stringify(fixResult))
