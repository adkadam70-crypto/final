import type { StandardizedTests } from '@/lib/standardized-tests'
import { computeGradeYearCoverage, type PriorGrades } from '@/lib/prior-grades'

// Minimal shape this needs from the master profile — kept narrow so this
// isn't coupled to the full Drizzle row type.
export type ChecklistProfile = {
  standardizedTests: StandardizedTests
  extracurriculars: string[]
}

export type SectionCoverageProfile = ChecklistProfile & { curriculum?: string; apCourses?: string[]; priorGrades?: PriorGrades | null; hasTwelfth?: boolean }

export type SectionCoverage = { have: string; need: string }

// Personalizes each Common App section's expanded detail with what's
// actually on this student's master profile already vs. what's genuinely
// still missing — the static whatToInclude bullets (lib/common-app-sections.ts)
// stay generic reference material, this is the "where do YOU actually
// stand" layer on top of it. Exact-match on the Common App section labels
// only (see computeSectionCoverageBar below for why) — returns null for
// anything else (the generic per-country requirement strings, which have no
// equivalent personalized breakdown yet).
export function getSectionCoverage(requirement: string, profile: SectionCoverageProfile, country: string): SectionCoverage | null {
  const r = requirement.toLowerCase()
  const t = profile.standardizedTests

  if (r === 'testing') {
    const parts: string[] = []
    if (t.satMath !== undefined && t.satReadingWriting !== undefined) parts.push(`SAT ${t.satMath + t.satReadingWriting}`)
    if (t.act !== undefined) parts.push(`ACT ${t.act}`)
    if (t.englishTestType !== undefined && t.englishTestScore !== undefined) parts.push(`${t.englishTestType} ${t.englishTestScore}`)
    return {
      have: parts.length ? parts.join(', ') : 'No test scores on file yet.',
      need: parts.length ? "Nothing more needed here — just confirm each school's own testing policy when you add it." : 'Add an SAT/ACT score, or an English proficiency score if applying as an international student, on your profile.',
    }
  }

  if (r === 'activities') {
    const n = profile.extracurriculars.length
    return {
      have: n ? profile.extracurriculars.join('; ') : 'None added yet.',
      need: n >= 10 ? 'You\'ve filled all 10 slots — just double-check they\'re ranked with your most meaningful commitment first.' : `You have ${n}/10 slots filled. Common App allows up to 10, ranked by importance — add more real commitments if you have them, don't pad with one-offs.`,
    }
  }

  if (r === 'education' || r.includes('transcript') || r.includes('board') || r.includes('curriculum works') || r.includes('bulletin') || r.includes('grade')) {
    const { haveYears, missingYears } = computeGradeYearCoverage(country, profile.priorGrades, !!profile.hasTwelfth)
    const curriculumNote = profile.curriculum ? `${profile.curriculum} curriculum. ` : ''
    const apNote = profile.apCourses?.length ? ` ${profile.apCourses.length} AP course(s) reported.` : ''
    return {
      have: haveYears.length ? `${curriculumNote}${haveYears.join(', ')} grade${haveYears.length > 1 ? 's' : ''} on file.${apNote}` : 'No grade years on file yet.',
      need: missingYears.length ? `Still need ${missingYears.join(', ')} grade transcript${missingYears.length > 1 ? 's' : ''} — add them under Prior Grades on your main profile.` : 'Nothing more needed here — every grade-year this country actually reviews is on file.',
    }
  }

  if (r === 'profile') {
    return {
      have: 'Not tracked in this app.',
      need: 'Fill in your legal name, address, demographics, and fee-waiver eligibility directly on the Common App.',
    }
  }

  if (r === 'family') {
    return {
      have: 'Not tracked in this app.',
      need: 'Fill in parent/guardian education, occupation, and sibling info directly on the Common App.',
    }
  }

  if (r === 'writing') {
    return {
      have: 'Not tracked in this app.',
      need: 'Draft your Personal Statement (250-650 words) responding to one of the 7 fixed prompts — this is the one section no profile field can fill in for you.',
    }
  }

  return null
}

