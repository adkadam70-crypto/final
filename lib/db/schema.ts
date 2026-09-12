import { pgTable, text, integer, timestamp, jsonb, uuid, uniqueIndex } from "drizzle-orm/pg-core";
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
  country: text('country').notNull(), // 'US' | 'UK' | 'AU' | 'SG' | 'HK' | 'IN' | 'DE' | 'FR'
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
  actualAcceptanceRate: integer('actualAcceptanceRate'), // 0-100, a REAL published selectivity figure — nullable. Usually a US-style admit rate (admits ÷ applicants), but also a nationally-published offer rate where that is the standard measure and means the same thing for the applicant (a UCAS provider offer rate, a VTAC first-preference offer rate) — an offer IS the admission; enrolling is the applicant's choice. acceptanceRateSource names which. NOT for our own inferred numbers — those go in estimatedAcceptanceRate.
  acceptanceRateSource: text('acceptanceRateSource'), // e.g. 'U.S. Dept of Education College Scorecard' or 'UCAS 2024 end-of-cycle offer rate ...' — nullable. When set, baselineSelectivity above was derived FROM this real rate (100 - rate), not curated/estimated — the two are not independent facts. The string states what kind of figure it is (admit rate vs offer rate) so the UI and AI label it correctly.
  // Our own researched estimate of the overall undergrad acceptance rate, set
  // ONLY when actualAcceptanceRate is null AND credible data supported an
  // estimate (>=2 independent sources within tolerance, direct applicant/admit
  // counts, or structural signals — published Numerus Clausus cutoffs,
  // Parcoursup taux d'accès, entrance-exam seat ratios, UCAS offer rates).
  // Never derived from baselineSelectivity alone; never set alongside a real
  // actualAcceptanceRate. Treated exactly like actualAcceptanceRate: when set,
  // baselineSelectivity was aligned to (100 - this), and the match/analysis
  // AI anchors acceptanceProbability on it — flagged as an estimate in the
  // rationale, never stated as a certified figure.
  estimatedAcceptanceRate: integer('estimatedAcceptanceRate'),
  // User-facing sentence explaining the rate situation: either "Estimated ~X%
  // — <basis>. A research estimate, not a figure certified by the university."
  // or "No official acceptance rate — <why>." Null on rows that carry a real
  // actualAcceptanceRate (acceptanceRateSource covers those).
  acceptanceRateNote: text('acceptanceRateNote'),
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
  // Published 25th-75th percentile range for admitted students' standardized
  // test scores — nullable, populated only for schools that have been
  // researched. Null means "not yet researched," never "no testing." SAT and
  // ACT ranges are independent (a school may publish one, both, or neither);
  // never derive one from the other, since no SAT<->ACT concordance is used
  // anywhere else in this app (see lib/standardized-tests.ts). Compared
  // against the student's own satComposite()/act in match.ts and
  // analyze-target-university.ts to give the AI a real, factual data point —
  // never used to compute a probability adjustment directly in code.
  satRange25: integer('satRange25'), // 400-1600 composite, 25th percentile
  satRange75: integer('satRange75'), // 400-1600 composite, 75th percentile
  actRange25: integer('actRange25'), // 1-36, 25th percentile
  actRange75: integer('actRange75'), // 1-36, 75th percentile
  testScoreSource: text('testScoreSource'), // e.g. 'U.S. News & World Report — 2026 Best Colleges' — nullable, covers whichever of the four fields above are set
  // 'Required' | 'Recommended' | 'Test-Optional' | 'Test-Blind' — the school's
  // admissions testing policy, independent of whether we have a range on
  // file. Nullable: null means "not yet researched," never "Required" by
  // default. Matters because an absent satRange/actRange means two very
  // different things depending on this field — a Test-Blind school (e.g. the
  // UC system) never considers scores at all, even if submitted, so a
  // missing range is expected and permanent; a Test-Optional school simply
  // may not have a published range on this source yet. Never conflate the
  // two when explaining a missing range to a student.
  testPolicy: text('testPolicy'),
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
  // Program-specific admission requirements ON TOP OF universities.requirements
  // (school-wide) — e.g. Carnegie Mellon's School of Computer Science
  // requiring a supplemental essay and sometimes an AP CS score, or NYU
  // Stern requiring its own supplemental essays. Same convention as
  // universities.requirements: empty array means "none on file / none
  // required beyond the school-wide list," never "unresearched" — a row
  // existing in this table at all already implies the field was
  // deliberately researched, since a row won't exist otherwise.
  additionalRequirements: jsonb('additionalRequirements').$type<string[]>().notNull().default([]),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

