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

  if (r.includes('jee')) return t.jeePercentile !== undefined ? 100 : 0
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
