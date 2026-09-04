// France catalog — new country ('FR'), tranche 1 (~55 rows). Same lightweight
// shape and dedup-by-(name,country) guard as seed-universities.mjs.
//
// France's higher-ed system splits into tracks that admit very differently,
// and the catalog reflects that:
//   - Public universities: non-selective at licence (bachelor) level — apply
//     via Parcoursup; clearing the Baccalaureat-equivalent bar is usually
//     enough (capped fields like medicine excepted).
//   - Grandes ecoles (engineering / business): highly selective, entered
//     after two years of classes preparatoires + a national concours, or via
//     a post-bac concours (SESAME, GEIPI, Avenir...).
//   - Sciences Po / IEPs, Dauphine, ENS: selective public institutions with
//     their own procedures.
//
// This tranche: the THE-France-ranked universities, the elite science and
// generalist grandes ecoles, the ecoles normales superieures, Sciences Po
// Paris + Dauphine. Tranche 2 adds the wider engineering-school and
// business-school sets and more regional universities.
//
// rankValue (set in seed-overall-rankings-fr.mjs) uses THE's France ordinal,
// the same single-source-per-country convention as DE/AU. The specialist
// French rankings (L'Etudiant engineering, L'Etudiant business) go into
// programRankings via seed-program-rankings-fr.mjs, exactly where the US /
// India / UK subject rankings live.
//
// baselineSelectivity is a curated estimate. Acceptance-rate handling is in
// seed-acceptance-estimates-fr.mjs — France DOES support real estimates for
// a good share of rows (Parcoursup taux d'acces open data; concours and
// Sciences Po published counts), unlike Germany.
//
// climate: south = Warm; Paris/centre/west = Balanced; north/east = Cold.
//
// Usage: node --env-file=.env.local scripts/seed-universities-fr.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const REQ_UNIV = [
  'Secondary diploma recognized as Baccalauréat-equivalent (CBSE/ISC, IB, A-Levels accepted; a US diploma is usually paired with SAT/AP)',
  'Campus France "Études en France" dossier first for non-EU applicants from a CEF country (India included)',
  'Apply via Parcoursup for licence (bachelor) programs',
  'French proficiency (DELF/DALF B2 or TCF) for French-taught programs; IELTS/TOEFL for English-taught',
]

const REQ_GE_PREPA = [
  'Two years of classes préparatoires (CPGE) followed by the competitive concours — or an international/university admissions track for some programs',
  'Very strong high-school and prépa academic record',
  'Campus France "Études en France" dossier for non-EU CEF-country applicants',
  'French and/or English proficiency depending on the program',
]

const REQ_GE_POSTBAC = [
  'Post-bac concours via Parcoursup (e.g. GEIPI, Avenir, Puissance Alpha for engineering) — written tests plus, for some, an interview',
  'Strong high-school transcripts (bulletins) from the last 2-3 years',
  'Campus France "Études en France" dossier for non-EU CEF-country applicants',
  'French and/or English proficiency depending on the program',
]

