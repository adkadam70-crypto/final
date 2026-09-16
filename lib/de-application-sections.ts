// Germany's real undergraduate admission structure, laid out the same way
// the other country-specific modules in this directory are — used as the
// DE-specific checklist in Build Your Dream instead of the generic
// APPLICATION_INFO.DE.requirements fallback.
//
// Germany has no single shared application: uni-assist handles document
// verification for ~180 universities, but some run their own portal, and
// which pathway a student even qualifies for (direct admission vs. a
// year of Studienkolleg first) is decided by the anabin database's
// assessment of their specific curriculum — this module surfaces that
// decision explicitly instead of assuming direct admission applies.
//
// Every fact here (APS requirement, anabin H+/H-/H+- statuses, the
// JEE/NEET direct-admission exception, uni-assist fees/turnaround) was
// verified via web search this session against uni-assist's own process
// documentation and current admissions guides — see furtherReading.
export type DEApplicationSection = {
  label: string
  description: string
  whatToInclude: string[]
  furtherReading?: { label: string; url: string }[]
}

export const DE_APPLICATION_SECTIONS: DEApplicationSection[] = [
  {
    label: 'Check Your Pathway: Direct Admission vs. Studienkolleg',
    description: "The single most important first step — most Indian Class XII holders (CBSE, ICSE, State Board) are NOT eligible for direct admission and need a year of Studienkolleg first. This is decided by your exact curriculum, not by you.",
    whatToInclude: [
      "The anabin database (run by Germany's Kultusministerkonferenz) is the official source: your qualification is marked H+ (direct admission), H- (Studienkolleg required first), or H+/- (depends on the specific university) — check your exact board and state here before assuming either path",
      "Most CBSE/ICSE/State Board Class XII holders are H- — direct admission is the exception, not the norm, limited in practice to students who also cleared a competitive national entrance exam (JEE Main/Advanced, NEET) at a genuinely high level, not just a strong board score alone",
      "If H-: a Studienkolleg (foundation year) is mandatory before university — see the dedicated Studienkolleg section below for what that actually involves",
      "APS certification (see below) is what performs the definitive check — it examines your exact record and confirms which pathway applies, don't rely on a generic anabin lookup alone for your final answer",
    ],
    furtherReading: [{ label: 'anabin database', url: 'https://anabin.kmk.org/' }],
  },
  {
    label: 'APS Certificate (Mandatory for Indian Applicants)',
    description: 'A mandatory academic-verification step run by the German Embassy in India (also required for Chinese and Vietnamese applicants) — uni-assist will not process your application without it.',
    whatToInclude: [
      'Verifies your educational credentials are genuine and assesses whether they meet the level required for German university admission — this is a real vetting step, not a formality',
      'Apply at least 3-4 weeks before your university/uni-assist deadline — this is a real bottleneck if left late, since uni-assist explicitly will not start processing your file without a completed APS certificate already in hand',
      'Required documents typically include Class X and XII marksheets/certificates, your degree certificate and complete semester-wise transcripts (if applicable), and passport copy',
    ],
    furtherReading: [{ label: 'APS Certificate — for Indian students', url: 'https://www.studyineurope.eu/study-in-germany/for-indian-students/aps-certificate/' }],
  },
  {
    label: 'Studienkolleg (If Your Curriculum Requires It)',
    description: "A one-year foundation programme ending in the Feststellungsprüfung (FSP) — once passed, it qualifies you for direct admission to any German university in the matching subject group. This is a real, substantial commitment, not a quick formality.",
    whatToInclude: [
      'Choose the right course type (subject group) for your intended field — e.g. T-Kurs for engineering/technical fields, W-Kurs for business/economics, M-Kurs for medicine/biology, G-Kurs for humanities — this determines which subjects you study and which degrees the FSP qualifies you for afterward',
      'Apply directly to a Studienkolleg (often attached to a specific university) — competition for popular locations is real, apply early',
      'The Feststellungsprüfung (FSP) at the end is a real exam with real consequences — failing it (or failing to pass within the allowed resit attempts) can end this pathway, budget serious preparation time for it, not just for the coursework itself',
    ],
    furtherReading: [{ label: 'Feststellungsprüfung — the Studienkolleg entrance/exit exam', url: 'https://prep4university-studienkolleg.de/en/studienkolleg-entrance-exam/' }],
  },
  {
    label: 'uni-assist Application & Documents',
    description: "The shared document-verification service for ~180 German universities — check whether your target school actually uses it first, since some run their own portal instead.",
    whatToInclude: [
      'Complete transcripts showing every semester, every course, every grade AND the grading scale used — partial transcripts are a common real rejection reason, not an edge case',
      'Every document must be on official letterhead with an institutional stamp; anything not already in English or German needs a certified translation uploaded as its own separate file',
      'PDF format only, minimum 300 DPI scan quality — lower-quality scans are a real, avoidable rejection reason',
      'Fee: about €75 for the first application, €30 for each additional one at the same intake — processing takes 4-8 weeks, so submit well before 15 July (winter semester) or 15 January (summer semester), not on the deadline itself',
    ],
    furtherReading: [{ label: 'uni-assist — official site', url: 'https://www.uni-assist.de/en/' }],
  },
  {
    label: 'Language Proficiency',
    description: 'Required regardless of pathway — which test depends entirely on whether your specific program is taught in German or English.',
    whatToInclude: [
      'German-taught programs: DSH-2 or TestDaF (level 4 in all four sections) — these are real German-proficiency exams, not something you can substitute with English scores',
      'English-taught programs: IELTS or TOEFL — commonly 6.0-6.5 IELTS, but check your specific program\'s own published minimum',
      'A Studienkolleg\'s own coursework is generally taught in German — factor in real German-language readiness even if your EVENTUAL degree program will be English-taught',
    ],
  },
  {
    label: 'Numerus Clausus (NC) & GPA',
    description: 'For NC-restricted subjects, your Abitur-equivalent GPA (not a holistic review, not test scores, not extracurriculars) is what actually decides admission — understand this before assuming any other factor will help.',
    whatToInclude: [
      "Popular subjects (medicine, psychology, many business/law programs) are NC-restricted — admission is a GPA cutoff that moves every semester based on that cycle's actual applicant pool, not a fixed number you can look up once and rely on",
      'Subjects without an NC (zulassungsfrei) admit everyone who meets the basic eligibility bar — check whether your specific target program is NC-restricted or open before building your expectations around either scenario',
      'Extracurriculars and essays carry essentially no weight in NC admission — a motivation letter matters only at the small minority of private/English-taught programs that run US-style holistic review (e.g. WHU, Jacobs University), not the system broadly',
    ],
  },
  {
    label: 'Financial & Visa Requirements',
    description: "Real, hard prerequisites for the student visa — budget for these as part of your actual application timeline, not as an afterthought once you already have an offer.",
    whatToInclude: [
      'A blocked account (Sperrkonto) with a real minimum balance (roughly €11,904 as of this cycle, adjusted periodically — confirm the current figure before opening one) proving you can support yourself for a year',
      'Apply for your student visa at VFS Global (for Indian applicants) only once you have your admission letter — this step has its own real processing time, plan for it before your intended arrival date, not after',
    ],
  },
]

