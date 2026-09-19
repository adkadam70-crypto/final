// One row: Jamia Millia Islamia (AJK Mass Communication Research Centre),
// Communications & Media #2, India Today 2024 — found via independent
// verification of a Gemini batch's SIMC=3 claim, which surfaced the real
// #2 spot that the batch itself hadn't included. Rejected from the same
// batch: 8 claimed IIT Engineering ranks (NIRF 2024) sourced to a research
// paper PDF that came back as unreadable binary when fetched — same
// failure mode as the Outlook-ICARE PDF in the previous round.
//
// This file documents the row already inserted directly via SQL in this
// session for reproducibility — running it is a no-op if the row exists.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-in-jamia-mcrc.mjs
import { neon } from '@neondatabase/serverless'
const sql = neon(process.env.DATABASE_URL)
const universityId = 128
const field = 'Communications & Media'
const source = 'India Today Best Colleges 2024 — Mass Communication'
const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${universityId} AND field = ${field} AND "rankSource" = ${source}`
if (existing.length === 0) {
  await sql`INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (${universityId}, ${field}, 2, ${source}, 'https://www.indiatoday.in/visualstories/education/top-5-journalism-colleges-in-india-based-on-the-nirf-list-169158-17-09-2024', 95, 'AJK Mass Communication Research Centre at Jamia Millia Islamia — confirmed via independent search, not from the original batch (which omitted this real #2 spot).')`
  console.log('Inserted Jamia Millia Islamia Communications & Media 2')
} else {
  console.log('Already exists')
}
