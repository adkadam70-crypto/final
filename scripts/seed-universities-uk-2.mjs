// UK catalog — tranche 2 (~30 rows). Runs after the original UK rows in
// seed-universities.mjs / seed-universities-round2.mjs / -round3.mjs.
// Brings the UK to ~124 rows. Same terse shape and (name, country) dedup.
//
// Deliberate spread — the earlier UK set is Russell-Group / mid-table heavy
// with almost no dedicated specialist institutions. This tranche adds:
//   - 6 CUG-ranked universities that were simply missing (Keele,
//     Aberystwyth, Hull, UWE Bristol, Chichester, Bath Spa) plus Edge Hill
//   - Harper Adams (CUG #48) — the UK's leading agriculture-and-land
//     specialist, a real gap
//   - 3 CUG-ranked art schools (Norwich University of the Arts, Arts
//     University Bournemouth, University for the Creative Arts)
//   - a set of CUG-ranked post-92 universities across health, education,
//     engineering, computing and the creative industries
//   - 5 music/drama conservatoires and Glasgow School of Art — none appear
//     in the CUG overall league table (it has a separate Performing Arts
//     table), so rankValue stays NULL, exactly like other specialist
//     institutions in the catalog
//
// rankValue is set by seed-overall-rankings-uk.mjs (extended for the
// CUG-ranked names here). acceptance rate by seed-acceptance-estimates-uk.mjs
// (extended with a conservatoire / selective-art-school branch) — every UK
// row gets a UCAS-offer-rate estimate, and baselineSelectivity is realigned
// to (100 - rate) the same way that pass already does for every UK row.
// The baselineSelectivity values below are provisional placeholders.
//
// climate: 'Cold' for the whole UK, matching every existing UK row.
//
// Usage: node --env-file=.env.local scripts/seed-universities-uk-2.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const REQ_PS = ['A-Levels (grades vary by course)', 'Personal statement']
const REQ_PORTFOLIO = ['Portfolio', 'A-Levels or an Art Foundation diploma', 'Interview for some courses']
const REQ_AUDITION = ['Audition or recall (portfolio for production/design courses)', 'Interview', 'A-Levels or equivalent — the audition is decisive']

