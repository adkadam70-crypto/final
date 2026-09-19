// Removes 57 rows added earlier this session that mapped NIRF
// institution-level rankings (University, Overall, State Public
// University, Research Institutions, Open University categories — none
// of which are subject/program-specific) into the programRankings table
// under a proxy field (mostly "Science & Technology / Research"). On
// reflection this misrepresents what the data actually is: a student
// would see "#125 in Science & Technology / Research" and reasonably
// read that as a real subject ranking, when it's actually the school's
// general institutional NIRF standing with no connection to any specific
// program.
//
// Does NOT touch a separate set of 38 "NIRF 2025 — Research Institutions
// category" rows that predate this session (part of the existing base
// seed) — those have the same underlying issue but are a prior,
// deliberate design decision, not something introduced here.
//
// Usage: node --env-file=.env.local scripts/cleanup-in-remove-institution-level-rows.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const result = await sql`
  DELETE FROM "programRankings" pr
  USING universities u
  WHERE u.id = pr."universityId"
    AND u.country = 'IN'
    AND (
      pr."rankSource" LIKE '%2024 — University category%' OR
      pr."rankSource" LIKE '%2024 — Overall category%' OR
      pr."rankSource" LIKE '%2024 — State Public University category%' OR
      pr."rankSource" LIKE '%2024 — Research Institutions category%' OR
      pr."rankSource" LIKE '%2024 — Open University category%'
    )
  RETURNING pr.id
`

console.log(`Deleted ${result.length} institution-level rows.`)
