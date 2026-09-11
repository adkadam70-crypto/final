// India's real undergraduate admission landscape, structured the same way
// lib/common-app-sections.ts structures the US Common App — used as the
// India-specific application checklist in Build Your Dream instead of the
// generic 5-line APPLICATION_INFO.IN.requirements fallback every other
// country still uses.
//
// Unlike the US (one shared application, one shared checklist), India has
// no single national platform — which specific requirements apply depends
// entirely on the program the student is targeting (engineering vs.
// medicine vs. law vs. a general central-university humanities/science
// seat all gate on completely different national exams). So this module
// exports a classifier (confirmedField -> program category) plus a
// per-category section list, rather than one flat array.
//
// Every fact here (exam pattern, question counts, marking scheme,
// counselling body, category-reservation shares) was verified via web
// search this session against official/primary sources (NTA, JoSAA, the
// CLAT Consortium, IIT Bombay's UCEED site, the Council of Architecture,
// AIU) or well-corroborated secondary sources where no single official page
// had the full picture — see the furtherReading links on each section.
// Numbers (percentiles, seat counts, cutoff percentages) move year to year;
// treat these as "how the system works," not this year's exact cutoff.

export type IndiaApplicationSection = {
  id: string
  label: string
  description: string
  whatToInclude: string[]
  furtherReading?: { label: string; url: string }[]
}

export type IndiaProgramCategory = 'engineering' | 'medicine' | 'law' | 'design' | 'commerce' | 'hospitality' | 'agriculture' | 'general'

// Ordered so more specific fields are checked before the categories they
// could false-positive against (e.g. "medicine" is checked early so
// "medical" doesn't also get caught by a looser rule later) — \b word
// boundaries specifically so "biomedical engineering" doesn't match
// "medical" (no boundary exists between "bio" and "medical" as one word)
// and instead falls through to the engineering match, which is correct:
// biomedical engineering is JEE-gated, not NEET-gated.
const CATEGORY_PATTERNS: [IndiaProgramCategory, RegExp][] = [
  ['medicine', /\b(medicine|medical|mbbs|bds|dent(al|istry)|ayurved|ayush|homeopath|unani|siddha|nursing|pharma(cy)?|veterinary|b\.?v\.?sc)\b/i],
  ['law', /\b(law|legal|llb)\b/i],
  ['design', /\b(design|architect(ure)?|fashion|animation|interior)\b/i],
  ['hospitality', /\b(hotel|hospitality|culinary|catering|tourism)\b/i],
  ['agriculture', /\b(agricultur(e|al)|horticulture|forestry|dairy)\b/i],
  ['commerce', /\b(commerce|business|management|bba|b\.?com|accounting|finance|entrepreneur)\b/i],
  ['engineering', /\b(engineer(ing)?|computer science|software|b\.?tech|mechanical|electrical|electronics|civil|robotics|data science|information technology|artificial intelligence)\b/i],
]

export function classifyIndiaField(field: string | null | undefined): IndiaProgramCategory {
  if (!field) return 'general'
  for (const [category, pattern] of CATEGORY_PATTERNS) {
    if (pattern.test(field)) return category
  }
  // Humanities, pure sciences, social sciences, and anything else not
  // caught above all funnel to CUET-UG in practice — this is the real
  // catch-all path for Central Universities, not a placeholder default.
  return 'general'
}

const BOARD_RESULTS: IndiaApplicationSection = {
  id: 'board-results',
  label: 'Class XII Board Exam Results',
  description: 'Your board marks are the baseline for every path below — for direct-admission programs they ARE the merit list; for exam-gated programs (engineering, medicine, law, design) they set a minimum eligibility floor on top of your entrance rank.',
  whatToInclude: [
    'Your board (CBSE, ICSE/CISCE, or your state board) and your Class XII marksheet once results are out',
    'Aggregate percentage — most direct-admission private/state universities set a floor around 40-60%, adjusted per program',
    "For JEE-gated engineering seats specifically: General/EWS/OBC-NCL candidates need 75% aggregate (65% for SC/ST/PwD) OR to be in the top 20th percentile of your own board, to actually be eligible for a JoSAA seat — this is separate from, and on top of, your JEE rank",
    'Individual subject marks matter for programs with subject prerequisites (e.g. Physics/Chemistry/Maths for engineering & most science programs, Physics/Chemistry/Biology for medicine, Maths for architecture)',
  ],
}

