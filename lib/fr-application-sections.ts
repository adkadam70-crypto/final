// France's real undergraduate admission structure, laid out the same way
// the other country-specific modules in this directory are — used as the
// FR-specific checklist in Build Your Dream instead of the generic
// APPLICATION_INFO.FR.requirements fallback.
//
// The single most important correction this module makes versus the old
// generic text: Indian (and any other foreign-board) students applying to
// a first-year Licence do NOT use Parcoursup — Parcoursup is for French
// Baccalauréat holders and non-Europeans who sat a French curriculum at a
// lycée français abroad. Foreign-board students use the DAP (Demande
// d'Admission Préalable) procedure through Études en France instead. This
// was verified via web search this session directly against Campus
// France's own guidance — see furtherReading.
export type FRApplicationSection = {
  label: string
  description: string
  whatToInclude: string[]
  furtherReading?: { label: string; url: string }[]
}

export const FR_APPLICATION_SECTIONS: FRApplicationSection[] = [
  {
    label: 'Choose Your Pathway: DAP vs. Parcoursup vs. Grandes Écoles',
    description: "Which platform you use depends entirely on your curriculum and target program — using the wrong one is a common, avoidable mistake.",
    whatToInclude: [
      "CBSE/ICSE/State Board (or any foreign secondary diploma) applying to a first-year Licence: use DAP (Demande d'Admission Préalable) through the Études en France platform — this is the correct route, not Parcoursup",
      "Parcoursup is for French Baccalauréat holders and non-European students who sat a French-curriculum diploma at a lycée français abroad — a foreign-board student applying through Parcoursup is applying through the wrong system entirely",
      "Grandes écoles (engineering, business): a separate track via post-bac concours (SESAME, ACCÈS for business; GEIPI, Avenir, Puissance Alpha for engineering) or, for the classic route, two years of classes préparatoires (CPGE) followed by the concours",
      "Master's-level applicants use Mon Master (a different platform from all of the above) — not relevant for undergraduate Licence applicants",
    ],
    furtherReading: [{ label: 'Campus France — DAP or Parcoursup?', url: 'https://www.southafrica.campusfrance.org/dap-or-parcoursup' }],
  },
  {
    label: 'DAP via Études en France',
    description: 'The actual application procedure for a foreign-board student applying to a first-year Licence — a real, gated process with its own deadline, not a formality layered on top of a university application.',
    whatToInclude: [
      'Create your dossier on the Études en France platform — this is where the DAP request itself is submitted, not directly to the university',
      'You can apply to a maximum of 3 courses through one DAP procedure — choose carefully, this is a real cap, not a soft limit',
      "Typical deadline: mid-December for the following September intake (the 2026-27 cycle's window ran 1 October to 15 December) — confirm the current cycle's exact dates on Études en France directly rather than assuming last year's dates repeat exactly",
      'Campus France reviews your file and, in most cases, invites you for an interview before issuing clearance — this interview is a real evaluation step, prepare for it seriously rather than treating it as routine',
    ],
    furtherReading: [
      { label: "Campus France — 'Studying in France' procedure", url: 'https://www.campusfrance.org/en/application-etudes-en-france-procedure' },
    ],
  },
  {
    label: 'Academic Documents & Transcripts',
    description: 'High-school transcripts from the last 2-3 years — weighed heavily for selective programs, not just a formality confirming you graduated.',
    whatToInclude: [
      'Transcripts (bulletins) from your last 2-3 years of secondary school, not just your final-year result',
      'Your diploma/certificate recognized as equivalent to the French Baccalauréat — CBSE/ICSE/State Board, IB, and A-Levels are all accepted on their own terms',
      'A US high-school diploma is typically expected to be paired with SAT/AP scores — GPA alone is not treated as sufficient evidence on its own',
    ],
  },
  {
    label: 'Language Proficiency',
    description: "Required regardless of pathway — which test depends on whether your specific program is taught in French or English.",
    whatToInclude: [
      'French-taught programs: DELF/DALF B2, or the TCF — real French-proficiency exams, budget genuine preparation time if French isn\'t already strong',
      'English-taught programs (a real and growing option, especially at grandes écoles and some Licence programs): IELTS or TOEFL, check your specific program\'s own minimum',
    ],
  },
  {
    label: 'Motivation Letter (Lettre de Motivation)',
    description: "The real non-grade factor here — short and focused on program fit and academic motivation, not a US-style personal narrative essay.",
    whatToInclude: [
      'Roughly 1,500 characters on Parcoursup-adjacent formats, though DAP/Études en France dossiers may have their own specific length guidance — check the current platform\'s own instructions',
      'Focus on WHY this specific program and institution, and what in your academic record supports that choice — generic "why I love France" framing reads as weak here',
      'This is the single biggest non-grade lever available in an otherwise grades-first system — worth real effort, not an afterthought',
    ],
    furtherReading: [{ label: 'Campus France — Applying to a French Institution', url: 'https://www.usa.campusfrance.org/applying-to-a-french-institution' }],
  },
  {
    label: 'Grandes Écoles Track (If Targeting One)',
    description: "A genuinely different, more selective track than the standard Licence route — relevant if you're targeting a top engineering or business school specifically.",
    whatToInclude: [
      'Classic route: 2 years of classes préparatoires (CPGE) after your Baccalauréat-equivalent, then the concours (a set of competitive written and oral exams) — this is a multi-year commitment, not a single application step',
      'Post-bac alternative: direct entry via a post-bac concours immediately after secondary school — SESAME or ACCÈS for business schools, GEIPI Polytech, Avenir, or Puissance Alpha for engineering schools',
      'Each concours has its own exam pattern, dates, and registration process, entirely separate from DAP/Parcoursup/Études en France — confirm your specific target school\'s own accepted concours before assuming a general one covers it',
    ],
  },
]

// Generic per-university tasks for the "My Universities" tab — grandes
// écoles and public-university Licence programs run genuinely different
// admission tracks, so what needs confirming per school varies more than
// in a single shared-application system.
export const FR_PER_UNIVERSITY_TASK_TEMPLATE: string[] = [
  "Confirm this school's actual admission route (DAP, a specific concours, or direct Parcoursup-eligible) — don't assume it matches a similar-sounding school",
  "Check this program's language of instruction and its specific proficiency threshold",
  "Confirm this school's current application deadline on its own site, not a generic France-wide date",
]

export const FR_PER_UNIVERSITY_TASK_DETAILS: Record<string, string> = {
  "Confirm this school's actual admission route (DAP, a specific concours, or direct Parcoursup-eligible) — don't assume it matches a similar-sounding school":
    "Two schools that sound similar (e.g. two business grandes écoles) can run completely different admission processes — one via a shared post-bac concours, another via its own direct application. Confirm this exact school's route on its own admissions page.",
  "Check this program's language of instruction and its specific proficiency threshold":
    "English-taught tracks are increasingly common at grandes écoles specifically, alongside the traditional French-taught Licence — confirm which applies to your specific program before assuming DELF/DALF is required.",
  "Confirm this school's current application deadline on its own site, not a generic France-wide date":
    "DAP, Parcoursup, and each concours all run on different calendars, and grandes écoles set their own specific deadlines within those — a generic 'France deadline' does not exist; check this exact school and program.",
}
