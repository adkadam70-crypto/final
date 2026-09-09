// The real, current structure of the Common Application (verified via
// Common App's own guidance this session), used as the US-specific
// application checklist in Build Your Dream instead of the generic
// per-country requirements list every other country still uses. Common App
// splits into two levels: the core application (done once, shared across
// every school) and a per-college "My Colleges" tab (done once per school
// added) — see PER_UNIVERSITY_TASK_TEMPLATE below for that second level.
export const COMMON_APP_SECTIONS: { label: string; description: string }[] = [
  { label: 'Profile', description: 'Personal info, address, contact details, demographics, language, geography & nationality, fee waiver eligibility.' },
  { label: 'Family', description: "Parent/guardian education & occupation, household details, up to 10 siblings." },
  { label: 'Education', description: 'High school(s) attended, concurrent college enrollment, current courses, class rank, academic history.' },
  { label: 'Testing', description: "SAT/ACT scores, if you're submitting them — many selective schools have gone back to requiring them, so check each school's own policy rather than assuming test-optional." },
  { label: 'Activities', description: 'Up to 10 extracurriculars, each a 150-character description of what you actually did.' },
  { label: 'Writing', description: 'The Personal Essay (250-650 words, one of 7 fixed prompts) plus an optional Additional Information section.' },
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
