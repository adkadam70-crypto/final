'use client'

import { useState, useTransition, useRef, useEffect, type Dispatch, type SetStateAction } from 'react'
import Link from 'next/link'
import { GraduationCap, Globe, Flame, Compass, Loader2, CheckCircle2, Award, ChevronDown, History, ArrowRight, Plus, X, BookOpen, Info } from 'lucide-react'
import { saveProfile, type SaveProfileInput } from '@/app/actions/profile'
import { markSuggestedActivityDone, type SuggestedActivityRow } from '@/app/actions/dream'
import { AP_COURSE_CATEGORIES, AP_COURSES } from '@/lib/ap-courses'
import { LiquidButton } from '@/components/ui/liquid-glass-button'
import { gradeBadge } from '@/lib/grade'
import { AcademicDetailInput } from '@/components/academic-detail-input'
import { defaultAcademicDetail, ACADEMIC_FIELDS, type AcademicDetail } from '@/lib/academic-detail'
import { satComposite, ENGLISH_TEST_TYPES, ENGLISH_TEST_RANGES, type StandardizedTests, type EnglishTestType } from '@/lib/standardized-tests'
import {
  GRADE_RELEVANCE,
  defaultNinthTenthCurriculum,
  type PriorGrades,
  type NinthTenthGrades,
  type NinthTenthYear,
  type NinthTenthCurriculum,
} from '@/lib/prior-grades'
import { HowWeAnalyze } from '@/components/how-we-analyze'
import { WorldMap } from '@/components/ui/map'
import { COUNTRY_COORDINATES } from '@/lib/country-coordinates'

type Curriculum = 'CBSE' | 'IB_DIPLOMA' | 'A_LEVELS' | 'US_GPA_PCT'

const CURRICULUM_LABELS: Record<Curriculum, string> = {
  CBSE: 'CBSE / ISC (India)',
  IB_DIPLOMA: 'IB Diploma',
  A_LEVELS: 'A-Levels',
  US_GPA_PCT: 'US (GPA)',
}

// SAT section scores are only ever reported in multiples of 10, from 200-800.
const SAT_SECTION_SCORES = Array.from({ length: 61 }, (_, i) => 200 + i * 10)

type ProfileRow = {
  id: number
  targetCountries: string[]
  curriculum: string
  gradeValue: number
  preferredClimate: string
  preferredSector: string
  preferredRank: string
  intendedField: string
  academicDetail: AcademicDetail | null
  standardizedTests: StandardizedTests
  priorGrades: PriorGrades | null
  extracurriculars: string[]
  apCourses: string[]
  createdAt: Date
}

type LatestProfile = {
  id: number
  targetCountries: string[]
  curriculum: string
  preferredClimate: string
  preferredSector: string
  preferredRank: string
  intendedField: string
  academicDetail: AcademicDetail | null
  standardizedTests: StandardizedTests
  priorGrades: PriorGrades | null
  extracurriculars: string[]
  apCourses: string[]
} | null

