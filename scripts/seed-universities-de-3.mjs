// Germany catalog — tranche 3 (~42 rows). Runs after seed-universities-de.mjs
// and seed-universities-de-2.mjs. Brings Germany to ~145 rows.
//
// Same lightweight shape and (name, country) dedup guard as the earlier
// passes. Rankings and acceptance data land in the separate passes
// (seed-overall-rankings-de.mjs, seed-acceptance-estimates-de.mjs) — which
// have been extended to classify every name added here.
//
// Deliberate program spread (the earlier tranches were research-university
// heavy): this tranche is mostly universities of applied sciences (HAW/FH)
// across engineering, media, health, social work and business; ten art /
// music / film / drama colleges; four more research universities that THE's
// Germany guide does not rank (Leipzig, Bielefeld, Halle, Lübeck); and six
// private institutions.
//
// rankValue: every row here is left NULL — THE's "Best universities in
// Germany" guide covers only ~55 institutions and none of these are in it
// (verified against the guide, Sept 2026). Same treatment as the ~48
// tranche-2 rows past THE's list; inventing an ordinal would break the
// "ordinal among this country's own universities, from a named source"
// contract every country here follows.
//
// baselineSelectivity is a CURATED ESTIMATE (no acceptanceRateSource, and —
// per seed-acceptance-estimates-de.mjs — every German row is Tier 5 with no
// estimatedAcceptanceRate either, so this number is never realigned from a
// rate). It reflects how competitive the institution is overall and how many
// of its popular subjects carry a strict Numerus Clausus / selection
// procedure, scaled 0-100. Art/music/film schools are scored on how hard the
// portfolio/audition round is, not on grades.
//
// climate: Germany's 3-bucket mapping used in the earlier tranches — the
// southwest (Baden-Württemberg), the Rhineland (Cologne/Bonn/Düsseldorf/
// Aachen) and Hesse read as 'Balanced'; Bavaria, the north and the east
// read as 'Cold'.
//
// Usage: node --env-file=.env.local scripts/seed-universities-de-3.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const REQ_UNI = [
  'Recognized secondary qualification (Abitur-equivalent) — CBSE/ISC Standard XII accepted where it matches the anabin pattern, otherwise a Studienkolleg year first',
  'APS certificate (mandatory for applicants from India, China, Vietnam)',
  'German proficiency (DSH-2 / TestDaF 4x4) for German-taught programs; IELTS/TOEFL for English-taught programs',
  'Popular subjects may be Numerus Clausus-restricted (a grade cutoff that shifts each semester)',
]

const REQ_FH = [
  'Recognized secondary qualification; universities of applied sciences also admit strong vocational/technical qualifications',
  'APS certificate (mandatory for applicants from India, China, Vietnam)',
  'German proficiency (DSH-2 / TestDaF 4x4) or IELTS/TOEFL depending on the program language',
  'Many applied-sciences programs run an internal aptitude/selection procedure (Auswahlverfahren) rather than a pure grade cutoff',
]

const REQ_PRIVATE = [
  'Recognized secondary qualification with strong grades',
  'Selective private admission — typically an aptitude test and/or interview and essays, not a grade cutoff',
  'English and/or German proficiency depending on the program language',
  'Private tuition applies (no German public-university fee model)',
]

const REQ_ARTS = [
  'Recognized secondary qualification (sometimes waived for outstanding artistic ability)',
  'Portfolio submission and/or an entrance audition or practical test — the decisive factor',
  'German proficiency for most programs; some programs teach in English',
  'APS certificate (mandatory for applicants from India, China, Vietnam)',
]