const UNIVERSITIES = [
  // --- Universities (THE France list) + Dauphine + Sciences Po ---
  { name: 'PSL University', country: 'FR', location: 'Paris', climate: 'Balanced', sectors: ['Research'], baselineSelectivity: 80, internshipProgram: 'A collegiate university federating ENS-PSL, Dauphine-PSL, Mines Paris-PSL, ESPCI and others; research-intensive, small cohorts, strong CNRS lab access.', requirements: ['Admission is to a component school — see ENS-PSL, Université Paris-Dauphine, Mines Paris — each with its own concours or selection procedure', 'Campus France "Études en France" dossier for non-EU CEF-country applicants', 'French and/or English proficiency depending on the program'], link: 'https://psl.eu/en', academicFields: ['Science & Technology / Research', 'Humanities', 'Business', 'Engineering'] },
  { name: 'Institut Polytechnique de Paris', country: 'FR', location: 'Palaiseau, Île-de-France', climate: 'Balanced', sectors: ['Tech Hub', 'Research'], baselineSelectivity: 88, internshipProgram: 'An alliance of École Polytechnique, ENSTA Paris, Télécom Paris, ENSAE Paris and Télécom SudParis on the Saclay plateau; deep links to industrial R&D and deep-tech startups.', requirements: ['Admission is to a member school (École Polytechnique, ENSTA, Télécom Paris, ENSAE) — each via concours or a bachelor/master admissions track', 'Campus France "Études en France" dossier for non-EU CEF-country applicants', 'French and/or English proficiency depending on the program'], link: 'https://www.ip-paris.fr/en', academicFields: ['Engineering', 'Computer Science & IT', 'Science & Technology / Research', 'Mathematics & Statistics'] },
  { name: 'Université Paris-Saclay', country: 'FR', location: 'Gif-sur-Yvette, Île-de-France', climate: 'Balanced', sectors: ['Research', 'Tech Hub'], baselineSelectivity: 55, internshipProgram: 'France\'s largest research university by output, on a campus cluster with CEA, CNRS and INRAE labs; very strong physics, mathematics and biology.', requirements: REQ_UNIV, link: 'https://www.universite-paris-saclay.fr/en', academicFields: ['Science & Technology / Research', 'Mathematics & Statistics', 'Engineering', 'Medicine & Health Sciences'] },
  { name: 'Sorbonne University', country: 'FR', location: 'Paris', climate: 'Balanced', sectors: ['Research'], baselineSelectivity: 58, internshipProgram: 'Large research university spanning sciences, medicine and the humanities in central Paris; strong mathematics, physics and literature.', requirements: REQ_UNIV, link: 'https://www.sorbonne-universite.fr/en', academicFields: ['Humanities', 'Science & Technology / Research', 'Medicine & Health Sciences', 'Mathematics & Statistics'] },
  { name: 'Université Paris Cité', country: 'FR', location: 'Paris', climate: 'Balanced', sectors: ['Research'], baselineSelectivity: 52, internshipProgram: 'Broad research university formed from Paris Descartes and Paris Diderot; medicine, life sciences, and social sciences with Paris teaching-hospital links.', requirements: REQ_UNIV, link: 'https://u-paris.fr/en/', academicFields: ['Medicine & Health Sciences', 'Science & Technology / Research', 'Social Sciences', 'Humanities'] },
  { name: 'École Normale Supérieure de Lyon', country: 'FR', location: 'Lyon', climate: 'Balanced', sectors: ['Research'], baselineSelectivity: 90, internshipProgram: 'Elite research-and-teacher-training school; entry mainly by concours after prépa, with a small international selection. Very high placement into academia and CNRS.', requirements: REQ_GE_PREPA, link: 'https://www.ens-lyon.fr/en/', academicFields: ['Science & Technology / Research', 'Humanities', 'Mathematics & Statistics', 'Social Sciences'] },
  { name: 'Université Grenoble Alpes', country: 'FR', location: 'Grenoble', climate: 'Balanced', sectors: ['Tech Hub', 'Research'], baselineSelectivity: 46, internshipProgram: 'Research university in a major microelectronics and energy hub (CEA-Leti nearby); strong physics, computer science and environmental science.', requirements: REQ_UNIV, link: 'https://www.univ-grenoble-alpes.fr/english/', academicFields: ['Science & Technology / Research', 'Computer Science & IT', 'Environmental Science & Sustainability', 'Engineering'] },
  { name: 'Aix-Marseille University', country: 'FR', location: 'Marseille', climate: 'Warm', sectors: ['Research'], baselineSelectivity: 42, internshipProgram: 'One of the largest French-speaking universities; broad research profile with strong physics, medicine, economics and law faculties.', requirements: REQ_UNIV, link: 'https://www.univ-amu.fr/en', academicFields: ['Science & Technology / Research', 'Medicine & Health Sciences', 'Law', 'Social Sciences'] },
  { name: 'University of Bordeaux', country: 'FR', location: 'Bordeaux', climate: 'Warm', sectors: ['Research'], baselineSelectivity: 44, internshipProgram: 'Research university strong in the life sciences, optics/lasers and archaeology; wine-science programs unique to the region.', requirements: REQ_UNIV, link: 'https://www.u-bordeaux.fr/en/', academicFields: ['Science & Technology / Research', 'Medicine & Health Sciences', 'Law', 'Agriculture & Natural Resources'] },
  { name: 'University of Montpellier', country: 'FR', location: 'Montpellier', climate: 'Warm', sectors: ['Research'], baselineSelectivity: 44, internshipProgram: 'Home to one of the world\'s oldest medical schools; strong ecology, agronomy, chemistry and water-science research.', requirements: REQ_UNIV, link: 'https://www.umontpellier.fr/en/', academicFields: ['Medicine & Health Sciences', 'Environmental Science & Sustainability', 'Science & Technology / Research', 'Agriculture & Natural Resources'] },
  { name: 'University of Strasbourg', country: 'FR', location: 'Strasbourg', climate: 'Cold', sectors: ['Research'], baselineSelectivity: 46, internshipProgram: 'Research university with several Nobel-linked chemistry and physics groups; European-institutions proximity feeds law and political science.', requirements: REQ_UNIV, link: 'https://en.unistra.fr/', academicFields: ['Science & Technology / Research', 'Law', 'Social Sciences', 'Humanities'] },
  { name: 'Claude Bernard University Lyon 1', country: 'FR', location: 'Lyon', climate: 'Balanced', sectors: ['Research'], baselineSelectivity: 44, internshipProgram: 'The science-and-health university of Lyon; medicine, pharmacy, mathematics and physics with a large teaching-hospital network.', requirements: REQ_UNIV, link: 'https://www.univ-lyon1.fr/en/', academicFields: ['Medicine & Health Sciences', 'Science & Technology / Research', 'Mathematics & Statistics'] },
  { name: 'University of Lille', country: 'FR', location: 'Lille', climate: 'Cold', sectors: ['Research'], baselineSelectivity: 40, internshipProgram: 'Large multidisciplinary university in northern France; strong law, health, and social-science faculties and a growing AI research centre.', requirements: REQ_UNIV, link: 'https://www.univ-lille.fr/en/', academicFields: ['Law', 'Medicine & Health Sciences', 'Social Sciences', 'Science & Technology / Research'] },
  { name: 'Nantes Université', country: 'FR', location: 'Nantes', climate: 'Balanced', sectors: ['Research'], baselineSelectivity: 40, internshipProgram: 'West-coast research university with strengths in materials, marine science and medicine; part of a alliance with Centrale Nantes.', requirements: REQ_UNIV, link: 'https://english.univ-nantes.fr/', academicFields: ['Science & Technology / Research', 'Medicine & Health Sciences', 'Law', 'Environmental Science & Sustainability'] },
  { name: 'University of Toulouse', country: 'FR', location: 'Toulouse', climate: 'Warm', sectors: ['Manufacturing & Engineering Hub', 'Research'], baselineSelectivity: 42, internshipProgram: 'Umbrella research university in Europe\'s aerospace capital (Airbus, ONERA, CNES); strong aeronautics-adjacent science and economics (Toulouse School of Economics).', requirements: REQ_UNIV, link: 'https://www.univ-toulouse.fr/en', academicFields: ['Science & Technology / Research', 'Engineering', 'Social Sciences', 'Mathematics & Statistics'] },
  { name: 'Université Côte d\'Azur', country: 'FR', location: 'Nice', climate: 'Warm', sectors: ['Tech Hub', 'Research'], baselineSelectivity: 40, internshipProgram: 'Research university next to the Sophia Antipolis technology park; computer science, AI (3IA Côte d\'Azur), astrophysics and law.', requirements: REQ_UNIV, link: 'https://univ-cotedazur.eu/', academicFields: ['Computer Science & IT', 'Science & Technology / Research', 'Law', 'Humanities'] },
  { name: 'University of Rennes', country: 'FR', location: 'Rennes', climate: 'Balanced', sectors: ['Research', 'Tech Hub'], baselineSelectivity: 40, internshipProgram: 'Science, health and law university in a strong telecoms/electronics region; digital-technology and photonics research.', requirements: REQ_UNIV, link: 'https://en.univ-rennes.fr/', academicFields: ['Science & Technology / Research', 'Computer Science & IT', 'Law', 'Medicine & Health Sciences'] },
  { name: 'Panthéon-Sorbonne University', country: 'FR', location: 'Paris', climate: 'Balanced', sectors: ['Government & Policy Hub', 'Research'], baselineSelectivity: 55, internshipProgram: 'Paris 1 — economics, law, political science, art history and philosophy; a feeder into the civil service, international organisations and academia. Popular licences are capped and competitive.', requirements: REQ_UNIV, link: 'https://www.pantheonsorbonne.fr/en', academicFields: ['Law', 'Social Sciences', 'Humanities', 'Business'] },
  { name: 'Université Paris-Dauphine – PSL', country: 'FR', location: 'Paris', climate: 'Balanced', sectors: ['Finance Capital', 'Business'], baselineSelectivity: 78, internshipProgram: 'A selective "grand établissement" within PSL for economics, management, finance and applied mathematics; recruits on file via Parcoursup and feeds finance and consulting.', requirements: ['Selective admission on high-school record via Parcoursup (much more competitive than a standard licence)', 'Strong quantitative background', 'Campus France "Études en France" dossier for non-EU CEF-country applicants', 'French proficiency for French-taught programs; some English-taught tracks'], link: 'https://dauphine.psl.eu/en/', academicFields: ['Business', 'Mathematics & Statistics', 'Social Sciences'] },
  { name: 'Sciences Po', country: 'FR', location: 'Paris', climate: 'Balanced', sectors: ['Government & Policy Hub', 'Research'], baselineSelectivity: 88, internshipProgram: 'France\'s leading school for politics, international affairs, law, economics and journalism; a compulsory third year abroad and a strong pipeline into diplomacy, policy, media and consulting.', requirements: ['Application on school record + written work + an oral interview (no written entrance exam since 2021)', 'Choice of a French-taught or English-taught bachelor track and a regional campus', 'Campus France "Études en France" dossier for non-EU CEF-country applicants', 'Proficiency in the language of instruction'], link: 'https://www.sciencespo.fr/en/', academicFields: ['Social Sciences', 'Law', 'Humanities', 'Communications & Media'] },

  // --- Elite engineering & science grandes écoles ---
  { name: 'École Polytechnique', country: 'FR', location: 'Palaiseau, Île-de-France', climate: 'Balanced', sectors: ['Tech Hub', 'Research'], baselineSelectivity: 96, internshipProgram: 'France\'s most prestigious engineering school ("l\'X"); a military-adjacent cycle ingénieur entered by concours after prépa, plus a selective English-taught Bachelor of Science. Elite placement across research, industry and the civil service.', requirements: ['Cycle ingénieur: two years of prépa (MP/PC/PSI/...) + the very competitive X concours — or the international admissions track', 'Bachelor of Science: selective application on academic record + interview', 'Campus France "Études en France" dossier for non-EU CEF-country applicants', 'Strong mathematics and physics; French and/or English depending on the program'], link: 'https://www.polytechnique.edu/en', academicFields: ['Engineering', 'Mathematics & Statistics', 'Science & Technology / Research', 'Computer Science & IT'] },
  { name: 'ENSTA Paris', country: 'FR', location: 'Palaiseau, Île-de-France', climate: 'Balanced', sectors: ['Tech Hub', 'Research'], baselineSelectivity: 82, internshipProgram: 'Top generalist engineering school within Institut Polytechnique de Paris; strong in applied mathematics, robotics, energy and defence-adjacent systems.', requirements: REQ_GE_PREPA, link: 'https://www.ensta-paris.fr/en', academicFields: ['Engineering', 'Computer Science & IT', 'Mathematics & Statistics', 'Science & Technology / Research'] },
  { name: 'CentraleSupélec', country: 'FR', location: 'Gif-sur-Yvette, Île-de-France', climate: 'Balanced', sectors: ['Tech Hub', 'Research'], baselineSelectivity: 90, internshipProgram: 'A merger of two historic generalist engineering schools; broad engineering plus a strong systems/energy focus, with a large corporate partnership network on the Saclay plateau.', requirements: REQ_GE_PREPA, link: 'https://www.centralesupelec.fr/en', academicFields: ['Engineering', 'Computer Science & IT', 'Science & Technology / Research', 'Business'] },
  { name: 'Mines Paris – PSL', country: 'FR', location: 'Paris', climate: 'Balanced', sectors: ['Tech Hub', 'Research'], baselineSelectivity: 90, internshipProgram: 'Historic top-tier engineering school (part of PSL); energy, materials, applied mathematics and geosciences with a famously strong industrial and consulting network.', requirements: REQ_GE_PREPA, link: 'https://www.minesparis.psl.eu/en/', academicFields: ['Engineering', 'Science & Technology / Research', 'Environmental Science & Sustainability', 'Computer Science & IT'] },
  { name: 'École des Ponts ParisTech', country: 'FR', location: 'Champs-sur-Marne, Île-de-France', climate: 'Balanced', sectors: ['Manufacturing & Engineering Hub', 'Research'], baselineSelectivity: 86, internshipProgram: 'One of France\'s oldest engineering schools; civil engineering, transport, environment and applied mathematics/finance, with a strong quantitative-finance placement record.', requirements: REQ_GE_PREPA, link: 'https://ecoledesponts.fr/en', academicFields: ['Engineering', 'Environmental Science & Sustainability', 'Mathematics & Statistics', 'Architecture & Design'] },
  { name: 'Télécom Paris', country: 'FR', location: 'Palaiseau, Île-de-France', climate: 'Balanced', sectors: ['Tech Hub', 'Research'], baselineSelectivity: 85, internshipProgram: 'The leading French engineering school for information and communication technology (within IP Paris); computer science, networks, data science and a strong startup incubator (StationF partner).', requirements: REQ_GE_PREPA, link: 'https://www.telecom-paris.fr/en/home', academicFields: ['Computer Science & IT', 'Engineering', 'Communications & Media', 'Science & Technology / Research'] },
  { name: 'ISAE-SUPAERO', country: 'FR', location: 'Toulouse', climate: 'Warm', sectors: ['Manufacturing & Engineering Hub', 'Research'], baselineSelectivity: 86, internshipProgram: 'The world\'s leading aerospace engineering school; aeronautics, space systems and propulsion, in the middle of Europe\'s aerospace industry (Airbus, CNES, ONERA).', requirements: REQ_GE_PREPA, link: 'https://www.isae-supaero.fr/en/', academicFields: ['Engineering', 'Science & Technology / Research', 'Computer Science & IT'] },
  { name: 'ESPCI Paris – PSL', country: 'FR', location: 'Paris', climate: 'Balanced', sectors: ['Research', 'Tech Hub'], baselineSelectivity: 84, internshipProgram: 'A small, research-intense engineering school (part of PSL) at the physics/chemistry/biology interface; several Nobel laureates among alumni and faculty, strong deep-tech spinout record.', requirements: REQ_GE_PREPA, link: 'https://www.espci.psl.eu/en/', academicFields: ['Science & Technology / Research', 'Engineering', 'Computer Science & IT'] },
  { name: 'ENSAE Paris', country: 'FR', location: 'Palaiseau, Île-de-France', climate: 'Balanced', sectors: ['Finance Capital', 'Research'], baselineSelectivity: 84, internshipProgram: 'The national school for statistics and economics (within IP Paris); the leading French route into quantitative finance, data science, economic research and INSEE.', requirements: REQ_GE_PREPA, link: 'https://www.ensae.fr/en', academicFields: ['Mathematics & Statistics', 'Business', 'Computer Science & IT', 'Social Sciences'] },
  { name: 'IMT Atlantique', country: 'FR', location: 'Brest / Nantes / Rennes', climate: 'Balanced', sectors: ['Tech Hub', 'Research'], baselineSelectivity: 76, internshipProgram: 'Large generalist engineering school under the Institut Mines-Télécom; digital technology, energy and environmental engineering across three western campuses.', requirements: REQ_GE_PREPA, link: 'https://www.imt-atlantique.fr/en', academicFields: ['Engineering', 'Computer Science & IT', 'Environmental Science & Sustainability', 'Science & Technology / Research'] },
  { name: 'Chimie ParisTech – PSL', country: 'FR', location: 'Paris', climate: 'Balanced', sectors: ['Research'], baselineSelectivity: 78, internshipProgram: 'The national chemical-engineering school within PSL; materials, energy storage and molecular chemistry with strong industrial-research links.', requirements: REQ_GE_PREPA, link: 'https://www.chimieparistech.psl.eu/en/', academicFields: ['Science & Technology / Research', 'Engineering', 'Environmental Science & Sustainability'] },
  { name: 'Arts et Métiers', country: 'FR', location: 'Paris (8 campuses nationwide)', climate: 'Balanced', sectors: ['Manufacturing & Engineering Hub', 'Research'], baselineSelectivity: 74, internshipProgram: 'The reference school for mechanical, industrial and production engineering; a strong hands-on/manufacturing culture and a very large alumni network in industry.', requirements: REQ_GE_PREPA, link: 'https://artsetmetiers.fr/en', academicFields: ['Engineering', 'Architecture & Design', 'Science & Technology / Research'] },

  // --- ENS Ulm + ENS Paris-Saclay ---
  { name: 'École Normale Supérieure – PSL', country: 'FR', location: 'Paris', climate: 'Balanced', sectors: ['Research'], baselineSelectivity: 95, internshipProgram: 'ENS Ulm — the most selective route into French research and academia; entry by concours after prépa or a selective international/master admission. Exceptional placement into CNRS and academia.', requirements: REQ_GE_PREPA, link: 'https://www.ens.psl.eu/en', academicFields: ['Science & Technology / Research', 'Humanities', 'Mathematics & Statistics', 'Social Sciences'] },
  { name: 'ENS Paris-Saclay', country: 'FR', location: 'Gif-sur-Yvette, Île-de-France', climate: 'Balanced', sectors: ['Research'], baselineSelectivity: 90, internshipProgram: 'Research-and-teaching training school on the Saclay plateau; strong in computer science, mathematics, physics and the social sciences, closely tied to Université Paris-Saclay labs.', requirements: REQ_GE_PREPA, link: 'https://ens-paris-saclay.fr/en', academicFields: ['Computer Science & IT', 'Mathematics & Statistics', 'Science & Technology / Research', 'Social Sciences'] },
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

console.log(`\nInserted ${inserted} French universities (tranche 1).`)
if (skipped.length) console.log(`Already existed, skipped: ${skipped.join(', ')}`)
