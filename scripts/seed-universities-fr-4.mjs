// France catalog — tranche 4 (~18 rows). Runs after seed-universities-fr-3.mjs.
// Brings France to ~167 rows. Same lightweight shape and (name, country)
// dedup guard as the earlier passes.
//
// France is already deep (149 rows), so this tranche is deliberately narrow
// and program-diverse rather than a broad fill: art/design/photography
// schools, an art-history institute, a communication school, three more
// engineering schools, two more Catholic multi-faculty universities, three
// small public universities, one more regional IEP, and one THE-ranked
// public engineering grande école (ENTPE) that was missing.
//
// Rankings: only ENTPE is added to seed-overall-rankings-fr.mjs (THE France
// 2026 ranks it at #13, tied). Every other row here is not in THE's France
// guide (~48 institutions) and stays rankValue NULL, exactly like the other
// specialist schools already in the catalog.
//
// Acceptance rate: seed-acceptance-estimates-fr.mjs has been extended to
// classify every name here — Parcoursup taux d'accès estimate for the
// private post-bac schools and Catholic universities, non-selective-licence
// estimate for the three public universities, the common IEP concours
// estimate for Sciences Po Toulouse, a direct applicant/admit estimate for
// the École du Louvre and CELSA, and a "no comparable rate" note for the
// portfolio/creative-concours schools (EnsAD, ENSP Arles, Villa Arson, ESA)
// and the concours-after-prépa school (ENTPE).
//
// Usage: node --env-file=.env.local scripts/seed-universities-fr-4.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const REQ_UNIV = [
  'Secondary diploma recognized as Baccalauréat-equivalent (CBSE/ISC, IB, A-Levels accepted; a US diploma is usually paired with SAT/AP)',
  'Campus France "Études en France" dossier first for non-EU applicants from a CEF country (India included)',
  'Apply via Parcoursup for licence (bachelor) programs',
  'French proficiency (DELF/DALF B2 or TCF) for French-taught programs; IELTS/TOEFL for English-taught',
]
const REQ_POSTBAC_ENG = [
  'Post-bac admission via Parcoursup — on the high-school record, often with a written test and/or interview',
  'Strong grades in mathematics and physics',
  'Campus France "Études en France" dossier for non-EU CEF-country applicants',
  'French and/or English proficiency depending on the program',
]
const REQ_PREPA = [
  'Two years of classes préparatoires (CPGE) followed by the competitive concours — or a small separate admissions track',
  'Very strong high-school and prépa academic record',
  'Campus France "Études en France" dossier for non-EU CEF-country applicants',
  'French and/or English proficiency depending on the program',
]
const REQ_BSCHOOL = [
  'Post-bac concours via Parcoursup (SESAME, ACCÈS, Team, Pass...) or a post-prépa concours',
  'Strong high-school transcripts; the concours weighs written tests and interviews',
  'Campus France "Études en France" dossier for non-EU CEF-country applicants',
  'English proficiency (IELTS/TOEFL); French for French-taught tracks',
]
const REQ_ART = [
  'Portfolio (book) and an entrance examination or interview assessed by a jury — the decisive factor, not an academic concours',
  'A recognized secondary diploma (Baccalauréat-equivalent); some programs also require a foundation year',
  'Campus France "Études en France" dossier for non-EU CEF-country applicants',
  'French proficiency for most programs; some English-taught tracks',
]
const REQ_CATHO = [
  'Secondary diploma recognized as Baccalauréat-equivalent; admission on the school record via Parcoursup, sometimes with an interview',
  'Campus France "Études en France" dossier for non-EU CEF-country applicants',
  'French proficiency (DELF/DALF B2 or TCF) for French-taught programs; IELTS/TOEFL for English-taught',
  'Private tuition applies (these are private non-profit institutions)',
]
const REQ_IEP = [
  'The common post-bac entrance examination of the network of Instituts d\'études politiques (concours commun)',
  'Very strong high-school transcripts across history, languages and general knowledge',
  'Campus France "Études en France" dossier for non-EU CEF-country applicants',
  'French proficiency (DELF/DALF B2 or TCF); some English-taught courses',
]

