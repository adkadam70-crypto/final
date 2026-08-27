// Lightweight, curriculum-agnostic record of grades 9-11 — deliberately NOT
// per-subject like the current (12th-equivalent) academicDetail input.
// Which years actually matter varies a lot by country (see GRADE_RELEVANCE
// below, researched per-country) — since a single student can target
// several countries at once, we can't force them to skip years, so we
// collect all three but guide attention with country-aware copy instead.

export type PriorGrade = {
  grade: 9 | 10 | 11
  overallScore?: number // 0-100, a simple overall percentage for that year
  note?: string // e.g. "grades dipped in 10th after a family move, recovered by 11th"
}

export function validatePriorGrades(grades: PriorGrade[]): string | null {
  for (const g of grades) {
    if (g.overallScore !== undefined && (g.overallScore < 0 || g.overallScore > 100)) {
      return 'Prior-year overall scores must be between 0 and 100.'
    }
  }
  return null
}

export function formatPriorGrades(grades: PriorGrade[]): string {
  const withScores = grades.filter((g) => g.overallScore !== undefined)
  if (withScores.length === 0) return 'None provided'
  return withScores
    .map((g) => `Grade ${g.grade}: ${g.overallScore}%${g.note ? ` (${g.note})` : ''}`)
    .join('; ')
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
