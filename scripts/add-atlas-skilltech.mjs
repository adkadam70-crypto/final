// Adds ATLAS SkillTech University (Mumbai) — confirmed completely absent
// from the catalog, which is exactly why it fell through to the AI's
// ungrounded general-knowledge fallback in the target-university analysis
// and produced an unreliable 25% for a maxed-out profile.
//
// baselineSelectivity here is a CURATED ESTIMATE, same discipline as the
// original 399-school seed (scripts/seed-universities*.mjs) — not a real
// cited acceptance rate, because none is published for this school (it's a
// small private university, est. 2021, admitting via its own entrance
// test/portfolio + a minimum eligibility bar rather than a competitive
// numeric cutoff). Estimate is informed by real research though, not a
// guess: minimum eligibility is ~50% in the qualifying exam, admission is
// test/portfolio-based rather than percentile-competitive, and it's a new,
// small, tuition-driven private university — all of which point to
// meaningfully low selectivity, not the 70-90 range of Ashoka/IITs/IIMs.
//
// Usage: node --env-file=.env.local scripts/add-atlas-skilltech.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const existing = await sql`SELECT id FROM universities WHERE name = 'ATLAS SkillTech University'`
if (existing.length > 0) {
  console.log('Already exists, id', existing[0].id)
  process.exit(0)
}

const [row] = await sql`
  INSERT INTO universities (name, country, location, climate, sectors, "baselineSelectivity", "internshipProgram", requirements, link, "academicFields")
  VALUES (
    'ATLAS SkillTech University',
    'IN',
    'Mumbai',
    'Warm',
    ${JSON.stringify(['Finance Capital', 'Tech Hub'])}::jsonb,
    28,
    'Industry accelerator partnerships and placement cell (~92% placement rate reported, average package ~INR 8 LPA)',
    ${JSON.stringify([
      'University entrance exam or JEE Main / MHT CET (B.Tech)',
      'Design Aptitude Test + portfolio (B.Des)',
      'Business aptitude test + interview (BBA)',
      'Minimum 50% in qualifying examination',
    ])}::jsonb,
    'https://atlasuniversity.edu.in/',
    ${JSON.stringify(['Computer Science & IT', 'Business', 'Architecture & Design'])}::jsonb
  )
  RETURNING id
`
console.log('Added ATLAS SkillTech University, id', row.id)
