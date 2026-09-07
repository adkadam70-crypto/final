// India catalog — expansion round 5 (~40 rows). Runs after
// add-missing-universities-india-round4.mjs. Brings India to ~195 rows.
//
// The existing India catalog is heavily engineering / commerce / medicine.
// This round is deliberately program-diverse — the gaps it fills:
//   - Law: 6 National Law Universities (the catalog had no dedicated law
//     school at all)
//   - Pure science: 3 IISERs (none were in the catalog)
//   - Design: NIFT Delhi, Srishti Manipal, MIT Institute of Design
//   - Architecture & planning: SPA Delhi, CEPT University
//   - Medicine: JIPMER, PGIMER Chandigarh, NIMHANS, AFMC Pune
//   - Agriculture: G. B. Pant University, ANGRAU
//   - Arts / humanities colleges: St. Xavier's Kolkata, Madras Christian,
//     Stella Maris, Ambedkar University Delhi
//   - Media / film / communication: FTII, IIMC, MICA
//   - Performing arts: National School of Drama, Kalakshetra
//   - Comprehensive universities: MSU Baroda, Pondicherry, Visva-Bharati
//   - Newer IITs: Gandhinagar, Ropar, Jodhpur, IIT (ISM) Dhanbad
//   - Management: IIM Indore (its 5-year IPM is a post-Class-12 entry)
//   - More NITs: NIT Delhi, NIT Silchar; plus NEHU (central university)
//
// rankValue here follows the India method exactly: it is filled ONLY from
// NIRF's "Universities" or "College" category (the two overall-ordinal
// tracks). Subject-category NIRF ranks — Law, Medical, Architecture,
// Research, Engineering, Management — go into programRankings via
// seed-program-rankings-india-round6.mjs, NOT here. Rows not in any NIRF
// category (design schools, FTII/IIMC/NSD/Kalakshetra, several universities)
// keep rankValue NULL, same as the many existing NULL-rank India rows.
// College-category ranks (Madras Christian #16, Stella Maris #41, St.
// Xavier's Kolkata #8) are set by seed-overall-rankings-india-round3.mjs,
// which has been extended.
//
// baselineSelectivity is a CURATED starting estimate; seed-acceptance-
// estimates-in.mjs then realigns it to (100 - estimatedAcceptanceRate) for
// every row where the entrance-exam seat structure supports an estimate
// (CLAT / IAT / NEET / JEE / IPMAT), and leaves it curated for the Tier-5
// rows.
//
// Usage: node --env-file=.env.local scripts/seed-universities-india-round5.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const REQ_LAW = [
  'Admission through CLAT (Common Law Admission Test) for the 5-year integrated BA/BBA LLB (Hons); NLU Delhi admits via its own AILET',
  'A minimum Class-12 aggregate (typically ~45%) is required alongside the entrance rank',
  'Reserved seats under state-domicile, category and other quotas',
  'Instruction and the entrance exam are in English',
]
const REQ_IIT = [
  'Qualify JEE Main, then rank in JEE Advanced; seats allotted by all-India rank through JoSAA counselling',
  'At least 75% in Class 12 (or top-20 percentile of the board) for general category',
  'A limited number of foreign-national supernumerary seats are admitted separately (often on SAT Subject / board scores)',
  'Instruction is in English',
]
const REQ_NIT = [
  'Qualify JEE Main; seats allotted by all-India rank through JoSAA counselling, with a home-state quota (~50% of seats)',
  'At least 75% in Class 12 (or top-20 percentile of the board) for general category',
  'Instruction is in English',
]
const REQ_IISER = [
  'Admission through the IISER Aptitude Test (IAT); a few seats via KVPY-successor / JEE Advanced channels',
  'A strong Class-12 science stream record (a board-percentile cut-off applies)',
  'Instruction is in English; the programme is a research-focused 5-year BS-MS',
]
const REQ_NEET_MED = [
  'MBBS/BDS admission is on NEET-UG all-India rank through MCC (15% all-India quota) and state counselling',
  'Physics, Chemistry and Biology in Class 12 with the required aggregate',
  'Very few seats relative to the NEET candidate pool — among the most competitive admissions in India',
]
const REQ_CUET_UNIV = [
  'Admission on CUET-UG score for most undergraduate programmes, with a separate cut-off per programme',
  'A recognised Class-12 qualification (CBSE/ISC/state board; IB and A-Levels assessed for equivalence)',
  'Reserved seats under central-government category quotas',
]
const REQ_STATE_UNIV = [
  'Admission by state entrance test or Class-12 merit through the state counselling process, by programme',
  'A recognised Class-12 qualification with the programme-specific subject requirements',
  'A home-state / domicile quota applies to most seats',
]
const REQ_DESIGN = [
  'Admission through a design-aptitude entrance test plus a studio/portfolio round and interview (NIFT entrance for NIFT; the institute\'s own test for the private schools)',
  'A recognised Class-12 qualification in any stream',
  'Instruction is in English',
]
const REQ_ARCH = [
  'B.Arch admission on JEE Main Paper 2 (B.Arch) or NATA score plus Class-12 with Mathematics; CEPT runs its own assessment',
  'At least 50% aggregate in Class 12 with Mathematics as a subject',
  'Instruction is in English',
]
const REQ_AGRI = [
  'Undergraduate admission on ICAR AIEEA rank (all-India quota) or the state agricultural-university counselling process',
  'Physics, Chemistry, Biology/Mathematics and Agriculture in Class 12 as required by the programme',
  'A home-state quota applies to most seats',
]
const REQ_CREATIVE_CONCOURS = [
  'A multi-stage entrance process — a written test and/or portfolio, followed by an aptitude/orientation round and an interview before a panel',
  'A recognised qualification (Class 12 for most courses; some acting/direction courses ask for a bachelor\'s degree)',
  'Very small cohorts relative to applications — among the most competitive creative admissions in India',
]
const REQ_IPM = [
  'Admission to the 5-year Integrated Programme in Management (IPM) is through the IPMAT exam (aptitude + verbal ability) plus a written test and personal interview',
  'A strong Class-12 record across all streams is eligible',
  'Instruction is in English',
]