const AIU_EQUIVALENCY: IndiaApplicationSection = {
  id: 'aiu-equivalency',
  label: 'AIU Equivalency Certificate',
  description: "Your board isn't an Indian one (IB, A-Levels, a US high school diploma, or another foreign curriculum) — most Indian universities require this before they'll consider your Class XII-equivalent result at all.",
  whatToInclude: [
    'Apply online at evaluation.aiu.ac.in with your mark sheets/transcripts, passport, and the certificate fee',
    "This certifies your foreign qualification as equivalent to Indian Class XII (10+2) — it doesn't replace whatever entrance exam your target program requires, it's a prerequisite layered on top of it",
    'Processing typically takes 2-4 weeks — start this well before application deadlines, not after you already have offers to accept',
  ],
  furtherReading: [{ label: 'AIU Equivalence — official portal', url: 'https://evaluation.aiu.ac.in/' }],
}

const CATEGORY_CERTIFICATE: IndiaApplicationSection = {
  id: 'category-certificate',
  label: 'Category / Reservation Certificate (if applicable)',
  description: 'Real and worth planning for early if it applies to you — Indian admissions reserve a defined share of seats and relax cutoffs by category, but only with the right certificate in hand before counselling.',
  whatToInclude: [
    'OBC-NCL (non-creamy-layer), SC, ST, or EWS certificate, issued by your state government — these take real time to obtain, so start the paperwork months before counselling opens, not the week of',
    'PwBD (persons with benchmark disability) certification, if applicable, for the separate PwBD quota most exams and counselling bodies run',
    'For NEET specifically: OBC 27%, SC 15%, ST 7.5%, and EWS 10% are reserved within the 15% All-India Quota; the remaining 85% is State Quota, where each state sets its own reservation policy — only centrally-issued OBC-NCL/EWS certificates are valid for the AIQ portion',
    "For CLAT/law: reservation is NLU-by-NLU based on each university's own home-state quota policy, not one national table — check your specific target NLU's own reservation rules rather than assuming a fixed percentage",
  ],
}

const DIRECT_ADMISSION_NOTE: IndiaApplicationSection = {
  id: 'direct-admission',
  label: 'Direct-Admission Private Universities (No Entrance Test)',
  description: 'A real, common path for this field, not a fallback — many private and deemed universities admit purely on your Class XII percentage plus a basic interview, with no entrance exam at all.',
  whatToInclude: [
    'Common for BBA, B.Com, BA, and non-medical/non-engineering B.Sc programs at private/deemed universities (Amity, NMIMS, Symbiosis and its open-learning arm, and many state-private clusters, among others)',
    'Typical floor is 40-60% aggregate in Class XII, varying by institution and specific program',
    "This path genuinely does not exist for engineering at any AICTE-recognized institute, medicine/dentistry/AYUSH (NEET is mandatory with zero exceptions), law at NLUs, NID/UCEED-gated design, or CoA-recognized architecture (NATA is legally required) — if your target is one of those, an entrance exam isn't optional no matter which specific university you're looking at",
  ],
}

