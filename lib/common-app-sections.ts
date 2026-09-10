// The real, current structure of the Common Application (verified via
// Common App's own guidance this session), used as the US-specific
// application checklist in Build Your Dream instead of the generic
// per-country requirements list every other country still uses. Common App
// splits into two levels: the core application (done once, shared across
// every school) and a per-college "My Colleges" tab (done once per school
// added) — see PER_UNIVERSITY_TASK_TEMPLATE below for that second level.
export type CommonAppSection = {
  label: string
  description: string
  // Shown when the student clicks into the section — a deeper, concrete
  // breakdown of what actually has to go in it, not just the one-line
  // summary above.
  whatToInclude: string[]
  // A worked example, where one genuinely helps (Activities' ranking logic
  // is the clearest case) — omitted for sections where an example wouldn't
  // add anything beyond the whatToInclude bullets.
  example?: string
  // Real published essay archives — schools that put out real admitted
  // students' essays each year, not a generic "how to write an essay" blog.
  essayExampleLinks?: { label: string; url: string }[]
}

export const COMMON_APP_SECTIONS: CommonAppSection[] = [
  {
    label: 'Profile',
    description: 'Personal info, address, contact details, demographics, language, geography & nationality, fee waiver eligibility.',
    whatToInclude: [
      'Legal name exactly as it appears on official documents, plus any preferred name',
      'Current and permanent mailing address, phone number, email you check regularly',
      'Date of birth, sex, and (optional) race/ethnicity and gender identity questions',
      'Language(s) spoken at home and your level of English fluency',
      'Country of birth and citizenship — this is what determines whether a school treats you as an international applicant',
      'Whether you want to be considered for an application fee waiver (based on financial need)',
    ],
  },
  {
    label: 'Family',
    description: 'Parent/guardian education & occupation, household details, up to 10 siblings.',
    whatToInclude: [
      "Each parent/guardian's education level (this is a real first-generation-student signal schools look at)",
      'Parent/guardian occupation and employer',
      'Household structure — who you live with, marital status of parents/guardians',
      'Siblings (up to 10): their age and whether they attend/attended college, and where',
    ],
  },
  {
    label: 'Education',
    description: 'High school(s) attended, concurrent college enrollment, current courses, class rank, academic history.',
    whatToInclude: [
      'Every high school attended, with dates — if you transferred schools, list all of them',
      'Counselor and school CEEB code (your school provides this)',
      'Current-year courses in progress, with level (Honors/AP/IB/regular)',
      'Class rank, if your school calculates and reports one (many don\'t — that\'s fine to leave blank)',
      'Any college courses taken while still in high school (dual enrollment)',
      'Whether you\'ve ever been suspended, expelled, or convicted of a crime — schools require honest disclosure here',
    ],
  },
  {
    label: 'Testing',
    description: "SAT/ACT scores, if you're submitting them — many selective schools have gone back to requiring them, so check each school's own policy rather than assuming test-optional.",
    whatToInclude: [
      'Which tests you\'ve taken or plan to take (SAT, ACT, and any AP exam scores)',
      'Self-reported scores are fine for most schools at application time — official score reports are sent later, only if admitted/enrolling',
      "Each individual school's OWN testing policy — required, test-optional, or test-blind — since this varies school by school and has been shifting back toward required at several selective schools",
      'English proficiency test scores (IELTS/TOEFL/Duolingo/etc.) if applying as an international student from a non-English-medium school',
    ],
  },
  {
    label: 'Activities',
    description: 'Up to 10 extracurriculars, each a 150-character description of what you actually did.',
    whatToInclude: [
      'Up to 10 activities total — you do not need all 10 filled to submit a strong application',
      'A category for each (Athletics, Art, Community Service, Work, Research, Music, Debate/Speech, Student Government, etc.)',
      'Position/leadership description (up to 50 characters) — e.g. "Founder & President", "Varsity Captain", "Section Editor"',
      'A 150-character description of what you actually did — concrete and specific beats a vague title (say what you built, organized, taught, or achieved, not just the role name)',
      'Grade levels you participated (9/10/11/12) and timing (school year and/or summer)',
      'Hours per week and weeks per year — schools use this to judge depth of commitment, not just breadth',
      'CRITICAL — order matters: Common App activities are ranked by YOU, most-important first, and admissions readers weigh the first few entries more heavily. Rank by genuine depth of commitment and personal significance, not by what sounds most impressive on paper — a 3-year commitment you led should almost always outrank a one-time, resume-padding activity, even if the second one has a fancier name.',
    ],
    example: 'A student who spent 3 years running their school\'s coding club should list that FIRST (e.g. "Founder & President — Coding Club: Built and taught a 12-week Python curriculum to 30 students; organized a school-wide hackathon with 80 participants"), ahead of a one-off summer shadowing program, even though "shadowing at a hospital" might sound more prestigious in isolation — sustained leadership and initiative reads stronger than a short, passive activity.',
  },
  {
    label: 'Writing',
    description: 'The Personal Essay (250-650 words, one of 7 fixed prompts) plus an optional Additional Information section.',
    whatToInclude: [
      'The Personal Statement: 250-650 words, responding to ONE of Common App\'s 7 fixed prompts (background/identity, overcoming a challenge, questioning a belief, gratitude, personal growth, a topic of fascination, or a free topic of your choice)',
      'This essay is shared with every school on your list — it should tell a story only you could tell, with a specific, concrete anecdote rather than a general statement of values',
      'The optional Additional Information section (up to 650 words) — use it only for context that genuinely needs explaining (an extenuating circumstance, a gap in your record, COVID impact), never as a second essay to restate your resume',
      'Some individual schools ALSO require their own supplemental essays on top of this — those live under that school\'s own tab, not here (see the per-school checklist when you add a university)',
    ],
    essayExampleLinks: [
      { label: 'Johns Hopkins — Essays That Worked', url: 'https://apply.jhu.edu/application-tips/essays-that-worked/' },
      { label: 'Connecticut College — Essays That Worked', url: 'https://www.conncoll.edu/admission-financial-aid/apply/essays-that-worked/' },
      { label: 'Common App — Writing Prompts', url: 'https://www.commonapp.org/apply/essay-prompts' },
    ],
  },
]

