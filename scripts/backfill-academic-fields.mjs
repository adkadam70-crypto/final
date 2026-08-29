// Two-part cleanup:
//
// 1. Any university with a real programRankings row for a field should have
//    that field in its academicFields tag list — the Business/Engineering
//    seed passes didn't all update the tag consistently.
//
// 2. Computer Science & IT and Mathematics & Statistics are near-universal
//    majors at any research university, so — unlike the narrow "just the
//    ranked elite schools" problem this is deliberately meant to avoid
//    repeating — this tags them broadly: any school already tagged
//    Engineering or Science & Technology / Research gets both added if
//    missing. This is an inference (real research universities offer CS
//    and math departments), not a citation, and is clearly weaker evidence
//    than the sourced programRankings rows — but it's what actually fixes
//    "CS-intent students get zero field-matched schools" without collapsing
//    the pool to only the 10 schools with a verified CS ranking.
//
// Usage: node --env-file=.env.local scripts/backfill-academic-fields.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function addField(current, field) {
  return current.includes(field) ? current : [...current, field]
}

// --- Part 1: backfill from programRankings -------------------------------
const rankedPairs = await sql`
  SELECT DISTINCT pr."universityId", pr.field, u."academicFields"
  FROM "programRankings" pr
  JOIN universities u ON u.id = pr."universityId"
`
let backfilled = 0
for (const row of rankedPairs) {
  const current = row.academicFields || []
  if (!current.includes(row.field)) {
    await sql`UPDATE universities SET "academicFields" = ${JSON.stringify(addField(current, row.field))}::jsonb WHERE id = ${row.universityId}`
    backfilled++
  }
}
console.log(`Part 1: backfilled ${backfilled} missing tags for schools with a verified program ranking.`)

// --- Part 2: broad CS + Math coverage for research/engineering schools ---
const stemSchools = await sql`
  SELECT id, "academicFields" FROM universities
  WHERE "academicFields" @> '["Engineering"]'::jsonb OR "academicFields" @> '["Science & Technology / Research"]'::jsonb
`
let csAdded = 0
let mathAdded = 0
for (const row of stemSchools) {
  let fields = row.academicFields || []
  const before = fields.length
  if (!fields.includes('Computer Science & IT')) { fields = addField(fields, 'Computer Science & IT'); csAdded++ }
  if (!fields.includes('Mathematics & Statistics')) { fields = addField(fields, 'Mathematics & Statistics'); mathAdded++ }
  if (fields.length !== before) {
    await sql`UPDATE universities SET "academicFields" = ${JSON.stringify(fields)}::jsonb WHERE id = ${row.id}`
  }
}
console.log(`Part 2: added Computer Science & IT to ${csAdded} schools, Mathematics & Statistics to ${mathAdded} schools (inferred from existing Engineering/Sci-Tech tags — ${stemSchools.length} schools checked).`)

const { rows: counts } = await sql`
  SELECT
    count(*) FILTER (WHERE "academicFields" @> '["Computer Science & IT"]'::jsonb) AS cs,
    count(*) FILTER (WHERE "academicFields" @> '["Mathematics & Statistics"]'::jsonb) AS math
  FROM universities
`
console.log(`\nNew totals — Computer Science & IT: ${counts[0].cs} schools, Mathematics & Statistics: ${counts[0].math} schools.`)
