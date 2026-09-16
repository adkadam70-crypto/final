// Hong Kong's real undergraduate admission structure, laid out the same
// way lib/common-app-sections.ts and lib/uk-application-sections.ts lay
// out their systems — used as the HK-specific checklist in Build Your
// Dream instead of the generic APPLICATION_INFO.HK.requirements fallback.
//
// Unlike the US/UK, Hong Kong has no single shared application: local
// HKDSE students apply through JUPAS, but every other curriculum
// (CBSE/ICSE/State Board, IB, A-Levels, a US diploma) applies "Non-JUPAS"
// — directly to each university's own international-admissions portal,
// each with its own deadlines, documents, and English-proficiency
// threshold. Since this app's students are overwhelmingly on non-HKDSE
// curricula, the Non-JUPAS/international pathway is the one built out in
// depth here; JUPAS is included for completeness.
//
// Every fact here (deadlines, IELTS threshold, application rounds) was
// verified via web search this session against HKU's own admissions site
// as the representative example — other universities (HKUST, CUHK, PolyU,
// CityU) run the same Non-JUPAS structure with their own specific
// deadlines and thresholds, which is why the per-university checklist
// below tells the student to confirm the exact numbers per school rather
// than assuming HKU's figures apply everywhere.
export type HKApplicationSection = {
  label: string
  description: string
  whatToInclude: string[]
  furtherReading?: { label: string; url: string }[]
}

export const HK_APPLICATION_SECTIONS: HKApplicationSection[] = [
  {
    label: 'Choose Your Pathway: JUPAS vs. Non-JUPAS',
    description: 'The single most important first decision — which application system you use depends entirely on your curriculum, not on which university you want.',
    whatToInclude: [
      'JUPAS is for HKDSE (the local Hong Kong Diploma of Secondary Education) students only — up to 20 program choices, ranked by preference, through one shared portal',
      "Everyone else — CBSE/ICSE/State Board, IB, A-Levels, a US high school diploma, or any other international curriculum — applies through each university's own Non-JUPAS / international-admissions portal, directly and separately per university",
      "There is no shared Non-JUPAS application the way UCAS or Common App works — you create a separate account and submit a separate application to HKU, HKUST, CUHK, PolyU, CityU, and any other university individually, each with its own deadlines and required documents",
    ],
  },
  {
    label: 'Academic Documents & Predicted Grades',
    description: "Your current transcript plus predicted (or actual, if already released) results in your curriculum — this is what your application is actually assessed on before any interview.",
    whatToInclude: [
      'Official transcripts for the last 2-3 years, plus predicted grades from your school for any results not yet out',
      "Each university sets its OWN minimum threshold per curriculum (e.g. a specific CBSE/CISCE aggregate percentage, or an IB points total) — check the exact university's international-qualifications page for your specific board, don't assume one school's published number applies to another",
      'Subject prerequisites for your intended program (e.g. Maths and a science for most STEM programs) — confirmed per program, not university-wide',
    ],
  },
  {
    label: 'English Language Proficiency',
    description: 'Required for every non-JUPAS applicant unless your entire prior education was in English — this is a hard gate, not a soft preference.',
    whatToInclude: [
      'IELTS Academic overall band 6.5 is a common threshold (HKU\'s published figure) — other universities publish their own, so confirm the exact number for each school you\'re applying to rather than assuming they match',
      'TOEFL iBT is generally accepted as an alternative — check each university\'s own accepted-test list and minimum score',
      'Some universities exclude specific IELTS variants (e.g. "IELTS Indicator" or online/one-skill-retake versions) — confirm you\'re booking a version each target university actually accepts before you sit it',
      'Your test must usually be taken within 2 years of your intended entry date — check each university\'s own validity window',
    ],
    furtherReading: [{ label: 'HKU — English Language Requirement', url: 'https://admissions.hku.hk/apply/international-qualifications/english-language-requirement' }],
  },
  {
    label: 'Personal Statement & References',
    description: 'Increasingly weighed alongside grades on the international pathway, even though academics still come first — this is where you explain program fit, not tell a US-style personal narrative.',
    whatToInclude: [
      'A personal statement addressing why this program and university specifically, plus what in your record supports that choice — check each university\'s own required length/format, they vary',
      "Reference letter(s) from a teacher or counselor — arrange this early, the same way you would for UCAS, since your school needs lead time",
      "Some universities (and some programs) request a supplementary essay or short-answer responses on top of the general personal statement — confirm per school",
    ],
  },
  {
    label: 'Interviews (Where Required)',
    description: "Not universal, but common — especially for competitive programs (business, medicine, law) and increasingly used to differentiate between similarly-qualified international applicants.",
    whatToInclude: [
      'Interviews on the international pathway are typically conducted online (Skype/Zoom) for overseas applicants rather than requiring in-person travel',
      'Whether you get one depends on your program and how your application reads on paper — check whether your target program\'s page mentions interviews at all, and prepare for program-specific "why this field" and "why Hong Kong" framing if so',
    ],
  },
  {
    label: 'Application Rounds & Deadlines',
    description: "Most universities run staged rounds (earlier submission = earlier decision and often better chances, since later rounds fill from a shrinking pool of remaining seats) rather than one single deadline.",
    whatToInclude: [
      "HKU's own published pattern for 2026 entry: applications open late September, first-round submission deadline late November, supporting documents due early December, first-round results from December — later rounds continue on a rolling basis into the following August, subject to remaining places",
      "Applying in the first round genuinely matters here — rolling admission means later rounds are competing for whatever seats are left, not a fresh full allocation",
      "Each university sets its own exact dates — confirm the current cycle's dates on each university's own admissions page rather than assuming they match HKU's",
    ],
    furtherReading: [{ label: 'HKU — International Qualifications', url: 'https://admissions.hku.hk/apply/international-qualifications' }],
  },
]

// Generic per-university tasks for the "My Universities" tab — Hong Kong
// has no shared non-JUPAS application, so (unlike Common App) every added
// school genuinely needs its own separate account, deadline, and document
// check, not just a school-specific add-on to one shared core.
export const HK_PER_UNIVERSITY_TASK_TEMPLATE: string[] = [
  "Create this university's own Non-JUPAS/international-admissions account — there is no shared portal across Hong Kong universities",
  "Confirm this university's exact English-proficiency threshold and accepted tests for your intended program",
  "Check this university's own application round dates — apply in its earliest round, since later rounds compete for fewer remaining seats",
]

export const HK_PER_UNIVERSITY_TASK_DETAILS: Record<string, string> = {
  "Create this university's own Non-JUPAS/international-admissions account — there is no shared portal across Hong Kong universities":
    "Each Hong Kong university (HKU, HKUST, CUHK, PolyU, CityU, and others) runs a completely separate online application system for non-JUPAS applicants — adding a school here means a real separate application on that university's own site, with its own login, document uploads, and application fee.",
  "Confirm this university's exact English-proficiency threshold and accepted tests for your intended program":
    "Published minimums (e.g. IELTS 6.5 overall at HKU) vary by university and sometimes by program within the same university — check the specific school's own English Language Requirement page rather than assuming one school's threshold applies to another.",
  "Check this university's own application round dates — apply in its earliest round, since later rounds compete for fewer remaining seats":
    "Hong Kong's non-JUPAS admission is rolling, not a single deadline with one collective decision date — the earliest round you're eligible for gives you the best chance, since each later round is being decided against a shrinking number of remaining seats, not a fresh full applicant pool.",
}
