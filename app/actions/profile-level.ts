'use server'

import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { dreamProfiles, dreamCountryProfiles, dreamUniversityTracks, matches, universityAnalyses } from '@/lib/db/schema'
import { getUserId } from '@/lib/get-user-id'
import { getLatestProfile } from '@/app/actions/profile'
import { LEVEL_NAMES, type EmeraldLevel } from '@/lib/emerald-levels'

// Score thresholds — 5 levels over a 0-100 composite score (see the
// breakdown below for how that score is built).
const LEVEL_THRESHOLDS: [EmeraldLevel, number][] = [
  [5, 80],
  [4, 60],
  [3, 40],
  [2, 20],
  [1, 0],
]

function levelForScore(score: number): EmeraldLevel {
  for (const [level, min] of LEVEL_THRESHOLDS) {
    if (score >= min) return level
  }
  return 1
}

export type ProfileLevelResult = {
  score: number
  level: EmeraldLevel
  levelName: string
  nextLevelScore: number | null // null once at max level
  breakdown: {
    profile: number // 0-40 — the main profile is the foundation everything else builds on, so it's weighted heaviest
    dream: number // 0-20 — Build Your Dream progress (onboarding, field confirmed, countries added)
    universities: number // 0-20 — real universities tracked in Build Your Dream
    aiActivity: number // 0-20 — AI matches run + target-university analyses done
  }
  hint: string // one concrete thing that would raise the score most right now
}

const MAX_PROFILE_POINTS = 40
const MAX_DREAM_POINTS = 20
const MAX_UNIVERSITY_POINTS = 20
const MAX_AI_POINTS = 20

// Same six dimensions components/profile-form.tsx's own completionChecklist
// checks — replicated here against the SAVED profile row (not live form
// state) since this runs server-side with no form state to read.
function computeProfileCompleteness(profile: NonNullable<Awaited<ReturnType<typeof getLatestProfile>>>): number {
  const tests = profile.standardizedTests ?? {}
  const hasAnyTest = Boolean(
    tests.satMath || tests.satReadingWriting || tests.act || tests.jeePercentile || tests.jeeAdvancedRank || tests.neetScore || tests.clatRank || tests.cuetScore || tests.englishTestScore,
  )
  const priorGrades = profile.priorGrades
  const hasPriorGradeYear = (y?: { percentage?: number; gpa?: number; ibAverage?: number; igcse?: unknown } | null) =>
    !!y && (y.percentage != null || y.gpa != null || y.ibAverage != null || y.igcse != null)
  const checklist = [
    profile.targetCountries.length > 0,
    hasAnyTest,
    profile.extracurriculars.some((e) => e.trim().length > 0),
    profile.apCourses.length > 0,
    hasPriorGradeYear(priorGrades?.ninthTenth?.grade9) || hasPriorGradeYear(priorGrades?.ninthTenth?.grade10) || !!priorGrades?.eleventh,
    profile.intendedField !== 'No preference',
  ]
  return Math.round((checklist.filter(Boolean).length / checklist.length) * MAX_PROFILE_POINTS)
}

/**
 * The "emerald" profile-strength score — a deterministic composite across
 * four factors (not an AI judgment; see analyzeProfileStrength in
 * app/actions/profile-strength.ts for that separate, unrelated feature).
 * Available to every signed-in user, not just admins — Build Your Dream and
 * AI-match contributions are simply 0 for users who haven't touched those
 * features yet (including everyone while Build Your Dream stays
 * admin-only), not an error state.
 */
export async function getProfileLevel(): Promise<ProfileLevelResult> {
  const userId = await getUserId()

  const profile = await getLatestProfile()
  const profileScore = profile ? computeProfileCompleteness(profile) : 0

  // Queried directly against the tables (not through app/actions/dream.ts's
  // exported functions) since those are gated behind assertDreamAdmin() —
  // a non-admin user simply has zero rows here, which is exactly the
  // correct 0-point contribution, not something that should throw.
  const [dreamRows, countryRows, universityRows, matchRows, analysisRows] = await Promise.all([
    db.select().from(dreamProfiles).where(eq(dreamProfiles.userId, userId)).limit(1),
    db.select().from(dreamCountryProfiles).where(eq(dreamCountryProfiles.userId, userId)),
    db.select().from(dreamUniversityTracks).where(eq(dreamUniversityTracks.userId, userId)),
    db.select().from(matches).where(eq(matches.userId, userId)),
    db.select().from(universityAnalyses).where(eq(universityAnalyses.userId, userId)),
  ])
  const dream = dreamRows[0]

  // Dream progress: onboarding answered (+5), field confirmed (+5), up to
  // +10 for countries added (3 per country, capped — deliberately NOT
  // requiring the full per-country checklist-completion computation here,
  // which needs confirmedField + curriculum + country-specific section
  // definitions across 5 different modules; country COUNT is a simple,
  // honest proxy for "how many fronts you're actively building on").
  const onboardingDone = !!dream && (dream.strengths.length > 0 || !!dream.hobbies || dream.interests.length > 0 || dream.workingStyle?.length > 0 || !!dream.futureVision)
  const dreamScore = Math.min(MAX_DREAM_POINTS, (onboardingDone ? 5 : 0) + (dream?.confirmedField ? 5 : 0) + Math.min(10, countryRows.length * 3))

  const universityScore = Math.min(MAX_UNIVERSITY_POINTS, universityRows.length * 4)

  const aiScore = Math.min(MAX_AI_POINTS, (matchRows.length + analysisRows.length) * 4)

  const score = profileScore + dreamScore + universityScore + aiScore
  const level = levelForScore(score)
  const nextThresholdEntry = [...LEVEL_THRESHOLDS].reverse().find(([, min]) => min > score)
  const nextLevelScore = nextThresholdEntry ? nextThresholdEntry[1] : null

  let hint = 'Set up your main profile to start earning levels.'
  if (profile) {
    if (profileScore < MAX_PROFILE_POINTS) hint = 'Fill in more of your main profile — it carries the most weight.'
    else if (dreamScore < MAX_DREAM_POINTS) hint = dream?.confirmedField ? 'Add another country in Build Your Dream.' : 'Confirm a field in Build Your Dream.'
    else if (universityScore < MAX_UNIVERSITY_POINTS) hint = 'Track another real university in Build Your Dream.'
    else if (aiScore < MAX_AI_POINTS) hint = 'Run a match or analyze a target university.'
    else hint = "You're maxed out — nice work."
  }

  return {
    score,
    level,
    levelName: LEVEL_NAMES[level],
    nextLevelScore,
    breakdown: { profile: profileScore, dream: dreamScore, universities: universityScore, aiActivity: aiScore },
    hint,
  }
}
