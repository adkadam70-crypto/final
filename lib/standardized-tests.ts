// Standardized test scores, kept separate from AcademicDetail on purpose:
// these are orthogonal to curriculum (a CBSE or IB student can still sit the
// SAT when applying to the US), so they shouldn't live inside the
// curriculum-specific discriminated union. Which fields are relevant is
// driven by the student's selected target countries, not their curriculum.

export type StandardizedTests = {
  satMath?: number // 200-800
  satReadingWriting?: number // 200-800
  act?: number // 1-36
  jeePercentile?: number // 0-100 — JEE Main is reported as a percentile, not a raw score
  neetScore?: number // 0-720 — NEET is reported as a raw marks score, not a percentile
}

export function satComposite(t: StandardizedTests): number | null {
  if (t.satMath === undefined || t.satReadingWriting === undefined) return null
  return t.satMath + t.satReadingWriting
}

// Human-readable summary for AI prompts — only mentions tests that were
// actually entered, since most fields are optional.
export function formatStandardizedTests(t: StandardizedTests): string {
  const parts: string[] = []
  const composite = satComposite(t)
  if (composite !== null) parts.push(`SAT ${composite}/1600 (Math ${t.satMath}, Reading & Writing ${t.satReadingWriting})`)
  if (t.act !== undefined) parts.push(`ACT ${t.act}/36`)
  if (t.jeePercentile !== undefined) parts.push(`JEE Main ${t.jeePercentile}th percentile`)
  if (t.neetScore !== undefined) parts.push(`NEET ${t.neetScore}/720`)
  return parts.length ? parts.join('; ') : 'None provided'
}

// A school's published 25th-75th percentile range for admitted students'
// test scores — subset of the universities table columns, kept as its own
// type so this function isn't coupled to the full Drizzle row shape.
export type TestScoreRange = {
  satRange25: number | null
  satRange75: number | null
  actRange25: number | null
  actRange75: number | null
  testScoreSource: string | null
  // 'Required' | 'Recommended' | 'Test-Optional' | 'Test-Blind' | null (not
  // yet researched) — see the column comment in lib/db/schema.ts. Read
  // BEFORE falling back to a "no range on file" message, since a Test-Blind
  // school's missing range means something structurally different from a
  // Test-Optional school's missing range.
  testPolicy: string | null
}

// Produces ONE plain-language fact string comparing a student's own test
// score against a school's real published range — pure arithmetic (a
// percentile-position calculation), never a probability judgment. That
// judgment is left entirely to the AI prompt this feeds into. SAT is only
// ever compared against SAT, ACT against ACT — no SAT<->ACT concordance is
// used anywhere in this app, so a student/school test-type mismatch is
// reported as "not directly comparable" rather than guessed at.
export function testScoreRangeComparison(student: StandardizedTests, school: TestScoreRange): string {
  // Test-Blind takes priority over everything else below: scores are never
  // considered here regardless of what the student submitted or whether a
  // range happens to be on file, so a range comparison would be misleading
  // even if one existed.
  if (school.testPolicy === 'Test-Blind') {
    return 'This school is Test-Blind — it does not consider SAT/ACT scores in admissions decisions at all, even if submitted. The student\'s test scores are not a relevant signal for this school.'
  }

  if (!school.testScoreSource) {
    return school.testPolicy === 'Test-Optional'
      ? 'This school is Test-Optional, but no published 25th-75th percentile score range is on file for it yet.'
      : 'Not on file — no published SAT/ACT range for this school yet.'
  }

  const schoolHasSat = school.satRange25 != null && school.satRange75 != null
  const schoolHasAct = school.actRange25 != null && school.actRange75 != null
  const composite = satComposite(student)
  const act = student.act ?? null

  // Policy context prepended to whichever comparison sentence follows below
  // — a range is still informative even at a Test-Optional school (it tells
  // the student where they'd land among students who DID submit scores),
  // so this is additive framing, not a reason to skip the comparison.
  const policyPrefix =
    school.testPolicy === 'Test-Optional'
      ? 'This school is Test-Optional (scores are not required). '
      : school.testPolicy === 'Recommended'
        ? 'This school recommends but does not require scores. '
        : ''

  function describe(value: number, lo: number, hi: number, label: string, unit: string): string {
    const prefix = policyPrefix
    if (value < lo) {
      return `${prefix}Student's ${label} of ${value}${unit} falls BELOW this school's published 25th percentile of ${lo}${unit} (range ${lo}-${hi}${unit}, per ${school.testScoreSource}) — a below-typical academic profile for admitted students on this measure.`
    }
    if (value > hi) {
      return `${prefix}Student's ${label} of ${value}${unit} is ABOVE this school's published 75th percentile of ${hi}${unit} (range ${lo}-${hi}${unit}, per ${school.testScoreSource}) — a strong academic profile relative to admitted students on this measure.`
    }
    const percentilePosition = Math.round(25 + ((value - lo) / (hi - lo)) * 50)
    return `${prefix}Student's ${label} of ${value}${unit} falls WITHIN this school's published 25th-75th percentile range of ${lo}-${hi}${unit} (per ${school.testScoreSource}) — roughly the ${percentilePosition}th percentile position among admitted students.`
  }

  if (composite !== null && schoolHasSat) {
    return describe(composite, school.satRange25!, school.satRange75!, 'SAT composite', '/1600')
  }
  if (act !== null && schoolHasAct) {
    return describe(act, school.actRange25!, school.actRange75!, 'ACT composite', '/36')
  }
  if ((composite !== null && schoolHasAct && !schoolHasSat) || (act !== null && schoolHasSat && !schoolHasAct)) {
    return `Student reported a different test type than the one this school publishes a range for (per ${school.testScoreSource}) — not directly comparable, since no SAT<->ACT concordance is used in this app.`
  }
  if (composite === null && act === null) {
    return `Student has not reported an SAT or ACT score, so no comparison against this school's published range (per ${school.testScoreSource}) is possible.`
  }
  return `No published SAT/ACT range on file for this school that matches a test type the student reported.`
}

export function validateStandardizedTests(t: StandardizedTests): string | null {
  if (t.satMath !== undefined && (t.satMath < 200 || t.satMath > 800)) return 'SAT Math must be between 200 and 800.'
  if (t.satReadingWriting !== undefined && (t.satReadingWriting < 200 || t.satReadingWriting > 800)) return 'SAT Reading & Writing must be between 200 and 800.'
  if (t.act !== undefined && (t.act < 1 || t.act > 36)) return 'ACT must be between 1 and 36.'
  if (t.jeePercentile !== undefined && (t.jeePercentile < 0 || t.jeePercentile > 100)) return 'JEE percentile must be between 0 and 100.'
  if (t.neetScore !== undefined && (t.neetScore < 0 || t.neetScore > 720)) return 'NEET score must be between 0 and 720.'
  return null
}
