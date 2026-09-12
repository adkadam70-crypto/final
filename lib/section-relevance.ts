// "Is this optional section worth filling in, given MY selected countries" —
// shown as a plain-text breakdown (not a dot) next to a section heading:
// which of the student's own selected target countries actually weigh this
// section, and which don't. Deliberately narrow in scope: Academics
// (curriculum + main grade) is NEVER part of this system since it's
// universally required regardless of target country — only genuinely
// optional sections (prior grades, AP courses, extracurriculars,
// India-specific entrance exams) get this treatment. Sections stay visible
// either way — this informs, it never hides anything, since a student
// targeting one relevant AND one irrelevant country at once still needs the
// section for the relevant one.

export const COUNTRY_NAMES: Record<string, string> = {
  US: 'the US',
  UK: 'the UK',
  AU: 'Australia',
  SG: 'Singapore',
  HK: 'Hong Kong',
  IN: 'India',
  DE: 'Germany',
  FR: 'France',
}

export type RelevanceBreakdown = {
  // Only ever contains codes that are actually in the student's own
  // targetCountries — this is "of what you picked, which apply", not a
  // global reference table.
  relevantCountries: string[]
  notRelevantCountries: string[]
  note: string
}

function breakdown(targetCountries: string[], relevantSet: Set<string>, relevantNote: string, notRelevantNote: string): RelevanceBreakdown {
  const relevantCountries = targetCountries.filter((c) => relevantSet.has(c))
  const notRelevantCountries = targetCountries.filter((c) => !relevantSet.has(c))
  const note = relevantCountries.length > 0 && notRelevantCountries.length > 0
    ? `${relevantNote} Less so for ${notRelevantCountries.map((c) => COUNTRY_NAMES[c] ?? c).join(', ')}.`
    : relevantCountries.length > 0
      ? relevantNote
      : notRelevantNote
  return { relevantCountries, notRelevantCountries, note }
}

// Whether a country's admissions process meaningfully looks at grades
// earlier than the final year — same research behind GRADE_RELEVANCE
// (lib/prior-grades.ts). AU/IN/DE explicitly do NOT formally consider
// earlier years per that research; US/UK/SG/HK/FR do, to varying degrees.
const PRIOR_GRADES_RELEVANT = new Set(['US', 'UK', 'SG', 'HK', 'FR'])

export function priorGradesRelevance(targetCountries: string[]): RelevanceBreakdown {
  return breakdown(
    targetCountries,
    PRIOR_GRADES_RELEVANT,
    'Relevant — reviews grades earlier than your final year.',
    "Not formally considered by any of your selected countries — 9th-11th mainly matters if you're also targeting the US, UK, Singapore, Hong Kong, or France.",
  )
}

// AP (Advanced Placement) is a US College Board credential — its main value
// is signaling rigor to US admissions offices (and occasionally earning US
// college credit). Every other country here runs admissions off its own
// curriculum's own rigor signal instead (A-Level grades, IB HL subjects,
// board percentage, HKDSE bands) rather than weighing an added-on US exam.
const AP_RELEVANT = new Set(['US'])

export function apCoursesRelevance(targetCountries: string[]): RelevanceBreakdown {
  return breakdown(
    targetCountries,
    AP_RELEVANT,
    'Relevant — a real rigor signal for US applications.',
    "Not a factor for any of your selected countries — AP is a US-specific credential; other admissions processes weigh their own curriculum's rigor instead.",
  )
}

// Researched against each country's own application-info entry
// (lib/application-info.ts's extracurriculars field): US weighs it heavily;
// UK/SG/HK give it real (if secondary) weight through a named mechanism
// (super-curriculars, CCA/Discretionary Admission, OEA/OLE); AU (no weight
// for direct ATAR entry), India (minimal for merit admission), Germany
// (essentially not considered under NC), and France (limited at public
// universities) do not meaningfully weigh it.
const EXTRACURRICULARS_RELEVANT = new Set(['US', 'UK', 'SG', 'HK'])

export function extracurricularsRelevance(targetCountries: string[]): RelevanceBreakdown {
  return breakdown(
    targetCountries,
    EXTRACURRICULARS_RELEVANT,
    'Relevant — carries real weight in admissions.',
    'Not weighed much by any of your selected countries — admission there runs mainly on grades/exam results instead, so treat this as optional for your current selection.',
  )
}

// India's major entrance exams are each tied to one field — flagging a
// mismatch as a note (never hiding the section, a student's intended field
// can change) so a student browsing JEE fields while undecided isn't misled
// into thinking it's required for every field.
export function indiaExamFieldNote(exam: 'JEE' | 'NEET' | 'CLAT', intendedField: string): string | null {
  if (intendedField === 'No preference') return null
  const relevantField: Record<'JEE' | 'NEET' | 'CLAT', string> = {
    JEE: 'Engineering',
    NEET: 'Medicine & Health Sciences',
    CLAT: 'Law',
  }
  const forField = relevantField[exam]
  if (intendedField === forField) return null
  return `Typically only relevant for ${forField} — you've selected ${intendedField}. Leave blank if it doesn't apply.`
}