const UNIVERSITIES = [
  // --- CUG-ranked universities that were missing ---
  { name: 'Harper Adams University', country: 'UK', location: 'Newport, Shropshire', climate: 'Cold', sectors: ['Research'], baselineSelectivity: 16, internshipProgram: 'The UK\'s leading agriculture and land-management specialist; a compulsory placement year and heavy agri-industry, food and veterinary-nursing recruiting.', requirements: ['A-Levels BCC (science/agriculture subjects for some courses)', 'Personal statement'], link: 'https://www.harper-adams.ac.uk', academicFields: ['Agriculture & Natural Resources', 'Environmental Science & Sustainability', 'Science & Technology / Research', 'Business'] },
  { name: 'Keele University', country: 'UK', location: 'Keele, Staffordshire', climate: 'Cold', sectors: ['Research'], baselineSelectivity: 16, internshipProgram: 'A large single-campus university with a medical school; strong health, physiotherapy and dual-honours placement.', requirements: ['A-Levels BBB', 'Personal statement'], link: 'https://www.keele.ac.uk', academicFields: ['Medicine & Health Sciences', 'Science & Technology / Research', 'Humanities', 'Business'] },
  { name: 'Aberystwyth University', country: 'UK', location: 'Aberystwyth, Wales', climate: 'Cold', sectors: ['Research'], baselineSelectivity: 16, internshipProgram: 'A coastal Welsh university with the world\'s oldest department of international politics; strong geography, rural sciences and library/information science.', requirements: ['A-Levels BBB-BBC', 'Personal statement'], link: 'https://www.aber.ac.uk', academicFields: ['Social Sciences', 'Environmental Science & Sustainability', 'Agriculture & Natural Resources', 'Humanities'] },
  { name: 'Edge Hill University', country: 'UK', location: 'Ormskirk, Lancashire', climate: 'Cold', sectors: ['Research'], baselineSelectivity: 12, internshipProgram: 'A post-92 university with a large education faculty; strong teacher-training, nursing, sport and media placement.', requirements: REQ_PS, link: 'https://www.edgehill.ac.uk', academicFields: ['Education', 'Medicine & Health Sciences', 'Social Sciences', 'Communications & Media'] },
  { name: 'University of Hull', country: 'UK', location: 'Hull', climate: 'Cold', sectors: ['Research'], baselineSelectivity: 10, internshipProgram: 'A mid-size civic university; strong nursing, education, logistics and offshore-wind / renewable-energy placement on the Humber.', requirements: REQ_PS, link: 'https://www.hull.ac.uk', academicFields: ['Medicine & Health Sciences', 'Education', 'Business', 'Environmental Science & Sustainability'] },
  { name: 'University of the West of England, Bristol', country: 'UK', location: 'Bristol', climate: 'Cold', sectors: ['Manufacturing & Engineering Hub', 'Creative Hub'], baselineSelectivity: 12, internshipProgram: 'A large Bristol university with strong aerospace/robotics engineering, health, and creative-industries (animation, film) placement.', requirements: REQ_PS, link: 'https://www.uwe.ac.uk', academicFields: ['Engineering', 'Medicine & Health Sciences', 'Architecture & Design', 'Business'] },
  { name: 'University of Chichester', country: 'UK', location: 'Chichester, West Sussex', climate: 'Cold', sectors: ['Research'], baselineSelectivity: 10, internshipProgram: 'A small south-coast university; strong sport, dance, musical theatre and teacher-training placement.', requirements: REQ_PS, link: 'https://www.chi.ac.uk', academicFields: ['Education', 'Arts', 'Medicine & Health Sciences', 'Business'] },
  { name: 'Bath Spa University', country: 'UK', location: 'Bath', climate: 'Cold', sectors: ['Creative Hub'], baselineSelectivity: 10, internshipProgram: 'A creative-and-cultural university; strong creative-writing, education, art-and-design and publishing placement.', requirements: REQ_PS, link: 'https://www.bathspa.ac.uk', academicFields: ['Arts', 'Education', 'Humanities', 'Business'] },

  // --- CUG-ranked art schools ---
  { name: 'University for the Creative Arts', country: 'UK', location: 'Farnham, Surrey (multi-campus)', climate: 'Cold', sectors: ['Creative Hub'], baselineSelectivity: 38, internshipProgram: 'A specialist creative-arts university across Surrey and Kent; strong fashion, film, animation, games and graphic-design placement.', requirements: REQ_PORTFOLIO, link: 'https://www.uca.ac.uk', academicFields: ['Architecture & Design', 'Arts', 'Communications & Media'] },
  { name: 'Norwich University of the Arts', country: 'UK', location: 'Norwich', climate: 'Cold', sectors: ['Creative Hub'], baselineSelectivity: 38, internshipProgram: 'A specialist art-and-design university; strong illustration, graphic design, film, games and architecture placement.', requirements: REQ_PORTFOLIO, link: 'https://www.norwichuni.ac.uk', academicFields: ['Arts', 'Architecture & Design', 'Communications & Media'] },
  { name: 'Arts University Bournemouth', country: 'UK', location: 'Bournemouth', climate: 'Cold', sectors: ['Creative Hub'], baselineSelectivity: 38, internshipProgram: 'A specialist arts university feeding the UK film and animation industry; strong modelmaking, visual effects, costume and architecture placement.', requirements: REQ_PORTFOLIO, link: 'https://aub.ac.uk', academicFields: ['Arts', 'Architecture & Design', 'Communications & Media'] },

  // --- CUG-ranked post-92 universities ---
  { name: 'University of Chester', country: 'UK', location: 'Chester', climate: 'Cold', sectors: ['Research'], baselineSelectivity: 8, internshipProgram: 'A church-foundation university; strong nursing, allied health, education and business placement across the northwest.', requirements: REQ_PS, link: 'https://www.chester.ac.uk', academicFields: ['Medicine & Health Sciences', 'Education', 'Business', 'Social Sciences'] },
  { name: "St Mary's University, Twickenham", country: 'UK', location: 'London', climate: 'Cold', sectors: ['Research'], baselineSelectivity: 8, internshipProgram: 'A small Catholic university in southwest London; strong education, sport and exercise science, and theology placement.', requirements: REQ_PS, link: 'https://www.stmarys.ac.uk', academicFields: ['Education', 'Medicine & Health Sciences', 'Humanities', 'Communications & Media'] },
  { name: 'University of Sunderland', country: 'UK', location: 'Sunderland', climate: 'Cold', sectors: ['Manufacturing & Engineering Hub'], baselineSelectivity: 8, internshipProgram: 'A northeast post-92 university; strong nursing, pharmacy, media production and automotive-engineering placement (near the Nissan plant).', requirements: REQ_PS, link: 'https://www.sunderland.ac.uk', academicFields: ['Medicine & Health Sciences', 'Communications & Media', 'Engineering', 'Business'] },
  { name: 'University of Worcester', country: 'UK', location: 'Worcester', climate: 'Cold', sectors: ['Research'], baselineSelectivity: 8, internshipProgram: 'A small West Midlands university; strong nursing, teacher-training, sport and applied-ecology placement.', requirements: REQ_PS, link: 'https://www.worcester.ac.uk', academicFields: ['Medicine & Health Sciences', 'Education', 'Environmental Science & Sustainability', 'Business'] },
  { name: 'University of Derby', country: 'UK', location: 'Derby', climate: 'Cold', sectors: ['Manufacturing & Engineering Hub'], baselineSelectivity: 8, internshipProgram: 'A post-92 university with strong nursing, aeronautical/motorsport engineering (Rolls-Royce nearby) and hospitality placement.', requirements: REQ_PS, link: 'https://www.derby.ac.uk', academicFields: ['Medicine & Health Sciences', 'Engineering', 'Business', 'Arts'] },
  { name: 'Cardiff Metropolitan University', country: 'UK', location: 'Cardiff, Wales', climate: 'Cold', sectors: ['Creative Hub'], baselineSelectivity: 8, internshipProgram: 'A Cardiff post-92 university; strong sport and health science, product and graphic design, dietetics and business placement.', requirements: REQ_PS, link: 'https://www.cardiffmet.ac.uk', academicFields: ['Medicine & Health Sciences', 'Architecture & Design', 'Business', 'Education'] },
  { name: 'Teesside University', country: 'UK', location: 'Middlesbrough', climate: 'Cold', sectors: ['Tech Hub'], baselineSelectivity: 8, internshipProgram: 'A northeast post-92 university known for computer games and animation; also strong engineering, health and forensic science placement.', requirements: REQ_PS, link: 'https://www.tees.ac.uk', academicFields: ['Computer Science & IT', 'Engineering', 'Medicine & Health Sciences', 'Communications & Media'] },
  { name: 'University of East London', country: 'UK', location: 'London', climate: 'Cold', sectors: ['Research'], baselineSelectivity: 8, internshipProgram: 'An east-London post-92 university; strong health, psychology, sport rehabilitation and construction-management placement.', requirements: REQ_PS, link: 'https://www.uel.ac.uk', academicFields: ['Medicine & Health Sciences', 'Psychology', 'Engineering', 'Business'] },
  { name: 'University of Gloucestershire', country: 'UK', location: 'Cheltenham', climate: 'Cold', sectors: ['Research'], baselineSelectivity: 8, internshipProgram: 'A small university across Cheltenham and Gloucester; strong sport, business, journalism and applied-ecology placement.', requirements: REQ_PS, link: 'https://www.glos.ac.uk', academicFields: ['Business', 'Medicine & Health Sciences', 'Arts', 'Environmental Science & Sustainability'] },
  { name: 'Staffordshire University', country: 'UK', location: 'Stoke-on-Trent', climate: 'Cold', sectors: ['Tech Hub'], baselineSelectivity: 8, internshipProgram: 'A post-92 university with a strong games-design and esports profile; also nursing, engineering and forensic science placement.', requirements: REQ_PS, link: 'https://www.staffs.ac.uk', academicFields: ['Computer Science & IT', 'Medicine & Health Sciences', 'Engineering', 'Communications & Media'] },
  { name: 'Canterbury Christ Church University', country: 'UK', location: 'Canterbury, Kent', climate: 'Cold', sectors: ['Research'], baselineSelectivity: 8, internshipProgram: 'A church-foundation university in Kent; strong teacher-training, nursing, policing and applied-social-science placement.', requirements: REQ_PS, link: 'https://www.canterbury.ac.uk', academicFields: ['Education', 'Medicine & Health Sciences', 'Social Sciences', 'Humanities'] },
  { name: 'University of South Wales', country: 'UK', location: 'Pontypridd, Wales', climate: 'Cold', sectors: ['Manufacturing & Engineering Hub'], baselineSelectivity: 8, internshipProgram: 'One of the largest universities in Wales; strong engineering, computing and cyber, aircraft maintenance, and film/creative-industries placement.', requirements: REQ_PS, link: 'https://www.southwales.ac.uk', academicFields: ['Engineering', 'Computer Science & IT', 'Medicine & Health Sciences', 'Communications & Media'] },

  // --- Conservatoires and specialist art school (no CUG overall rank -> rankValue NULL) ---
  { name: 'Royal Academy of Music', country: 'UK', location: 'London', climate: 'Cold', sectors: ['Creative Hub'], baselineSelectivity: 76, internshipProgram: 'The UK\'s oldest conservatoire (a University of London college); instrumental and vocal performance, composition, conducting and jazz, with a professional-orchestra and opera pathway.', requirements: REQ_AUDITION, link: 'https://www.ram.ac.uk', academicFields: ['Arts'] },
  { name: 'Royal College of Music', country: 'UK', location: 'London', climate: 'Cold', sectors: ['Creative Hub'], baselineSelectivity: 76, internshipProgram: 'A leading international conservatoire in South Kensington; performance, composition, conducting and historical performance, with a very high proportion of international students.', requirements: REQ_AUDITION, link: 'https://www.rcm.ac.uk', academicFields: ['Arts'] },
  { name: 'Royal Northern College of Music', country: 'UK', location: 'Manchester', climate: 'Cold', sectors: ['Creative Hub'], baselineSelectivity: 73, internshipProgram: 'Manchester\'s conservatoire; classical and popular-music performance, composition and a strong opera school, closely linked to the city\'s orchestras.', requirements: REQ_AUDITION, link: 'https://www.rncm.ac.uk', academicFields: ['Arts'] },
  { name: 'Guildhall School of Music and Drama', country: 'UK', location: 'London', climate: 'Cold', sectors: ['Creative Hub'], baselineSelectivity: 82, internshipProgram: 'The City of London\'s conservatoire; music, acting and production arts, with one of the most selective drama programmes in the UK.', requirements: REQ_AUDITION, link: 'https://www.gsmd.ac.uk', academicFields: ['Arts', 'Communications & Media'] },
  { name: 'Trinity Laban Conservatoire of Music and Dance', country: 'UK', location: 'London', climate: 'Cold', sectors: ['Creative Hub'], baselineSelectivity: 67, internshipProgram: 'The UK\'s only conservatoire combining music and contemporary dance; performance, composition, musical theatre and dance across Greenwich and Deptford.', requirements: REQ_AUDITION, link: 'https://www.trinitylaban.ac.uk', academicFields: ['Arts'] },
  { name: 'Royal Conservatoire of Scotland', country: 'UK', location: 'Glasgow, Scotland', climate: 'Cold', sectors: ['Creative Hub'], baselineSelectivity: 73, internshipProgram: 'Scotland\'s national conservatoire; music, drama, dance, production and screen, entered by audition or portfolio.', requirements: REQ_AUDITION, link: 'https://www.rcs.ac.uk', academicFields: ['Arts', 'Communications & Media'] },
  { name: 'Glasgow School of Art', country: 'UK', location: 'Glasgow, Scotland', climate: 'Cold', sectors: ['Creative Hub'], baselineSelectivity: 68, internshipProgram: 'One of Europe\'s leading art schools; fine art, design, the Mackintosh School of Architecture, and simulation and visualisation, with portfolio-based admission.', requirements: REQ_PORTFOLIO, link: 'https://www.gsa.ac.uk', academicFields: ['Arts', 'Architecture & Design', 'Communications & Media'] },
]

let inserted = 0
const skipped = []

for (const u of UNIVERSITIES) {
  const existing = await sql`SELECT id FROM universities WHERE name = ${u.name} AND country = ${u.country}`
  if (existing.length > 0) { skipped.push(u.name); continue }
  const [row] = await sql`
    INSERT INTO universities (
      name, country, location, climate, sectors, "baselineSelectivity",
      "internshipProgram", requirements, link, "academicFields"
    ) VALUES (
      ${u.name}, ${u.country}, ${u.location}, ${u.climate},
      ${JSON.stringify(u.sectors)}::jsonb, ${u.baselineSelectivity},
      ${u.internshipProgram}, ${JSON.stringify(u.requirements)}::jsonb,
      ${u.link}, ${JSON.stringify(u.academicFields)}::jsonb
    ) RETURNING id`
  console.log(`Added ${u.name}, id ${row.id}`)
  inserted++
}

console.log(`\nInserted ${inserted} UK institutions (tranche 2).`)
if (skipped.length) console.log(`Already existed, skipped: ${skipped.join(', ')}`)
