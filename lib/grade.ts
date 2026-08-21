// Deterministic academic normalization (curriculum -> GPA/ATAR/UK equivalents).
export function normalizeGrade(curriculum: string, gradeValue: number) {
  if (curriculum === 'CBSE' || curriculum === 'US_GPA_PCT') {
    if (gradeValue >= 95)
      return { gpa: '4.0', atar: '98.50', uk: 'A*A*A*', tier: 4 }
    if (gradeValue >= 90) return { gpa: '3.85', atar: '95.00', uk: 'A*AA', tier: 3 }
    if (gradeValue >= 80) return { gpa: '3.50', atar: '88.00', uk: 'AAB', tier: 2 }
    return { gpa: '3.00', atar: '75.00', uk: 'BBB', tier: 1 }
  }
  if (curriculum === 'IB_DIPLOMA') {
    if (gradeValue >= 40)
      return { gpa: '4.0', atar: '98.00+', uk: '40+ IB', tier: 4 }
    if (gradeValue >= 35)
      return { gpa: '3.75', atar: '93.00', uk: '35 IB', tier: 3 }
    if (gradeValue >= 30)
      return { gpa: '3.20', atar: '80.00', uk: '30 IB', tier: 2 }
    return { gpa: '2.80', atar: '70.00', uk: '28 IB', tier: 1 }
  }
  // A-Levels or generic percentage fallback
  if (gradeValue >= 90) return { gpa: '3.9', atar: '96.00', uk: 'A*AA', tier: 3 }
  if (gradeValue >= 80) return { gpa: '3.5', atar: '88.00', uk: 'AAB', tier: 2 }
  return { gpa: '3.0', atar: '78.00', uk: 'BBB', tier: 1 }
}

export function gradeBadge(curriculum: string, gradeValue: number) {
  const n = normalizeGrade(curriculum, gradeValue)
  const label =
    curriculum === 'IB_DIPLOMA'
      ? `${gradeValue}/45 IB`
      : curriculum === 'A_LEVELS'
        ? `${gradeValue}% A-Levels`
        : `${gradeValue}% ${curriculum === 'CBSE' ? 'CBSE' : ''}`.trim()
  return `${label} → ${n.gpa} GPA | ${n.atar} ATAR | ${n.uk}`
}