const JEE_MAIN: IndiaApplicationSection = {
  id: 'jee-main',
  label: 'JEE Main',
  description: 'Run by the NTA — the gateway exam for most engineering seats in India (NITs, IIITs, GFTIs directly, plus it\'s the qualifying stage for JEE Advanced/the IITs).',
  whatToInclude: [
    'Paper 1 (B.Tech): 75 questions / 300 marks across Physics, Chemistry, Maths (20 MCQ + 5 numerical-value per subject), 3 hours',
    'Marking: +4 for a correct answer, -1 for a wrong one (numerical-value questions also carry -1)',
    'Runs twice a year — your better of the two scores counts toward your final percentile',
    'Only the top ~2.5 lakh rankers across all categories become eligible to sit JEE Advanced (see below) — General cutoff is calibrated each year so exactly that many qualify; category cutoffs sit meaningfully lower (OBC/SC/ST/EWS)',
  ],
  furtherReading: [{ label: 'NTA — JEE Main', url: 'https://jeemain.nta.nic.in/' }],
}

const JEE_ADVANCED: IndiaApplicationSection = {
  id: 'jee-advanced',
  label: 'JEE Advanced & JoSAA Counselling (IITs/NITs/IIITs)',
  description: 'Only relevant if you\'re targeting an IIT specifically — a separate, harder exam on top of JEE Main, run by a rotating IIT. Seat allotment across every IIT/NIT/IIIT/GFTI then runs through one centralized counselling body.',
  whatToInclude: [
    'Two compulsory papers, 180 marks each (360 total), ~102 questions total, mixed format (MCQ, multi-answer, numerical, matching) — this is materially harder and differently-formatted than JEE Main, not just "the same test again"',
    "JoSAA (Joint Seat Allocation Authority) runs the single centralized counselling for every IIT, NIT, IIIT, and GFTI using your JEE Main/Advanced rank — you rank-order your preferred college+branch combinations and get allotted through multiple rounds",
    "Remember the 75%-boards (65% SC/ST/PwD) or top-20th-percentile rule from the board results section above — it's checked again here, at JoSAA seat confirmation, not just at registration",
    'Standard OBC-NCL/SC/ST/EWS/PwD quotas apply at JoSAA seat allocation, same as most centralized Indian counselling',
  ],
  furtherReading: [
    { label: 'JEE Advanced — official site', url: 'https://jeeadv.ac.in/' },
    { label: 'JoSAA — official counselling site', url: 'https://josaa.nic.in/' },
  ],
}

const STATE_PRIVATE_ENGINEERING: IndiaApplicationSection = {
  id: 'state-private-engineering',
  label: 'State & Private Engineering Entrance Exams',
  description: "Worth checking if you're also considering colleges outside the JEE/JoSAA system — many strong engineering programs run their own separate entrance exam entirely.",
  whatToInclude: [
    'State exams (e.g. MHT-CET in Maharashtra, WBJEE in West Bengal) feed that state\'s own centralized counselling, separate from JoSAA — MHT-CET is 150 MCQs (no negative marking), WBJEE is MCQ-based across Physics/Chemistry/Maths',
    "Private-university tests (BITSAT for BITS Pilani campuses, VITEEE for VIT, SRMJEEE for SRM, among others) admit purely on their own exam merit — no board-percentage gate the way JoSAA has",
    "BITSAT: 130 questions across Physics, Chemistry, English+Logical Reasoning, and Maths/Biology, 3 hours, with up to 12 bonus questions if you finish early",
    "VITEEE: 125 questions / 500 marks across Maths-or-Biology, Physics, Chemistry, Aptitude, and English, with -1 for a wrong answer",
    "Each of these has its own separate registration, exam date, and application fee — check your specific target school's own admissions page for which exam(s) it actually accepts",
  ],
}

