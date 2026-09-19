// Seventeenth Germany pass, one row: Munich Business School, Business #3
// (WiWo HR-Manager Ranking 2024, Fachhochschulen pool), confirmed with an
// exact percentage (12.0%) and full top-3 context that also matches what
// was already on file for HTW Berlin (#1, 18.0%) and Reutlingen (#2,
// 13.9%) — real cross-corroboration, not just a repeated claim.
//
// Notably, this same number ("Munich Business School, Business, rank 3")
// appeared in the very first fully-fabricated WiWo batch this session,
// which was otherwise rejected wholesale. It turned out to be right by
// coincidence — which is exactly why it wasn't trusted at the time and
// only went in now that it's independently confirmed.
//
// This file documents the row already inserted directly via SQL in this
// session for reproducibility — running it is a no-op if the row exists.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-de-round17-mbs.mjs
import { neon } from '@neondatabase/serverless'
const sql = neon(process.env.DATABASE_URL)
const universityId = (await sql`SELECT id FROM universities WHERE name = 'Munich Business School' AND country = 'DE'`)[0].id
const field = 'Business'
const source = 'WirtschaftsWoche HR-Manager Ranking 2024 — Betriebswirtschaftslehre (BWL, Fachhochschulen)'
const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${universityId} AND field = ${field} AND "rankSource" = ${source}`
if (existing.length === 0) {
  await sql`INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (${universityId}, ${field}, 3, ${source}, 'https://www.wiwo.de/erfolg/hochschule/hochschulranking-2024-das-sind-die-besten-unis-und-fhs-fuer-bwl-studenten/29850780.html', 92, 'Real German-specific HR-recruiter survey rank among Fachhochschulen, not a world-subject rank. Confirmed with exact percentage (12.0%) alongside HTW Berlin #1 (18.0%) and Reutlingen #2 (13.9%), both already on file.')`
  console.log('Inserted Munich Business School Business 3')
} else {
  console.log('Already exists')
}
