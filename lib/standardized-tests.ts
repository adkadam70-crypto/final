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

export function validateStandardizedTests(t: StandardizedTests): string | null {
  if (t.satMath !== undefined && (t.satMath < 200 || t.satMath > 800)) return 'SAT Math must be between 200 and 800.'
  if (t.satReadingWriting !== undefined && (t.satReadingWriting < 200 || t.satReadingWriting > 800)) return 'SAT Reading & Writing must be between 200 and 800.'
  if (t.act !== undefined && (t.act < 1 || t.act > 36)) return 'ACT must be between 1 and 36.'
  if (t.jeePercentile !== undefined && (t.jeePercentile < 0 || t.jeePercentile > 100)) return 'JEE percentile must be between 0 and 100.'
  if (t.neetScore !== undefined && (t.neetScore < 0 || t.neetScore > 720)) return 'NEET score must be between 0 and 720.'
  return null
}
