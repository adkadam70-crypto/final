// First research pass over US universities that had ZERO programRankings
// coverage at all (not just a missing field) — 1,398 of 1,628 US schools,
// most of them community/technical colleges outside our matching audience.
// This batch covers real, selective 4-year schools from that gap list that
// have a genuine, citable subject-specific ranking, verified via live web
// search rather than a subscriber-only US News login (unlike earlier
// rounds, so sources here are named per-row instead of assumed uniform).
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-us-round3-no-coverage.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank) {
  return Math.max(15, Math.min(99, Math.round(100 - (rank - 1) * 1.1)))
}

const PQ_BUSINESS_SOURCE = 'Poets&Quants — 2026 Best Undergraduate Business Programs'
const PQ_BUSINESS_URL = 'https://poetsandquantsforundergrads.com/rankings/2026-best-undergraduate-business-schools/'
const USNEWS_ENG_NODOC_SOURCE = 'U.S. News & World Report — 2026 Best Undergraduate Engineering Programs (schools whose highest degree is a bachelor\'s or master\'s)'
const USNEWS_ENG_NODOC_URL = 'https://www.usnews.com/best-colleges/rankings/engineering-overall'
const NICHE_MUSIC_SOURCE = 'Niche — 2026 Best Colleges for Music in America'
const NICHE_MUSIC_URL = 'https://www.niche.com/colleges/search/best-colleges-for-music/'
const ARTOBJECT_ART_SOURCE = 'Art & Object — 2026 Top 15 Undergraduate Art Schools'
const ARTOBJECT_ART_URL = 'https://www.artandobject.com/'
const NICHE_BUSINESS_SOURCE = 'Niche — 2026 Best Colleges for Business in America'
const NICHE_BUSINESS_URL = 'https://www.niche.com/colleges/search/best-colleges-for-business/'

const DATA = [
  ['Texas Christian University', 'Business', 28, PQ_BUSINESS_SOURCE, PQ_BUSINESS_URL, null],
  ['United States Air Force Academy', 'Engineering', 7, USNEWS_ENG_NODOC_SOURCE, USNEWS_ENG_NODOC_URL, null],
  ['Berklee College of Music', 'Arts', 15, NICHE_MUSIC_SOURCE, NICHE_MUSIC_URL, 'Niche crowd/data composite ranking, not a peer-assessment survey like US News.'],
  ['California Institute of the Arts', 'Arts', 2, ARTOBJECT_ART_SOURCE, ARTOBJECT_ART_URL, 'Editorial ranking (tuition, major breadth, outcomes, diversity, quality of life), not a peer-assessment survey.'],
  ['University of Saint Thomas (MN)', 'Business', 87, NICHE_BUSINESS_SOURCE, NICHE_BUSINESS_URL, 'Niche crowd/data composite ranking, not a peer-assessment survey like US News.'],
]

let inserted = 0
const skipped = []

for (const [name, field, rank, source, url, note] of DATA) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'US'`
  if (rows.length === 0) {
    skipped.push(name)
    continue
  }
  const universityId = rows[0].id
  const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${universityId} AND field = ${field} AND "rankSource" = ${source}`
  if (existing.length > 0) continue

  const baseNote = 'Peer-assessment or composite ranking, not an admissions-selectivity metric directly — programSelectivity here is our own derived scale for comparability with other rankings, not itself a published figure.'

  await sql`
    INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (
      ${universityId}, ${field}, ${rank}, ${source}, ${url},
      ${selectivityFromRank(rank)},
      ${note ? `${baseNote} ${note}` : baseNote}
    )
  `
  inserted++
}

console.log(`Inserted ${inserted} program-ranking rows.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