const NEET: IndiaApplicationSection = {
  id: 'neet',
  label: 'NEET-UG',
  description: 'The sole mandatory gateway for MBBS, BDS, AYUSH (BAMS/BHMS/BUMS/BSMS/BNYS), nursing, and veterinary (B.V.Sc) admission in India — no institution, government or private, can admit without a valid NEET score.',
  whatToInclude: [
    '180 compulsory MCQs across Physics (45), Chemistry (45), and Biology/Botany+Zoology combined (90) — 720 marks total, 180 minutes, offered in 13 languages',
    'Marking: +4 correct, -1 wrong, 0 for unattempted',
    'Board marks alone are never sufficient here — your NEET rank fully gates every seat, unlike engineering where a strong board percentage can matter at direct-admission private colleges',
    '15% of seats nationally form the All-India Quota (AIQ) — within it, OBC 27%, SC 15%, ST 7.5%, EWS 10% are reserved; the remaining 85% is State Quota, where individual state policy applies (only centrally-issued OBC-NCL/EWS certificates count toward the AIQ portion)',
    "B.V.Sc (veterinary) is NEET-gated too — it is NOT covered by ICAR AIEEA the way general agriculture programs are, a common mix-up",
  ],
  furtherReading: [{ label: 'NTA — NEET', url: 'https://neet.nta.nic.in/' }],
}

const CLAT: IndiaApplicationSection = {
  id: 'clat',
  label: 'CLAT / AILET (Law Entrance)',
  description: "CLAT is the dominant national law entrance exam, run by the NLU Consortium for admission across 24 National Law Universities plus 60+ affiliated colleges. NLU Delhi runs its own separate exam, AILET, for its own seats.",
  whatToInclude: [
    'CLAT UG: ~120 comprehension-based MCQs across English, Current Affairs/GK, Legal Reasoning, Logical Reasoning, and Quantitative Techniques — 2-hour offline (pen-and-paper) test, +1 correct / -0.25 wrong',
    'AILET (NLU Delhi only, not part of the Consortium): a separate 90-minute offline OMR test — apply to this independently if NLU Delhi is a target, a CLAT score alone doesn\'t cover it',
    'Reservation is set individually by each NLU based on its own home-state quota policy — there is no single national CLAT reservation table the way there is for JEE/NEET, so check your specific target NLU\'s own published policy',
    "Outside the NLU system, private law schools often run their own test (Symbiosis SET, LSAT-India) or admit via board marks + interview — don't assume CLAT is required everywhere",
  ],
  furtherReading: [{ label: 'Consortium of NLUs — CLAT', url: 'https://consortiumofnlus.ac.in/' }],
}

const DESIGN_ARCHITECTURE: IndiaApplicationSection = {
  id: 'design-architecture-entrance',
  label: 'Design/Architecture Entrance (NID DAT, UCEED, NATA)',
  description: "Which exam applies depends on exactly what you're targeting — NID's own campuses, an IIT's B.Des program, and architecture (B.Arch) each gate on a different exam.",
  whatToInclude: [
    "NID DAT (for NID's own campuses): two stages — Prelims (qualifying only, doesn't count toward final merit) then Mains, which is 100% of your final result and includes a Studio Sensitivity Test plus an in-person interview at an NID campus",
    "UCEED (for IIT B.Des programs, run by IIT Bombay): one exam, two parts — Part A is computer-based (visualization, spatial reasoning, logic, language), Part B is offline (a sketching question and a design-aptitude question) — both parts are mandatory to get a result at all",
    "NATA (for B.Arch, legally required by the Council of Architecture at every recognized architecture college — not optional the way some other entrance exams are): Part A is offline drawing/composition, Part B is online MCQ/MSQ; you can sit up to 3 sessions across the year and your best score counts",
    "Board marks alone are not sufficient at any of these — the entrance score (plus interview/studio round for NID) fully gates admission",
  ],
  furtherReading: [
    { label: 'NID — Design Aptitude Test', url: 'https://admissions.nid.edu/' },
    { label: 'UCEED — official site (IIT Bombay)', url: 'https://www.uceed.iitb.ac.in/' },
    { label: 'NATA — Council of Architecture', url: 'https://www.nata.in/' },
  ],
}

