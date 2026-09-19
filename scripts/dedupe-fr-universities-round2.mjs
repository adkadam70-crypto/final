// France dedupe round 2: documented multi-way university mergers where the
// pre-merger numbered institutions (Strasbourg I/II/III, Nancy I/II,
// Aix-Marseille I/II/III, Lille I/II/III, Bordeaux I/II/IV) are the same
// real institution as a modern merged row already in the catalog, plus two
// English-name/French-name duplicate pairs (Strasbourg, Lorraine) for the
// modern merged institution itself.
//
// Usage: node --env-file=.env.local scripts/dedupe-fr-universities-round2.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const migrateThenDelete = [
  [626, 3321],  // University of Strasbourg -> Université de Strasbourg
  [705, 3268],  // University of Lorraine -> Université de Lorraine
]

const deleteOutright = [
  3319, 3310, 3320, // Strasbourg I / II / III (pre-merger)
  3250, 3279,       // Nancy I / Nancy II (pre-merger, merged into Lorraine)
  3308, 3309, 3273, 3243, // Aix-Marseille (unaccented) / I / II / III (pre-merger)
  3264, 3265, 3266, // Lille I / II / III (pre-merger)
  3101, 3244, 3231, // Bordeaux I / II (Victor Segalen) / IV (Montesquieu) (pre-merger)
]

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

console.log(`Migrated ${migrated} programRankings rows. Deleted ${deleted} duplicate university rows outright, plus ${migrateThenDelete.length} merged-and-deleted.`)
