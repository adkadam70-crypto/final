// The real, current structure of a UCAS application, structured the same
// way lib/common-app-sections.ts structures the US Common App — used as
// the UK-specific checklist in Build Your Dream instead of the generic
// APPLICATION_INFO.UK.requirements fallback every other country still
// uses. Like the US, the UK has ONE shared national application (UCAS),
// so this is a flat section list, not India's field-branching model.
//
// Every fact here (the 2026-entry 3-question personal statement format and
// its character limit, UCAS deadline dates, and each admissions test's
// real structure) was verified via web search this session against UCAS's
// own site and each test's official/administering body — see
// furtherReading on each section. Deadlines and score thresholds move
// year to year; treat this as "how the system works," not this cycle's
// exact numbers.
export type UKApplicationSection = {
  label: string
  description: string
  whatToInclude: string[]
  furtherReading?: { label: string; url: string }[]
}

export const UK_APPLICATION_SECTIONS: UKApplicationSection[] = [
  {
    label: 'Personal Details & Education',
    description: 'Contact info, fee status, and your full qualification history — every exam board, subject, and grade (actual or predicted) you list here is what UCAS forwards to every course you apply to.',
    whatToInclude: [
      'Legal name, address, contact details, and nationality/fee status (this determines whether you\'re assessed as Home or International/Overseas fee status)',
      'Every qualification you hold or are taking — GCSEs (or equivalent), and your current A-Level/IB/CBSE/ICSE/State Board/other subjects with predicted or actual grades',
      "If you're on a non-UK curriculum, list it exactly as your school reports it — universities set their own per-curriculum entry requirements (see each course's own page for the grade equivalence they expect from your specific board)",
      'Any resits, retakes, or gaps in your education — UCAS asks you to disclose these, not hide them',
    ],
  },
  {
    label: 'Employment History',
    description: 'Optional, and weighed far less than in a US application — only include it if it exists.',
    whatToInclude: [
      'Any paid work you\'ve done, with employer name and dates — most 17-18 year old applicants leave this section empty or near-empty, and that is normal',
      'This does not replace or substitute for the "super-curricular" activity that actually matters for your course (see the Personal Statement section)',
    ],
  },
  {
    label: 'Personal Statement (3 Questions, 2026 Entry)',
    description: "Replaced the old single free-form essay starting with 2026 entry — now three specific, structured questions, 4,000 characters total across all three (UCAS lets you split that budget across the three however you want).",
    whatToInclude: [
      '"Why do you want to study this course or subject?" — be specific to the actual course, not a generic love of the field',
      '"How have your qualifications and studies helped you to prepare for this course or subject?" — cite specific topics, projects, or coursework, not just subject names',
      '"What else have you done to prepare outside of formal education, and why are these experiences useful?" — this is where "super-curricular" activity goes: subject-specific reading, MOOCs, an EPQ, Olympiads, relevant work experience, taster lectures',
      "Real UK admissions weighs 'super-curricular' engagement (going deeper into the subject itself) far above generic extracurriculars or hobbies unrelated to your course — a coding competition matters for a Computer Science application in a way that captaining an unrelated sports team does not",
      'The SAME statement (all three answers) is sent to every course you apply to — write it for the most competitive/specific course on your list if your 5 choices span different subjects, since a statement that reads as genuinely for one subject looks unfocused to a different one',
    ],
    furtherReading: [
      { label: 'UCAS — Personal Statement Toolkit', url: 'https://www.ucas.com/advisers/help-and-training/toolkits/personal-statement-toolkit' },
      { label: 'UCAS — How to write your personal statement', url: 'https://www.ucas.com/applying/applying-to-university/writing-your-personal-statement/how-to-write-your-personal-statement-for-2026-entry-onwards' },
    ],
  },
  {
    label: 'Reference',
    description: "A school/college reference confirming your predicted grades and academic context — submitted by a teacher or counselor, not something you write yourself.",
    whatToInclude: [
      "Arrange this with your school's UCAS coordinator early — most schools have an internal deadline well before UCAS's own, so this often needs starting months in advance",
      'If you\'re home-schooled or your school doesn\'t support UCAS references, you need an "independent" reference from someone who can genuinely speak to your academic ability — UCAS has specific rules for who qualifies, check these before assuming any adult will do',
      'This is where your predicted grades are formally confirmed to UCAS — make sure what your teachers predict matches what you\'ve told universities elsewhere in your application',
    ],
  },
  {
    label: 'Course Choices (up to 5)',
    description: 'Up to 5 course+university combinations, submitted together — but Oxford and Cambridge cannot both be chosen in the same cycle, and medicine/dentistry/veterinary applicants are capped at 4 choices in that group (the 5th slot can be a non-clinical backup).',
    whatToInclude: [
      'Universities cannot see which other choices you\'ve made until after decisions are out (except your firm/insurance choices post-offer) — so there is no "safety school penalty" the way there sometimes is in other systems',
      'Deadline structure: 15 October 2026, 18:00 UK time for Oxford, Cambridge, and most medicine/dentistry/veterinary courses; 13 January 2027, 18:00 UK time as the main equal-consideration deadline for almost everything else',
      'Applications submitted after 13 January but before 30 June are still forwarded, but only considered if a course still has space — there is no formal "equal consideration" guarantee past that date',
      "Offers are typically conditional (\"AAB\" or similar) — you accept a Firm choice and an Insurance backup, and UCAS's Clearing/Adjustment process runs after results if your Firm doesn't confirm",
    ],
    furtherReading: [{ label: 'UCAS — key dates', url: 'https://www.ucas.com/undergraduate/applying-university/key-dates-ucas-undergraduate' }],
  },
  {
    label: 'Course-Specific Admissions Tests',
    description: "Not every course needs one — but several of the most competitive courses and universities require a separate admissions test on top of the UCAS application itself. Which one (if any) applies depends entirely on your course and university.",
    whatToInclude: [
      'UCAT (medicine & dentistry, almost universally): 4 sections — Verbal Reasoning, Decision Making, Quantitative Reasoning (each scored 300-900, combined out of 2700), plus a separately-banded Situational Judgement Test (bands 1-4). BMAT has been discontinued and is no longer used.',
      'LNAT (law, most Russell Group law schools including Oxford): 2 hours 15 minutes — Section A is 42 multiple-choice questions on 12 comprehension passages (95 min, the only numerically-scored part); Section B is one ~750-word essay from a choice of 3 prompts (40 min), sent to universities unscored but read by admissions tutors',
      "ESAT (Engineering and Science Admissions Test — required for specific Oxford courses like Engineering Science, Physics, Biomedical Sciences, and Cambridge courses like Engineering, Natural Sciences, Veterinary Medicine): tests Maths plus your relevant sciences (Physics/Chemistry/Biology)",
      "TMUA (Test of Mathematics for University Admission — required for Cambridge Maths/Computer Science/Economics, Oxford Maths/Computer Science, and used by Warwick, LSE for specific courses): tests mathematical reasoning, not curriculum content recall",
      "TARA (Test of Academic Reasoning for Admissions — used by UCL for many courses and by Oxford for some humanities courses from 2026): a reasoning-based test, distinct from TMUA/ESAT",
      "Check your EXACT course + university combination's own admissions-test page — these requirements are set per-course, not per-university, and change from year to year, so don't assume based on a similar course elsewhere",
    ],
    furtherReading: [
      { label: 'Oxford — Admissions tests', url: 'https://www.ox.ac.uk/admissions/undergraduate/applying/guide-for-applicants/admissions-tests' },
      { label: 'Cambridge — Engineering and Science Admissions Test', url: 'https://www.undergraduate.study.cam.ac.uk/apply/how/science-engineering-admission-test' },
    ],
  },
]

