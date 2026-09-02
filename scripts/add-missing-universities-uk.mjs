// UK catalog completion pass — adds the real UK universities ranked #97
// through #122 in The Complete University Guide 2027 league table that
// weren't yet in the catalog (the catalog already covered #1-96 in full,
// via seed-overall-rankings-uk.mjs). Brings UK "Top 200" coverage to
// essentially the country's entire real university landscape, since the
// UK doesn't have 200 universities in the first place.
//
// Same caveat already documented in seed-overall-rankings-uk.mjs applies
// here: this source's live table returned some inconsistent exact
// positions across separate large-table fetches. One ambiguous name
// ("Lincoln Bishop University" — likely a garbled read of Bishop
// Grosseteste University, Lincoln) was deliberately excluded rather than
// guessed at.
//
// baselineSelectivity is a curated estimate continuing the same downward
// trend visible in already-ranked schools at this tier (no single
// aggregator publishes a real acceptance rate for most of these) — not a
// sourced acceptance rate.
//
// Usage: node --env-file=.env.local scripts/add-missing-universities-uk.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const RANK_SOURCE = 'The Complete University Guide 2027 — UK league table'

const SCHOOLS = [
  { name: 'Abertay University', rank: 97, location: 'Dundee, Scotland', sectors: ['Tech Hub'], academicFields: ['Computer Science & IT'], baselineSelectivity: 26, link: 'https://www.abertay.ac.uk', note: 'Known nationally for games development and cybersecurity programs' },
  { name: 'University of Bedfordshire', rank: 98, location: 'Luton, England', sectors: ['Business'], academicFields: ['Business', 'Social Sciences'], baselineSelectivity: 20, link: 'https://www.beds.ac.uk' },
  { name: 'Leeds Arts University', rank: 98, location: 'Leeds, England', sectors: ['Creative Hub'], academicFields: ['Arts'], baselineSelectivity: 24, link: 'https://www.leeds-art.ac.uk', note: 'Specialist arts and design institution; portfolio-based admission' },
  { name: 'York St John University', rank: 98, location: 'York, England', sectors: ['Research'], academicFields: ['Education', 'Humanities'], baselineSelectivity: 22, link: 'https://www.yorksj.ac.uk' },
  { name: 'Royal Agricultural University', rank: 101, location: 'Cirencester, England', sectors: ['Manufacturing & Engineering Hub'], academicFields: ['Agriculture & Natural Resources', 'Business'], baselineSelectivity: 24, link: 'https://www.rau.ac.uk', note: "UK's oldest agricultural college; specialist land-based sector focus" },
  { name: 'London South Bank University', rank: 104, location: 'London, England', sectors: ['Manufacturing & Engineering Hub'], academicFields: ['Engineering', 'Medicine & Health Sciences'], baselineSelectivity: 22, link: 'https://www.lsbu.ac.uk' },
  { name: 'Anglia Ruskin University', rank: 105, location: 'Cambridge, England', sectors: ['Healthcare & Biotech Hub'], academicFields: ['Medicine & Health Sciences', 'Business'], baselineSelectivity: 20, link: 'https://www.aru.ac.uk' },
  { name: 'Southampton Solent University', rank: 108, location: 'Southampton, England', sectors: ['Manufacturing & Engineering Hub'], academicFields: ['Engineering', 'Communications & Media'], baselineSelectivity: 20, link: 'https://www.solent.ac.uk', note: 'Known for maritime and yachting-industry courses' },
  { name: 'University of Cumbria', rank: 109, location: 'Carlisle, England', sectors: ['Research'], academicFields: ['Education', 'Medicine & Health Sciences'], baselineSelectivity: 22, link: 'https://www.cumbria.ac.uk' },
  { name: 'University of Greater Manchester', rank: 110, location: 'Bolton, England', sectors: ['Manufacturing & Engineering Hub'], academicFields: ['Engineering', 'Business'], baselineSelectivity: 20, link: 'https://www.greatermanchester.ac.uk', note: 'Renamed from University of Bolton in 2024' },
  { name: 'Arts University Plymouth', rank: 111, location: 'Plymouth, England', sectors: ['Creative Hub'], academicFields: ['Arts'], baselineSelectivity: 24, link: 'https://www.aup.ac.uk', note: 'Specialist arts and design institution; portfolio-based admission' },
  { name: 'Buckinghamshire New University', rank: 112, location: 'High Wycombe, England', sectors: ['Healthcare & Biotech Hub'], academicFields: ['Medicine & Health Sciences', 'Business'], baselineSelectivity: 18, link: 'https://www.bucks.ac.uk' },
  { name: 'University of Northampton', rank: 113, location: 'Northampton, England', sectors: ['Business'], academicFields: ['Business', 'Medicine & Health Sciences'], baselineSelectivity: 20, link: 'https://www.northampton.ac.uk' },
  { name: 'University of Roehampton', rank: 115, location: 'London, England', sectors: ['Research'], academicFields: ['Humanities', 'Social Sciences', 'Education'], baselineSelectivity: 24, link: 'https://www.roehampton.ac.uk' },
  { name: 'University of Buckingham', rank: 115, location: 'Buckingham, England', sectors: ['Business'], academicFields: ['Law', 'Business', 'Medicine & Health Sciences'], baselineSelectivity: 30, link: 'https://www.buckingham.ac.uk', note: "UK's oldest private university; accelerated 2-year degrees" },
  { name: 'Leeds Trinity University', rank: 117, location: 'Leeds, England', sectors: ['Research'], academicFields: ['Education', 'Communications & Media'], baselineSelectivity: 20, link: 'https://www.leedstrinity.ac.uk' },
  { name: 'Plymouth Marjon University', rank: 118, location: 'Plymouth, England', sectors: ['Healthcare & Biotech Hub'], academicFields: ['Education', 'Medicine & Health Sciences'], baselineSelectivity: 18, link: 'https://www.marjon.ac.uk', note: 'Known for sports science and teacher training' },
  { name: 'Birmingham Newman University', rank: 119, location: 'Birmingham, England', sectors: ['Research'], academicFields: ['Education', 'Humanities'], baselineSelectivity: 18, link: 'https://www.newman.ac.uk' },
  { name: 'University of the West of Scotland', rank: 120, location: 'Paisley, Scotland', sectors: ['Manufacturing & Engineering Hub'], academicFields: ['Engineering', 'Business'], baselineSelectivity: 22, link: 'https://www.uws.ac.uk' },
  { name: 'London Metropolitan University', rank: 121, location: 'London, England', sectors: ['Business'], academicFields: ['Business', 'Law'], baselineSelectivity: 18, link: 'https://www.londonmet.ac.uk' },
  { name: 'Wrexham University', rank: 122, location: 'Wrexham, Wales', sectors: ['Healthcare & Biotech Hub'], academicFields: ['Medicine & Health Sciences', 'Computer Science & IT'], baselineSelectivity: 16, link: 'https://www.wrexham.ac.uk' },
]

