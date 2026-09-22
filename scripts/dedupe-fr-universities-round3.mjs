// France dedupe round 3: Toulouse, Rennes, Sorbonne/Paris-VI, and
// Panthéon-Sorbonne duplicate/pre-merger rows.
//
// Usage: node --env-file=.env.local scripts/dedupe-fr-universities-round3.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const migrateThenDelete = [
  [3306, 724], // Université Paul Sabatier (Toulouse III) -> Toulouse III – Paul Sabatier University
  [3291, 632], // Université Rennes I -> University of Rennes
]

const deleteOutright = [
  3296, // Université des Sciences Sociales (Toulouse I) — pre-merger predecessor
  3297, // Université de Toulouse-le-Mirail (Toulouse II) — pre-merger predecessor
  3298, // Université de Toulouse-le-Mirail (Toulouse III) — mislabeled duplicate of the above
  3299, // Université de Toulouse — French-name dup of University of Toulouse (630)
  3333, // Université de Rennes 2 — French-name dup of University of Rennes 2 (725)
  3249, // Université Rennes II - Haute-Bretagne — old pre-2016 name, same dup
  3229, // Sorbonne Université - Faculté des Sciences (Paris VI) — pre-merger predecessor of Sorbonne University
  633,  // Panthéon-Sorbonne University — English-name dup, 0 refs (French-name row 3283 keeps the 1 ranking)
]

async function hasNoRefs(id) {
  const pr = await sql`SELECT COUNT(*) FROM "programRankings" WHERE "universityId" = ${id}`
  const ss = await sql`SELECT COUNT(*) FROM "savedSchools" WHERE "universityId" = ${id}`
  const dt = await sql`SELECT COUNT(*) FROM "dreamUniversityTracks" WHERE "universityId" = ${id}`
  const ua = await sql`SELECT COUNT(*) FROM "universityAnalyses" WHERE "universityId" = ${id}`
  return !(Number(pr[0].count) || Number(ss[0].count) || Number(dt[0].count) || Number(ua[0].count))
}

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
  if (!(await hasNoRefs(id))) {
    console.log(`SKIP ${id} — has references, not safe to delete outright`)
    continue
  }
  await sql`DELETE FROM universities WHERE id = ${id}`
  deleted++
}

console.log(`Migrated ${migrated} programRankings rows. Deleted ${deleted} duplicate university rows outright, plus ${migrateThenDelete.length} merged-and-deleted.`)
