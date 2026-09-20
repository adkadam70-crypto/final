// Germany dedupe: old German-only Fachhochschule/Technische Hochschule
// names that duplicate an already-ranked modern-name row. All confirmed
// zero-reference beforehand (no rankings, no saved schools, no dream
// tracks, no analyses) — safe to delete outright, no migration needed.
//
// Usage: node --env-file=.env.local scripts/dedupe-de-universities.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const deleteOutright = [
  2852, // Fachhochschule Karlsruhe, Hochschule für Technik -> Karlsruhe University of Applied Sciences
  2857, // Technische Hochschule Köln -> TH Köln
  2831, // Fachhochschule Dortmund -> Dortmund University of Applied Sciences and Arts
  2858, // Fachhochschule Konstanz... -> HTWG Konstanz
  2896, // Fachhochschule Trier... -> Trier University of Applied Sciences
  2873, // Fachhochschule Niederrhein -> Niederrhein University of Applied Sciences
  2879, // Fachhochschule Offenburg... -> Offenburg University of Applied Sciences
  2838, // Fachhochschule Frankfurt am Main -> Frankfurt University of Applied Sciences
  2840, // Fachhochschule Furtwangen... -> Furtwangen University
  2853, // Fachhochschule Kempten... -> Kempten University of Applied Sciences
  2824, // Fachhochschule Bielefeld -> Bielefeld University of Applied Sciences and Arts
  2844, // Fachhochschule Hannover -> Hannover University of Applied Sciences and Arts
  2839, // Europa Fachhochschule Fresenius -> Hochschule Fresenius
]

async function hasNoRefs(id) {
  const pr = await sql`SELECT COUNT(*) FROM "programRankings" WHERE "universityId" = ${id}`
  const ss = await sql`SELECT COUNT(*) FROM "savedSchools" WHERE "universityId" = ${id}`
  const dt = await sql`SELECT COUNT(*) FROM "dreamUniversityTracks" WHERE "universityId" = ${id}`
  const ua = await sql`SELECT COUNT(*) FROM "universityAnalyses" WHERE "universityId" = ${id}`
  return !(Number(pr[0].count) || Number(ss[0].count) || Number(dt[0].count) || Number(ua[0].count))
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

console.log(`Deleted ${deleted} duplicate university rows.`)