const CUET: IndiaApplicationSection = {
  id: 'cuet',
  label: 'CUET-UG',
  description: 'The real gateway for Central Universities (DU, JNU, BHU, AMU, Jamia, and 40+ others) and accepted as one option at 260+ other participating state/private universities — the closest thing India has to a shared application for humanities, sciences, and social sciences.',
  whatToInclude: [
    'Choose a minimum of 3 and maximum of 10 subjects total across Languages, Domain-Specific Subjects (23 on offer — pick the ones matching your intended course), and a General Test',
    'Each section: +5 for a correct answer, -1 for a wrong one, 0 unattempted — computer-based test',
    'Legally mandatory only for the Central Universities — everywhere else it\'s one accepted option among several, so a private university can accept CUET scores without requiring them and run its own admission process in parallel',
    'Board XII marks set your basic eligibility floor, but the CUET score is what actually builds the merit list at Central Universities — a strong board percentage does not substitute for a weak CUET score there',
    'Cutoffs for competitive programs at top Central Universities (DU, BHU, AMU) commonly land in the 98th-99th percentile range — check your specific target program\'s previous-year cutoff, which varies enormously by subject and university',
  ],
  furtherReading: [{ label: 'NTA — CUET-UG', url: 'https://cuet.nta.nic.in/' }],
}

const BBA_MANAGEMENT_ENTRANCE: IndiaApplicationSection = {
  id: 'bba-management-entrance',
  label: 'Management/BBA-Specific Entrance (IPMAT & university tests)',
  description: 'Commerce/management is the most fragmented field in Indian admissions — on top of CUET, several specific programs run their own separate entrance exam.',
  whatToInclude: [
    'IPMAT (5-year Integrated Programme in Management, BBA+MBA combined) is run separately by IIM Indore and IIM Rohtak, each with its own exam — Quant, Logical Reasoning/Verbal sections, strict per-section timing, scored differently at each IIM, so check the specific IIM\'s own pattern rather than assuming they match',
    "Several private business schools (Christ University's own CUET-Christ test is a well-known example, not to be confused with the national CUET) run their own entrance test plus a skills assessment and personal interview, entirely independent of the national CUET",
    "Many BBA/B.Com seats, especially at private/deemed universities, need no entrance test at all — see the direct-admission note below",
  ],
}

const NCHM_JEE: IndiaApplicationSection = {
  id: 'nchm-jee',
  label: 'NCHM JEE (Hotel Management)',
  description: 'Run by the NTA on behalf of NCHMCT — the gateway to the IHM (Institute of Hotel Management) network and its affiliated hospitality colleges nationally.',
  whatToInclude: [
    '120 questions / 480 marks, computer-based test',
    'Feeds a centralized counselling process (typically 3 rounds plus a spot round) across the IHM network — seats allotted by your rank, category, and institute preference, similar in structure to JoSAA but IHM-specific',
    'Result is valid for one year',
    'Some private hospitality colleges outside the IHM network admit on board marks + interview without requiring NCHM JEE — check your specific target school',
  ],
  furtherReading: [{ label: 'NCHMCT JEE — official site', url: 'https://nchmjee.nta.nic.in/' }],
}

const ICAR_AIEEA: IndiaApplicationSection = {
  id: 'icar-aieea',
  label: 'ICAR AIEEA / CUET-ICAR-UG (Agriculture)',
  description: 'Agriculture admission now runs through the CUET-ICAR-UG channel (the successor to the standalone ICAR AIEEA exam), conducted by the NTA under the ICAR-AU system.',
  whatToInclude: [
    'Computer-based MCQ test, 120 minutes, sections in Physics/Chemistry/Biology-or-Maths-or-Agriculture drawn from the Class XI-XII NCERT syllabus',
    'Eligibility floor: General/OBC/EWS need at least 50% Class XII aggregate; SC/ST/PwBD need at least 40%',
    'ICAR itself runs the post-exam counselling and seat allocation, separate from JoSAA/JEE',
    "Important: this does NOT cover veterinary science (B.V.Sc & AH) — that's gated by NEET-UG, not this exam, a common point of confusion",
  ],
}

// One catch-all section every category (except where explicitly noted
// otherwise below) still carries, since it's a genuinely common admission
// path for these fields specifically.
const DIRECT_ADMISSION_CATEGORIES: IndiaProgramCategory[] = ['commerce', 'general']

