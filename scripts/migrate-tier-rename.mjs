// One-time backfill: 'Target' -> 'Good Chance' in already-stored rows.
// Renaming the TS type doesn't touch existing data — savedSchools.matchTier
// (plain text) and matches.results (jsonb array) both need updating.
// Usage: node --env-file=.env.local scripts/migrate-tier-rename.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const savedSchoolsResult = await sql`
  UPDATE "savedSchools" SET "matchTier" = 'Good Chance' WHERE "matchTier" = 'Target'
`
console.log(`savedSchools: updated ${savedSchoolsResult.length ?? 'rows'}`)

const matchRows = await sql`SELECT id, results FROM matches`
let updatedMatches = 0
for (const row of matchRows) {
  if (!Array.isArray(row.results)) continue
  const hasTarget = row.results.some((r) => r.matchTier === 'Target')
  if (!hasTarget) continue
  const newResults = row.results.map((r) => (r.matchTier === 'Target' ? { ...r, matchTier: 'Good Chance' } : r))
  await sql`UPDATE matches SET results = ${JSON.stringify(newResults)}::jsonb WHERE id = ${row.id}`
  updatedMatches++
}
console.log(`matches: updated ${updatedMatches} of ${matchRows.length} rows`)
