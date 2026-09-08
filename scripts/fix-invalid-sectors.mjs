// One-off: 5 universities carried a sectors[] value that isn't one of the 8
// valid "industry hub" options (the profile form's dropdown + the AI prompt
// both expect: Business, Creative Hub, Finance Capital, Government & Policy
// Hub, Healthcare & Biotech Hub, Manufacturing & Engineering Hub, Research,
// Tech Hub). An out-of-list value silently never matches a student's
// preferred hub and feeds a nonsense token to the prompt.
//
//   - Amherst / Washington and Lee / University of Richmond: "Liberal Arts"
//     -> "Research" (what every other liberal-arts college in the catalog
//     already uses — Williams, Swarthmore, Pomona, Bowdoin, Middlebury).
//   - United States Naval Academy: "Engineering" -> "Manufacturing &
//     Engineering Hub".
//   - Oregon State University: drop the stray "Agriculture & Natural
//     Resources" (an academic field, not a hub) — the row keeps Research +
//     Manufacturing & Engineering Hub.
//
// Usage: node --import ./scripts/_dns-fix.mjs --env-file=.env scripts/fix-invalid-sectors.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const FIXES = [
  { name: 'Amherst College', sectors: ['Research'] },
  { name: 'Washington and Lee University', sectors: ['Research'] },
  { name: 'University of Richmond', sectors: ['Research'] },
  { name: 'United States Naval Academy', sectors: ['Government & Policy Hub', 'Manufacturing & Engineering Hub'] },
  { name: 'Oregon State University', sectors: ['Research', 'Manufacturing & Engineering Hub'] },
]

let n = 0
for (const f of FIXES) {
  const rows = await sql`SELECT id, sectors FROM universities WHERE name = ${f.name} AND country = 'US'`
  if (rows.length === 0) { console.log(`skip (not found): ${f.name}`); continue }
  await sql`UPDATE universities SET sectors = ${JSON.stringify(f.sectors)}::jsonb WHERE id = ${rows[0].id}`
  console.log(`${f.name}: ${JSON.stringify(rows[0].sectors)} -> ${JSON.stringify(f.sectors)}`)
  n++
}

const bad = await sql`
  SELECT count(*)::int AS c FROM universities
  WHERE EXISTS (SELECT 1 FROM jsonb_array_elements_text(sectors) s
    WHERE s NOT IN ('Business','Creative Hub','Finance Capital','Government & Policy Hub',
                    'Healthcare & Biotech Hub','Manufacturing & Engineering Hub','Research','Tech Hub'))`
console.log(`\nFixed ${n}. Rows still carrying an invalid sector: ${bad[0].c}`)
