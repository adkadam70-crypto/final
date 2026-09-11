import type { StandardizedTests } from '@/lib/standardized-tests'

// Minimal shape this needs from the master profile — kept narrow so this
// isn't coupled to the full Drizzle row type.
export type ChecklistProfile = {
  standardizedTests: StandardizedTests
  extracurriculars: string[]
}

// Auto-detects how "done" a real application-requirement line item already
// is, based on what's already filled in on the student's MASTER profile —
// so a US student who already entered an SAT score doesn't see 0% on a
// checklist that's actually already partly satisfied. Returns null when
// there's no real matching profile field to check (essays, recommendation
// letters, interviews, portfolios, concours, etc.) — those fall back to the
// student's own manual toggle instead of a guess.
//
// Deliberately binary (0 or 100) even where auto-detected, not a fuzzy
// in-between percentage — either the relevant score/field exists on the
// profile or it doesn't, there's no honest partial-credit reading of "half
// an SAT score."
export function computeAutoChecklistProgress(requirement: string, profile: ChecklistProfile): number | null {
  const r = requirement.toLowerCase()
  const t = profile.standardizedTests
  const hasSat = t.satMath !== undefined && t.satReadingWriting !== undefined
  const hasAct = t.act !== undefined
  const hasEnglishTest = t.englishTestType !== undefined && t.englishTestScore !== undefined

  // Common App section labels (US-specific, see lib/common-app-sections.ts)
  // — matched as exact section names, not substrings, so "Education" here
  // doesn't collide with a country requirements string that happens to
  // mention "education" in passing.
  if (r === 'testing') return hasSat || hasAct || hasEnglishTest ? 100 : 0
  if (r === 'activities') return profile.extracurriculars.length > 0 ? 100 : 0
  if (r === 'education') return 100 // reaching this feature already requires a filled-in academic profile
  if (r === 'profile' || r === 'family' || r === 'writing') return null // no matching master-profile field — manual

  // "jee main"/"jee advanced" specifically, not a bare "jee" substring —
  // NCHM JEE (hotel management) is a completely unrelated exam that also
  // contains the letters "jee" and must NOT be treated as satisfied by an
  // engineering jeePercentile field.
  if (r.includes('jee main') || r.includes('jee advanced')) return t.jeePercentile !== undefined ? 100 : 0
  if (r.includes('neet')) return t.neetScore !== undefined ? 100 : 0
  if (r.includes('cuet')) return null // no dedicated CUET field on the profile yet
  if (r.includes('sat') || r.includes('act')) return hasSat || hasAct ? 100 : 0
  if (r.includes('ielts') || r.includes('toefl') || r.includes('duolingo') || r.includes('pte') || r.includes('cambridge english') || (r.includes('english') && (r.includes('proficiency') || r.includes('language')))) {
    return hasEnglishTest ? 100 : 0
  }
  // Reaching this feature at all already requires a filled-in academicDetail
  // (see the needsProfile gate in app/actions/dream.ts), so any
  // transcript/board-result/grades line is already satisfied by definition.
  if (r.includes('transcript') || r.includes('board') || r.includes('grade') || r.includes('curriculum works') || r.includes('bulletin')) return 100
  if (r.includes('extracurricular')) return profile.extracurriculars.length > 0 ? 100 : 0

  return null
}

export type SectionCoverageProfile = ChecklistProfile & { curriculum?: string; apCourses?: string[] }

export type SectionCoverage = { have: string; need: string }

// Personalizes each Common App section's expanded detail with what's
// actually on this student's master profile already vs. what's genuinely
// still missing — the static whatToInclude bullets (lib/common-app-sections.ts)
// stay generic reference material, this is the "where do YOU actually
// stand" layer on top of it. Exact-match on the Common App section labels
// only (see computeAutoChecklistProgress above for why) — returns null for
// anything else (the generic per-country requirement strings, which have no
// equivalent personalized breakdown yet).
export function getSectionCoverage(requirement: string, profile: SectionCoverageProfile): SectionCoverage | null {
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

  if (r === 'education') {
    return {
      have: profile.curriculum ? `${profile.curriculum} curriculum, grades on file.${profile.apCourses?.length ? ` ${profile.apCourses.length} AP course(s) reported.` : ''}` : 'Grades on file.',
      need: 'Nothing more needed here — pulled automatically from your saved profile.',
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

export type ChecklistItemProgress = {
  requirement: string
  progress: number // 0-100, whichever of auto-detected or manual applies
  autoDetected: boolean
}

// Merges auto-detected progress with the student's manual overrides (stored
// per-country in dreamCountryProfiles.checklist) — auto-detected items
// always win over a stale manual value, since the master profile is the
// source of truth for anything it can actually answer.
export function mergeChecklistProgress(
  requirements: string[],
  manualChecklist: Record<string, number>,
  profile: ChecklistProfile,
): ChecklistItemProgress[] {
  return requirements.map((requirement) => {
    const auto = computeAutoChecklistProgress(requirement, profile)
    if (auto !== null) return { requirement, progress: auto, autoDetected: true }
    return { requirement, progress: manualChecklist[requirement] ?? 0, autoDetected: false }
  })
}

export function overallCompletionPct(items: ChecklistItemProgress[]): number {
  if (items.length === 0) return 0
  return Math.round(items.reduce((sum, i) => sum + i.progress, 0) / items.length)
}
