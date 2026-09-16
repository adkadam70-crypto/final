// Australia's real undergraduate admission structure for international
// applicants, laid out the same way the other country-specific modules in
// this directory are — used as the AU-specific checklist in Build Your
// Dream instead of the generic APPLICATION_INFO.AU.requirements fallback.
//
// The single most important correction this module makes versus the old
// generic text: CBSE/ICSE/State Board, A-Level, and IB-taken-outside-
// Australia students do NOT apply through UAC (or any state admissions
// centre) — those centres are for Australian-curriculum Year 12 students
// (in or outside Australia), IB taken at an Australian school, or NZ
// NCEA students. Everyone else applies DIRECTLY to each university,
// which converts their result to an equivalent selection rank internally
// — the same "no shared platform" shape as Hong Kong and Singapore, not
// UAC's shared-platform shape. Verified via web search this session
// against UAC's own eligibility guidance — see furtherReading.
export type AUApplicationSection = {
  label: string
  description: string
  whatToInclude: string[]
  furtherReading?: { label: string; url: string }[]
}

export const AU_APPLICATION_SECTIONS: AUApplicationSection[] = [
  {
    label: 'Direct Application to Each University (Not UAC)',
    description: "UAC and the other state admissions centres (VTAC, QTAC, SATAC) are for Australian-curriculum Year 12 students, IB taken at an Australian school, or NZ NCEA — CBSE/ICSE/State Board, A-Levels, and IB taken outside Australia all apply directly to each university instead.",
    whatToInclude: [
      'Create a separate account and submit a separate application to each university — there is no shared platform the way UCAS or Common App work, the same shape as Hong Kong and Singapore\'s international pathways',
      "Direct applications typically ask for more documents than a UAC application (roughly 7 vs. 4 on average) — budget more prep time per school than a state-admissions applicant would need",
      "Group of Eight (Go8 — Australia's most research-intensive universities) and other universities each run their own portal, deadlines, and document checklist",
    ],
    furtherReading: [{ label: 'UAC — International Year 12 students', url: 'https://uac.edu.au/future-applicants/international-year-12-students' }],
  },
  {
    label: 'Academic Documents & Selection Rank Conversion',
    description: "Each university converts your result into its own ATAR-equivalent 'selection rank' internally using its own published conversion table — there is no single universal formula, and it's set per university, not nationally.",
    whatToInclude: [
      'Official transcripts/certificates for your final 2 years of secondary school (Year 11-12 equivalent)',
      "For CBSE/ICSE specifically: universities commonly average your best 4 subjects and match that percentage to an ATAR band via their own published table — e.g. an 84% across your best 4 CBSE/ICSE subjects has commonly mapped to roughly an ATAR of 92, but this varies by university, confirm your specific target school's own table rather than assuming one number applies everywhere",
      "A US high-school diploma is normally paired with an SAT or ACT score for a direct rank conversion — GPA alone typically isn't sufficient on its own",
    ],
  },
  {
    label: 'English Language Proficiency',
    description: "A hard requirement for every international applicant, with genuinely higher thresholds at Australia's top research universities than the older, lower baseline many students expect.",
    whatToInclude: [
      "The Group of Eight (Go8) universities' common baseline is IELTS 6.5 overall with no band below 6.0 for undergraduate entry — check whether your specific target school follows this or sets its own",
      'TOEFL iBT and PTE Academic are commonly accepted alternatives — confirm your specific target university\'s own accepted-test list and minimums, they are not identical everywhere',
      'Competitive programs (medicine, law) at Go8 universities can set meaningfully higher thresholds than the general undergraduate baseline',
    ],
  },
  {
    label: 'Personal Statement / Genuine Student Statement',
    description: "Not universal for the academic application itself, but the Genuine Student (GS) statement IS mandatory for every international student's visa — don't skip this thinking it's optional.",
    whatToInclude: [
      "A personal statement or statement of purpose is required by a majority of Group of Eight universities for direct undergraduate applications — typically shorter than a US-style essay, around 500 words is a common length, confirm your specific program's own limit",
      "Separately, EVERY international student must submit a Genuine Student (GS) statement as part of their Australian student visa application — this exists even for universities that don't require a personal statement for academic admission itself, so don't assume no-personal-statement means no writing requirement anywhere in the process",
      "Two academic references are requested by a meaningful share of postgraduate direct applications — less common at undergraduate level, but check your specific program",
    ],
  },
  {
    label: 'Course-Specific Admissions Tests',
    description: "Not universal — but a real, separate requirement for a handful of competitive fields at Go8 universities specifically.",
    whatToInclude: [
      'UCAT for medicine (and sometimes dentistry) — the same test used across several other English-speaking systems, check whether your specific target program requires it',
      'LSAT for some law programs at Go8 universities — not universal across all Australian law programs, confirm per school',
      'Portfolio or audition requirements for creative-arts and design programs, set per program',
    ],
  },
]

// Generic per-university tasks for the "My Universities" tab — like Hong
// Kong and Singapore, Australia has no shared application across
// universities for this app's target curricula, so every added school
// needs its own separate account/deadline/conversion-table check.
export const AU_PER_UNIVERSITY_TASK_TEMPLATE: string[] = [
  "Create this university's own direct-application account — confirm it doesn't route through UAC for your curriculum",
  "Look up this university's own selection-rank conversion table for your exact curriculum and subject combination",
  "Confirm this program's specific IELTS/TOEFL/PTE threshold and whether a course-specific test (UCAT/LSAT/portfolio) applies",
]

export const AU_PER_UNIVERSITY_TASK_DETAILS: Record<string, string> = {
  "Create this university's own direct-application account — confirm it doesn't route through UAC for your curriculum":
    "Most Australian universities accept both UAC-eligible and direct-application international students through separate channels — creating the wrong one can mean your application isn't even being evaluated by the right process. Confirm on this specific university's own international-admissions page.",
  "Look up this university's own selection-rank conversion table for your exact curriculum and subject combination":
    "Selection-rank conversion tables are set PER UNIVERSITY, not nationally — the same CBSE percentage can convert to a different equivalent rank at two different schools. Use this exact university's own published table, not a generic industry rule of thumb.",
  "Confirm this program's specific IELTS/TOEFL/PTE threshold and whether a course-specific test (UCAT/LSAT/portfolio) applies":
    "Thresholds and extra test requirements are set per program, not university-wide — a competitive program (medicine, law) at the same school you're already considering for another course can carry meaningfully different requirements.",
}
