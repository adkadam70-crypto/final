// India — adds Indian Institute of Foreign Trade (Delhi), missing from the
// catalog entirely. Real, government-run, with a published NIRF 2024
// Management category rank. Same user-approved exception as
// scripts/add-missing-iims.mjs.
//
// Usage: node --env-file=.env.local scripts/add-iift.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const name = 'Indian Institute of Foreign Trade'
const existing = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'IN'`
if (existing.length > 0) {
  console.log('Already exists, skipping.')
} else {
  await sql`
    INSERT INTO universities (name, country, location, climate, sectors, "baselineSelectivity", "internshipProgram", requirements, link, "academicFields")
    VALUES (
      ${name}, 'IN', 'New Delhi, Delhi', 'Warm', ${JSON.stringify(['Finance Capital'])}, 85,
      'Established 1963; India''s premier institute for international trade and business management, strong export/trade-sector recruiter base.',
      ${JSON.stringify(['CAT/IIFT entrance exam score', "Bachelor's degree (postgraduate program)"])},
      'https://iift.ac.in',
      ${JSON.stringify(['Business'])}
    )
  `
  console.log('Inserted IIFT.')
}
