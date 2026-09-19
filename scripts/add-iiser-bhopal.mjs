// India — adds IISER Bhopal, missing from the catalog (Pune, Kolkata, and
// Mohali already existed). Same user-approved exception as
// scripts/add-missing-iims.mjs. IISER Thiruvananthapuram, Tirupati, and
// Berhampur are NOT added here — none appear in NIRF's Overall, Research
// Institutions, or University top-100/50 lists, so there's no verified
// ranking source for them yet.
//
// Usage: node --env-file=.env.local scripts/add-iiser-bhopal.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const name = 'Indian Institute of Science Education and Research Bhopal'
const existing = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'IN'`
if (existing.length > 0) {
  console.log('Already exists, skipping.')
} else {
  await sql`
    INSERT INTO universities (name, country, location, climate, sectors, "baselineSelectivity", "internshipProgram", requirements, link, "academicFields", "estimatedAcceptanceRate", "acceptanceRateNote")
    VALUES (
      ${name}, 'IN', 'Bhopal, Madhya Pradesh', 'Warm', ${JSON.stringify(['Research', 'General'])}, 84,
      'Established 2008; part of India''s flagship IISER network for integrated science research education.',
      ${JSON.stringify(['IISER Aptitude Test (IAT) or JEE/KVPY-based admission', "Bachelor's/Master's integrated science program"])},
      'https://www.iiserb.ac.in',
      ${JSON.stringify(['Science & Technology / Research'])},
      3,
      'Estimated ~3% — IISER network admits via a national aptitude test (IAT) against a large qualified applicant pool; a research estimate, not a figure certified by the institute.'
    )
  `
  console.log('Inserted IISER Bhopal.')
}