const UNIVERSITIES = [
  // --- Research universities not in THE's Germany guide (rankValue stays NULL) ---
  { name: 'Leipzig University', country: 'DE', location: 'Leipzig, Saxony', climate: 'Cold', sectors: ['Research'], baselineSelectivity: 44, internshipProgram: 'One of Germany\'s oldest universities (founded 1409) and a large comprehensive institution; strong medicine, law, life sciences and a historic link to the city\'s publishing and trade-fair economy.', requirements: REQ_UNI, link: 'https://www.uni-leipzig.de/en', academicFields: ['Medicine & Health Sciences', 'Humanities', 'Law', 'Science & Technology / Research'] },
  { name: 'Bielefeld University', country: 'DE', location: 'Bielefeld, North Rhine-Westphalia', climate: 'Cold', sectors: ['Research'], baselineSelectivity: 42, internshipProgram: 'Founded as a reform university with an interdisciplinary focus; nationally strong in sociology, mathematics, history and the philosophy of science, built around one vast connected main building.', requirements: REQ_UNI, link: 'https://www.uni-bielefeld.de/english/', academicFields: ['Social Sciences', 'Mathematics & Statistics', 'Humanities', 'Science & Technology / Research'] },
  { name: 'Martin Luther University of Halle-Wittenberg', country: 'DE', location: 'Halle, Saxony-Anhalt', climate: 'Cold', sectors: ['Research'], baselineSelectivity: 38, internshipProgram: 'Saxony-Anhalt\'s largest university, with a long tradition in the humanities, law, pharmacy and agricultural sciences, and the seat of the Leopoldina national academy of sciences.', requirements: REQ_UNI, link: 'https://www.uni-halle.de/?lang=en', academicFields: ['Humanities', 'Law', 'Medicine & Health Sciences', 'Agriculture & Natural Resources'] },
  { name: 'University of Lübeck', country: 'DE', location: 'Lübeck, Schleswig-Holstein', climate: 'Cold', sectors: ['Research', 'Healthcare & Biotech Hub'], baselineSelectivity: 44, internshipProgram: 'A focused university built around medicine, life sciences, computer science and medical engineering, with a research-heavy curriculum and a university teaching hospital on campus.', requirements: REQ_UNI, link: 'https://www.uni-luebeck.de/en/university.html', academicFields: ['Medicine & Health Sciences', 'Computer Science & IT', 'Science & Technology / Research', 'Engineering'] },

  // --- Universities of applied sciences (HAW / FH / TH) ---
  { name: 'Münster University of Applied Sciences', country: 'DE', location: 'Münster, North Rhine-Westphalia', climate: 'Cold', sectors: ['Manufacturing & Engineering Hub', 'Business'], baselineSelectivity: 32, internshipProgram: 'One of Germany\'s largest universities of applied sciences (FH Münster); engineering, design, business and health with strongly practice-linked, project-based teaching and a compulsory internship semester.', requirements: REQ_FH, link: 'https://en.fh-muenster.de/', academicFields: ['Engineering', 'Business', 'Architecture & Design', 'Medicine & Health Sciences'] },
  { name: 'Dortmund University of Applied Sciences and Arts', country: 'DE', location: 'Dortmund, North Rhine-Westphalia', climate: 'Cold', sectors: ['Tech Hub', 'Manufacturing & Engineering Hub'], baselineSelectivity: 30, internshipProgram: 'Applied-sciences university (FH Dortmund) with a computer-science and information-technology focus alongside design, business and engineering, embedded in the Dortmund tech and startup scene.', requirements: REQ_FH, link: 'https://www.fh-dortmund.de/en/', academicFields: ['Computer Science & IT', 'Engineering', 'Architecture & Design', 'Business'] },
  { name: 'Niederrhein University of Applied Sciences', country: 'DE', location: 'Krefeld / Mönchengladbach, North Rhine-Westphalia', climate: 'Balanced', sectors: ['Manufacturing & Engineering Hub', 'Creative Hub'], baselineSelectivity: 28, internshipProgram: 'A large applied-sciences university with a nationally known textile-and-clothing faculty alongside engineering, business, design, nutrition and social work.', requirements: REQ_FH, link: 'https://www.hs-niederrhein.de/english/', academicFields: ['Engineering', 'Architecture & Design', 'Business', 'Environmental Science & Sustainability'] },
  { name: 'Bielefeld University of Applied Sciences and Arts', country: 'DE', location: 'Bielefeld, North Rhine-Westphalia', climate: 'Cold', sectors: ['Manufacturing & Engineering Hub', 'Business'], baselineSelectivity: 28, internshipProgram: 'Applied-sciences university (Hochschule Bielefeld / HSBI) across campuses in East Westphalia; engineering and mathematics, business, social work, health and a design faculty.', requirements: REQ_FH, link: 'https://www.hsbi.de/en', academicFields: ['Engineering', 'Business', 'Social Sciences', 'Architecture & Design'] },
  { name: 'Bochum University of Applied Sciences', country: 'DE', location: 'Bochum, North Rhine-Westphalia', climate: 'Cold', sectors: ['Manufacturing & Engineering Hub', 'Research'], baselineSelectivity: 28, internshipProgram: 'Applied-sciences university (Hochschule Bochum) with an engineering and geodesy core and a well-known solar-car racing team; also business and sustainable construction.', requirements: REQ_FH, link: 'https://www.hochschule-bochum.de/en/', academicFields: ['Engineering', 'Environmental Science & Sustainability', 'Business', 'Computer Science & IT'] },
  { name: 'Furtwangen University', country: 'DE', location: 'Furtwangen / Villingen-Schwenningen, Baden-Württemberg', climate: 'Balanced', sectors: ['Tech Hub', 'Healthcare & Biotech Hub'], baselineSelectivity: 32, internshipProgram: 'Black Forest applied-sciences university (HFU) with one of Germany\'s earliest computer-science faculties, plus medical and micro engineering, molecular life sciences and international business.', requirements: REQ_FH, link: 'https://www.hs-furtwangen.de/en/', academicFields: ['Computer Science & IT', 'Engineering', 'Medicine & Health Sciences', 'Business'] },
  { name: 'Stuttgart Media University', country: 'DE', location: 'Stuttgart, Baden-Württemberg', climate: 'Balanced', sectors: ['Creative Hub', 'Tech Hub'], baselineSelectivity: 34, internshipProgram: 'A public applied-sciences university (Hochschule der Medien) devoted entirely to media — print and packaging, film and audiovisual media, media informatics, library and information science, and advertising.', requirements: REQ_FH, link: 'https://www.hdm-stuttgart.de/en/', academicFields: ['Communications & Media', 'Computer Science & IT', 'Arts', 'Business'] },
  { name: 'Stuttgart University of Applied Sciences', country: 'DE', location: 'Stuttgart, Baden-Württemberg', climate: 'Balanced', sectors: ['Manufacturing & Engineering Hub', 'Creative Hub'], baselineSelectivity: 32, internshipProgram: 'Applied-sciences university (HFT Stuttgart) with a strong architecture, civil engineering, surveying and building-physics profile, plus mathematics and business administration.', requirements: REQ_FH, link: 'https://www.hft-stuttgart.com/', academicFields: ['Architecture & Design', 'Engineering', 'Mathematics & Statistics', 'Environmental Science & Sustainability'] },
  { name: 'RheinMain University of Applied Sciences', country: 'DE', location: 'Wiesbaden / Rüsselsheim, Hesse', climate: 'Balanced', sectors: ['Manufacturing & Engineering Hub', 'Business'], baselineSelectivity: 28, internshipProgram: 'Applied-sciences university (Hochschule RheinMain) across Wiesbaden and Rüsselsheim; engineering, computer science, media, design, social work and business in the Frankfurt–Rhine–Main region.', requirements: REQ_FH, link: 'https://www.hs-rm.de/en/', academicFields: ['Engineering', 'Computer Science & IT', 'Business', 'Social Sciences'] },
  { name: 'Offenburg University of Applied Sciences', country: 'DE', location: 'Offenburg, Baden-Württemberg', climate: 'Balanced', sectors: ['Manufacturing & Engineering Hub', 'Tech Hub'], baselineSelectivity: 30, internshipProgram: 'A compact, technical applied-sciences university (Hochschule Offenburg) near the French border; electrical and mechanical engineering, media and computer science.', requirements: REQ_FH, link: 'https://www.hs-offenburg.de/en/', academicFields: ['Engineering', 'Computer Science & IT', 'Communications & Media', 'Science & Technology / Research'] },
  { name: 'Technical University of Applied Sciences Würzburg-Schweinfurt', country: 'DE', location: 'Würzburg / Schweinfurt, Bavaria', climate: 'Cold', sectors: ['Manufacturing & Engineering Hub', 'Business'], baselineSelectivity: 28, internshipProgram: 'A large Bavarian applied-sciences university (THWS); engineering, plastics and elastomer technology, business, social work and a substantial English-taught international-programs portfolio.', requirements: REQ_FH, link: 'https://www.thws.de/en/', academicFields: ['Engineering', 'Business', 'Social Sciences', 'Computer Science & IT'] },
  { name: 'Rosenheim Technical University of Applied Sciences', country: 'DE', location: 'Rosenheim, Bavaria', climate: 'Cold', sectors: ['Manufacturing & Engineering Hub'], baselineSelectivity: 30, internshipProgram: 'Bavarian applied-sciences university (TH Rosenheim) known nationally for wood technology and timber construction, alongside mechanical engineering, plastics and interior design.', requirements: REQ_FH, link: 'https://www.th-rosenheim.de/en/', academicFields: ['Engineering', 'Architecture & Design', 'Business', 'Computer Science & IT'] },
  { name: 'Kempten University of Applied Sciences', country: 'DE', location: 'Kempten, Bavaria', climate: 'Cold', sectors: ['Manufacturing & Engineering Hub', 'Business'], baselineSelectivity: 28, internshipProgram: 'Applied-sciences university in the Allgäu (Hochschule Kempten); mechanical and electrical engineering, business administration, tourism management and social work.', requirements: REQ_FH, link: 'https://www.hs-kempten.de/en/', academicFields: ['Engineering', 'Business', 'Social Sciences', 'Computer Science & IT'] },
  { name: 'Fulda University of Applied Sciences', country: 'DE', location: 'Fulda, Hesse', climate: 'Balanced', sectors: ['Healthcare & Biotech Hub', 'Research'], baselineSelectivity: 30, internshipProgram: 'Applied-sciences university (Hochschule Fulda) with an unusually strong public-health and nursing-science profile, plus food technology, social work and computer science.', requirements: REQ_FH, link: 'https://www.hs-fulda.de/en/', academicFields: ['Medicine & Health Sciences', 'Social Sciences', 'Science & Technology / Research', 'Computer Science & IT'] },
  { name: 'Trier University of Applied Sciences', country: 'DE', location: 'Trier / Birkenfeld, Rhineland-Palatinate', climate: 'Balanced', sectors: ['Manufacturing & Engineering Hub', 'Creative Hub'], baselineSelectivity: 28, internshipProgram: 'Applied-sciences university (Hochschule Trier) with a dedicated Umwelt-Campus Birkenfeld for sustainability and green engineering, plus a large art-and-design school.', requirements: REQ_FH, link: 'https://www.hochschule-trier.de/en/', academicFields: ['Engineering', 'Environmental Science & Sustainability', 'Architecture & Design', 'Computer Science & IT'] },
  { name: 'Mannheim University of Applied Sciences', country: 'DE', location: 'Mannheim, Baden-Württemberg', climate: 'Balanced', sectors: ['Manufacturing & Engineering Hub', 'Healthcare & Biotech Hub'], baselineSelectivity: 30, internshipProgram: 'Applied-sciences university (Hochschule Mannheim) with a technical core — mechanical, electrical, process and biotechnology engineering — plus computer science, design and social work.', requirements: REQ_FH, link: 'https://www.hs-mannheim.de/en/', academicFields: ['Engineering', 'Computer Science & IT', 'Science & Technology / Research', 'Social Sciences'] },
  { name: 'Augsburg University of Applied Sciences', country: 'DE', location: 'Augsburg, Bavaria', climate: 'Cold', sectors: ['Manufacturing & Engineering Hub', 'Creative Hub'], baselineSelectivity: 28, internshipProgram: 'Bavarian applied-sciences university (Technische Hochschule Augsburg); mechanical, electrical and environmental engineering, computer science, architecture and a well-regarded design faculty.', requirements: REQ_FH, link: 'https://www.tha.de/en/', academicFields: ['Engineering', 'Architecture & Design', 'Computer Science & IT', 'Business'] },
  { name: 'Dresden University of Applied Sciences', country: 'DE', location: 'Dresden, Saxony', climate: 'Cold', sectors: ['Manufacturing & Engineering Hub', 'Tech Hub'], baselineSelectivity: 28, internshipProgram: 'Applied-sciences university (HTW Dresden) in "Silicon Saxony"; microelectronics, mechanical and vehicle engineering, computer science, agriculture and business.', requirements: REQ_FH, link: 'https://www.htw-dresden.de/en/', academicFields: ['Engineering', 'Computer Science & IT', 'Agriculture & Natural Resources', 'Business'] },
  { name: 'Mittweida University of Applied Sciences', country: 'DE', location: 'Mittweida, Saxony', climate: 'Cold', sectors: ['Tech Hub', 'Creative Hub'], baselineSelectivity: 28, internshipProgram: 'Saxon applied-sciences university (Hochschule Mittweida) with an established media faculty — film, television and media management — alongside engineering, computer science and applied mathematics.', requirements: REQ_FH, link: 'https://www.hs-mittweida.de/en/', academicFields: ['Communications & Media', 'Engineering', 'Computer Science & IT', 'Business'] },
  { name: 'Weihenstephan-Triesdorf University of Applied Sciences', country: 'DE', location: 'Freising, Bavaria', climate: 'Cold', sectors: ['Research', 'Manufacturing & Engineering Hub'], baselineSelectivity: 32, internshipProgram: 'One of Germany\'s leading applied-sciences universities for agriculture, horticulture, forestry, food technology, brewing science and landscape architecture, on the historic Weihenstephan campus.', requirements: REQ_FH, link: 'https://www.hswt.de/en/', academicFields: ['Agriculture & Natural Resources', 'Environmental Science & Sustainability', 'Science & Technology / Research', 'Architecture & Design'] },

  // --- Sustainability / agriculture specialists ---
  { name: 'Eberswalde University for Sustainable Development', country: 'DE', location: 'Eberswalde, Brandenburg', climate: 'Cold', sectors: ['Research'], baselineSelectivity: 32, internshipProgram: 'A small applied-sciences university (HNEE) focused entirely on sustainability — forestry, wood engineering, organic agriculture, conservation and sustainable-economy programs.', requirements: REQ_FH, link: 'https://www.hnee.de/en/', academicFields: ['Environmental Science & Sustainability', 'Agriculture & Natural Resources', 'Science & Technology / Research', 'Business'] },
  { name: 'Hochschule Geisenheim University', country: 'DE', location: 'Geisenheim, Hesse', climate: 'Balanced', sectors: ['Research'], baselineSelectivity: 34, internshipProgram: 'A specialised university for viticulture, oenology, horticulture, landscape architecture and beverage technology in the Rheingau wine region, combining university and applied-sciences status.', requirements: REQ_UNI, link: 'https://www.hs-geisenheim.de/en/', academicFields: ['Agriculture & Natural Resources', 'Environmental Science & Sustainability', 'Science & Technology / Research', 'Architecture & Design'] },

  // --- Art / music / film / drama colleges (admission by portfolio or audition) ---
  { name: 'Folkwang University of the Arts', country: 'DE', location: 'Essen, North Rhine-Westphalia', climate: 'Cold', sectors: ['Creative Hub'], baselineSelectivity: 58, internshipProgram: 'One of Germany\'s major arts universities, spanning music, theatre, dance, design and academic studies, with a historic modern-dance tradition; admission is by audition or portfolio.', requirements: REQ_ARTS, link: 'https://www.folkwang-uni.de/en/home/', academicFields: ['Arts', 'Communications & Media'] },
  { name: 'Academy of Fine Arts Munich', country: 'DE', location: 'Munich, Bavaria', climate: 'Cold', sectors: ['Creative Hub'], baselineSelectivity: 62, internshipProgram: 'One of Germany\'s oldest and most prestigious fine-arts academies; painting, sculpture, new media and art education taught in individual professor-led studio classes, with portfolio-only admission.', requirements: REQ_ARTS, link: 'https://www.adbk.de/en/', academicFields: ['Arts', 'Architecture & Design'] },
  { name: 'Stuttgart State Academy of Art and Design', country: 'DE', location: 'Stuttgart, Baden-Württemberg', climate: 'Balanced', sectors: ['Creative Hub'], baselineSelectivity: 55, internshipProgram: 'A combined fine-art and design academy — product, communication and interior design, plus art conservation and architecture — with portfolio-based, competitive admission.', requirements: REQ_ARTS, link: 'https://www.abk-stuttgart.de/en/', academicFields: ['Arts', 'Architecture & Design'] },
  { name: 'Karlsruhe University of Arts and Design', country: 'DE', location: 'Karlsruhe, Baden-Württemberg', climate: 'Balanced', sectors: ['Creative Hub', 'Tech Hub'], baselineSelectivity: 60, internshipProgram: 'A small, highly selective art-and-design school (HfG Karlsruhe) sharing a building with the ZKM media-art centre; media art, product and communication design, exhibition design and art theory.', requirements: REQ_ARTS, link: 'https://www.hfg-karlsruhe.de/en/', academicFields: ['Arts', 'Communications & Media', 'Architecture & Design'] },
  { name: 'Film University Babelsberg Konrad Wolf', country: 'DE', location: 'Potsdam, Brandenburg', climate: 'Cold', sectors: ['Creative Hub'], baselineSelectivity: 78, internshipProgram: 'Germany\'s oldest and largest film school, on the historic Babelsberg studio lot; directing, cinematography, editing, sound, production and media studies, entered by a multi-stage creative admission.', requirements: REQ_ARTS, link: 'https://www.filmuniversitaet.de/en/', academicFields: ['Arts', 'Communications & Media'] },
  { name: 'University of Music and Performing Arts Munich', country: 'DE', location: 'Munich, Bavaria', climate: 'Cold', sectors: ['Creative Hub'], baselineSelectivity: 62, internshipProgram: 'One of Germany\'s largest music academies; instrumental and vocal performance, conducting, composition and church music, plus theatre and dance with the Bavarian Theatre Academy.', requirements: REQ_ARTS, link: 'https://website.musikhochschule-muenchen.de/en/', academicFields: ['Arts'] },
  { name: 'Cologne University of Music and Dance', country: 'DE', location: 'Cologne, North Rhine-Westphalia', climate: 'Balanced', sectors: ['Creative Hub'], baselineSelectivity: 60, internshipProgram: 'Europe\'s largest conservatoire by enrolment (Hochschule für Musik und Tanz Köln); classical and contemporary performance, jazz, composition, conducting and dance across Cologne, Aachen and Wuppertal.', requirements: REQ_ARTS, link: 'https://www.hfmt-koeln.de/en/', academicFields: ['Arts'] },
  { name: 'University of Music and Theatre Leipzig', country: 'DE', location: 'Leipzig, Saxony', climate: 'Cold', sectors: ['Creative Hub'], baselineSelectivity: 60, internshipProgram: 'Germany\'s oldest conservatoire, founded by Mendelssohn in 1843 (HMT Leipzig); performance, composition, conducting, jazz, church music and acting, closely tied to the Gewandhaus orchestra.', requirements: REQ_ARTS, link: 'https://www.hmt-leipzig.de/en', academicFields: ['Arts'] },
  { name: 'University of Fine Arts of Hamburg', country: 'DE', location: 'Hamburg', climate: 'Cold', sectors: ['Creative Hub'], baselineSelectivity: 58, internshipProgram: 'A fine-arts university (HFBK Hamburg) with an open, cross-disciplinary structure spanning painting, sculpture, film, photography, graphic and time-based art, design and theory; portfolio-based admission.', requirements: REQ_ARTS, link: 'https://www.hfbk-hamburg.de/en/', academicFields: ['Arts', 'Communications & Media', 'Architecture & Design'] },
  { name: 'Burg Giebichenstein University of Art and Design Halle', country: 'DE', location: 'Halle, Saxony-Anhalt', climate: 'Cold', sectors: ['Creative Hub'], baselineSelectivity: 52, internshipProgram: 'One of Germany\'s largest art-and-design universities, strong in industrial and product design, ceramics and fine art, continuing the tradition of the Bauhaus-era Burg workshops.', requirements: REQ_ARTS, link: 'https://www.burg-halle.de/en/', academicFields: ['Architecture & Design', 'Arts'] },

  // --- Private institutions ---
  { name: 'EBS University', country: 'DE', location: 'Oestrich-Winkel / Wiesbaden, Hesse', climate: 'Balanced', sectors: ['Business', 'Finance Capital'], baselineSelectivity: 52, internshipProgram: 'A private business-and-law university in the Rheingau near Frankfurt; management, finance and law with a compulsory term abroad, mandatory internships and close corporate ties.', requirements: REQ_PRIVATE, link: 'https://www.ebs.edu/en', academicFields: ['Business', 'Law', 'Economics'] },
  { name: 'Zeppelin University', country: 'DE', location: 'Friedrichshafen, Baden-Württemberg', climate: 'Balanced', sectors: ['Business', 'Government & Policy Hub'], baselineSelectivity: 50, internshipProgram: 'A small private university on Lake Constance bridging business, culture, communication and political/administrative science, with an interdisciplinary "between economy, culture and politics" model.', requirements: REQ_PRIVATE, link: 'https://www.zu.de/english/', academicFields: ['Business', 'Social Sciences', 'Communications & Media', 'Economics'] },
  { name: 'CODE University of Applied Sciences', country: 'DE', location: 'Berlin', climate: 'Cold', sectors: ['Tech Hub'], baselineSelectivity: 48, internshipProgram: 'A private Berlin university teaching only software engineering, interaction design and product management through self-directed, project-based learning; admission is by an aptitude challenge, not grades.', requirements: REQ_PRIVATE, link: 'https://code.berlin/en/', academicFields: ['Computer Science & IT', 'Architecture & Design', 'Business'] },
  { name: 'Munich Business School', country: 'DE', location: 'Munich, Bavaria', climate: 'Cold', sectors: ['Business'], baselineSelectivity: 44, internshipProgram: 'One of Germany\'s oldest private business schools; international-management bachelor and master programs taught in English with a required semester abroad and internship.', requirements: REQ_PRIVATE, link: 'https://www.munich-business-school.de/en', academicFields: ['Business', 'Economics'] },
  { name: 'Hochschule Fresenius', country: 'DE', location: 'Idstein, Hesse (multi-campus)', climate: 'Balanced', sectors: ['Healthcare & Biotech Hub', 'Business'], baselineSelectivity: 34, internshipProgram: 'One of Germany\'s largest private universities of applied sciences, spanning health and social sciences, chemistry and biology, business, psychology and the AMD design school.', requirements: REQ_PRIVATE, link: 'https://www.hs-fresenius.de/en/', academicFields: ['Medicine & Health Sciences', 'Business', 'Psychology', 'Arts'] },
  { name: 'SRH Berlin University of Applied Sciences', country: 'DE', location: 'Berlin', climate: 'Cold', sectors: ['Business', 'Creative Hub'], baselineSelectivity: 36, internshipProgram: 'A private applied-sciences university with campuses in Berlin, Dresden and Hamburg; management, technology, film and creative-industries programs taught largely in English.', requirements: REQ_PRIVATE, link: 'https://www.srh-berlin.de/en/', academicFields: ['Business', 'Computer Science & IT', 'Communications & Media', 'Arts'] },
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

console.log(`\nInserted ${inserted} German institutions (tranche 3).`)
if (skipped.length) console.log(`Already existed, skipped: ${skipped.join(', ')}`)