// Generic per-university tasks for the "My Universities" tab — UCAS choices
// share one core application, but what's ADDITIONALLY required (an
// admissions test, an interview, a portfolio) is set per course+university,
// not app-wide, so each added school needs its own check, similar in spirit
// to Common App's per-college tasks but for genuinely different reasons.
export const UK_PER_UNIVERSITY_TASK_TEMPLATE: string[] = [
  "Check this exact course's admissions-test requirement (UCAT/LNAT/ESAT/TMUA/TARA/none) and register before its own separate deadline — these are set per-course, not per-university",
  'Confirm this course\'s specific offer conditions (grades, and any required subject at a specific grade) from its own course page, not a generic university-wide figure',
  'Check whether this course requires an interview, written work submission, or portfolio, and what format it takes',
]

export const UK_PER_UNIVERSITY_TASK_DETAILS: Record<string, string> = {
  "Check this exact course's admissions-test requirement (UCAT/LNAT/ESAT/TMUA/TARA/none) and register before its own separate deadline — these are set per-course, not per-university":
    'Admissions tests are booked and sat through the test\'s OWN administering body (not through UCAS), often with a separate registration deadline that falls before the UCAS application deadline itself — leaving this until after you\'ve submitted your UCAS choices can mean missing the test window entirely.',
  'Confirm this course\'s specific offer conditions (grades, and any required subject at a specific grade) from its own course page, not a generic university-wide figure':
    'The same university can set very different offer conditions for different courses (e.g. AAA for one course, A*AA for another) — always check the specific course page for this cycle\'s published offer, since these are reviewed and can change year to year.',
  'Check whether this course requires an interview, written work submission, or portfolio, and what format it takes':
    'Oxford, Cambridge, and several competitive courses elsewhere interview shortlisted applicants (often online) between November and February — art, architecture, and some humanities courses may also ask for a portfolio or a sample of existing written work. Check this specific course\'s own admissions page for what applies and how far in advance you need to prepare it.',
}
