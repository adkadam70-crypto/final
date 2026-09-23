// Catches the "Culinary Arts filed under Business" class of bug: a
// programRankings row whose rankSource is clearly about one subject (e.g.
// "College Factual — Best Journalism Schools") but is filed under a
// DIFFERENT ACADEMIC_FIELDS bucket that already has its own dedicated field
// for that subject (e.g. field: "Communications & Media" instead of
// "Journalism"). Run this after any bulk import or manual insert into
// programRankings — before pushing/shipping the new rows, not after.
//
// This is a detector, not an auto-fixer: it prints suspects for a human (or
// an agent under supervision) to review and either re-tag (UPDATE field —
// preferred, when the correct dedicated field already exists in
// ACADEMIC_FIELDS) or delete (only when there's genuinely no correct field
// to move it to, e.g. a "Best Culinary Arts Schools" ranking, since this
// app's ACADEMIC_FIELDS has no Culinary Arts bucket).
//
// Exits with code 1 if any suspects are found, so it can be wired into a
// pre-commit/CI check later if desired.
//
// Usage: node --env-file=.env.local scripts/validate-program-ranking-fields.mjs

import { neon } from '@neondatabase/serverless'
const sql = neon(process.env.DATABASE_URL)

// Keep this in sync with ACADEMIC_FIELDS in lib/academic-detail.ts. Each
// entry lists distinctive keyword(s) for that field's OWN subject — chosen
// to be specific to the subject, not generic words that show up in
// publisher/ministry names (e.g. "Education" alone is too broad: it matches
// "Ministry of Education" and "Times Higher Education", which are
// publishers, not subject mismatches — that caused false positives during
// the first pass of this audit and is why every keyword here is a full
// subject phrase, not a single common word).
const FIELD_KEYWORDS = {
  'Accounting': ['Best Accounting Schools', 'Accountancy'],
  'Agriculture & Natural Resources': ['Agriculture & Allied', 'Best Agriculture Schools', 'Forestry Schools', 'Fisheries Schools'],
  'Architecture & Design': ['Best Architecture Schools', 'Interior Design Schools'],
  'Arts': ['Best Culinary Arts Schools', 'Fine Arts Schools', 'Performing Arts Schools'],
  'Biology & Life Sciences': ['Best Biology Schools', 'Best General Biology'],
  'Business': ['Best Culinary Arts Schools'], // never legitimately Business's own keyword — presence always flags
  'Communications & Media': ['Best Colleges for Communications', 'Broadcasting Schools'],
  'Computer Science & IT': ['Best Computer Science Schools'],
  'Data Science & Analytics': ['Best Data Science Schools'],
  'Economics': ['Best Undergraduate Economics Programs', 'Best Economics Schools'],
  'Education': ['Best Culinary Arts Schools'],
  'Engineering': ['Best Culinary Arts Schools'],
  'Environmental Science & Sustainability': ['Best Environmental Science Schools'],
  'Finance': ['Best Finance Schools'],
  'Humanities': ['Best Culinary Arts Schools'],
  'Journalism': ['Best Colleges for Journalism', 'Best Journalism Schools'],
  'Law': ['Best Culinary Arts Schools'],
  'Marketing': ['Best Marketing Schools'],
  'Mathematics & Statistics': ['Best Mathematics Schools'],
  'Medicine & Health Sciences': ['Best Culinary Arts Schools'],
  'Political Science': ['Best Political Science Schools'],
  'Psychology': ['Best Psychology Schools', 'Psychology (Germany)', 'Psychology (UK)'],
  'Science & Technology / Research': ['Best Culinary Arts Schools'],
  'Social Sciences': ['Best Culinary Arts Schools'],
}

// keyword -> field(s) it actually belongs to
const KEYWORD_TO_FIELD = {}
for (const [field, keywords] of Object.entries(FIELD_KEYWORDS)) {
  for (const kw of keywords) {
    if (!KEYWORD_TO_FIELD[kw]) KEYWORD_TO_FIELD[kw] = []
    KEYWORD_TO_FIELD[kw].push(field)
  }
}

async function main() {
  const rows = await sql`SELECT id, "universityId", field, "rankSource" FROM "programRankings" ORDER BY id`
  console.log(`Checking ${rows.length} programRankings rows against ${Object.keys(FIELD_KEYWORDS).length} known fields...`)

  const suspects = []
  for (const row of rows) {
    for (const [kw, owningFields] of Object.entries(KEYWORD_TO_FIELD)) {
      if (owningFields.includes(row.field)) continue // filed correctly
      if (row.rankSource.includes(kw)) {
        suspects.push({ id: row.id, universityId: row.universityId, field: row.field, rankSource: row.rankSource, shouldLikelyBe: owningFields.join('/') })
      }
    }
  }

  if (suspects.length === 0) {
    console.log('\nNo suspects found — every row appears filed under a field consistent with its rankSource.')
    return
  }

  console.log(`\n${suspects.length} suspect rows — review each and either re-tag (UPDATE field, preferred) or delete (only if no correct field exists in ACADEMIC_FIELDS):\n`)
  for (const s of suspects) {
    console.log(`  id=${s.id} uniId=${s.universityId} field="${s.field}" (likely should be "${s.shouldLikelyBe}") source="${s.rankSource}"`)
  }
  process.exitCode = 1
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
