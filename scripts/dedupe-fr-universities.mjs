// One-off cleanup: France catalog has duplicate rows for the same real
// institution (old pre-merger numbered name vs modern name, or just an
// accent/formatting variant). For each confirmed pair, migrate any
// programRankings/savedSchools/dreamUniversityTracks/universityAnalyses
// references from the loser id to the winner id, then delete the loser.
// Rows with zero references anywhere are deleted outright (checked first).
//
// Usage: node --env-file=.env.local scripts/dedupe-fr-universities.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const migrateThenDelete = [
  [3159, 621], // Ecole Normale Supérieure de Lyon -> École Normale Supérieure de Lyon
  [3201, 684], // Grenoble Ecole de Management -> Grenoble École de Management
]
const deleteOutright = [3110, 3272, 3271, 3336, 3335, 3337, 3303, 3270]

let migrated = 0
for (const [loserId, winnerId] of migrateThenDelete) {
  const rows = await sql`SELECT id, field, "rankSource" FROM "programRankings" WHERE "universityId" = ${loserId}`
  for (const row of rows) {
    const dup = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${winnerId} AND field = ${row.field} AND "rankSource" = ${row.rankSource}`
    if (dup.length > 0) {
      await sql`DELETE FROM "programRankings" WHERE id = ${row.id}`
    } else {
      await sql`UPDATE "programRankings" SET "universityId" = ${winnerId} WHERE id = ${row.id}`
      migrated++
    }
  }
  await sql`UPDATE "savedSchools" SET "universityId" = ${winnerId} WHERE "universityId" = ${loserId}`
  await sql`UPDATE "dreamUniversityTracks" SET "universityId" = ${winnerId} WHERE "universityId" = ${loserId}`
  await sql`UPDATE "universityAnalyses" SET "universityId" = ${winnerId} WHERE "universityId" = ${loserId}`
  await sql`DELETE FROM universities WHERE id = ${loserId}`
}

let deleted = 0
for (const id of deleteOutright) {
  const pr = await sql`SELECT COUNT(*) FROM "programRankings" WHERE "universityId" = ${id}`
  const ss = await sql`SELECT COUNT(*) FROM "savedSchools" WHERE "universityId" = ${id}`
  const dt = await sql`SELECT COUNT(*) FROM "dreamUniversityTracks" WHERE "universityId" = ${id}`
  const ua = await sql`SELECT COUNT(*) FROM "universityAnalyses" WHERE "universityId" = ${id}`
  if (Number(pr[0].count) || Number(ss[0].count) || Number(dt[0].count) || Number(ua[0].count)) {
    console.log(`SKIP ${id} — has references, not safe to delete outright`)
    continue
  }
  await sql`DELETE FROM universities WHERE id = ${id}`
  deleted++
}

console.log(`Migrated ${migrated} programRankings rows. Deleted ${deleted} duplicate university rows outright, plus up to 2 merged-and-deleted.`)
