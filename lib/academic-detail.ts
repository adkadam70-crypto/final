// Real per-curriculum academic input structures, researched against how each
// system actually grades students (not a generic percentage for everyone).

export const IB_SUBJECT_GROUPS = [
  { group: 1, name: 'Studies in Language & Literature' },
  { group: 2, name: 'Language Acquisition' },
  { group: 3, name: 'Individuals & Societies' },
  { group: 4, name: 'Sciences' },
  { group: 5, name: 'Mathematics' },
  { group: 6, name: 'The Arts' }, // may be substituted for a 2nd subject from groups 2-4
] as const

export type IBGroup = 1 | 2 | 3 | 4 | 5 | 6
export type IBLevel = 'HL' | 'SL'
export type IBCoreGrade = 'A' | 'B' | 'C' | 'D' | 'E'
export type ALevelGrade = 'A*' | 'A' | 'B' | 'C' | 'D' | 'E'

export type IBSubject = {
  group: IBGroup
  subjectName: string
  level: IBLevel
  grade: number // 1-7
}

export type AcademicDetail =
  | { curriculum: 'CBSE'; subjects: { name: string; marks: number }[] } // marks 0-100 each
  | { curriculum: 'A_LEVELS'; subjects: { name: string; grade: ALevelGrade }[] }
  | { curriculum: 'US_GPA_PCT'; unweightedGPA: number }
  | {
      curriculum: 'IB_DIPLOMA'
      subjects: IBSubject[] // exactly 6
      eeGrade: IBCoreGrade
      tokGrade: IBCoreGrade
      casComplete: boolean // CAS is pass/fail — never contributes points
    }

// Best-effort reconstruction from confirmed IBO anchor cells (A/A=3, A/B=3,
// B/A=3, B[TOK]/C[EE]=2, C/D=0, D/C=0; any E is an automatic diploma fail).
// Indexed [TOK][EE]. Worth re-verifying the full grid against IBO's official
// Diploma Programme Assessment Procedures if this ships beyond a prototype.
const IB_CORE_MATRIX: Record<IBCoreGrade, Record<IBCoreGrade, number | 'FAIL'>> = {
  A: { A: 3, B: 3, C: 2, D: 2, E: 'FAIL' },
  B: { A: 3, B: 2, C: 2, D: 1, E: 'FAIL' },
  C: { A: 2, B: 2, C: 1, D: 0, E: 'FAIL' },
  D: { A: 2, B: 1, C: 0, D: 0, E: 'FAIL' },
  E: { A: 'FAIL', B: 'FAIL', C: 'FAIL', D: 'FAIL', E: 'FAIL' },
}

const UCAS_POINTS: Record<ALevelGrade, number> = { 'A*': 56, A: 48, B: 40, C: 32, D: 24, E: 16 }

export function ucasPoints(subjects: { grade: ALevelGrade }[]): number {
  return subjects.reduce((sum, s) => sum + UCAS_POINTS[s.grade], 0)
}

export function ibCorePoints(tokGrade: IBCoreGrade, eeGrade: IBCoreGrade): number | 'FAIL' {
  return IB_CORE_MATRIX[tokGrade][eeGrade]
}

export function ibTotal(detail: Extract<AcademicDetail, { curriculum: 'IB_DIPLOMA' }>): number | 'FAIL' {
  const subjectSum = detail.subjects.reduce((sum, s) => sum + s.grade, 0)
  const core = ibCorePoints(detail.tokGrade, detail.eeGrade)
  if (core === 'FAIL') return 'FAIL'
  return subjectSum + core
}

// CBSE: best 5 of 5-6 subjects, summed out of 500, as a percentage.
export function cbsePercentage(subjects: { marks: number }[]): number {
  const best5 = [...subjects].map((s) => s.marks).sort((a, b) => b - a).slice(0, 5)
  const sum = best5.reduce((a, b) => a + b, 0)
  return Math.round((sum / 500) * 1000) / 10 // one decimal place
}