// Generic per-college tasks that apply to essentially every school added to
// the "My Colleges" tab, regardless of which school it is — real Common App
// structure (FERPA/Recommenders is genuinely a per-college step, not global,
// since recommenders are assigned per application). School-SPECIFIC gaps
// (a required portfolio, a missing test score for this exact school, etc.)
// come from the AI analysis itself when a school is added — these are just
// the baseline tasks every school carries.
export const PER_UNIVERSITY_TASK_TEMPLATE: string[] = [
  'Complete FERPA release & assign recommenders for this school',
  "Confirm this school's testing policy and submit or withhold scores accordingly",
  'Check whether this school requires self-reported Courses & Grades',
]

// Deep-dive guidance for the generic template tasks above — real Common App
// "My Colleges" tab behavior, so this is accurate for every school without
// needing a per-school AI call. Keyed by the exact task string so the UI can
// look up a deeper explanation on click; school-SPECIFIC tasks (from the AI
// analysis) have no entry here since they're already concrete single-line
// instructions by construction (see the dreamPriorityMode prompt in
// app/actions/analyze-target-university.ts).
export const PER_UNIVERSITY_TASK_DETAILS: Record<string, string> = {
  'Complete FERPA release & assign recommenders for this school': 'On this school\'s "My Colleges" tab, sign the FERPA release waiving your right to see recommendation letters (schools weigh waived letters as more candid), then assign which teachers/counselor write for THIS school specifically — Common App lets you assign different recommenders per school, so don\'t assume your first school\'s assignments carry over.',
  "Confirm this school's testing policy and submit or withhold scores accordingly": 'Testing policy is set PER SCHOOL, not app-wide — open this school\'s own admissions/testing page (policies range from required to test-optional to test-blind and have been shifting back toward required at some selective schools). If required or you\'re submitting voluntarily, self-report your scores on this school\'s Testing tab now; official reports only matter later if you enroll.',
  'Check whether this school requires self-reported Courses & Grades': 'Some schools require you to manually enter every course and grade from 9th grade on, on top of your official transcript — this is separate work, not automatic. Check this school\'s own requirements page for "Self-Reported Academic Record" or similar, and budget real time for it if required; it is not optional busywork, some admissions offices review it before the transcript arrives.',
}