let inserted = 0
let skipped = []

for (const school of SCHOOLS) {
  const existing = await sql`SELECT id FROM universities WHERE name = ${school.name} AND country = 'UK'`
  if (existing.length > 0) {
    skipped.push(school.name)
    continue
  }

  const requirements = ['A-Levels (BBC-BBB typical) or equivalent UCAS points', 'Personal statement']
  const internshipProgram = school.note
    ? `${school.note}; UK placement-year opportunities available in most programs`
    : 'Regional employer links and UK placement-year opportunities available in most programs'

  const [row] = await sql`
    INSERT INTO universities (
      name, country, location, climate, sectors, "baselineSelectivity",
      "internshipProgram", requirements, link, "academicFields",
      "rankSource", "rankValue"
    )
    VALUES (
      ${school.name}, 'UK', ${school.location}, 'Cold',
      ${JSON.stringify(school.sectors)}::jsonb, ${school.baselineSelectivity},
      ${internshipProgram}, ${JSON.stringify(requirements)}::jsonb,
      ${school.link},
      ${JSON.stringify(school.academicFields)}::jsonb,
      ${RANK_SOURCE}, ${school.rank}
    )
    RETURNING id
  `
  console.log(`Added ${school.name} (UK), rank ${school.rank}, id ${row.id}`)
  inserted++
}

console.log(`\nInserted ${inserted} UK universities.`)
if (skipped.length) console.log(`Already existed, skipped: ${skipped.join(', ')}`)
