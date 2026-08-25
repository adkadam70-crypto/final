import { type AcademicDetail, cbsePercentage, ucasPoints, ibTotal } from '@/lib/academic-detail'

// gradeValue is already normalized onto a consistent 0-100 scale by
// computeGradeValue() at save time, so tiering is curriculum-agnostic here.
export function gradeTier(gradeValue: number): number {
  if (gradeValue >= 90) return 4
  if (gradeValue >= 75) return 3
  if (gradeValue >= 55) return 2
  return 1
}

// Curriculum-accurate display string — what the student actually reports,
// not a generic percentage forced onto every system.
export function gradeBadge(detail: AcademicDetail): string {
  switch (detail.curriculum) {
    case 'CBSE': {
      const pct = detail.subjects.length >= 5 ? cbsePercentage(detail.subjects) : 0
      return `CBSE — best 5 of ${detail.subjects.length} subjects: ${pct}%`
    }
    case 'A_LEVELS': {
      const points = ucasPoints(detail.subjects)
      const grades = detail.subjects.map((s) => s.grade).join('')
      return `${detail.subjects.length} A-Levels: ${grades} (${points} UCAS pts)`
    }
    case 'US_GPA_PCT': {
      const parts = [`GPA ${detail.unweightedGPA.toFixed(2)}`]
      if (detail.satScore) parts.push(`SAT ${detail.satScore}`)
      if (detail.actScore) parts.push(`ACT ${detail.actScore}`)
      return parts.join(' | ')
    }
    case 'IB_DIPLOMA': {
      const total = ibTotal(detail)
      return total === 'FAIL' ? 'IB — EE/TOK combination fails diploma' : `IB Diploma: ${total} / 45`
    }
  }
}