// Generic per-university tasks for the "My Universities" tab — Germany's
// uni-assist covers document verification, but what's ADDITIONALLY
// required (its own NC cutoff, whether it accepts uni-assist at all,
// program-specific language requirements) is set per university/program.
export const DE_PER_UNIVERSITY_TASK_TEMPLATE: string[] = [
  "Confirm whether this university uses uni-assist or its own direct application portal",
  "Check this program's current NC cutoff (if restricted) or confirm it's zulassungsfrei (open admission)",
  "Confirm this program's specific language-proficiency threshold and whether it's German- or English-taught",
]

export const DE_PER_UNIVERSITY_TASK_DETAILS: Record<string, string> = {
  "Confirm whether this university uses uni-assist or its own direct application portal":
    "Not every German university uses uni-assist — some, especially technical universities, run their own separate online application system. Check this specific university's own admissions page before assuming uni-assist covers it.",
  "Check this program's current NC cutoff (if restricted) or confirm it's zulassungsfrei (open admission)":
    "NC cutoffs are recalculated every semester based on that cycle's actual applicant pool — a cutoff from a previous cycle is a rough guide at best, not a guarantee. Check this program's own most recently published cutoff, and note it can move up or down.",
  "Confirm this program's specific language-proficiency threshold and whether it's German- or English-taught":
    "Minimums vary by program even within the same university — a German-taught program and an English-taught program at the same school can have entirely different language requirements. Confirm the exact figure on this program's own page.",
}
