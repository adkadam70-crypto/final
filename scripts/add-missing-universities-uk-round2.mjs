// UK catalog completion, round 2 — 21 real, legitimate UK universities not
// yet in the catalog, found by cross-referencing every Complete University
// Guide 2027 subject table already fetched this session (see
// scripts/seed-program-rankings-uk-round3/4.mjs) against the existing
// catalog. 13 of these have a real overall CUG rank (baselineSelectivity
// follows the same tiered pattern already visible in the existing catalog
// at each rank band — see the query used to derive it, not a smooth
// formula); the other 8 are specialist institutions (conservatoires, land-
// based colleges, a private business school, a multi-campus regional
// college, a tiny early-years specialist) that — like Glasgow School of
// Art, RCM, RAM, RNCM, Trinity Laban, Guildhall already in the catalog —
// aren't included in CUG's overall table at all, so their
// baselineSelectivity is a curated estimate against comparable
// already-catalogued specialist peers, explicitly not a sourced rank.
//
// Deliberately excludes: Hull York / Brighton and Sussex / Kent and Medway
// Medical Schools (joint schools between two universities, don't map to a
// single admissions body), and "Lincoln Bishop University" (an ambiguous/
// likely-garbled table entry, same exclusion already made in round 1).
//
// Usage: node --env-file=.env.local scripts/add-missing-universities-uk-round2.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const RANK_SOURCE = 'The Complete University Guide 2027 — UK league table'