const UNIVERSITIES = [
  // --- National Law Universities (CLAT / AILET; 5-year integrated law) ---
  { name: 'National Law School of India University', country: 'IN', location: 'Bengaluru, Karnataka', climate: 'Balanced', sectors: ['Government & Policy Hub', 'Research'], baselineSelectivity: 95, internshipProgram: "India's first and most prestigious national law university; its 5-year BA LLB (Hons) is filled from the very top of the CLAT merit list and feeds the bar, the judiciary, policy think-tanks and corporate law firms.", requirements: REQ_LAW, link: 'https://www.nls.ac.in/', academicFields: ['Law', 'Social Sciences'] },
  { name: 'National Law University Delhi', country: 'IN', location: 'New Delhi', climate: 'Warm', sectors: ['Government & Policy Hub', 'Research'], baselineSelectivity: 94, internshipProgram: 'A top national law university that admits through its own AILET exam rather than CLAT; strong constitutional law, criminal justice and human-rights research, with placements into litigation, firms and the civil services.', requirements: REQ_LAW, link: 'https://nludelhi.ac.in/', academicFields: ['Law', 'Social Sciences'] },
  { name: 'NALSAR University of Law', country: 'IN', location: 'Hyderabad, Telangana', climate: 'Warm', sectors: ['Government & Policy Hub', 'Research'], baselineSelectivity: 93, internshipProgram: 'One of the oldest and most selective national law universities; its CLAT-admitted 5-year programme is a consistent top-three feeder into corporate law, chambers and academia.', requirements: REQ_LAW, link: 'https://www.nalsar.ac.in/', academicFields: ['Law', 'Social Sciences'] },
  { name: 'The West Bengal National University of Juridical Sciences', country: 'IN', location: 'Kolkata, West Bengal', climate: 'Warm', sectors: ['Government & Policy Hub', 'Research'], baselineSelectivity: 90, internshipProgram: 'NUJS Kolkata — eastern India\'s leading national law university, admitting via CLAT; known for its strength in public law, IP and a large clinical-legal-education programme.', requirements: REQ_LAW, link: 'https://www.nujs.edu/', academicFields: ['Law', 'Social Sciences'] },
  { name: 'Gujarat National Law University', country: 'IN', location: 'Gandhinagar, Gujarat', climate: 'Warm', sectors: ['Government & Policy Hub', 'Research'], baselineSelectivity: 88, internshipProgram: 'GNLU — a top-five national law university admitting through CLAT; broad 5-year programme with strengths in commercial law, and an on-campus centre network for research and policy.', requirements: REQ_LAW, link: 'https://www.gnlu.ac.in/', academicFields: ['Law', 'Social Sciences'] },
  { name: 'National Law University Odisha', country: 'IN', location: 'Cuttack, Odisha', climate: 'Warm', sectors: ['Government & Policy Hub'], baselineSelectivity: 78, internshipProgram: 'NLU Odisha (Cuttack) — a mid-2000s national law university admitting via CLAT; a well-regarded 5-year integrated law programme serving eastern India.', requirements: REQ_LAW, link: 'https://www.nluo.ac.in/', academicFields: ['Law', 'Social Sciences'] },

  // --- IISERs (IAT; 5-year BS-MS research programme) ---
  { name: 'Indian Institute of Science Education and Research Pune', country: 'IN', location: 'Pune, Maharashtra', climate: 'Balanced', sectors: ['Research'], baselineSelectivity: 90, internshipProgram: 'The largest and highest-profile of the IISERs; a research-immersive 5-year BS-MS across biology, chemistry, physics, mathematics, earth science and data science, with lab work from the first year.', requirements: REQ_IISER, link: 'https://www.iiserpune.ac.in/', academicFields: ['Science & Technology / Research', 'Mathematics & Statistics'] },
  { name: 'Indian Institute of Science Education and Research Kolkata', country: 'IN', location: 'Mohanpur, West Bengal', climate: 'Warm', sectors: ['Research'], baselineSelectivity: 88, internshipProgram: 'An IISER on a purpose-built campus north of Kolkata; the same 5-year BS-MS model, with additional strength in earth and climate science and computational biology.', requirements: REQ_IISER, link: 'https://www.iiserkol.ac.in/', academicFields: ['Science & Technology / Research', 'Mathematics & Statistics', 'Environmental Science & Sustainability'] },
  { name: 'Indian Institute of Science Education and Research Mohali', country: 'IN', location: 'Mohali, Punjab', climate: 'Warm', sectors: ['Research'], baselineSelectivity: 87, internshipProgram: 'An IISER next to Chandigarh; a research-focused 5-year BS-MS with recognised groups in chemical sciences, quantum physics and mathematics.', requirements: REQ_IISER, link: 'https://www.iisermohali.ac.in/', academicFields: ['Science & Technology / Research', 'Mathematics & Statistics'] },

  // --- Design ---
  { name: 'National Institute of Fashion Technology, New Delhi', country: 'IN', location: 'New Delhi', climate: 'Warm', sectors: ['Creative Hub'], baselineSelectivity: 78, internshipProgram: 'The flagship campus of NIFT, India\'s premier fashion institute; design, fashion technology and fashion-management programmes with heavy industry projects and a portfolio-plus-situation-test admission.', requirements: REQ_DESIGN, link: 'https://www.nift.ac.in/delhi/', academicFields: ['Architecture & Design', 'Arts', 'Business'] },
  { name: 'Srishti Manipal Institute of Art, Design and Technology', country: 'IN', location: 'Bengaluru, Karnataka', climate: 'Balanced', sectors: ['Creative Hub'], baselineSelectivity: 55, internshipProgram: 'A large art-and-design institute (part of the Manipal group) with an interdisciplinary studio model spanning visual communication, industrial and interaction design, film, and design-led innovation.', requirements: REQ_DESIGN, link: 'https://srishtimanipalinstitute.in/', academicFields: ['Architecture & Design', 'Arts', 'Communications & Media'] },
  { name: 'MIT Institute of Design', country: 'IN', location: 'Pune, Maharashtra', climate: 'Balanced', sectors: ['Creative Hub'], baselineSelectivity: 52, internshipProgram: 'A private design school (MIT-ADT University group) offering product, communication, interior, film and animation design, admitting on its own aptitude test and portfolio review.', requirements: REQ_DESIGN, link: 'https://www.mitid.edu.in/', academicFields: ['Architecture & Design', 'Arts', 'Communications & Media'] },

  // --- Architecture & planning ---
  { name: 'School of Planning and Architecture, Delhi', country: 'IN', location: 'New Delhi', climate: 'Warm', sectors: ['Government & Policy Hub', 'Research'], baselineSelectivity: 90, internshipProgram: 'India\'s only institution of national importance dedicated entirely to the built environment; architecture, urban and regional planning, landscape and design, feeding public planning bodies and practice.', requirements: REQ_ARCH, link: 'https://spa.ac.in/', academicFields: ['Architecture & Design', 'Environmental Science & Sustainability', 'Engineering'] },
  { name: 'CEPT University', country: 'IN', location: 'Ahmedabad, Gujarat', climate: 'Warm', sectors: ['Creative Hub', 'Research'], baselineSelectivity: 72, internshipProgram: 'A design-and-planning university (Centre for Environmental Planning and Technology) known for its architecture, planning, technology and management faculties and a studio-and-portfolio admission process.', requirements: REQ_ARCH, link: 'https://cept.ac.in/', academicFields: ['Architecture & Design', 'Environmental Science & Sustainability', 'Engineering', 'Business'] },

  // --- Medicine (NEET-UG) ---
  { name: 'Jawaharlal Institute of Postgraduate Medical Education and Research', country: 'IN', location: 'Puducherry', climate: 'Warm', sectors: ['Healthcare & Biotech Hub', 'Research'], baselineSelectivity: 99, internshipProgram: 'JIPMER — a central government institute of national importance; its small MBBS intake, filled entirely on NEET-UG all-India rank, is among the two or three most competitive medical admissions in India.', requirements: REQ_NEET_MED, link: 'https://jipmer.edu.in/', academicFields: ['Medicine & Health Sciences', 'Science & Technology / Research'] },
  { name: 'Postgraduate Institute of Medical Education and Research, Chandigarh', country: 'IN', location: 'Chandigarh', climate: 'Balanced', sectors: ['Healthcare & Biotech Hub', 'Research'], baselineSelectivity: 98, internshipProgram: 'PGIMER — a leading medical research and referral institute; primarily a postgraduate and super-speciality centre with a very large teaching hospital and NEET-based entry to its limited undergraduate seats.', requirements: REQ_NEET_MED, link: 'https://pgimer.edu.in/', academicFields: ['Medicine & Health Sciences', 'Science & Technology / Research'] },
  { name: 'National Institute of Mental Health and Neurosciences', country: 'IN', location: 'Bengaluru, Karnataka', climate: 'Balanced', sectors: ['Healthcare & Biotech Hub', 'Research'], baselineSelectivity: 97, internshipProgram: 'NIMHANS — India\'s apex centre for mental health and neuroscience; a hospital-plus-research institute offering medicine, nursing, psychology, psychiatric social work and neuroscience programmes.', requirements: ['Admission by NEET-UG (medical seats) or the institute\'s own entrance test for psychology, nursing and allied programmes', 'The required Class-12 subject combination for the chosen programme', 'Small, sought-after cohorts across all programmes'], link: 'https://nimhans.ac.in/', academicFields: ['Medicine & Health Sciences', 'Psychology', 'Science & Technology / Research'] },
  { name: 'Armed Forces Medical College, Pune', country: 'IN', location: 'Pune, Maharashtra', climate: 'Balanced', sectors: ['Healthcare & Biotech Hub'], baselineSelectivity: 97, internshipProgram: 'AFMC — the tri-services medical college; MBBS admission is on NEET-UG rank followed by a Toppers\' interview and a medical/physical test, with a service commitment after graduation. It does not participate in NIRF.', requirements: ['NEET-UG rank, then shortlisting for a Toppers\' interview and a medical examination', 'Physics, Chemistry, Biology and English in Class 12 with the required aggregate; age and nationality conditions apply', 'A Short Service Commission bond with the Armed Forces Medical Services on graduation'], link: 'https://afmc.nic.in/', academicFields: ['Medicine & Health Sciences'] },

  // --- Agriculture (ICAR AIEEA / state counselling) ---
  { name: 'G. B. Pant University of Agriculture and Technology', country: 'IN', location: 'Pantnagar, Uttarakhand', climate: 'Warm', sectors: ['Research'], baselineSelectivity: 40, internshipProgram: 'India\'s first agricultural university (1960), the model for the land-grant-style state agricultural universities; agriculture, veterinary science, agricultural engineering and home science with a large research farm.', requirements: REQ_AGRI, link: 'https://www.gbpuat.ac.in/', academicFields: ['Agriculture & Natural Resources', 'Engineering', 'Environmental Science & Sustainability', 'Science & Technology / Research'] },
  { name: 'Acharya N. G. Ranga Agricultural University', country: 'IN', location: 'Guntur, Andhra Pradesh', climate: 'Warm', sectors: ['Research'], baselineSelectivity: 34, internshipProgram: 'ANGRAU — Andhra Pradesh\'s principal agricultural university; crop science, agricultural engineering, food technology and a wide network of research stations across the state\'s agro-climatic zones.', requirements: REQ_AGRI, link: 'https://angrau.ac.in/', academicFields: ['Agriculture & Natural Resources', 'Environmental Science & Sustainability', 'Science & Technology / Research'] },

  // --- Arts / humanities colleges (NIRF College category or own merit) ---
  { name: "St. Xavier's College, Kolkata", country: 'IN', location: 'Kolkata, West Bengal', climate: 'Warm', sectors: ['Research'], baselineSelectivity: 78, internshipProgram: 'An autonomous Jesuit college, one of India\'s highest-ranked; commerce, the sciences, English, economics and mass communication, admitting on Class-12 merit with course-specific cut-offs among the highest in the east.', requirements: ['Admission on Class-12 aggregate and subject marks, with a course-specific merit cut-off (and an interview for some courses)', 'A recognised Class-12 qualification with the subject prerequisites for the chosen honours course', 'Instruction is in English'], link: 'https://www.sxccal.edu/', academicFields: ['Business', 'Science & Technology / Research', 'Communications & Media', 'Humanities'] },
  { name: 'Madras Christian College', country: 'IN', location: 'Chennai, Tamil Nadu', climate: 'Warm', sectors: ['Research'], baselineSelectivity: 72, internshipProgram: 'A historic autonomous liberal-arts college on a large forested campus; the sciences, commerce, economics, English and social work, admitting on Class-12 merit with community and management quotas.', requirements: ['Admission on Class-12 aggregate and subject marks with a course-specific merit list; community and management quotas apply', 'A recognised Class-12 qualification with the subject prerequisites', 'Instruction is in English'], link: 'https://mcc.edu.in/', academicFields: ['Humanities', 'Science & Technology / Research', 'Business', 'Social Sciences'] },
  { name: 'Stella Maris College', country: 'IN', location: 'Chennai, Tamil Nadu', climate: 'Warm', sectors: ['Research'], baselineSelectivity: 68, internshipProgram: 'An autonomous women\'s college known for the humanities, fine arts, economics, media and the sciences; admission is on Class-12 merit with a course-specific cut-off.', requirements: ['Admission on Class-12 aggregate and subject marks with a course-specific merit list', 'A recognised Class-12 qualification with the subject prerequisites', 'A women\'s college; instruction is in English'], link: 'https://stellamariscollege.edu.in/', academicFields: ['Humanities', 'Arts', 'Social Sciences', 'Communications & Media'] },
  { name: 'Ambedkar University Delhi', country: 'IN', location: 'New Delhi', climate: 'Warm', sectors: ['Research', 'Government & Policy Hub'], baselineSelectivity: 55, internshipProgram: 'A Delhi government research university dedicated to the social sciences and humanities; economics, sociology, psychology, history, law, and design, admitting on CUET with a strong critical-studies identity.', requirements: REQ_CUET_UNIV, link: 'https://aud.ac.in/', academicFields: ['Social Sciences', 'Humanities', 'Psychology', 'Law'] },

  // --- Media / film / communication ---
  { name: 'Film and Television Institute of India', country: 'IN', location: 'Pune, Maharashtra', climate: 'Balanced', sectors: ['Creative Hub'], baselineSelectivity: 92, internshipProgram: 'FTII — India\'s national film school on the former Prabhat Studios lot; direction, cinematography, editing, sound, acting and screenwriting, entered by a national written test plus orientation and interview with very small cohorts.', requirements: REQ_CREATIVE_CONCOURS, link: 'https://ftii.ac.in/', academicFields: ['Arts', 'Communications & Media'] },
  { name: 'Indian Institute of Mass Communication', country: 'IN', location: 'New Delhi', climate: 'Warm', sectors: ['Creative Hub', 'Government & Policy Hub'], baselineSelectivity: 82, internshipProgram: 'IIMC — the government\'s premier journalism and communication institute; English and Hindi journalism, radio and TV, advertising and PR, and development communication, with a competitive CUET-PG-linked entrance.', requirements: ['Admission through the CUET (PG) journalism paper plus the institute\'s counselling', 'A bachelor\'s degree in any discipline', 'Small cohorts across the Delhi and regional campuses'], link: 'https://iimc.gov.in/', academicFields: ['Communications & Media', 'Social Sciences'] },
  { name: 'MICA', country: 'IN', location: 'Ahmedabad, Gujarat', climate: 'Warm', sectors: ['Creative Hub', 'Business'], baselineSelectivity: 67, internshipProgram: 'MICA (formerly the Mudra Institute of Communications, Ahmedabad) — a private institute focused on strategic marketing, brand management and communication, with a case-and-industry-project pedagogy.', requirements: ['Admission through the institute\'s own process (a management aptitude test plus a psychometric test, group exercise and interview)', 'A bachelor\'s degree for the flagship programme; an integrated programme admits after Class 12', 'Instruction is in English'], link: 'https://www.mica.ac.in/', academicFields: ['Communications & Media', 'Business'] },

  // --- Performing arts ---
  { name: 'National School of Drama', country: 'IN', location: 'New Delhi', climate: 'Warm', sectors: ['Creative Hub'], baselineSelectivity: 92, internshipProgram: 'NSD — India\'s premier theatre-training institution; a three-year diploma in acting, direction and design entered by a nationwide audition-and-workshop selection that admits roughly two dozen students a year.', requirements: REQ_CREATIVE_CONCOURS, link: 'https://nsd.gov.in/', academicFields: ['Arts', 'Communications & Media'] },
  { name: 'Kalakshetra Foundation', country: 'IN', location: 'Chennai, Tamil Nadu', climate: 'Warm', sectors: ['Creative Hub'], baselineSelectivity: 70, internshipProgram: 'A deemed institution founded by Rukmini Devi Arundale for Bharatanatyam, Carnatic music, visual art and craft; a rigorous performance-conservatory model on a large campus by the sea.', requirements: ['Admission by audition / practical assessment and interview before a faculty panel', 'A recognised Class-12 qualification for the degree programmes; prior training in the art form is expected', 'Instruction combines English and Tamil'], link: 'https://kalakshetra.in/', academicFields: ['Arts'] },

  // --- Comprehensive universities ---
  { name: 'Maharaja Sayajirao University of Baroda', country: 'IN', location: 'Vadodara, Gujarat', climate: 'Warm', sectors: ['Research'], baselineSelectivity: 40, internshipProgram: 'A large historic state university with an unusually strong fine-arts faculty alongside science, technology, commerce, medicine and social work, on a landmark early-20th-century campus.', requirements: REQ_STATE_UNIV, link: 'https://msubaroda.ac.in/', academicFields: ['Arts', 'Engineering', 'Science & Technology / Research', 'Business'] },
  { name: 'Pondicherry University', country: 'IN', location: 'Puducherry', climate: 'Warm', sectors: ['Research'], baselineSelectivity: 45, internshipProgram: 'A central university on a coastal campus; social sciences, sciences, management, and a well-known department of ecology and environmental sciences, admitting on CUET.', requirements: REQ_CUET_UNIV, link: 'https://www.pondiuni.edu.in/', academicFields: ['Social Sciences', 'Science & Technology / Research', 'Environmental Science & Sustainability', 'Business'] },
  { name: 'Visva-Bharati University', country: 'IN', location: 'Santiniketan, West Bengal', climate: 'Warm', sectors: ['Creative Hub', 'Research'], baselineSelectivity: 42, internshipProgram: 'The central university founded by Rabindranath Tagore; internationally known for its fine-arts (Kala Bhavana) and music (Sangit Bhavana) schools, alongside humanities, education and rural studies.', requirements: ['Admission by the university\'s own entrance tests for most programmes (a practical/portfolio round for the art and music schools)', 'A recognised Class-12 qualification with the subject prerequisites', 'Instruction combines English and Bengali'], link: 'https://www.visvabharati.ac.in/', academicFields: ['Arts', 'Humanities', 'Education', 'Agriculture & Natural Resources'] },
  { name: 'North-Eastern Hill University', country: 'IN', location: 'Shillong, Meghalaya', climate: 'Cold', sectors: ['Research'], baselineSelectivity: 38, internshipProgram: 'NEHU — the central university for the north-eastern hill region; sciences, social sciences, management and a strong focus on the ecology, languages and cultures of the northeast.', requirements: REQ_CUET_UNIV, link: 'https://www.nehu.ac.in/', academicFields: ['Science & Technology / Research', 'Social Sciences', 'Environmental Science & Sustainability', 'Humanities'] },

  // --- Newer IITs (JEE Advanced) ---
  { name: 'Indian Institute of Technology Gandhinagar', country: 'IN', location: 'Gandhinagar, Gujarat', climate: 'Warm', sectors: ['Tech Hub', 'Research'], baselineSelectivity: 97, internshipProgram: 'A younger IIT known for a broad, foundation-heavy curriculum, a compulsory design/innovation and humanities component, and strong undergraduate research culture on a new riverside campus.', requirements: REQ_IIT, link: 'https://iitgn.ac.in/', academicFields: ['Engineering', 'Computer Science & IT', 'Science & Technology / Research', 'Humanities'] },
  { name: 'Indian Institute of Technology Ropar', country: 'IN', location: 'Rupnagar, Punjab', climate: 'Balanced', sectors: ['Tech Hub', 'Research'], baselineSelectivity: 96, internshipProgram: 'A younger IIT near Chandigarh; core engineering plus growing groups in biomedical engineering, AI and agricultural/water technology, with JEE-Advanced entry.', requirements: REQ_IIT, link: 'https://www.iitrpr.ac.in/', academicFields: ['Engineering', 'Computer Science & IT', 'Science & Technology / Research'] },
  { name: 'Indian Institute of Technology Jodhpur', country: 'IN', location: 'Jodhpur, Rajasthan', climate: 'Warm', sectors: ['Tech Hub', 'Research'], baselineSelectivity: 96, internshipProgram: 'A younger IIT with signature interdisciplinary schools in AI and data science, digital humanities, and management-and-entrepreneurship, on a large desert-edge campus.', requirements: REQ_IIT, link: 'https://www.iitj.ac.in/', academicFields: ['Engineering', 'Computer Science & IT', 'Science & Technology / Research'] },
  { name: 'Indian Institute of Technology (ISM) Dhanbad', country: 'IN', location: 'Dhanbad, Jharkhand', climate: 'Warm', sectors: ['Manufacturing & Engineering Hub', 'Research'], baselineSelectivity: 94, internshipProgram: 'The former Indian School of Mines, now an IIT; the country\'s deepest strength in mining, petroleum and earth-resource engineering alongside the full core-engineering set, with JEE-Advanced entry.', requirements: REQ_IIT, link: 'https://www.iitism.ac.in/', academicFields: ['Engineering', 'Environmental Science & Sustainability', 'Science & Technology / Research', 'Computer Science & IT'] },

  // --- Management (5-year IPM) ---
  { name: 'Indian Institute of Management Indore', country: 'IN', location: 'Indore, Madhya Pradesh', climate: 'Warm', sectors: ['Business'], baselineSelectivity: 98, internshipProgram: 'An older IIM whose 5-year Integrated Programme in Management (IPM) is one of the few ways to enter an IIM straight after Class 12, via the IPMAT exam; a hilltop campus with a large management-research faculty.', requirements: REQ_IPM, link: 'https://www.iimidr.ac.in/', academicFields: ['Business', 'Economics'] },

  // --- More NITs (JEE Main) ---
  { name: 'National Institute of Technology Delhi', country: 'IN', location: 'New Delhi', climate: 'Warm', sectors: ['Tech Hub'], baselineSelectivity: 88, internshipProgram: 'The youngest of the NITs, in the national capital; a compact set of core engineering branches plus computer science, with JEE-Main entry through JoSAA.', requirements: REQ_NIT, link: 'https://nitdelhi.ac.in/', academicFields: ['Engineering', 'Computer Science & IT'] },
  { name: 'National Institute of Technology Silchar', country: 'IN', location: 'Silchar, Assam', climate: 'Warm', sectors: ['Manufacturing & Engineering Hub'], baselineSelectivity: 88, internshipProgram: 'A well-regarded NIT serving the northeast; the full set of core engineering branches plus computer science and electronics, with JEE-Main entry and a large regional intake.', requirements: REQ_NIT, link: 'https://www.nits.ac.in/', academicFields: ['Engineering', 'Computer Science & IT'] },
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

console.log(`\nInserted ${inserted} Indian institutions (round 5).`)
if (skipped.length) console.log(`Already existed, skipped: ${skipped.join(', ')}`)
