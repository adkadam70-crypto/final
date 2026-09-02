import { pgTable, text, integer, timestamp, jsonb, uuid } from "drizzle-orm/pg-core";
import type { AcademicDetail, AcademicField } from "@/lib/academic-detail";
import type { StandardizedTests } from "@/lib/standardized-tests";
import type { PriorGrades } from "@/lib/prior-grades";

// Better Auth owns its own auth tables in Neon (typically in a separate schema),
// so we only model the app-specific tables here. User IDs must remain UUIDs so
// they match session.user.id returned by auth.api.getSession().

// --- App tables ------------------------------------------------------------

// Global catalog of universities. Not user-scoped — shared reference data.
export const universities = pgTable('universities', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  name: text('name').notNull(),
  country: text('country').notNull(), // 'US' | 'UK' | 'AU' | 'SG' | 'HK' | 'IN'
  location: text('location').notNull(),
  climate: text('climate').notNull(), // 'Warm' | 'Balanced' | 'Cold'
  sectors: jsonb('sectors').$type<string[]>().notNull().default([]),
  baselineSelectivity: integer('baselineSelectivity').notNull(), // 0-100, higher = more selective
  internshipProgram: text('internshipProgram').notNull(),
  requirements: jsonb('requirements').$type<string[]>().notNull().default([]),
  link: text('link').notNull(),
  academicFields: jsonb('academicFields').$type<AcademicField[]>().notNull().default([]),
  rankSource: text('rankSource'), // e.g. 'QS World University Rankings 2026' — nullable, curated (unverified) rows have no source yet
  rankValue: integer('rankValue'), // the cited rank number from rankSource — nullable
  actualAcceptanceRate: integer('actualAcceptanceRate'), // 0-100, real published overall admit rate — nullable
  acceptanceRateSource: text('acceptanceRateSource'), // e.g. 'U.S. Dept of Education College Scorecard' — nullable. When set, baselineSelectivity above was derived FROM this real rate (100 - rate), not curated/estimated — the two are not independent facts.
  globalRankValue: integer('globalRankValue'), // e.g. 4 for QS World rank #4 — nullable. DISPLAY ONLY: deliberately never read by the match/analysis AI prompts, so a student who only targets one country doesn't have their in-country chance calculation skewed by a cross-country prestige list.
  globalRankSource: text('globalRankSource'), // e.g. 'QS World University Rankings 2026' — nullable
  // Early Decision / Early Action / Regular-Decision-only rates — a US-only
  // phenomenon (verified: no binding equivalent in UK/AU/SG/HK/IN). Distinct
  // from actualAcceptanceRate above, which is the BLENDED overall rate: a
  // school can publish ~43% ED admit vs ~3.83% everyone else, both folded
  // into one ~5% headline. All nullable — null means "not yet researched or
  // doesn't offer this round," never zero. When present, these ground a
  // separate, additional personalized probability per round (see match.ts /
  // analyze-target-university.ts) — never used to silently overwrite the
  // main university-wide acceptanceProbability.
  earlyDecisionRate: integer('earlyDecisionRate'),
  earlyActionRate: integer('earlyActionRate'),
  regularDecisionRate: integer('regularDecisionRate'),
  earlyAdmissionSource: text('earlyAdmissionSource'), // e.g. 'Common Data Set 2024-25' — covers whichever of the three rates above are set
  // Narrow, curated exception field — NOT meant to be filled in for most
  // schools. Reserved for the small number of well-documented cases where a
  // school's headline acceptance rate is misleadingly low mainly because of
  // applicant-volume inflation (aggressive marketing, dropping supplemental
  // essays, going test-optional) rather than a proportional rise in how hard
  // it is for a genuinely well-matched applicant to get in — e.g. Northeastern
  // and University of Chicago, both independently reported. Exists so a
  // student isn't left thinking the app is broken when a school shows a
  // shockingly low percentage. Distinct from the ED/RD split above (a
  // different, also-real mechanism) — a school can have either, both, or
  // neither.
  admissionsContextNote: text('admissionsContextNote'),
  admissionsContextNoteSource: text('admissionsContextNoteSource'),
  imageUrl: text('imageUrl'), // real campus photo from Wikimedia Commons — nullable, not every school resolves to a good match
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

// Per-program (per-field) ranking data for a university, sourced from a
// named, citable ranking or acceptance-rate publication — distinct from
// universities.baselineSelectivity, which is a curated overall estimate, not
// sourced. A school can have zero, one, or several rows here (one per
// ACADEMIC_FIELDS value it's separately ranked for). Absence of a row for a
// given field means "not yet researched," not "unranked" — callers should
// fall back to baselineSelectivity, never treat a missing row as a zero.
export const programRankings = pgTable('programRankings', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  universityId: integer('universityId').notNull(), // FK to universities.id (no constraint, matching savedSchools' convention)
  field: text('field').notNull(), // one of ACADEMIC_FIELDS
  rankValue: integer('rankValue'), // the program-specific rank number from rankSource, nullable
  rankSource: text('rankSource').notNull(), // e.g. 'US News Best Undergraduate Computer Science Programs 2026'
  rankSourceUrl: text('rankSourceUrl').notNull(), // citation link, so a rank can be spot-checked
  acceptanceRate: integer('acceptanceRate'), // 0-100 program-specific admit rate, if the source publishes one; nullable
  programSelectivity: integer('programSelectivity').notNull(), // 0-100, this program's selectivity (derived from rank/acceptance rate) — used in place of baselineSelectivity when present
  notes: text('notes'), // caveats, e.g. "rank is for the business school overall, not a named major"
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

// A saved student profile (one row per save). Scoped by userId.
export const profiles = pgTable('profiles', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  userId: uuid('userId').notNull(),
  targetCountries: jsonb('targetCountries').$type<string[]>().notNull().default([]), // one or more of 'US' | 'UK' | 'AU' | 'SG' | 'HK' | 'IN'
  curriculum: text('curriculum').notNull(),
  gradeValue: integer('gradeValue').notNull(),
  preferredClimate: text('preferredClimate').notNull(),
  preferredSector: text('preferredSector').notNull(),
  preferredRank: text('preferredRank').notNull().default('No preference'), // 'Top 50' | 'Top 100' | 'Top 200' | 'No preference'
  intendedField: text('intendedField').notNull().default('No preference'), // one of ACADEMIC_FIELDS, or 'No preference'
  academicDetail: jsonb('academicDetail').$type<AcademicDetail | null>(), // real per-curriculum structure; gradeValue above is computed from this
  standardizedTests: jsonb('standardizedTests').$type<StandardizedTests>().notNull().default({}), // orthogonal to curriculum — SAT/ACT, JEE/NEET etc.
  priorGrades: jsonb('priorGrades').$type<PriorGrades>(), // nullable — 9th-11th context, curriculum-aware; see lib/prior-grades.ts
  extracurriculars: jsonb('extracurriculars').$type<string[]>().notNull().default([]),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

// AI-generated match results tied to a saved run. Scoped by userId.
export const matches = pgTable('matches', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  userId: uuid('userId').notNull(),
  targetCountries: jsonb('targetCountries').$type<string[]>().notNull().default([]),
  gradeBadge: text('gradeBadge').notNull(),
  // The full AI result payload: per-university tier, probability, and rationale.
  results: jsonb('results').$type<MatchResult[]>().notNull().default([]),
  summary: text('summary').notNull().default(''),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const savedSchools = pgTable('savedSchools', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  userId: uuid('userId').notNull(),
  universityId: integer('universityId').notNull(),
  universityName: text('universityName').notNull(),
  universityLocation: text('universityLocation').notNull(),
  matchTier: text('matchTier').notNull(),
  acceptanceProbability: integer('acceptanceProbability').notNull(),
  applicationStatus: text('applicationStatus').notNull().default('Researching'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

// Generic rate-limit ledger for AI-calling actions that don't already have
// their own per-call history table to count against — see lib/rate-limit.ts.
export const aiRateLimitLog = pgTable('aiRateLimitLog', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  userId: uuid('userId').notNull(),
  action: text('action').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export type ApplicationStatus = 'Researching' | 'Applying' | 'Submitted'

export type SavedSchool = {
  id: number
  universityId: number
  universityName: string
  universityLocation: string
  matchTier: string
  acceptanceProbability: number
  applicationStatus: ApplicationStatus
  createdAt: Date
}

// A saved single-university deep-dive analysis. Scoped by userId.
export const universityAnalyses = pgTable('universityAnalyses', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  userId: uuid('userId').notNull(),
  universityName: text('universityName').notNull(),
  universityId: integer('universityId'), // nullable — null if not resolved against the catalog
  usedCatalogGrounding: integer('usedCatalogGrounding').notNull().default(0), // 0/1 boolean (no boolean type churn needed)
  acceptanceProbability: integer('acceptanceProbability'),
  matchTier: text('matchTier'),
  admissionChanceSummary: text('admissionChanceSummary').notNull(),
  strengths: jsonb('strengths').$type<string[]>().notNull().default([]),
  weaknesses: jsonb('weaknesses').$type<string[]>().notNull().default([]),
  actionSteps: jsonb('actionSteps').$type<string[]>().notNull().default([]),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

// Real Early Decision / Early Action / Regular-Decision-only facts, shared
// shape between MatchResult and TargetAnalysisResult — see the field-level
// comment on MatchResult.earlyAdmission below for the full rationale.
export type EarlyAdmissionInfo = {
  earlyDecision: { realRate: number; yourChance: number } | null
  earlyAction: { realRate: number; yourChance: number } | null
  regularDecision: { realRate: number } | null
  publishedOverallRate: number | null
  source: string
} | null

export type MatchResult = {
  universityId: string
  name: string
  country: string
  location: string
  climate: string
  imageUrl: string | null
  matchTier: 'Safety' | 'Good Chance' | 'Reach' | 'Ultra Reach'
  acceptanceProbability: number
  // General selectivity only (real acceptance-rate-derived where we have
  // it, curated estimate otherwise) — NOT swapped for a program-specific
  // number. Charts and any "how competitive is this school" framing should
  // read from this one number; showing two different selectivity values
  // for the same school (general vs. program) reads as "which one is
  // real?" rather than adding clarity. acceptanceProbability is grounded
  // ONLY in this university-wide signal too — admission is to the
  // university, not a specific program, for the vast majority of schools
  // (see match.ts for the handful of real, known exceptions). A verified
  // program-specific rank is quality/fit context only — see rankBadge.
  baselineSelectivity: number
  // One rank fact to display per school, already resolved to whichever is
  // most specific: a verified program-specific rank for the student's own
  // intended field, or (if none) the school's verified general/overall
  // rank, or null if we have neither yet. Never both — see the comment
  // above on why mixing selectivity numbers is confusing; the same applies
  // to rank badges. `source` is carried through so the UI can explain WHY
  // several schools can legitimately show the same number — published
  // rankings (US News, NIRF, etc.) commonly report ties past the top ~10,
  // which reads as a bug if the source isn't shown alongside it.
  rankBadge: { type: 'program'; rankValue: number; field: string; source: string } | { type: 'general'; rankValue: number; source: string } | null
  // Display only — a cross-country prestige fact (e.g. QS World Rankings),
  // never fed into the AI prompt or the chance calculation. Showing this on
  // a US-only search result is fine ("this school also happens to be
  // globally ranked #4"); using it to affect that student's US-specific
  // odds would wrongly blend two different rankings systems.
  globalRank: { value: number; source: string } | null
  internshipProgram: string
  requirements: string[]
  link: string
  rationale: string
  improvementTips: string[]
  // Real Early Decision / Early Action / Regular-Decision-only facts, shown
  // directly (not gated behind a plan picker) whenever we have real data —
  // see universities.earlyDecisionRate etc. US-only in practice (verified:
  // no binding-commitment equivalent in UK/AU/SG/HK/IN). `realRate` is the
  // actual published figure for that round; `yourChance` is this student's
  // AI-estimated personalized odds if applying through that specific round,
  // only ever set alongside a real realRate — never invented. `regularDecision`
  // is the more "realistic" baseline for the typical non-early applicant,
  // often more pessimistic than publishedOverallRate since a blended headline
  // (like Northeastern's ~5%) can fold in a much easier ED pool (~43%) —
  // this is what acceptanceProbability above is grounded in when present,
  // ahead of the blended publishedOverallRate.
  earlyAdmission: EarlyAdmissionInfo
  // See universities.admissionsContextNote — rare, curated exception, null
  // for the overwhelming majority of schools. Independent of earlyAdmission
  // above: a school can have this without ED/EA data on file, or vice versa.
  admissionsContext: { note: string; source: string } | null
}