const UNIVERSITIES = [
  // --- THE-ranked public engineering grande école (ranked in seed-overall-rankings-fr.mjs) ---
  { name: 'ENTPE', country: 'FR', location: 'Vaulx-en-Velin, Auvergne-Rhône-Alpes', climate: 'Balanced', sectors: ['Manufacturing & Engineering Hub', 'Research'], baselineSelectivity: 72, internshipProgram: 'A public civil-engineering grande école (École nationale des travaux publics de l\'État) focused on public works, urban planning, transport, buildings and the environment; entered by concours after prépa, historically training state civil engineers.', requirements: REQ_PREPA, link: 'https://www.entpe.fr/', academicFields: ['Engineering', 'Environmental Science & Sustainability', 'Architecture & Design'] },

  // --- Art / design / photography schools (portfolio or creative concours) ---
  { name: 'École nationale supérieure des arts décoratifs', country: 'FR', location: 'Paris', climate: 'Balanced', sectors: ['Creative Hub'], baselineSelectivity: 78, internshipProgram: 'A national art-and-design school ("Arts Déco"), highly selective on portfolio and entrance tests, spanning graphic, product, textile, interior, animation, photo/video and scenography design.', requirements: REQ_ART, link: 'https://www.ensad.fr/en', academicFields: ['Architecture & Design', 'Arts', 'Communications & Media'] },
  { name: 'École nationale supérieure de la photographie', country: 'FR', location: 'Arles, Provence-Alpes-Côte d\'Azur', climate: 'Warm', sectors: ['Creative Hub'], baselineSelectivity: 80, internshipProgram: 'France\'s national photography school, in the city of the Rencontres d\'Arles festival; a very small portfolio-selected cohort covering artistic and documentary photography and the moving image.', requirements: REQ_ART, link: 'https://www.ensp-arles.fr/en/', academicFields: ['Arts', 'Communications & Media'] },
  { name: 'Villa Arson', country: 'FR', location: 'Nice, Provence-Alpes-Côte d\'Azur', climate: 'Warm', sectors: ['Creative Hub'], baselineSelectivity: 74, internshipProgram: 'A national contemporary-art school and art centre on a modernist hilltop campus; small studio-based cohorts admitted on portfolio and interview.', requirements: REQ_ART, link: 'https://www.villa-arson.fr/en/', academicFields: ['Arts'] },
  { name: 'École Spéciale d\'Architecture', country: 'FR', location: 'Paris', climate: 'Balanced', sectors: ['Creative Hub'], baselineSelectivity: 60, internshipProgram: 'A private, independent architecture school in Montparnasse known for an experimental, studio-driven pedagogy; admission on the school record, portfolio and interview.', requirements: REQ_ART, link: 'https://www.esa-paris.fr/', academicFields: ['Architecture & Design', 'Arts'] },

  // --- Art-history and communication schools (direct competitive selection) ---
  { name: 'École du Louvre', country: 'FR', location: 'Paris', climate: 'Balanced', sectors: ['Creative Hub', 'Government & Policy Hub'], baselineSelectivity: 87, internshipProgram: 'A higher-education institution specialising in art history, archaeology, epigraphy, anthropology and museum studies; first-cycle admission is by a written entrance examination.', requirements: ['Written entrance examination (a reasoning test plus general-culture questions) for first-cycle admission', 'A recognized secondary diploma (Baccalauréat-equivalent)', 'Campus France "Études en France" dossier for non-EU CEF-country applicants', 'French proficiency — most teaching is in French'], link: 'https://www.ecoledulouvre.fr/en', academicFields: ['Arts', 'Humanities'] },
  { name: 'CELSA – Sorbonne University', country: 'FR', location: 'Neuilly-sur-Seine, Île-de-France', climate: 'Balanced', sectors: ['Creative Hub', 'Business'], baselineSelectivity: 85, internshipProgram: 'Sorbonne University\'s school of communication and journalism; highly selective admission (mostly at L3 and master level) by competitive dossier and written exam across journalism, communication, marketing and human resources.', requirements: ['Competitive admission by dossier and written examination — mostly at licence-3 and master level, on top of prior higher-education study', 'A strong academic record in the humanities or social sciences', 'Campus France "Études en France" dossier for non-EU CEF-country applicants', 'French proficiency — teaching is in French'], link: 'https://www.celsa.fr/', academicFields: ['Communications & Media', 'Business'] },

  // --- Engineering schools ---
  { name: 'Institut Mines-Télécom Business School', country: 'FR', location: 'Évry-Courcouronnes, Île-de-France', climate: 'Balanced', sectors: ['Business', 'Tech Hub'], baselineSelectivity: 60, internshipProgram: 'A public business school within the Institut Mines-Télécom, positioned at the management–technology interface; recruits via post-prépa concours and post-bac tracks.', requirements: REQ_BSCHOOL, link: 'https://www.imt-bs.eu/en/', academicFields: ['Business', 'Computer Science & IT'] },
  { name: 'ESIEA', country: 'FR', location: 'Paris / Laval', climate: 'Balanced', sectors: ['Tech Hub'], baselineSelectivity: 45, internshipProgram: 'A private post-bac engineering school specialised in digital sciences — software, AI, cybersecurity and embedded systems — with campuses in Paris and Laval.', requirements: REQ_POSTBAC_ENG, link: 'https://www.esiea.fr/en/', academicFields: ['Computer Science & IT', 'Engineering'] },
  { name: 'EIGSI La Rochelle', country: 'FR', location: 'La Rochelle, Nouvelle-Aquitaine', climate: 'Balanced', sectors: ['Manufacturing & Engineering Hub'], baselineSelectivity: 45, internshipProgram: 'A private generalist engineering school recruiting mainly post-bac via Parcoursup; mechanical, energy, industrial and integrated-engineering tracks, with a second campus in Casablanca.', requirements: REQ_POSTBAC_ENG, link: 'https://www.eigsi.fr/en/', academicFields: ['Engineering', 'Science & Technology / Research'] },
  { name: 'ISEN Yncréa Ouest', country: 'FR', location: 'Brest / Nantes / Rennes / Caen', climate: 'Balanced', sectors: ['Tech Hub'], baselineSelectivity: 45, internshipProgram: 'A private digital-and-electronics engineering school across western France; embedded systems, networks, health technology and software, with a large post-bac intake.', requirements: REQ_POSTBAC_ENG, link: 'https://www.isen-ouest.fr/en/', academicFields: ['Engineering', 'Computer Science & IT'] },

  // --- Catholic multi-faculty universities (private non-profit) ---
  { name: 'Institut Catholique de Paris', country: 'FR', location: 'Paris', climate: 'Balanced', sectors: ['Research'], baselineSelectivity: 35, internshipProgram: 'A private multi-faculty university in the humanities tradition — theology, philosophy, history, languages, law, education, and social and political science — in central Paris.', requirements: REQ_CATHO, link: 'https://en.icp.fr/', academicFields: ['Humanities', 'Law', 'Social Sciences', 'Education'] },
  { name: 'Lille Catholic University', country: 'FR', location: 'Lille, Hauts-de-France', climate: 'Cold', sectors: ['Research', 'Healthcare & Biotech Hub'], baselineSelectivity: 40, internshipProgram: 'France\'s largest private non-profit university, federating faculties and schools — medicine, law, management, science and engineering — plus a teaching-hospital group.', requirements: REQ_CATHO, link: 'https://www.univ-catholille.fr/en', academicFields: ['Medicine & Health Sciences', 'Law', 'Business', 'Humanities'] },
  { name: 'UCLy (Lyon Catholic University)', country: 'FR', location: 'Lyon, Auvergne-Rhône-Alpes', climate: 'Balanced', sectors: ['Research'], baselineSelectivity: 35, internshipProgram: 'A private multi-faculty university in Lyon; law, philosophy and theology, languages, education, and a business school, with a strong humanities identity.', requirements: REQ_CATHO, link: 'https://www.ucly.fr/en/', academicFields: ['Humanities', 'Law', 'Business', 'Social Sciences'] },

  // --- Small public universities ---
  { name: 'University of Le Havre Normandy', country: 'FR', location: 'Le Havre, Normandy', climate: 'Cold', sectors: ['Research'], baselineSelectivity: 15, internshipProgram: 'A public university in France\'s largest seaport; logistics and supply-chain management, international trade, applied sciences and languages.', requirements: REQ_UNIV, link: 'https://www.univ-lehavre.fr/', academicFields: ['Business', 'Science & Technology / Research', 'Humanities', 'Environmental Science & Sustainability'] },
  { name: 'University of Nîmes', country: 'FR', location: 'Nîmes, Occitanie', climate: 'Warm', sectors: ['Research'], baselineSelectivity: 15, internshipProgram: 'A small public university in southern France offering compact bachelor and master programs across science, law-economics-management, arts-letters-languages and psychology.', requirements: REQ_UNIV, link: 'https://www.unimes.fr/', academicFields: ['Science & Technology / Research', 'Law', 'Psychology', 'Arts'] },
  { name: 'University of Corsica Pascal Paoli', country: 'FR', location: 'Corte, Corsica', climate: 'Warm', sectors: ['Research'], baselineSelectivity: 15, internshipProgram: 'Corsica\'s only university, refounded in 1981; strengths in island-relevant fields — renewable energy, Mediterranean ecology, tourism, and Corsican language and culture.', requirements: REQ_UNIV, link: 'https://www.universita.corsica/en/', academicFields: ['Science & Technology / Research', 'Environmental Science & Sustainability', 'Humanities', 'Business'] },

  // --- Regional institute of political studies ---
  { name: 'Sciences Po Toulouse', country: 'FR', location: 'Toulouse, Occitanie', climate: 'Warm', sectors: ['Government & Policy Hub', 'Research'], baselineSelectivity: 80, internshipProgram: 'One of France\'s regional instituts d\'études politiques; a five-year program in political science, public affairs, journalism and international relations, entered by the common post-bac IEP concours.', requirements: REQ_IEP, link: 'https://www.sciencespo-toulouse.fr/', academicFields: ['Social Sciences', 'Law', 'Communications & Media', 'Humanities'] },
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

console.log(`\nInserted ${inserted} French institutions (tranche 4).`)
if (skipped.length) console.log(`Already existed, skipped: ${skipped.join(', ')}`)
