import { gradeBadge } from '@/lib/grade'
import type { AcademicDetail } from '@/lib/academic-detail'

// Grades 9-11 context, split into two deliberately different shapes:
//
// - 9th & 10th share ONE curriculum picker (IGCSE is very commonly the
//   grades 9-10 curriculum even for students who move to A-Levels/IB for
//   11-12, so it needs its own selection independent of the main one) and
//   a lightweight, curriculum-appropriate input — grade *counts* for
//   IGCSE, not per-subject detail.
// - 11th reuses the exact same detailed AcademicDetail shape as the main
//   (12th-equivalent) input, since it's "part of the 12th section" for
//   curricula where 11th subject choices mirror 12th — just optional and
//   rendered smaller.
//
// None of this is required. Which years actually matter varies by country
// (see GRADE_RELEVANCE) — since a student can target several countries at
// once we can't force them to skip years, so we collect what's offered and
// guide attention with country-aware copy instead.

export type NinthTenthCurriculum = 'IGCSE' | 'CBSE_ICSE' | 'US_GPA' | 'IB_MYP'

export type IGCSEGradeCounts = {
  aStar?: number
  a?: number
  b?: number
  c?: number
  d?: number
  e?: number
}

export type NinthTenthYear = {
  igcse?: IGCSEGradeCounts
  percentage?: number // CBSE / ICSE
  gpa?: number // US, 0.0-4.0
  ibAverage?: number // IB Middle Years Programme, 1-7
  note?: string
}

export type NinthTenthGrades = {
  curriculum: NinthTenthCurriculum | null
  grade9: NinthTenthYear
  grade10: NinthTenthYear
}

export type PriorGrades = {
  ninthTenth: NinthTenthGrades
  eleventh: AcademicDetail | null
  additionalContext: string
}

export const EMPTY_PRIOR_GRADES: PriorGrades = {
  ninthTenth: { curriculum: null, grade9: {}, grade10: {} },
  eleventh: null,
  additionalContext: '',
}

// A student's 11th-grade curriculum should follow whatever their 12th
// (main) curriculum is; their 9-10 curriculum often differs (e.g. IGCSE
// before switching to A-Levels), so this is just a sensible starting
// guess the user can override, not a strict mapping.
export function defaultNinthTenthCurriculum(mainCurriculum: string): NinthTenthCurriculum {
  switch (mainCurriculum) {
    case 'A_LEVELS':
      return 'IGCSE'
    case 'IB_DIPLOMA':
      return 'IB_MYP'
    case 'US_GPA_PCT':
      return 'US_GPA'
    default:
      return 'CBSE_ICSE'
  }
}

function igcseCount(g: IGCSEGradeCounts | undefined): number {
  if (!g) return 0
  return (g.aStar ?? 0) + (g.a ?? 0) + (g.b ?? 0) + (g.c ?? 0) + (g.d ?? 0) + (g.e ?? 0)
}

function yearHasData(y: NinthTenthYear): boolean {
  return igcseCount(y.igcse) > 0 || y.percentage !== undefined || y.gpa !== undefined || y.ibAverage !== undefined || !!y.note?.trim()
}

export function validatePriorGrades(p: PriorGrades): string | null {
  for (const y of [p.ninthTenth.grade9, p.ninthTenth.grade10]) {
    if (y.percentage !== undefined && (y.percentage < 0 || y.percentage > 100)) return '9th/10th percentage must be between 0 and 100.'
    if (y.gpa !== undefined && (y.gpa < 0 || y.gpa > 4)) return '9th/10th GPA must be between 0.0 and 4.0.'
    if (y.ibAverage !== undefined && (y.ibAverage < 1 || y.ibAverage > 7)) return '9th/10th IB average must be between 1 and 7.'
  }
  return null
}

function formatNinthTenthYear(label: string, curriculum: NinthTenthCurriculum, y: NinthTenthYear): string | null {
  if (!yearHasData(y)) return null
  let value = ''
  if (curriculum === 'IGCSE' && y.igcse) {
    const parts: string[] = []
    if (y.igcse.aStar) parts.push(`${y.igcse.aStar} A*`)
    if (y.igcse.a) parts.push(`${y.igcse.a} A`)
    if (y.igcse.b) parts.push(`${y.igcse.b} B`)
    if (y.igcse.c) parts.push(`${y.igcse.c} C`)
    if (y.igcse.d) parts.push(`${y.igcse.d} D`)
    if (y.igcse.e) parts.push(`${y.igcse.e} E`)
    value = parts.join(', ')
  } else if (curriculum === 'CBSE_ICSE' && y.percentage !== undefined) {
    value = `${y.percentage}%`
  } else if (curriculum === 'US_GPA' && y.gpa !== undefined) {
    value = `GPA ${y.gpa.toFixed(2)}`
  } else if (curriculum === 'IB_MYP' && y.ibAverage !== undefined) {
    value = `${y.ibAverage.toFixed(1)}/7 average`
  }
  if (!value && !y.note?.trim()) return null
  return `${label}: ${value}${y.note ? ` (${y.note})` : ''}`.trim()
}

export function formatPriorGrades(p: PriorGrades): string {
  const parts: string[] = []

  if (p.ninthTenth.curriculum) {
    const g9 = formatNinthTenthYear('9th', p.ninthTenth.curriculum, p.ninthTenth.grade9)
    const g10 = formatNinthTenthYear('10th', p.ninthTenth.curriculum, p.ninthTenth.grade10)
    if (g9) parts.push(g9)
    if (g10) parts.push(g10)
  }

  if (p.eleventh) {
    parts.push(`11th: ${gradeBadge(p.eleventh)}`)
  }

  if (p.additionalContext.trim()) {
    parts.push(`Additional context: ${p.additionalContext.trim()}`)
  }

  return parts.length ? parts.join('; ') : 'None provided'
}

// Researched per country — see chat for sources (UCAS/GCSE coverage, US
// full-transcript holistic review, UAC/ATAR year weighting, Singapore
// A-Level rank-points, HKDSE senior-secondary scope, India's 12th-only
// merit admission). General guidance, not official policy from any one
// university.
export const GRADE_RELEVANCE: Record<string, string> = {
  US: "Reviews your full 9th–12th record as one story — trajectory matters, and 11th grade is usually weighted most. 9th matters more at highly selective schools.",
  UK: "Mainly evaluates your final 2 years (A-Levels) via predicted grades — but GCSEs (~10th) still get reviewed, especially at competitive courses and top universities.",
  AU: "ATAR is calculated mainly from your final 2 years (11th–12th) — earlier grades aren't formally part of the calculation.",
  SG: "Weighs your final 2 years (A-Level rank points) most heavily — O-Level (~10th) mainly covers baseline requirements like the Mother Tongue Language subject.",
  HK: "Senior secondary results (roughly 10th–12th, via HKDSE) matter most. For international qualifications, your fuller transcript is typically reviewed.",
  IN: "Direct admission is driven almost entirely by 12th-grade board marks — 9th–11th generally aren't formally considered (entrance exams like JEE/NEET matter more for specific fields).",
}
