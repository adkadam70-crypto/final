// Adds 4 universities requested for the Target University analysis feature
// specifically (app/actions/analyze-target-university.ts + components/
// target-university-analysis.tsx) — that feature queries the FULL catalog
// with no country restriction (unlike Build Your Dream, which is scoped to
// the 8 supported countries), so these show up there without needing a new
// supported country, its own APPLICATION_INFO entry, application-sections
// file, etc. Country 'CA' is intentionally NOT one of the 8 codes the rest
// of the app treats as selectable/supported (see lib/application-info.ts) —
// these two Canadian schools will never appear in the main country-based
// Find Matches / Build Your Dream flows, only in a direct by-name target-
// university lookup, per explicit request.
//
// Real data verified via live web search (QS 2026, published acceptance
// figures, official admission requirements pages) — see notes per row.
//
// Usage: node --env-file=.env.local scripts/add-canada-de-target-universities.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const ROWS = [
  {
    name: 'University of Waterloo',
    country: 'CA',
    location: 'Waterloo, Ontario',
    climate: 'Cold',
    sectors: ['Tech Hub', 'Research'],
    // Acceptance varies hugely by program (Software Eng ~5%, Comp Sci
    // ~4-6%, Civil/Env Eng ~20-25%, overall ~53%) — no single published
    // institution-wide admit rate is a fair "acceptance rate" the way a
    // US-style figure is, so this is left as a curated estimate
    // (baselineSelectivity) rather than a real actualAcceptanceRate, same
    // convention as other program-gated schools already in the catalog.
    baselineSelectivity: 78,
    internshipProgram: "World's largest co-op program (6 four-month paid work terms alternating with study terms) — the defining feature of a Waterloo degree, especially in Engineering and Computer Science.",
    requirements: [
      'Ontario Universities\' Application Centre (OUAC) application, opens mid-October',
      'Competitive average in required prerequisite courses (e.g. Computer Science requires 85%+ overall with 90%+ in Math and one other required subject)',
      'English proficiency (IELTS/TOEFL/etc.) for non-English-medium applicants — Waterloo does not accept IELTS One Skill Retake or TOEFL MyBest, a single sitting must clear all section minimums',
      'Program-specific supplementary application for Engineering and some other programs',
    ],
    link: 'https://uwaterloo.ca/future-students/',
    academicFields: ['Engineering', 'Computer Science & IT', 'Mathematics & Statistics', 'Science & Technology / Research'],
    rankSource: 'QS World University Rankings 2026',
    rankValue: 119,
    globalRankValue: 119,
    globalRankSource: 'QS World University Rankings 2026',
    acceptanceRateNote:
      'No single fair institution-wide rate — acceptance swings from ~5% (Software Engineering, Computer Science) to ~20-25% (Civil/Environmental Engineering) by program, with an overall blended rate around 53%. Selectivity shown is a curated estimate weighted toward Waterloo\'s most in-demand programs (CS/Software Eng), not a flat average.',
  },
  {
    name: 'University of Toronto',
    country: 'CA',
    location: 'Toronto, Ontario',
    climate: 'Cold',
    sectors: ['Research', 'General'],
    baselineSelectivity: 68,
    internshipProgram: "Canada's top-ranked research university — three campuses (St. George downtown, Mississauga, Scarborough), strongest globally in Computer Science, Medicine, and Life Sciences.",
    requirements: [
      'Ontario Universities\' Application Centre (OUAC) application — international deadline typically January 15',
      'Senior-level prerequisite courses per program, with competitive averages (top programs effectively need a 3.9+ GPA-equivalent)',
      'English proficiency: IELTS 6.5 overall (no band below 6.0) or equivalent for undergraduate programs',
      'Academic transcripts, and for some programs a supplementary application, portfolio, or personal statement',
    ],
    link: 'https://future.utoronto.ca/',
    academicFields: ['Science & Technology / Research', 'Medicine & Health Sciences', 'Computer Science & IT', 'Social Sciences'],
    rankSource: 'QS World University Rankings 2026',
    rankValue: 29,
    globalRankValue: 29,
    globalRankSource: 'QS World University Rankings 2026',
    actualAcceptanceRate: 43,
    acceptanceRateSource: 'Widely reported institution-wide undergraduate acceptance rate (2026 cycle); individual programs (e.g. Computer Science, ~6%) are substantially more selective.',
  },
  {
    name: 'Cologne Business School',
    country: 'DE',
    location: 'Cologne, North Rhine-Westphalia',
    climate: 'Balanced',
    sectors: ['Business'],
    baselineSelectivity: 28,
    internshipProgram: 'Private business school (part of Stuttgart-based Accadis/Global University Systems network) with campuses in Cologne, Potsdam, and Mainz — English- and German-taught Bachelor/Master/MBA programs, integrated internship semesters, and a student body from ~90 countries.',
    requirements: [
      'Recognized secondary school diploma (Abitur, IB Diploma, A-Levels, or equivalent)',
      'English proficiency (IELTS/TOEFL or equivalent) for English-taught programs — no German required for those tracks',
      'Completed application form plus CV/motivation letter',
      'Rolling admissions — apply early given ~4-month student visa processing for non-EU applicants',
    ],
    link: 'https://www.cbs.de/en/',
    academicFields: ['Business', 'Economics'],
    rankSource: 'QS World University Rankings 2026',
    rankValue: 221,
    actualAcceptanceRate: 72,
    acceptanceRateSource: 'Published institution-wide acceptance rate.',
  },
  // NOTE: "TH Köln – University of Applied Sciences" (Cologne University of
  // Applied Sciences) was deliberately NOT added here — it already existed
  // in the catalog under the name "TH Köln" (id 586, DE), already
  // well-researched (real image, 25k-student count, requirements). A first
  // run of this script briefly created a duplicate row under the fuller
  // name before that was caught and deleted.
]

let inserted = 0
for (const r of ROWS) {
  const existing = await sql`SELECT id FROM universities WHERE name = ${r.name} AND country = ${r.country}`
  if (existing.length > 0) {
    console.log(`Skipping (already exists): ${r.name}`)
    continue
  }
  await sql`
    INSERT INTO universities (
      name, country, location, climate, sectors, "baselineSelectivity", "internshipProgram", requirements, link,
      "academicFields", "rankSource", "rankValue", "globalRankValue", "globalRankSource",
      "actualAcceptanceRate", "acceptanceRateSource", "acceptanceRateNote"
    ) VALUES (
      ${r.name}, ${r.country}, ${r.location}, ${r.climate}, ${JSON.stringify(r.sectors)}, ${r.baselineSelectivity},
      ${r.internshipProgram}, ${JSON.stringify(r.requirements)}, ${r.link},
      ${JSON.stringify(r.academicFields)}, ${r.rankSource ?? null}, ${r.rankValue ?? null},
      ${r.globalRankValue ?? null}, ${r.globalRankSource ?? null},
      ${r.actualAcceptanceRate ?? null}, ${r.acceptanceRateSource ?? null}, ${r.acceptanceRateNote ?? null}
    )
  `
  inserted++
  console.log(`Inserted: ${r.name} (${r.country})`)
}

console.log(`\nDone. Inserted ${inserted} of ${ROWS.length} rows.`)
