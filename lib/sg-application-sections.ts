// Singapore's real undergraduate admission structure for international
// applicants, laid out the same way the other country-specific modules in
// this directory are — used as the SG-specific checklist in Build Your
// Dream instead of the generic APPLICATION_INFO.SG.requirements fallback.
//
// Like Hong Kong, Singapore has no single shared application — NUS, NTU,
// and SMU (the three universities international applicants target most)
// each run their own separate portal, deadline, and (for some programs)
// interview process. There is no field-based branching the way India
// needs (no exam gates a specific program the way JEE/NEET do), so this
// is a flat section list.
//
// Every fact here (deadlines, typical A-Level grade profile, SMU's
// interview emphasis) was verified via web search this session against
// NUS's own admissions pages and general-knowledge admissions research on
// each university's known process — see furtherReading. Deadlines and
// grade profiles shift year to year; treat this as "how the system
// works," not this cycle's exact cutoffs.
export type SGApplicationSection = {
  label: string
  description: string
  whatToInclude: string[]
  furtherReading?: { label: string; url: string }[]
}

export const SG_APPLICATION_SECTIONS: SGApplicationSection[] = [
  {
    label: 'Direct Application to Each University',
    description: 'NUS, NTU, and SMU each run their own separate application — there is no shared Singapore-wide portal the way UCAS or Common App works elsewhere.',
    whatToInclude: [
      'International applications typically open around October and close between late January and mid-March, depending on the university and your qualification — check each university\'s own current-cycle dates rather than assuming a fixed date',
      'Apply to each university separately, with its own account, document uploads, and application fee',
      'Main offer rounds are typically released in waves from mid-April through mid-June for the August intake — competitive programs at NUS and NTU often release earlier, other faculties later',
    ],
    furtherReading: [
      { label: 'NUS — Admission Requirements (International Qualifications)', url: 'https://www.nus.edu.sg/oam/admissions/international-qualifications-for-foreigners/admission-requirements' },
      { label: 'NTU — International Qualifications', url: 'https://www.ntu.edu.sg/admissions/undergraduate/admission-guide/international-qualifications' },
    ],
  },
  {
    label: 'Academic Documents & Indicative Grade Profiles',
    description: "Each university publishes an Indicative Grade Profile (IGP) per program each year — the middle range of grades its actual admitted cohort held — so you can realistically gauge your own chances before applying, not just guess.",
    whatToInclude: [
      "A-Level results (or equivalent — CBSE/ICSE/State Board, IB, and other curricula are all accepted on their own terms, not converted into A-Level-style points)",
      "For CBSE/ICSE/State Board applicants specifically: NUS looks for a strong pass across 5 subjects including English; there's no single universal percentage floor the way India's own JEE/NEET cutoffs work — check the program's own published range",
      "For a US high-school-diploma applicant: pair your GPA with an SAT score and supporting AP subjects — GPA alone is not treated as sufficient on its own",
      "Look up each program's own IGP from the previous admission cycle before applying — it's the single most useful real benchmark each university publishes, far more specific than a generic 'competitive' label",
    ],
  },
  {
    label: 'Aptitude-Based / Discretionary Admission',
    description: "A real secondary pathway both NUS and NTU run for specific programs or borderline applicants — folded into general Discretionary Admission since 2007, not a separate visible flag on your application.",
    whatToInclude: [
      "Certain programs (design, architecture, some specialized tracks) require a portfolio or a program-specific aptitude/skills test on top of your academic results",
      "Discretionary Admission looks at leadership, projects, and overall fit beyond the raw grade profile — there's no separate form for this; it's built into how your existing application is read, so a purposeful, specific record (not just strong grades) genuinely helps here",
      "Check each program's own page for whether a portfolio, additional essay, or aptitude test applies — this is set per-program, not university-wide",
    ],
  },
  {
    label: 'Interviews (Program- and University-Dependent)',
    description: "Most international applicants to NUS/NTU never interview — but SMU is the clear exception, weighing the personal interview heavily rather than treating it as a formality.",
    whatToInclude: [
      "SMU places real weight on the interview, not just your grade profile — expect substantive questions on your intended major, extracurricular record, and reasoning skills, not a pro-forma chat",
      "NUS and NTU reserve interviews mainly for specific programs (e.g. medicine, some scholarship tracks) rather than requiring them broadly — check your specific program's page",
      "Interviews for international applicants are typically conducted online rather than requiring in-person travel to Singapore",
    ],
  },
]

// Generic per-university tasks for the "My Universities" tab — like Hong
// Kong, Singapore has no shared application across universities, so every
// added school needs its own separate account/deadline/document check.
export const SG_PER_UNIVERSITY_TASK_TEMPLATE: string[] = [
  "Create this university's own international-applicant account and confirm its current-cycle deadline",
  "Look up this exact program's Indicative Grade Profile from the most recent admission cycle",
  "Check whether this program requires a portfolio, aptitude test, or interview, and its specific format",
]

export const SG_PER_UNIVERSITY_TASK_DETAILS: Record<string, string> = {
  "Create this university's own international-applicant account and confirm its current-cycle deadline":
    "NUS, NTU, and SMU each run entirely separate application portals and deadlines that can differ by several weeks from each other — adding a school here means a genuinely separate application, not a shared one with school-specific add-ons.",
  "Look up this exact program's Indicative Grade Profile from the most recent admission cycle":
    "The IGP is published per PROGRAM, not per university — two programs at the same school can have very different admitted-cohort ranges. Use last cycle's actual published IGP for your specific program as your benchmark, not a general sense of how selective the university is.",
  "Check whether this program requires a portfolio, aptitude test, or interview, and its specific format":
    "These requirements are set per program (design and some specialized tracks are the most common cases) rather than being university-wide — confirm on this exact program's own admissions page, and note SMU in particular weighs its interview heavily regardless of program.",
}