const SECTIONS_BY_CATEGORY: Record<IndiaProgramCategory, IndiaApplicationSection[]> = {
  engineering: [JEE_MAIN, JEE_ADVANCED, STATE_PRIVATE_ENGINEERING],
  medicine: [NEET],
  law: [CLAT],
  design: [DESIGN_ARCHITECTURE],
  commerce: [CUET, BBA_MANAGEMENT_ENTRANCE],
  hospitality: [NCHM_JEE],
  agriculture: [ICAR_AIEEA],
  general: [CUET],
}

// Generic per-university tasks for the "My Universities" tab — the US
// baseline template (lib/common-app-sections.ts's PER_UNIVERSITY_TASK_TEMPLATE)
// is Common-App-specific (FERPA release, self-reported courses & grades)
// and makes no sense for India, where there's no shared application and
// each school's process depends on which exam/counselling route gates it.
export const INDIA_PER_UNIVERSITY_TASK_TEMPLATE: string[] = [
  "Confirm this university's exact entrance route for your program — its own direct application, a state counselling body, or a national one (JoSAA/CSAB, NEET state/AIQ counselling, CLAT centralized, etc.)",
  "Check this specific university's cutoff (board percentage, exam rank, or CUET score) for your program and category from its most recent published round — cutoffs vary hugely school to school, even within the same exam",
  'Verify document requirements: migration certificate, category/reservation certificate if applicable, and an AIU equivalency certificate if your board is non-Indian',
]

export const INDIA_PER_UNIVERSITY_TASK_DETAILS: Record<string, string> = {
  "Confirm this university's exact entrance route for your program — its own direct application, a state counselling body, or a national one (JoSAA/CSAB, NEET state/AIQ counselling, CLAT centralized, etc.)":
    "India has no single shared application — the same-sounding program can be reached completely differently at two schools (one via centralized counselling on your JEE/NEET/CLAT rank, another via a direct application judged on board marks alone). Check this exact university's admissions page for its own process before assuming it matches the general exam requirements above.",
  "Check this specific university's cutoff (board percentage, exam rank, or CUET score) for your program and category from its most recent published round — cutoffs vary hugely school to school, even within the same exam":
    'A JEE/NEET/CUET rank that clears one college for a given program can miss another by a wide margin, and cutoffs shift year to year and round to round (multiple counselling rounds often have different closing ranks). Look up this university\'s own most recent published cutoff for your specific program and category rather than relying on a general benchmark.',
  'Verify document requirements: migration certificate, category/reservation certificate if applicable, and an AIU equivalency certificate if your board is non-Indian':
    "Migration certificates (from your previous board/institution) and category certificates take real processing time — don't leave them for counselling week. If you're on a non-Indian curriculum, confirm this university accepts your AIU equivalency certificate specifically, since acceptance can vary by institution.",
}

// curriculum comes from lib/academic-detail.ts's AcademicDetail — only
// 'CBSE' represents an Indian board today (see that file's own gap: ICSE
// and state boards don't have a distinct type yet, so a CBSE curriculum
// value is the only signal available that a student is on an Indian
// board at all). Anything else (A_LEVELS, US_GPA_PCT, IB_DIPLOMA) means
// the AIU equivalency section applies.
export function getIndiaApplicationSections(confirmedField: string | null | undefined, curriculum: string | null | undefined): IndiaApplicationSection[] {
  const category = classifyIndiaField(confirmedField)
  const sections: IndiaApplicationSection[] = [BOARD_RESULTS, ...SECTIONS_BY_CATEGORY[category]]
  if (curriculum && curriculum !== 'CBSE') sections.push(AIU_EQUIVALENCY)
  sections.push(CATEGORY_CERTIFICATE)
  if (DIRECT_ADMISSION_CATEGORIES.includes(category)) sections.push(DIRECT_ADMISSION_NOTE)
  return sections
}