// Small, focused sub-component for the 9th/10th block: one curriculum
// picker shared by both years (9-10 very often share a curriculum even
// when a student later switches for 11-12), with curriculum-appropriate
// inputs — grade counts for IGCSE, not per-subject detail like the main
// 12th input.
function NinthTenthInput({ value, onChange }: { value: NinthTenthGrades; onChange: (v: NinthTenthGrades) => void }) {
  const curriculum = value.curriculum ?? 'CBSE_ICSE'

  function updateYear(year: 'grade9' | 'grade10', patch: Partial<NinthTenthYear>) {
    onChange({ ...value, [year]: { ...value[year], ...patch } })
  }

  function yearBlock(year: 'grade9' | 'grade10', label: string) {
    const y = value[year]
    return (
      <div className="space-y-1.5">
        <span className="text-[11px] text-muted-foreground font-medium">{label}</span>
        {curriculum === 'IGCSE' && (
          <div className="grid grid-cols-6 gap-1">
            {(['aStar', 'a', 'b', 'c', 'd', 'e'] as const).map((k) => (
              <div key={k}>
                <label className="text-[9px] text-muted-foreground/70 block mb-0.5 text-center">{k === 'aStar' ? 'A*' : k.toUpperCase()}</label>
                <input
                  type="number"
                  min={0}
                  value={y.igcse?.[k] ?? ''}
                  onChange={(e) => updateYear(year, { igcse: { ...y.igcse, [k]: e.target.value ? Number(e.target.value) : undefined } })}
                  className="w-full bg-secondary border border-border rounded-lg p-1.5 text-xs text-foreground text-center focus:outline-none focus:border-primary"
                />
              </div>
            ))}
          </div>
        )}
        {curriculum === 'CBSE_ICSE' && (
          <input type="number" min={0} max={100} placeholder="Overall %" value={y.percentage ?? ''} onChange={(e) => updateYear(year, { percentage: e.target.value ? Number(e.target.value) : undefined })} className="w-full bg-secondary border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary" />
        )}
        {curriculum === 'US_GPA' && (
          <input type="number" min={0} max={4} step={0.01} placeholder="GPA (0.0–4.0)" value={y.gpa ?? ''} onChange={(e) => updateYear(year, { gpa: e.target.value ? Number(e.target.value) : undefined })} className="w-full bg-secondary border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary" />
        )}
        {curriculum === 'IB_MYP' && (
          <input type="number" min={1} max={7} step={0.1} placeholder="Average (1–7)" value={y.ibAverage ?? ''} onChange={(e) => updateYear(year, { ibAverage: e.target.value ? Number(e.target.value) : undefined })} className="w-full bg-secondary border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary" />
        )}
        <input
          type="text"
          maxLength={150}
          placeholder="Changes worth flagging? We'd love to know your trajectory"
          value={y.note ?? ''}
          onChange={(e) => updateYear(year, { note: e.target.value })}
          className="w-full bg-secondary border border-border rounded-lg p-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary"
        />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-[11px] text-muted-foreground block mb-1">Curriculum for 9th &amp; 10th grade</label>
        <select
          value={curriculum}
          onChange={(e) => onChange({ ...value, curriculum: e.target.value as NinthTenthCurriculum })}
          className="w-full bg-secondary border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary"
        >
          <option value="CBSE_ICSE">CBSE / ICSE / other percentage board</option>
          <option value="IB_MYP">IB (Middle Years Programme)</option>
          <option value="IGCSE">IGCSE</option>
          <option value="US_GPA">US (GPA)</option>
        </select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {yearBlock('grade9', '9th grade')}
        {yearBlock('grade10', '10th grade')}
      </div>
    </div>
  )
}

const HONORS_EXAMPLES = [
  'International/National Olympiad medal (Math, Science, Informatics, etc.)',
  'National Merit Scholar / state topper',
  'First place at a national-level debate, MUN, or hackathon',
  'State or national sports team representation',
  'Published research paper or patent',
]

const SERVICE_EXAMPLES = [
  'Founded or led a school club or student organization',
  'Regular volunteering with an NGO or community org (with hours/duration)',
  'Organized a fundraiser, awareness campaign, or community event',
  'Peer tutoring or mentoring program',
  'Internship or part-time work with measurable impact',
]

// A third, distinct dimension from Honors (peak competitive achievement) and
// Leadership/service (impact on others): sustained personal interest and
// talent — what admissions offices call "depth" or a "spike" — that doesn't
// require a national title or a leadership role to be worth showing. Common
// App's own activity list treats Arts, Athletics, Music, and "personal
// project" categories as distinct from both Honors and Volunteer/Community
// Service, so this closes a real gap rather than duplicating either field.
const PROJECT_EXAMPLES = [
  'School/club-level sports, music, or art — years of commitment, not just national wins',
  'A personal project: an app, a piece of writing, a research idea, a small business',
  'A portfolio, exhibition, performance, or publication of creative work',
  'A self-taught skill pursued in real depth (e.g. 3 years of competitive chess, a YouTube channel with a real audience)',
  'A sustained hobby that shows genuine, long-term interest rather than a single entry',
]

// Each of the three groups below used to be a single free-text field. Now
// every group holds a repeatable list of activities, each with its own
// type and description — closer to how Common App's real Activities list
// works, and it lets a student log more than one honor/leadership
// role/project without cramming them into one 200-char field.
type ActivityEntry = { type: string; description: string }
const emptyEntry = (): ActivityEntry => ({ type: '', description: '' })

const HONORS_TYPES = ['Award or honor', 'Olympiad / competition', 'Scholarship', 'Certification', 'Published research or paper', 'Other']
const SERVICE_TYPES = ['Leadership role', 'Volunteering / community service', 'Work experience / internship', 'Fundraiser or event organized', 'Other']
const PROJECT_TYPES = ['Sport / athletics', 'Music, art, or performance', 'Personal project (app, writing, business)', 'Portfolio / exhibition / publication', 'Hobby or self-taught skill', 'Other']

// Existing saved profiles have a flat string[] with no type info (the old
// three-field form). Slots 0/1/2 map to the three groups in order, same as
// before; anything beyond index 2 used to be silently dropped on every
// resave (the old form only ever read/wrote 3 slots) — now it survives as
// extra entries on the third group instead of vanishing.
function entriesFromLegacy(extracurriculars: string[] | undefined, groupIndex: 0 | 1 | 2): ActivityEntry[] {
  const list = extracurriculars ?? []
  const first: ActivityEntry = { type: '', description: list[groupIndex] ?? '' }
  if (groupIndex !== 2) return [first]
  const extras = list.slice(3).filter(Boolean).map((description) => ({ type: '', description }))
  return [first, ...extras]
}

function formatEntry(entry: ActivityEntry): string {
  const description = entry.description.trim()
  if (!description) return ''
  return entry.type ? `${entry.type}: ${description}` : description
}

function wordCount(text: string): number {
  const trimmed = text.trim()
  return trimmed ? trimmed.split(/\s+/).length : 0
}

// A 50-word cap only makes sense counted in words, not characters — plain
// maxLength on the textarea can't express that. Truncates rather than
// blocking further typing mid-word, so it never feels like the field just
// stopped responding.
function capWords(text: string, max: number): string {
  const words = text.split(/\s+/)
  if (words.length <= max) return text
  return words.slice(0, max).join(' ')
}

function ActivityGroupFields({
  label,
  types,
  examples,
  entries,
  onChange,
  onAdd,
  onRemove,
}: {
  label: string
  types: string[]
  examples: string[]
  entries: ActivityEntry[]
  onChange: (idx: number, patch: Partial<ActivityEntry>) => void
  onAdd: () => void
  onRemove: (idx: number) => void
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-foreground/90 block mb-2">{label}</label>
      <div className="space-y-2.5">
        {entries.map((entry, idx) => (
          <div key={idx} className="bg-secondary/60 border border-border rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-2">
              {/* Deliberately styled unlike the plain grey <select>s used
                  elsewhere in this form (e.g. the grade/curriculum picker)
                  — a rounded pill with an accent border/fill so this reads
                  as "pick a category for this entry," not just another
                  generic dropdown. */}
              <select
                value={entry.type}
                onChange={(e) => onChange(idx, { type: e.target.value })}
                className="shrink-0 max-w-[65%] bg-chart-2/10 border-2 border-chart-2/40 text-chart-2 rounded-full px-3 py-1.5 text-[11px] font-semibold focus:outline-none focus:border-chart-2"
              >
                <option value="">Type of activity…</option>
                {types.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {entries.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemove(idx)}
                  aria-label="Remove this activity"
                  className="ml-auto text-muted-foreground hover:text-destructive p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <textarea
              rows={2}
              placeholder="Describe this activity — what you did, for how long, and any impact"
              value={entry.description}
              onChange={(e) => onChange(idx, { description: capWords(e.target.value, 50) })}
              className="w-full bg-secondary border border-border rounded-xl p-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-chart-2 resize-none"
            />
            <div className="text-[10px] text-muted-foreground/70 text-right">{wordCount(entry.description)}/50 words</div>
          </div>
        ))}
      </div>
      <div className="flex items-start justify-between gap-2 mt-1.5">
        <ExamplesHint examples={examples} />
        <button type="button" onClick={onAdd} className="shrink-0 text-[11px] font-semibold text-chart-2 hover:brightness-125 flex items-center gap-1">
          <Plus className="w-3 h-3" /> Add another
        </button>
      </div>
    </div>
  )
}

function ProfileCompletionRing({ percent }: { percent: number }) {
  const size = 56
  const stroke = 5
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - percent / 100)
  return (
    <div className="shrink-0 flex flex-col items-center gap-1" title={`Profile ${percent}% complete`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} stroke="var(--border)" strokeWidth={stroke} fill="none" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="var(--primary)"
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-500"
          />
        </svg>
        {/* A counter-rotated <text> inside the -rotate-90 <svg> used to carry
            the number, but SVG `transform-origin: center` resolves against
            the viewport, not the element's own box, unless `transform-box:
            fill-box` is set — support for that split differently across
            browsers, so the digits didn't reliably land back in the same
            spot everywhere. A plain HTML overlay, positioned independently
            of the SVG's rotation, doesn't have that ambiguity. */}
        <div className="absolute inset-0 flex items-center justify-center text-[13px] font-bold text-foreground">{percent}%</div>
      </div>
      <span className="text-[10px] text-muted-foreground font-medium">Profile complete</span>
    </div>
  )
}

function ExamplesHint({ examples }: { examples: string[] }) {
  return (
    <details className="group mt-1.5">
      <summary className="cursor-pointer list-none text-[11px] text-primary font-medium flex items-center gap-1 w-fit">
        What can I add here? <ChevronDown className="w-3 h-3 transition-transform group-open:rotate-180" />
      </summary>
      <ul className="mt-1.5 text-[11px] text-muted-foreground space-y-1 list-disc list-inside">
        {examples.map((ex) => <li key={ex}>{ex}</li>)}
      </ul>
    </details>
  )
}

export function ProfileForm({
  initialProfiles,
  latestProfile,
  suggestedActivities,
}: {
  initialProfiles: ProfileRow[]
  latestProfile: LatestProfile
  suggestedActivities: SuggestedActivityRow[] | null
}) {
  const [activities, setActivities] = useState(suggestedActivities ?? [])
  const [activityPendingId, setActivityPendingId] = useState<number | null>(null)

  async function handleMarkActivityDone(id: number) {
    setActivityPendingId(id)
    const res = await markSuggestedActivityDone(id)
    setActivityPendingId(null)
    if (res.success) setActivities((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'completed' } : a)))
  }

  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const errorRef = useRef<HTMLParagraphElement>(null)

  // Move focus to the error on failure so keyboard/screen-reader users find
  // it immediately instead of having to hunt for it after a failed submit.
  useEffect(() => {
    if (error) errorRef.current?.focus()
  }, [error])

  // Seed every field from the user's last saved profile so the form always
  // reflects what's actually saved, rather than resetting to defaults —
  // still fully editable, and saving again just makes the edited version
  // the new latest profile.
  const [targetCountries, setTargetCountries] = useState<string[]>(latestProfile?.targetCountries?.length ? latestProfile.targetCountries : ['US'])
  const [curriculum, setCurriculum] = useState<Curriculum>((latestProfile?.curriculum as Curriculum) ?? 'CBSE')
  const [academicDetail, setAcademicDetail] = useState<AcademicDetail>(latestProfile?.academicDetail ?? defaultAcademicDetail('CBSE'))
  const [preferredClimate, setPreferredClimate] = useState(latestProfile?.preferredClimate ?? 'Warm')
  const [preferredSector, setPreferredSector] = useState(latestProfile?.preferredSector ?? 'Tech Hub')
  const [preferredRank, setPreferredRank] = useState(latestProfile?.preferredRank ?? 'No preference')
  const [intendedField, setIntendedField] = useState(latestProfile?.intendedField ?? 'No preference')
  const [ec1, setEc1] = useState<ActivityEntry[]>(entriesFromLegacy(latestProfile?.extracurriculars, 0))
  const [ec2, setEc2] = useState<ActivityEntry[]>(entriesFromLegacy(latestProfile?.extracurriculars, 1))
  const [ec3, setEc3] = useState<ActivityEntry[]>(entriesFromLegacy(latestProfile?.extracurriculars, 2))
  const activityHandlers = (setter: Dispatch<SetStateAction<ActivityEntry[]>>) => ({
    onChange: (idx: number, patch: Partial<ActivityEntry>) => setter((entries) => entries.map((e, i) => (i === idx ? { ...e, ...patch } : e))),
    onAdd: () => setter((entries) => [...entries, emptyEntry()]),
    onRemove: (idx: number) => setter((entries) => entries.filter((_, i) => i !== idx)),
  })
  const [apCourses, setApCourses] = useState<string[]>(latestProfile?.apCourses ?? [])
  const [apCourseInput, setApCourseInput] = useState('')
  const [showApSuggestions, setShowApSuggestions] = useState(false)
  const apInputWrapperRef = useRef<HTMLDivElement>(null)
  const [showApInfo, setShowApInfo] = useState(false)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (apInputWrapperRef.current && !apInputWrapperRef.current.contains(e.target as Node)) {
        setShowApSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const apQuery = apCourseInput.trim().toLowerCase()
  const apSuggestions = apQuery
    ? AP_COURSES.filter((c) => c.toLowerCase().includes(apQuery) && !apCourses.includes(c)).slice(0, 8)
    : []

  function addApCourse(course: string) {
    const trimmed = course.trim()
    if (!trimmed || apCourses.includes(trimmed)) return
    setApCourses((prev) => [...prev, trimmed])
    setApCourseInput('')
    setShowApSuggestions(false)
  }

  function removeApCourse(course: string) {
    setApCourses((prev) => prev.filter((c) => c !== course))
  }

  const [standardizedTests, setStandardizedTests] = useState<StandardizedTests>(latestProfile?.standardizedTests ?? {})
  const [ninthTenth, setNinthTenth] = useState<NinthTenthGrades>(
    latestProfile?.priorGrades?.ninthTenth ?? {
      curriculum: defaultNinthTenthCurriculum((latestProfile?.curriculum as Curriculum) ?? 'CBSE'),
      grade9: {},
      grade10: {},
    },
  )
  const [eleventh, setEleventh] = useState<AcademicDetail | null>(latestProfile?.priorGrades?.eleventh ?? null)
  const [loadedProfileId, setLoadedProfileId] = useState<number | null>(latestProfile?.id ?? null)

  const badge = gradeBadge(academicDetail)

  function handleCurriculumChange(next: Curriculum) {
    setCurriculum(next)
    setAcademicDetail(defaultAcademicDetail(next))
    // 11th grade reuses the main curriculum's shape (it's "a smaller part of
    // the 12th section"), so it needs to switch shape along with it.
    setEleventh((prev) => (prev ? defaultAcademicDetail(next) : null))
  }

  function toggleCountry(code: string) {
    setTargetCountries((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]))
  }

  // Reload every field from a previously saved profile — lets the user pick
  // an older version from "Recent profiles" and pick up editing from there.
  // Saving afterwards makes this the new latest profile, it doesn't touch
  // the row it was loaded from.
  function loadProfile(p: ProfileRow) {
    setTargetCountries(p.targetCountries.length ? p.targetCountries : ['US'])
    setCurriculum(p.curriculum as Curriculum)
    setAcademicDetail(p.academicDetail ?? defaultAcademicDetail(p.curriculum as Curriculum))
    setPreferredClimate(p.preferredClimate)
    setPreferredSector(p.preferredSector)
    setPreferredRank(p.preferredRank)
    setIntendedField(p.intendedField)
    setEc1(entriesFromLegacy(p.extracurriculars, 0))
    setEc2(entriesFromLegacy(p.extracurriculars, 1))
    setEc3(entriesFromLegacy(p.extracurriculars, 2))
    setApCourses(p.apCourses ?? [])
    setStandardizedTests(p.standardizedTests ?? {})
    setNinthTenth(p.priorGrades?.ninthTenth ?? { curriculum: defaultNinthTenthCurriculum(p.curriculum as Curriculum), grade9: {}, grade10: {} })
    setEleventh(p.priorGrades?.eleventh ?? null)
    setLoadedProfileId(p.id)
  }

  async function handleSave() {
    setError(null)
    setSaved(false)
    const priorGrades: PriorGrades = { ninthTenth, eleventh }
    const input: SaveProfileInput = {
      targetCountries,
      curriculum,
      academicDetail,
      standardizedTests,
      priorGrades,
      preferredClimate,
      preferredSector,
      preferredRank,
      intendedField,
      extracurriculars: [...ec1, ...ec2, ...ec3].map(formatEntry).filter(Boolean),
      apCourses,
    }
    startTransition(async () => {
      try {
        const res = await saveProfile(input)
        if (!res.success) {
          setError(res.message)
          setTimeout(() => setError(null), 5000)
          return
        }
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Something went wrong saving your profile.'
        console.error('Profile save failed:', message)
        setError(message)
        setTimeout(() => setError(null), 5000)
      }
    })
  }

  const COUNTRIES = [
    { code: 'AU', label: 'Australia' },
    { code: 'FR', label: 'France' },
    { code: 'DE', label: 'Germany' },
    { code: 'HK', label: 'Hong Kong' },
    { code: 'IN', label: 'India' },
    { code: 'SG', label: 'Singapore' },
    { code: 'UK', label: 'UK' },
    { code: 'US', label: 'USA' },
  ]

  const onlyAustralia = targetCountries.length === 1 && targetCountries[0] === 'AU'

  // A simple checklist across the sections below, not a weighted score —
  // good enough to show real progress without pretending to judge quality.
  const hasPriorGradeYear = (y: { percentage?: number; gpa?: number; ibAverage?: number; igcse?: unknown }) =>
    y.percentage != null || y.gpa != null || y.ibAverage != null || y.igcse != null
  const completionChecklist = [
    targetCountries.length > 0,
    Boolean(standardizedTests.satMath || standardizedTests.satReadingWriting || standardizedTests.act || standardizedTests.jeePercentile || standardizedTests.neetScore || standardizedTests.englishTestScore),
    [...ec1, ...ec2, ...ec3].some((e) => e.description.trim().length > 0),
    apCourses.length > 0,
    hasPriorGradeYear(ninthTenth.grade9) || hasPriorGradeYear(ninthTenth.grade10) || eleventh !== null,
    intendedField !== 'No preference',
  ]
  const completionPercent = Math.round((completionChecklist.filter(Boolean).length / completionChecklist.length) * 100)

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">Your Profile</h1>
          <p className="text-sm text-muted-foreground">Tell us about your academics and preferences. This powers your match results and university recommendations.</p>
        </div>
        <ProfileCompletionRing percent={completionPercent} />
      </div>

      <div className="space-y-12">
        <HowWeAnalyze />

        <section className="bg-card border border-border rounded-3xl p-6">
          <h2 className="text-xl font-extrabold tracking-tight text-primary mb-1 flex items-center gap-2"><Globe className="w-5 h-5 text-primary" /> Target countries</h2>
          <p className="text-[11px] text-muted-foreground/70 mb-5">Select one or more — matches run across every country you pick.</p>
          {/* One continuous box — the map sits "behind" (a slightly deeper
              shade, no border of its own) and blends directly into the
              country grid below it with no seam, rather than being a
              separate boxed element crammed above the picker. */}
          <div className="rounded-2xl border border-border overflow-hidden bg-secondary/30">
            <div className="pt-3 px-3">
              <WorldMap
                points={targetCountries.flatMap((code) => (COUNTRY_COORDINATES[code] ? [{ code, ...COUNTRY_COORDINATES[code] }] : []))}
              />
            </div>
            <div className="grid grid-cols-3 gap-2 p-3">
              {COUNTRIES.map((c) => {
                const active = targetCountries.includes(c.code)
                return (
                  <button key={c.code} onClick={() => toggleCountry(c.code)} aria-pressed={active} className={`p-3 rounded-2xl text-xs font-medium transition-all border ${active ? 'bg-accent border-primary text-accent-foreground' : 'bg-secondary border-border text-muted-foreground hover:border-foreground/20'}`}>{c.label}</button>
                )
              })}
            </div>
          </div>
          <Link href="/application-info" className="mt-4 flex items-center justify-between gap-2 p-3 bg-accent/40 border border-primary/25 rounded-2xl text-xs text-accent-foreground hover:bg-accent/60 transition-colors">
            <span>Want the specifics for your selected countries — how to apply, what to submit, what each one prioritizes?</span>
            <span className="flex items-center gap-1 text-primary font-semibold shrink-0"><ArrowRight className="w-3.5 h-3.5" /></span>
          </Link>
        </section>

        <section className="bg-card border border-border rounded-3xl p-6">
          <h2 className="text-xl font-extrabold tracking-tight text-primary mb-4 flex items-center gap-2"><GraduationCap className="w-5 h-5 text-primary" /> Academics</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="curriculum" className="text-xs text-muted-foreground block mb-2">Curriculum / board</label>
              <select id="curriculum" value={curriculum} onChange={(e) => handleCurriculumChange(e.target.value as Curriculum)} className="w-full bg-secondary border border-border rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-primary">
                <option value="A_LEVELS">A-Levels</option>
                <option value="CBSE">CBSE / ISC (India)</option>
                <option value="IB_DIPLOMA">IB Diploma</option>
                <option value="US_GPA_PCT">US (GPA)</option>
              </select>
            </div>

            <AcademicDetailInput detail={academicDetail} onChange={setAcademicDetail} />

            <div className="p-3 bg-accent/60 border border-primary/25 rounded-2xl flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
              <div>
                <div className="text-[10px] text-primary/90 uppercase tracking-wider font-semibold">Grade summary</div>
                <div className="text-xs font-mono text-accent-foreground font-semibold">{badge}</div>
              </div>
            </div>

            <div className="pt-2 border-t border-border">
              <div className="flex items-center gap-2 mb-1">
                <History className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Earlier grades (9th–11th)</span>
                <span className="text-[10px] text-muted-foreground/60 font-normal normal-case">— optional, helps sharpen the AI's analysis</span>
              </div>
              {targetCountries.length > 0 && (
                <ul className="text-[11px] text-muted-foreground/80 mb-3 space-y-1">
                  {targetCountries.map((c) => GRADE_RELEVANCE[c] && (
                    <li key={c}><strong className="text-foreground/80">{c}:</strong> {GRADE_RELEVANCE[c]}</li>
                  ))}
                </ul>
              )}
              <p className="text-[11px] text-muted-foreground/70 mb-3">Grade 12 above is what actually powers your matches — everything below is extra context that the AI still reads, so fill in whichever years are worth including.</p>

              <div className="space-y-4">
                <div className="bg-secondary/40 border border-border rounded-2xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-foreground/80">11th grade{curriculum === 'A_LEVELS' && ' (AS-Level)'}</span>
                    {eleventh && (
                      <button type="button" onClick={() => setEleventh(null)} className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-0.5">
                        <X className="w-3 h-3" /> Remove
                      </button>
                    )}
                  </div>
                  {eleventh ? (
                    <div className="scale-[0.92] origin-top -mx-2 -mb-2">
                      <AcademicDetailInput detail={eleventh} onChange={setEleventh} variant={curriculum === 'A_LEVELS' ? 'as' : 'full'} />
                    </div>
                  ) : (
                    <div>
                      <p className="text-[10px] text-primary/80 font-medium mb-1.5">Optional — adding this helps strengthen your analysis.</p>
                      <button type="button" onClick={() => setEleventh(defaultAcademicDetail(curriculum))} className="text-[11px] text-primary font-medium flex items-center gap-1">
                        <Plus className="w-3 h-3" /> Add 11th grade detail ({CURRICULUM_LABELS[curriculum]})
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-secondary/40 border border-border rounded-2xl p-3">
                  <span className="text-[11px] font-semibold text-foreground/80 block mb-2">9th &amp; 10th grade</span>
                  <NinthTenthInput value={ninthTenth} onChange={setNinthTenth} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-card border border-border rounded-3xl p-6">
            <h2 className="text-xl font-extrabold tracking-tight text-primary mb-1 flex items-center gap-2"><Award className="w-5 h-5 text-chart-4" /> Standardized tests</h2>
            <p className="text-[11px] text-muted-foreground/70 mb-4">These apply regardless of curriculum or target country. All optional.</p>
            <div className="space-y-4">
              <div>
                <div className="text-[11px] text-muted-foreground mb-1.5">English proficiency test — if you've taken one</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-muted-foreground/70 block mb-1">Test</label>
                    <select
                      value={standardizedTests.englishTestType ?? ''}
                      onChange={(e) => {
                        const type = (e.target.value || undefined) as EnglishTestType | undefined
                        setStandardizedTests((t) => ({ ...t, englishTestType: type, englishTestScore: type ? t.englishTestScore : undefined }))
                      }}
                      className="w-full bg-secondary border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary"
                    >
                      <option value="">Select test</option>
                      {ENGLISH_TEST_TYPES.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground/70 block mb-1">Score</label>
                    <input
                      type="number"
                      disabled={!standardizedTests.englishTestType}
                      min={standardizedTests.englishTestType ? ENGLISH_TEST_RANGES[standardizedTests.englishTestType].min : undefined}
                      max={standardizedTests.englishTestType ? ENGLISH_TEST_RANGES[standardizedTests.englishTestType].max : undefined}
                      step={standardizedTests.englishTestType ? ENGLISH_TEST_RANGES[standardizedTests.englishTestType].step : undefined}
                      placeholder={standardizedTests.englishTestType ? `${ENGLISH_TEST_RANGES[standardizedTests.englishTestType].min}–${ENGLISH_TEST_RANGES[standardizedTests.englishTestType].max}` : 'Pick a test first'}
                      value={standardizedTests.englishTestScore ?? ''}
                      onChange={(e) => setStandardizedTests((t) => ({ ...t, englishTestScore: e.target.value ? Number(e.target.value) : undefined }))}
                      className="w-full bg-secondary border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
              {targetCountries.includes('US') && (
                <div>
                  <div className="text-[11px] text-muted-foreground mb-1.5">SAT / ACT (United States)</div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-muted-foreground/70 block mb-1">SAT Math</label>
                      <select value={standardizedTests.satMath ?? ''} onChange={(e) => setStandardizedTests((t) => ({ ...t, satMath: e.target.value ? Number(e.target.value) : undefined }))} className="w-full bg-secondary border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary">
                        <option value="">Select score</option>
                        {SAT_SECTION_SCORES.map((score) => (
                          <option key={score} value={score}>{score}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground/70 block mb-1">SAT Reading & Writing</label>
                      <select value={standardizedTests.satReadingWriting ?? ''} onChange={(e) => setStandardizedTests((t) => ({ ...t, satReadingWriting: e.target.value ? Number(e.target.value) : undefined }))} className="w-full bg-secondary border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary">
                        <option value="">Select score</option>
                        {SAT_SECTION_SCORES.map((score) => (
                          <option key={score} value={score}>{score}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground/70 block mb-1">ACT</label>
                      <input type="number" min={1} max={36} placeholder="1–36" value={standardizedTests.act ?? ''} onChange={(e) => setStandardizedTests((t) => ({ ...t, act: e.target.value ? Number(e.target.value) : undefined }))} className="w-full bg-secondary border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary" />
                    </div>
                  </div>
                  {satComposite(standardizedTests) !== null && (
                    <p className="text-[11px] text-muted-foreground mt-1.5">SAT composite: <span className="text-primary font-mono font-semibold">{satComposite(standardizedTests)}</span> / 1600</p>
                  )}
                </div>
              )}
              {targetCountries.includes('IN') && (
                <div>
                  <div className="text-[11px] text-muted-foreground mb-1.5">JEE / NEET (India) — if applying to engineering or medical programs</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-muted-foreground/70 block mb-1">JEE Main percentile</label>
                      <input type="number" min={0} max={100} step={0.01} placeholder="0–100" value={standardizedTests.jeePercentile ?? ''} onChange={(e) => setStandardizedTests((t) => ({ ...t, jeePercentile: e.target.value ? Number(e.target.value) : undefined }))} className="w-full bg-secondary border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary" />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground/70 block mb-1">NEET score</label>
                      <input type="number" min={0} max={720} placeholder="0–720" value={standardizedTests.neetScore ?? ''} onChange={(e) => setStandardizedTests((t) => ({ ...t, neetScore: e.target.value ? Number(e.target.value) : undefined }))} className="w-full bg-secondary border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary" />
                    </div>
                  </div>
                </div>
              )}
            </div>
        </section>

        {!onlyAustralia && (
          <section className="bg-card border border-border rounded-3xl p-6">
            <h2 className="text-xl font-extrabold tracking-tight text-primary mb-4 flex items-center gap-2"><Flame className="w-5 h-5 text-chart-2" /> Extracurricular flexes</h2>
            <div className="space-y-6">
              <ActivityGroupFields
                label="Honors & national-level achievements"
                types={HONORS_TYPES}
                examples={HONORS_EXAMPLES}
                entries={ec1}
                {...activityHandlers(setEc1)}
              />
              <ActivityGroupFields
                label="Leadership, service & work experience"
                types={SERVICE_TYPES}
                examples={SERVICE_EXAMPLES}
                entries={ec2}
                {...activityHandlers(setEc2)}
              />
              <ActivityGroupFields
                label="Creative pursuits, sports & personal projects"
                types={PROJECT_TYPES}
                examples={PROJECT_EXAMPLES}
                entries={ec3}
                {...activityHandlers(setEc3)}
              />
            </div>
          </section>
        )}

        {suggestedActivities !== null && activities.length > 0 && (
          <section className="bg-card border border-border rounded-3xl p-6">
            <h2 className="text-xl font-extrabold tracking-tight text-primary mb-1 flex items-center gap-2">
              <Flame className="w-5 h-5 text-chart-5" /> Suggested activities
            </h2>
            <p className="text-[11px] text-muted-foreground mb-3">From your Build Your Dream roadmap — mark one completed to fold it into your extracurriculars above.</p>
            <ul className="space-y-1.5">
              {activities.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2 text-xs bg-secondary border border-border rounded-xl px-3 py-2">
                  <span className={a.status === 'completed' ? 'text-muted-foreground line-through' : 'text-foreground/90'}>{a.text}</span>
                  {a.status === 'completed' ? (
                    <span className="shrink-0 text-[10px] font-semibold text-chart-2 uppercase flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Completed</span>
                  ) : (
                    <span className="shrink-0 flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase">Shortlisted</span>
                      <button
                        type="button"
                        disabled={activityPendingId === a.id}
                        onClick={() => handleMarkActivityDone(a.id)}
                        className="text-[10px] font-semibold text-primary uppercase hover:brightness-125 disabled:opacity-50"
                      >
                        Mark completed
                      </button>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="bg-card border border-border rounded-3xl p-6">
          <h2 className="text-xl font-extrabold tracking-tight text-primary mb-1 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-chart-2" /> AP courses taken
            <button
              type="button"
              onClick={() => setShowApInfo((v) => !v)}
              aria-expanded={showApInfo}
              aria-label="What is AP?"
              className="text-muted-foreground/60 hover:text-primary normal-case tracking-normal font-normal"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </h2>
          {showApInfo && (
            <p className="text-[11px] text-muted-foreground/80 bg-secondary/60 border border-border rounded-xl p-2.5 mb-3 text-pretty">
              AP (Advanced Placement) is a US College Board program of college-level courses taught in high school, each ending in a standardized exam scored 1-5. Students on any curriculum worldwide can take AP exams alongside their main diploma — many international applicants use them to show extra academic depth for competitive/US-facing applications.
            </p>
          )}
          <p className="text-[11px] text-muted-foreground mb-3">Optional — add any real AP courses you've taken, alongside your main curriculum.</p>

          {apCourses.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {apCourses.map((c) => (
                <span key={c} className="flex items-center gap-1.5 text-[11px] bg-secondary border border-border text-foreground/90 px-2.5 py-1 rounded-lg">
                  {c}
                  <button type="button" onClick={() => removeApCourse(c)} aria-label={`Remove ${c}`} className="text-muted-foreground hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div ref={apInputWrapperRef} className="relative">
            <input
              type="text"
              placeholder="Type to search AP courses…"
              value={apCourseInput}
              onChange={(e) => { setApCourseInput(e.target.value); setShowApSuggestions(true) }}
              onFocus={() => setShowApSuggestions(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && apSuggestions.length > 0) { e.preventDefault(); addApCourse(apSuggestions[0]) }
                if (e.key === 'Escape') setShowApSuggestions(false)
              }}
              autoComplete="off"
              className="w-full bg-secondary border border-border rounded-xl p-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-chart-2"
            />
            {showApSuggestions && apSuggestions.length > 0 && (
              <ul className="absolute z-20 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-lg max-h-56 overflow-y-auto py-1">
                {apSuggestions.map((s) => (
                  <li key={s}>
                    <button type="button" onClick={() => addApCourse(s)} className="w-full text-left px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors">
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <details className="group mt-3">
            <summary className="cursor-pointer list-none text-[11px] text-primary font-medium flex items-center gap-1 w-fit">
              Browse all AP courses <ChevronDown className="w-3 h-3 transition-transform group-open:rotate-180" />
            </summary>
            <div className="mt-2 space-y-3 max-h-64 overflow-y-auto pr-1">
              {AP_COURSE_CATEGORIES.map((cat) => (
                <div key={cat.category}>
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{cat.category}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.courses.map((course) => {
                      const added = apCourses.includes(course)
                      return (
                        <button
                          key={course}
                          type="button"
                          disabled={added}
                          onClick={() => addApCourse(course)}
                          className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors ${
                            added ? 'bg-primary/10 border-primary/30 text-primary cursor-default' : 'bg-secondary border-border text-foreground/90 hover:border-chart-2'
                          }`}
                        >
                          {course}
                          {added ? ' ✓' : ''}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </details>
        </section>

        <section className="bg-card border border-border rounded-3xl p-6">
          <h2 className="text-xl font-extrabold tracking-tight text-primary mb-4 flex items-center gap-2"><Compass className="w-5 h-5 text-chart-4" /> Climate, sector & ranking</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="climate" className="text-[11px] text-muted-foreground block mb-1">Preferred climate</label>
              <select id="climate" value={preferredClimate} onChange={(e) => setPreferredClimate(e.target.value)} className="w-full bg-secondary border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary">
                <option>No preference</option><option>Balanced</option><option>Cold</option><option>Warm</option>
              </select>
            </div>
            <div>
              <label htmlFor="sector" className="text-[11px] text-muted-foreground block mb-1">Industry hub</label>
              <select id="sector" value={preferredSector} onChange={(e) => setPreferredSector(e.target.value)} className="w-full bg-secondary border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary">
                <option>No preference</option>
                <option>Business</option>
                <option>Creative Hub</option>
                <option>Finance Capital</option>
                <option>Government & Policy Hub</option>
                <option>Healthcare & Biotech Hub</option>
                <option>Manufacturing & Engineering Hub</option>
                <option>Research</option>
                <option>Tech Hub</option>
              </select>
            </div>
            <div>
              <label htmlFor="field" className="text-[11px] text-muted-foreground block mb-1">Intended field of study</label>
              <select id="field" value={intendedField} onChange={(e) => setIntendedField(e.target.value)} className="w-full bg-secondary border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary">
                <option>No preference</option>
                {ACADEMIC_FIELDS.map((f) => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="rank" className="text-[11px] text-muted-foreground block mb-1">Preferred university ranking</label>
              <select id="rank" value={preferredRank} onChange={(e) => setPreferredRank(e.target.value)} className="w-full bg-secondary border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary">
                <option>No preference</option><option>Top 50</option><option>Top 100</option><option>Top 200</option>
              </select>
            </div>
          </div>
        </section>

        {pending || saved ? (
          <button disabled className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold text-sm py-4 rounded-2xl opacity-90 cursor-not-allowed">
            {pending ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving profile…</> : <><CheckCircle2 className="w-4 h-4" /> Saved!</>}
          </button>
        ) : (
          <LiquidButton onClick={handleSave} fullWidth>Save profile</LiquidButton>
        )}

        {error && <p ref={errorRef} tabIndex={-1} className="text-xs text-destructive text-center outline-none" role="alert">{error}</p>}
      </div>

      {initialProfiles.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-bold mb-1">Recent profiles</h2>
          <p className="text-[11px] text-muted-foreground/70 mb-4">Pick an older version to load it back into the form above and keep editing.</p>
          <div className="space-y-2">
            {initialProfiles.map((p) => {
              const isLoaded = p.id === loadedProfileId
              return (
                <div key={p.id} className={`bg-card border rounded-2xl p-4 flex items-center justify-between text-xs gap-3 ${isLoaded ? 'border-primary' : 'border-border'}`}>
                  <div>
                    <span className="font-medium">{p.targetCountries.join(', ')} · {p.curriculum} · grade score {p.gradeValue}</span>
                    <span className="text-muted-foreground block sm:inline sm:ml-2">{new Date(p.createdAt).toLocaleDateString('en-US')}</span>
                  </div>
                  {isLoaded ? (
                    <span className="text-primary font-semibold shrink-0">Loaded</span>
                  ) : (
                    <button onClick={() => loadProfile(p)} className="shrink-0 text-primary font-medium hover:brightness-125">Use this version</button>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}
    </main>
  )
}