const SCHOOLS = [
  { name: 'Falmouth University', rank: 65, location: 'Falmouth, England', sectors: ['Creative Hub'], academicFields: ['Arts', 'Communications & Media'], baselineSelectivity: 38, link: 'https://www.falmouth.ac.uk', note: 'Specialist creative arts institution (film, games, design, journalism); portfolio-based admission' },
  { name: 'Leeds Beckett University', rank: 86, location: 'Leeds, England', sectors: ['Business'], academicFields: ['Business', 'Education', 'Arts', 'Psychology'], baselineSelectivity: 8, link: 'https://www.leedsbeckett.ac.uk' },
  { name: 'Liverpool Hope University', rank: 83, location: 'Liverpool, England', sectors: ['Research'], academicFields: ['Education', 'Business', 'Arts', 'Mathematics & Statistics', 'Psychology'], baselineSelectivity: 8, link: 'https://www.hope.ac.uk' },
  { name: 'Queen Margaret University, Edinburgh', rank: 102, location: 'Edinburgh, Scotland', sectors: ['Healthcare & Biotech Hub'], academicFields: ['Medicine & Health Sciences', 'Business', 'Education', 'Psychology'], baselineSelectivity: 8, link: 'https://www.qmu.ac.uk', note: 'Known nationally for speech and language therapy, physiotherapy, and other allied health programs' },
  { name: 'University of Greenwich', rank: 103, location: 'London, England', sectors: ['Business'], academicFields: ['Business', 'Education', 'Arts', 'Computer Science & IT', 'Mathematics & Statistics', 'Psychology'], baselineSelectivity: 8, link: 'https://www.gre.ac.uk' },
  { name: 'University of Lancashire', rank: 90, location: 'Preston, England', sectors: ['Business'], academicFields: ['Business', 'Education', 'Medicine & Health Sciences', 'Arts', 'Agriculture & Natural Resources', 'Psychology'], baselineSelectivity: 8, link: 'https://www.uclan.ac.uk', note: 'Renamed from University of Central Lancashire (UCLan) in 2024' },
  { name: 'University of Stirling', rank: 55, location: 'Stirling, Scotland', sectors: ['Research'], academicFields: ['Business', 'Computer Science & IT', 'Education', 'Mathematics & Statistics', 'Psychology'], baselineSelectivity: 15, link: 'https://www.stir.ac.uk' },
  { name: 'University of Suffolk', rank: 44, location: 'Ipswich, England', sectors: ['Research'], academicFields: ['Education', 'Arts', 'Business', 'Computer Science & IT', 'Psychology'], baselineSelectivity: 26, link: 'https://www.uos.ac.uk' },
  { name: 'University of Wales Trinity Saint David', rank: 100, location: 'Carmarthen, Wales', sectors: ['Research'], academicFields: ['Arts', 'Business', 'Education', 'Psychology'], baselineSelectivity: 8, link: 'https://www.uwtsd.ac.uk' },
  { name: 'University of West London', rank: 84, location: 'London, England', sectors: ['Business'], academicFields: ['Arts', 'Business', 'Education', 'Psychology'], baselineSelectivity: 8, link: 'https://www.uwl.ac.uk' },
  { name: 'University of Winchester', rank: 97, location: 'Winchester, England', sectors: ['Research'], academicFields: ['Education', 'Business', 'Arts', 'Psychology'], baselineSelectivity: 8, link: 'https://www.winchester.ac.uk' },
  { name: 'University of Wolverhampton', rank: 101, location: 'Wolverhampton, England', sectors: ['Business'], academicFields: ['Business', 'Computer Science & IT', 'Education', 'Mathematics & Statistics', 'Psychology'], baselineSelectivity: 8, link: 'https://www.wlv.ac.uk' },
  { name: 'Hartpury University', rank: null, location: 'Gloucester, England', sectors: ['Manufacturing & Engineering Hub'], academicFields: ['Agriculture & Natural Resources'], baselineSelectivity: 15, link: 'https://www.hartpury.ac.uk', note: 'Specialist land-based/equine/sport institution, comparable in focus to Harper Adams University' },
  { name: "SRUC Scotland's Rural College", rank: null, location: 'Edinburgh, Scotland', sectors: ['Manufacturing & Engineering Hub'], academicFields: ['Agriculture & Natural Resources'], baselineSelectivity: 15, link: 'https://www.sruc.ac.uk', note: 'Specialist agricultural/rural-sector college with multiple Scottish campuses' },
  { name: 'Rose Bruford College', rank: null, location: 'Sidcup, England', sectors: ['Creative Hub'], academicFields: ['Arts'], baselineSelectivity: 20, link: 'https://www.bruford.ac.uk', note: 'Specialist drama conservatoire; audition-based admission' },
  { name: 'BIMM University', rank: null, location: 'Multiple UK campuses, England', sectors: ['Creative Hub'], academicFields: ['Arts'], baselineSelectivity: 12, link: 'https://www.bimm.ac.uk', note: 'Specialist contemporary music institution with campuses across the UK' },
  { name: 'Institute of Contemporary Music Performance', rank: null, location: 'London, England', sectors: ['Creative Hub'], academicFields: ['Arts'], baselineSelectivity: 12, link: 'https://www.icmp.ac.uk', note: 'Specialist contemporary music performance institution' },
  { name: 'Liverpool Institute for Performing Arts', rank: null, location: 'Liverpool, England', sectors: ['Creative Hub'], academicFields: ['Arts', 'Communications & Media'], baselineSelectivity: 18, link: 'https://www.lipa.ac.uk', note: 'Specialist performing arts conservatoire co-founded by Paul McCartney; audition/portfolio-based admission' },
  { name: "Regent's University London", rank: null, location: 'London, England', sectors: ['Business'], academicFields: ['Business'], baselineSelectivity: 15, link: 'https://www.regents.ac.uk', note: 'Private university with an international, business-focused student body' },
  { name: 'University of the Highlands and Islands', rank: null, location: 'Inverness, Scotland', sectors: ['Research'], academicFields: ['Agriculture & Natural Resources', 'Arts', 'Business', 'Education'], baselineSelectivity: 8, link: 'https://www.uhi.ac.uk', note: 'Federated multi-campus institution serving the Scottish Highlands and Islands' },
  { name: 'Norland University of Early Childhood', rank: null, location: 'Bath, England', sectors: ['Research'], academicFields: ['Education'], baselineSelectivity: 20, link: 'https://www.norland.ac.uk', note: 'Tiny specialist institution for early-years/nannying education; highly limited places despite a niche field' },
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
      ${school.rank !== null ? RANK_SOURCE : null}, ${school.rank}
    )
    RETURNING id
  `
  console.log(`Added ${school.name} (UK), rank ${school.rank ?? 'n/a (specialist, not in overall table)'}, id ${row.id}`)
  inserted++
}

console.log(`\nInserted ${inserted} UK universities.`)
if (skipped.length) console.log(`Already existed, skipped: ${skipped.join(', ')}`)
