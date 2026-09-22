// Per-country admissions deadline calendars — researched this session via
// direct fetches of official sources (Common App, UCAS, Parcoursup.gouv.fr,
// uni-assist, NUS, HKU/CUHK, NTA, plus university-published international
// deadlines for Australia, which has no single national date). Every date
// below traces to a cited source; where a country's system has no fixed
// annual date (Australia) or the exact cycle wasn't yet published at
// research time (India's CUET UG/NEET UG for the 2027 cycle), that's
// labeled honestly instead of inventing a number.

export type DeadlineRound = {
  label: string
  date: string
  binding?: boolean
  note?: string
}

export type CountryDeadlines = {
  code: string
  name: string
  system: string
  rounds: DeadlineRound[]
  checklist: string[]
  sourceNote: string
  sources: { label: string; url: string }[]
}

export const ADMISSIONS_DEADLINES: Record<string, CountryDeadlines> = {
  US: {
    code: 'US',
    name: 'United States',
    system: 'Common App — dates below are the typical annual pattern most schools follow for the 2026-2027 cycle (fall 2027 entry); always confirm against your specific schools\' own pages.',
    rounds: [
      { label: 'Early Decision I / Early Action', date: 'November 1, 2026', binding: true, note: 'ED is binding — you must attend if admitted. EA is non-binding. Some schools use Nov 15 instead of Nov 1.' },
      { label: 'Early Decision II', date: 'January 1–15, 2027', binding: true, note: 'Binding, for schools that offer a second early round.' },
      { label: 'Regular Decision', date: 'January 1–15, 2027', note: 'A handful of public flagships extend to February 1.' },
    ],
    checklist: [
      'Common App personal essay (250–650 words)',
      'School-specific supplemental essays',
      'Counselor recommendation + transcript sent by your school',
      '1–2 teacher recommendation letters',
      'SAT/ACT score send (if submitting — many schools are test-optional)',
    ],
    sourceNote: 'Cross-referenced across BestColleges and several 2026-2027 admissions-consulting calendars; all agree on the same November 1 / January 1–15 pattern.',
    sources: [
      { label: 'Common App', url: 'https://www.commonapp.org/' },
      { label: 'BestColleges — 2026-2027 deadlines', url: 'https://www.bestcolleges.com/blog/college-application-deadlines/' },
    ],
  },
  UK: {
    code: 'UK',
    name: 'United Kingdom',
    system: 'UCAS — single national deadline system, confirmed directly from UCAS for 2027 entry.',
    rounds: [
      { label: 'Oxford, Cambridge, most Medicine/Dentistry/Vet courses', date: 'October 15, 2026, 18:00 UK time', note: 'Applications must arrive at UCAS by this time to guarantee equal consideration.' },
      { label: 'All other undergraduate courses', date: 'January 13, 2027, 18:00 UK time' },
    ],
    checklist: [
      'UCAS personal statement (reworked into 3 shorter questions for 2026+ entry)',
      'Predicted A-Level/IB grades from your school',
      'Admissions test if your course requires one (UCAT for medicine/dentistry, LNAT for law)',
      'Reference from your school',
    ],
    sourceNote: 'Both dates confirmed via direct fetch of UCAS\'s own published 2027-entry deadline pages.',
    sources: [
      { label: 'UCAS — Oxbridge/Medicine 2027 entry deadline', url: 'https://www.ucas.com/events/2027-entry-deadline-for-the-universities-of-oxford-and-cambridge-and-most-courses-in-medicine-475536' },
      { label: 'UCAS — all other courses 2027 entry deadline', url: 'https://www.ucas.com/events/2027-entry-deadline-for-all-undergraduate-courses-except-those-with-a-15-october-deadline-475546' },
    ],
  },
  FR: {
    code: 'FR',
    name: 'France',
    system: 'Parcoursup — the single national platform, confirmed via the official 2026 government calendar.',
    rounds: [
      { label: 'Registration & wish formulation opens', date: 'January 19, 2026' },
      { label: 'Wish formulation deadline', date: 'March 12, 2026' },
      { label: 'Confirm wishes & complete file', date: 'April 1, 2026' },
      { label: 'Main admission phase', date: 'June 2 – July 11, 2026', note: 'A complementary phase runs June 11 – September 10, 2026 for remaining places.' },
    ],
    checklist: [
      'Academic transcripts (bulletins) uploaded to Parcoursup',
      'Motivation letter per wish ("projet de formation motivé")',
      'Up to 10 wishes, each requiring its own short statement',
    ],
    sourceNote: 'Confirmed via info.gouv.fr and the official Parcoursup 2026 calendar cited by multiple French education outlets.',
    sources: [
      { label: 'Parcoursup — official site', url: 'https://www.parcoursup.gouv.fr/' },
      { label: 'info.gouv.fr — Parcoursup 2026 key dates', url: 'https://www.info.gouv.fr/actualite/parcoursup-2026-derniere-ligne-droite-pour-formuler-ses-voeux' },
    ],
  },
  DE: {
    code: 'DE',
    name: 'Germany',
    system: 'uni-assist — most universities use this centralized service for international applicants; individual universities can set their own (often earlier) internal deadline.',
    rounds: [
      { label: 'Winter semester (starts October)', date: 'July 15', note: 'uni-assist recommends applying at least 8 weeks earlier for document-review buffer.' },
      { label: 'Summer semester (starts April)', date: 'January 15' },
    ],
    checklist: [
      'uni-assist VPD (preliminary examination documentation) request — start this early, it can take weeks',
      'Certified copies of transcripts and diplomas',
      'Proof of German or English language proficiency depending on the program',
      'University-specific internal deadline — often earlier than the uni-assist date',
    ],
    sourceNote: 'Confirmed via uni-assist\'s own official deadlines page. These are recurring annual dates, not a single cycle\'s one-off dates — always double check your specific university, which can set its own earlier cutoff.',
    sources: [{ label: 'uni-assist — deadlines & processing time', url: 'https://www.uni-assist.de/en/how-to-apply/plan-your-application/deadlines-processing-time/' }],
  },
  SG: {
    code: 'SG',
    name: 'Singapore',
    system: 'Direct application to each university (NUS, NTU, SMU) — no shared national platform.',
    rounds: [
      { label: 'NUS — international qualifications (August intake)', date: 'Mid-December – mid-February', note: 'Confirmed pattern from NUS\'s own admissions page: the most recent cycle ran Dec 16 – Feb 17.' },
      { label: 'NTU — international qualifications (August intake)', date: 'Similar window, roughly December – February', note: 'Check NTU\'s admissions page for the exact current-cycle dates.' },
    ],
    checklist: [
      'International qualification transcripts (A-Levels, IB, or equivalent)',
      'Personal qualifying test / interview where the program requires one',
      'English proficiency proof if your prior schooling wasn\'t in English',
    ],
    sourceNote: 'NUS window confirmed via direct fetch of NUS\'s own admissions page. Singapore has no fixed calendar date each year — the window shifts slightly cycle to cycle, so treat this as a "typically around this time" pattern, not a fixed date.',
    sources: [
      { label: 'NUS — undergraduate admissions', url: 'https://nus.edu.sg/oam/apply-to-nus/application' },
      { label: 'NTU — undergraduate admissions', url: 'https://www.ntu.edu.sg/admissions/undergraduate' },
    ],
  },
  HK: {
    code: 'HK',
    name: 'Hong Kong',
    system: 'JUPAS (for Hong Kong-curriculum students) or direct International/Non-JUPAS admission (for everyone else) — no shared deadline across universities.',
    rounds: [
      { label: 'Applications typically open', date: 'September–October' },
      { label: 'Advance Offer Round (example: CUHK\'s most recent cycle)', date: 'Mid-November' },
      { label: 'Regular Round (example: CUHK\'s most recent cycle)', date: 'Early January', note: 'Rolling consideration continues after this for remaining places at most universities.' },
    ],
    checklist: [
      'International qualification transcripts (A-Levels, IB, AP, or equivalent)',
      'English proficiency proof where required',
      'Personal statement / supplementary form per university',
    ],
    sourceNote: 'HKU confirms its own International/Non-JUPAS window "normally opens in September/October each year" but doesn\'t publish one fixed closing date on that page. The Advance/Regular round dates shown are CUHK\'s actual most recent published cycle, given as a realistic example of the pattern — check each university\'s own page for its current cycle.',
    sources: [
      { label: 'HKU — International/Non-JUPAS admissions', url: 'https://admissions.hku.hk/node/152' },
      { label: 'CUHK — Non-JUPAS important dates', url: 'https://admission.cuhk.edu.hk/application/non-jupas/important-dates/' },
    ],
  },
  IN: {
    code: 'IN',
    name: 'India',
    system: 'NTA-administered national entrance exams — the path (and exam) depends on your target field and institution type.',
    rounds: [
      { label: 'JEE Main Session 1 (Engineering)', date: 'January 22–24 & 28–30, 2027', note: 'From NTA\'s own published 2027 exam calendar (released Sept 2026); January 31 is a buffer day.' },
      { label: 'JEE Advanced (IITs)', date: 'Not yet announced', note: 'Typically held in May, for students who clear JEE Main — NTA\'s calendar release only covers exams through March 2027 so far.' },
      { label: 'CUET UG (central/many state universities)', date: 'Not yet announced', note: 'Typically held in May in past cycles — NTA had not yet published the 2027 CUET UG date as of its most recent calendar release.' },
      { label: 'NEET UG (Medicine)', date: 'Not yet announced', note: 'Typically held in May in past cycles — same caveat as CUET UG above.' },
    ],
    checklist: [
      'NTA registration for each relevant exam',
      'Class 12 board marksheet (eligibility cutoff varies by exam/institution)',
      'Category/reservation certificates if applicable',
      'Counseling-round document verification after results (JoSAA for JEE, state/university-specific for others)',
    ],
    sourceNote: 'JEE Main dates are real, confirmed dates from NTA\'s official calendar. The "not yet announced" exams are honestly labeled as such rather than guessed — NTA\'s public calendar notice only extends through March 2027 at time of research.',
    sources: [{ label: 'NTA — official site', url: 'https://nta.ac.in/' }],
  },
  AU: {
    code: 'AU',
    name: 'Australia',
    system: 'No single national deadline. Australian-curriculum/NZ students go through state bodies (UAC, VTAC, QTAC, SATAC); everyone else applies directly to each university, which sets its own date.',
    rounds: [
      { label: 'University of Melbourne — undergraduate, Semester 1 2027', date: 'Applications open until October 31, 2026' },
      { label: 'University of Sydney — international, Semester 1 2027', date: 'Recommended by December 1, 2026', note: 'Highly competitive courses close earlier.' },
      { label: 'UNSW — rolling, program-specific', date: 'Varies by term and program', note: 'Check UNSW\'s own closing-dates page for your specific course.' },
    ],
    checklist: [
      'Academic transcripts + your curriculum\'s equivalent of a final-year result',
      'English proficiency proof (IELTS/TOEFL) if required',
      'Each university converts your result into its own entry-score equivalent — no single national formula',
    ],
    sourceNote: 'These are real, cited deadlines from three specific universities\' own admissions pages — not a national standard, since Australia doesn\'t have one for international direct applicants. Treat these as representative examples and always check your target university directly.',
    sources: [
      { label: 'University of Melbourne — important dates', url: 'https://study.unimelb.edu.au/how-to-apply/undergraduate-study/international-applications/entry-requirements/important-dates' },
      { label: 'University of Sydney — application dates', url: 'https://www.sydney.edu.au/study/applying/application-dates.html' },
      { label: 'UNSW — closing dates', url: 'https://www.unsw.edu.au/study/how-to-apply/application-deadline-dates' },
    ],
  },
}

export const ADMISSIONS_DEADLINES_COUNTRIES = Object.keys(ADMISSIONS_DEADLINES)