// A saved student profile (one row per save). Scoped by userId.
export const profiles = pgTable('profiles', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  userId: uuid('userId').notNull(),
  targetCountries: jsonb('targetCountries').$type<string[]>().notNull().default([]), // one or more of 'US' | 'UK' | 'AU' | 'SG' | 'HK' | 'IN' | 'DE' | 'FR'
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
  // Real AP (Advanced Placement) courses taken, independent of curriculum —
  // a student on any curriculum (CBSE, A-Levels, IB, etc.) may also take AP
  // exams alongside it. Picked from the College Board's real course catalog
  // (see lib/ap-courses.ts), not free text, so this is always a genuine,
  // real course name the AI can weigh directly.
  apCourses: jsonb('apCourses').$type<string[]>().notNull().default([]),
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
  // Nullable — only used for the IP-level rate-limit backstop in
  // lib/rate-limit.ts (catches one IP spread across many accounts); never
  // shown to users or used for anything else.
  ipAddress: text('ipAddress'),
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
  ipAddress: text('ipAddress'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

// One row per signed-up account, capturing the IP + coarse device
// fingerprint (user-agent + accept-language, hashed) present at signup —
// lets us throttle the same person spinning up many accounts to dodge the
// per-account AI rate limits above. Weak signals individually (shared IPs,
// spoofable fingerprints), but combined they raise the cost of doing that
// enough to stop casual abuse; see lib/auth.ts databaseHooks.
export const signupFingerprints = pgTable('signupFingerprints', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  userId: uuid('userId').notNull(),
  ipAddress: text('ipAddress').notNull(),
  deviceHash: text('deviceHash').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

// "Build Your Dream" — a guided onboarding layered on top of the master
// profile above, not a replacement for it (see app/actions/dream.ts). One
// row per user: the onboarding answers and field recommendation are
// student-level, done once — the countries a student is actively building
// toward live in dreamCountryProfiles below (one row per user+country, so a
// student can build several countries off this same onboarding/field).
export const dreamProfiles = pgTable('dreamProfiles', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  userId: uuid('userId').notNull().unique(),
  // Onboarding answers.
  strengths: jsonb('strengths').$type<string[]>().notNull().default([]), // Q1: subjects they excel in/enjoy
  hobbies: text('hobbies').notNull().default(''), // Q2: free-text passions/hobbies
  interests: jsonb('interests').$type<string[]>().notNull().default([]), // Q3: real-world problem/industry tags
  interestsOther: text('interestsOther').notNull().default(''), // Q3: open-text addition
  // AI field-recommendation output — recommendedField is one of
  // ACADEMIC_FIELDS, proposed from the onboarding answers + master profile;
  // confirmedField is what the student actually locked in (their own choice
  // if they overrode the recommendation). Everything past onboarding reads
  // confirmedField, never recommendedField directly.
  recommendedField: text('recommendedField'),
  recommendedFieldRationale: text('recommendedFieldRationale'),
  confirmedField: text('confirmedField'),
  // Timeline context for the "Build your own profile" roadmap — lets the AI
  // reason about how much runway is actually left (e.g. "10th grade,
  // applying Fall 2028" vs. "12th grade, applying this fall") instead of
  // giving the same generic advice regardless of where the student is.
  currentGrade: text('currentGrade'), // e.g. '9th', '10th', '11th', '12th'
  applicationYear: integer('applicationYear'), // the fall they intend to start college, e.g. 2028
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

// One row per (user, country) the student has added to their Build Your
// Dream dashboard. Each gets its own AI profile analysis and its own
// application checklist against that country's real requirements (see
// lib/application-info.ts) — deliberately separate rows, not a single
// jsonb blob keyed by country, so querying "all countries for this user"
// and per-row timestamps stay simple.
export const dreamCountryProfiles = pgTable('dreamCountryProfiles', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  userId: uuid('userId').notNull(),
  country: text('country').notNull(),
  // AI profile-analysis output for this student's confirmed field in this
  // specific country — re-generated on demand, never silently stale-merged
  // with another country's result since each country has its own row.
  analysisStrengths: jsonb('analysisStrengths').$type<string[]>(),
  analysisGaps: jsonb('analysisGaps').$type<string[]>(),
  // Per-item checklist progress, keyed by the requirement string itself
  // (from lib/application-info.ts) -> a 0-100 completion percentage. Items
  // with a real matching field on the master profile (test scores,
  // transcript, extracurriculars) are auto-computed fresh on every read
  // (see computeAutoChecklistProgress in app/actions/dream.ts) and never
  // stored here; this column only stores the MANUAL override for items with
  // no detectable profile signal (essays, recommendation letters, etc.) —
  // student-toggled, 0 or 100.
  checklist: jsonb('checklist').$type<Record<string, number>>().notNull().default({}),
  // AI-generated "Build your own profile" roadmap for this country: a plain
  // summary of how much time is left (grade + intended application year,
  // see dreamProfiles above) and a phased list of what to work on before
  // applying — separate from analysisStrengths/Gaps above, which grade the
  // profile as it stands today rather than plan what to do next.
  roadmapSummary: text('roadmapSummary'),
  roadmapSteps: jsonb('roadmapSteps').$type<{ title: string; detail: string; howTo: string[]; targetUniversity: string | null }[]>(),
  // Up to 10 Common App "Activities" slots, formatted from the student's
  // existing extracurriculars first (real commitments, most important
  // first) then padded out with shortlisted-but-not-yet-completed roadmap
  // suggestions — see generateActivitiesPlan in app/actions/dream.ts. Any
  // slot the student types in by hand (past what the AI could fill) is
  // stored the same shape, category/position left blank.
  activitiesPlan: jsonb('activitiesPlan').$type<{ category: string; position: string; description: string }[]>(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
}, (table) => ({
  userCountryUnique: uniqueIndex('dreamCountryProfiles_user_country_idx').on(table.userId, table.country),
}))

// One row per (user, country, university) added to a Build Your Dream
// country's "My Universities" list — created by the "Add to list" action on
// a deep-dive analysis (see components/dream-country-workspace.tsx). Each
// school gets its own real per-college Common App tasks (see
// lib/common-app-sections.ts's PER_UNIVERSITY_TASK_TEMPLATE) plus the
// specific gaps the AI analysis found for that exact school, tracked
// separately from the country-wide Common App checklist above.
export const dreamUniversityTracks = pgTable('dreamUniversityTracks', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  userId: uuid('userId').notNull(),
  country: text('country').notNull(),
  universityId: integer('universityId').notNull(),
  universityName: text('universityName').notNull(),
  // Snapshot of the analysis that was showing when this school was added —
  // kept alongside the school so its card can show the "why" without
  // re-running the AI call every time the list renders.
  strengths: jsonb('strengths').$type<string[]>().notNull().default([]),
  weaknesses: jsonb('weaknesses').$type<string[]>().notNull().default([]),
  // Snapshot of the analysis' headline numbers at add-time, so the list can
  // show "your chance" without re-running the AI call every render — and a
  // snapshot of the catalog's real image, so the list can show a thumbnail
  // without a join back to `universities` on every read.
  acceptanceProbability: integer('acceptanceProbability'),
  matchTier: text('matchTier'),
  universityImageUrl: text('universityImageUrl'),
  // The university's own real site link (universities.link) — lets a click
  // from this list go straight to that school's own application pages,
  // where the tasks below actually get done.
  universityLink: text('universityLink'),
  // The real per-college tasks for this school: PER_UNIVERSITY_TASK_TEMPLATE
  // plus whatever school-specific gaps the analysis surfaced (a required
  // portfolio, a missing score, a specific supplemental essay) — all
  // manually toggled, since none of these have a master-profile field to
  // auto-detect from.
  tasks: jsonb('tasks').$type<string[]>().notNull().default([]),
  taskProgress: jsonb('taskProgress').$type<Record<string, number>>().notNull().default({}),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
}, (table) => ({
  userCountryUniversityUnique: uniqueIndex('dreamUniversityTracks_user_country_university_idx').on(table.userId, table.country, table.universityId),
}))

// AI-recommended (or self-added) extracurricular ideas surfaced by the
// "Build your own profile" roadmap. Tracked separately from the master
// profile's own `extracurriculars` so a suggestion can sit as "shortlisted"
// before the student has actually done it — only marking one "completed"
// folds its text into the real master-profile extracurriculars array (see
// appendExtracurricularToProfile in app/actions/profile.ts), so AI
// match/analysis prompts everywhere else only ever see things the student
// has actually confirmed doing.
export const profileSuggestedActivities = pgTable('profileSuggestedActivities', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  userId: uuid('userId').notNull(),
  text: text('text').notNull(),
  status: text('status').notNull().default('shortlisted'), // 'shortlisted' | 'completed'
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
  earlyDecisionProbability: integer('earlyDecisionProbability'),
  earlyActionProbability: integer('earlyActionProbability'),
  // FK-less reference (matching this table's own convention) to the exact
  // profiles row this analysis was run against — lets a repeat request for
  // the same school, same profile, reuse this row instead of asking the AI
  // again and getting a different-sounding probability each time. Null on
  // rows written before this column existed; those just never cache-hit.
  profileId: integer('profileId'),
  ipAddress: text('ipAddress'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
}, (table) => [
  // Closes the race the cache-read-then-write check above can't: two
  // requests for the same (account, school, profile) fired at once — e.g.
  // the same school analyzed from two open tabs — both miss the cache
  // before either has written yet, so both independently call the AI. This
  // constraint doesn't stop that double call, but it guarantees only ONE of
  // the two results ever gets persisted; analyze-target-university.ts uses
  // `onConflictDoNothing` + a re-read on conflict so whichever request loses
  // the race returns the WINNER's stored numbers instead of its own,
  // discarded ones — every tab ends up showing the same thing. Postgres
  // treats NULL as distinct from NULL in a unique index, so historical rows
  // with profileId IS NULL (written before this column existed) never
  // collide with each other here.
  uniqueIndex('university_analyses_user_uni_profile_idx').on(table.userId, table.universityId, table.profileId),
])

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

// One resolved acceptance-rate fact to show per school. Shared between
// MatchResult and TargetAnalysisResult. Resolved server-side from
// universities.actualAcceptanceRate / acceptanceRateSource /
// estimatedAcceptanceRate / acceptanceRateNote:
//   - 'official'   : a real published rate (never our estimate)
//   - 'estimated'  : our own researched estimate — `note` says the basis and
//                    that the university does not certify it
//   - 'unspecified': no rate exists or none is credibly estimable — `note`
//                    says why (e.g. Numerus Clausus, non-selective licence)
//   - null         : row predates this pass; nothing to show
export type AcceptanceRateInfo =
  | { kind: 'official'; rate: number; source: string }
  | { kind: 'estimated'; rate: number; note: string }
  | { kind: 'unspecified'; note: string }
  | null

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
  // Both rank facts shown side by side when both exist, so a rank-filtered
  // search (e.g. "Top 100") never looks self-contradictory — a school can
  // qualify via its general rank while its program-specific rank sits
  // outside the threshold, and hiding one number used to read as a bug.
  // `source` is carried through so the UI can explain WHY several schools
  // can legitimately show the same number — published rankings (US News,
  // NIRF, etc.) commonly report ties past the top ~10.
  generalRankBadge: { rankValue: number; source: string } | null
  programRankBadge: { rankValue: number; field: string; source: string } | null
  // Display only — a cross-country prestige fact (e.g. QS World Rankings),
  // never fed into the AI prompt or the chance calculation. Showing this on
  // a US-only search result is fine ("this school also happens to be
  // globally ranked #4"); using it to affect that student's US-specific
  // odds would wrongly blend two different rankings systems.
  globalRank: { value: number; source: string } | null
  // The school's own acceptance rate (or the honest absence of one) — see
  // AcceptanceRateInfo. Distinct from acceptanceProbability, which is the
  // student's personalized chance.
  acceptanceRate: AcceptanceRateInfo
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