export type CoverageBar = { pct: number; label: string }

// How much of a checklist item is ALREADY backed by real profile data —
// shown as an informational progress bar alongside the item, separate from
// the student's own manual "done" tick (see ChecklistItemProgress below).
// This used to silently mark transcript/grade line items 100% done just
// because *a* profile existed — wrong for e.g. a US applicant who only
// entered 12th-grade data: US holistic review reads all 4 years, so that
// line item was genuinely only 25% covered, not "done". Returns null for
// requirements with no real matching profile signal (essays, recommendation
// letters, interviews, portfolios, concours, etc.) — those get no bar, just
// the manual tick.
export function computeSectionCoverageBar(requirement: string, profile: SectionCoverageProfile, country: string): CoverageBar | null {
  const r = requirement.toLowerCase()
  const t = profile.standardizedTests
  const hasSat = t.satMath !== undefined && t.satReadingWriting !== undefined
  const hasAct = t.act !== undefined
  const hasEnglishTest = t.englishTestType !== undefined && t.englishTestScore !== undefined

  if (r === 'testing') {
    const pct = hasSat || hasAct || hasEnglishTest ? 100 : 0
    return { pct, label: pct === 100 ? 'Test score on file' : 'No test score on file yet' }
  }
  if (r === 'activities' || r.includes('extracurricular')) {
    const n = profile.extracurriculars.length
    const pct = Math.min(100, Math.round((n / 10) * 100))
    return { pct, label: `${n}/10 activities added` }
  }
  if (r === 'education' || r.includes('transcript') || r.includes('board') || r.includes('curriculum works') || r.includes('bulletin') || r.includes('grade')) {
    const { pct, haveYears, missingYears } = computeGradeYearCoverage(country, profile.priorGrades, !!profile.hasTwelfth)
    return { pct, label: missingYears.length ? `${haveYears.length}/${haveYears.length + missingYears.length} grade-years on file` : 'All required grade-years on file' }
  }
  if (r.includes('jee main') || r.includes('jee advanced')) {
    const pct = t.jeePercentile !== undefined ? 100 : 0
    return { pct, label: pct === 100 ? 'JEE score on file' : 'No JEE score on file yet' }
  }
  if (r.includes('neet')) {
    const pct = t.neetScore !== undefined ? 100 : 0
    return { pct, label: pct === 100 ? 'NEET score on file' : 'No NEET score on file yet' }
  }
  if (r.includes('sat') || r.includes('act')) {
    const pct = hasSat || hasAct ? 100 : 0
    return { pct, label: pct === 100 ? 'Score on file' : 'No score on file yet' }
  }
  if (r.includes('ielts') || r.includes('toefl') || r.includes('duolingo') || r.includes('pte') || r.includes('cambridge english') || (r.includes('english') && (r.includes('proficiency') || r.includes('language')))) {
    const pct = hasEnglishTest ? 100 : 0
    return { pct, label: pct === 100 ? 'Score on file' : 'No score on file yet' }
  }

  return null
}

export type ChecklistItemProgress = {
  requirement: string
  progress: number // 0 or 100 — always the student's own manual tick, never inferred
}

// Purely reflects the student's own manual toggle now (stored per-country
// in dreamCountryProfiles.checklist) — no item is ever auto-marked done.
// Coverage info (see computeSectionCoverageBar above) is shown alongside as
// a separate, informational bar instead of silently flipping the tick,
// since "some real data exists" and "this requirement is actually done"
// are genuinely different things (a US applicant with only 12th-grade data
// has SOME transcript coverage, not a submittable transcript record).
export function mergeChecklistProgress(requirements: string[], manualChecklist: Record<string, number>): ChecklistItemProgress[] {
  return requirements.map((requirement) => ({ requirement, progress: manualChecklist[requirement] ?? 0 }))
}

export function overallCompletionPct(items: ChecklistItemProgress[]): number {
  if (items.length === 0) return 0
  return Math.round(items.reduce((sum, i) => sum + i.progress, 0) / items.length)
}