// Normalizes every curriculum onto the existing 0-100 gradeValue column so
// tier-bucketing logic elsewhere keeps working against a single scale, while
// the real structured data lives in academicDetail for accurate display.
export function computeGradeValue(detail: AcademicDetail): number {
  switch (detail.curriculum) {
    case 'CBSE':
      return Math.round(cbsePercentage(detail.subjects))
    case 'A_LEVELS': {
      const points = ucasPoints(detail.subjects)
      // 3 subjects at A*A*A* = 168 points, treated as the 100% ceiling.
      return Math.min(100, Math.round((points / 168) * 100))
    }
    case 'US_GPA_PCT':
      return Math.min(100, Math.round(detail.unweightedGPA * 25))
    case 'IB_DIPLOMA': {
      const total = ibTotal(detail)
      return Math.round(((total === 'FAIL' ? 0 : total) / 45) * 100)
    }
  }
}

// Light-touch validation — enough to catch obviously incomplete input, not
// exhaustive curriculum-admin rule enforcement (e.g. permitted A-Level
// subject combinations).
export function validateAcademicDetail(detail: AcademicDetail): string | null {
  switch (detail.curriculum) {
    case 'CBSE':
      if (detail.subjects.length < 5) return 'Enter at least 5 subjects.'
      if (detail.subjects.some((s) => s.marks < 0 || s.marks > 100)) return 'Marks must be between 0 and 100.'
      return null
    case 'A_LEVELS':
      if (detail.subjects.length < 3) return 'Enter at least 3 A-Level subjects.'
      return null
    case 'US_GPA_PCT':
      if (detail.unweightedGPA < 0 || detail.unweightedGPA > 4.0) return 'GPA must be between 0.0 and 4.0.'
      return null
    case 'IB_DIPLOMA':
      if (detail.subjects.length !== 6) return 'Enter all 6 IB subjects.'
      return null
  }
}

export function defaultAcademicDetail(curriculum: AcademicDetail['curriculum']): AcademicDetail {
  switch (curriculum) {
    case 'CBSE':
      return {
        curriculum: 'CBSE',
        subjects: [
          { name: 'English Core', marks: 90 },
          { name: 'Mathematics', marks: 90 },
          { name: 'Physics', marks: 90 },
          { name: 'Chemistry', marks: 90 },
          { name: 'Computer Science', marks: 90 },
        ],
      }
    case 'A_LEVELS':
      return {
        curriculum: 'A_LEVELS',
        subjects: [
          { name: 'Mathematics', grade: 'A' },
          { name: 'Physics', grade: 'A' },
          { name: 'Chemistry', grade: 'A' },
        ],
      }
    case 'US_GPA_PCT':
      return { curriculum: 'US_GPA_PCT', unweightedGPA: 3.85 }
    case 'IB_DIPLOMA':
      return {
        curriculum: 'IB_DIPLOMA',
        subjects: [
          { group: 1, subjectName: 'English A: Literature', level: 'HL', grade: 6 },
          { group: 2, subjectName: 'Spanish B', level: 'SL', grade: 6 },
          { group: 3, subjectName: 'Economics', level: 'HL', grade: 6 },
          { group: 4, subjectName: 'Physics', level: 'HL', grade: 6 },
          { group: 5, subjectName: 'Mathematics: Analysis and Approaches', level: 'SL', grade: 6 },
          { group: 6, subjectName: 'Visual Arts', level: 'SL', grade: 6 },
        ],
        eeGrade: 'B',
        tokGrade: 'B',
        casComplete: true,
      }
  }
}

export const ACADEMIC_FIELDS = [
  'Science & Technology / Research',
  'Computer Science & IT',
  'Engineering',
  'Mathematics & Statistics',
  'Business',
  'Economics',
  'Medicine & Health Sciences',
  'Law',
  'Education',
  'Humanities',
  'Social Sciences',
  'Psychology',
  'Arts',
  'Architecture & Design',
  'Communications & Media',
  'Environmental Science & Sustainability',
  'Agriculture & Natural Resources',
] as const
export type AcademicField = (typeof ACADEMIC_FIELDS)[number]
