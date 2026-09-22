'use client'

import { useState, useTransition, useRef, useEffect, type Dispatch, type SetStateAction } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { GraduationCap, Globe, Trophy, Compass, Loader2, CheckCircle2, Award, ChevronDown, ArrowRight, Plus, X, BookOpen, Info, ShieldCheck, History, PenLine } from 'lucide-react'
import { saveProfile, type SaveProfileInput } from '@/app/actions/profile'
import { markSuggestedActivityDone, type SuggestedActivityRow } from '@/app/actions/dream'
import { APPLICATION_INFO } from '@/lib/application-info'
import { AP_COURSE_CATEGORIES, AP_COURSES } from '@/lib/ap-courses'
import { gradeBadge } from '@/lib/grade'
import { AcademicDetailInput } from '@/components/academic-detail-input'
import { EmeraldBadgeSmall } from '@/components/emerald-badge'
import { AdminUserManagement } from '@/components/admin/user-management'
import type { AdminUserRow } from '@/app/actions/admin'
import { defaultAcademicDetail, ACADEMIC_FIELDS, INDUSTRY_HUBS, FIELD_CONCENTRATIONS, IB_SUBJECT_GROUPS, ibTotal, type AcademicDetail, type IBCoreGrade } from '@/lib/academic-detail'
import { ALL_IB_SUBJECTS } from '@/lib/subject-lists'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { satComposite, ENGLISH_TEST_TYPES, ENGLISH_TEST_RANGES, type StandardizedTests, type EnglishTestType } from '@/lib/standardized-tests'
import {
  GRADE_RELEVANCE,
  defaultNinthTenthCurriculum,
  type PriorGrades,
  type NinthTenthGrades,
  type NinthTenthYear,
  type NinthTenthCurriculum,
} from '@/lib/prior-grades'
import { priorGradesRelevance, apCoursesRelevance, extracurricularsRelevance, indiaExamFieldNote, COUNTRY_NAMES, type RelevanceBreakdown } from '@/lib/section-relevance'
import { clamp } from '@/lib/utils'
import { HowWeAnalyze } from '@/components/how-we-analyze'
import { WorldMap } from '@/components/ui/map'
import { COUNTRY_COORDINATES } from '@/lib/country-coordinates'

type Curriculum = 'CBSE' | 'ICSE' | 'STATE_BOARD' | 'IB_DIPLOMA' | 'A_LEVELS' | 'INTL_A_LEVELS' | 'US_GPA_PCT'

const CURRICULUM_LABELS: Record<Curriculum, string> = {
  CBSE: 'CBSE (India)',
  ICSE: 'ICSE / ISC (India)',
  STATE_BOARD: 'State Board (India)',
  IB_DIPLOMA: 'IB Diploma',
  A_LEVELS: 'A-Levels (UK)',
  INTL_A_LEVELS: 'International A-Levels (Edexcel / Cambridge)',
  US_GPA_PCT: 'US (GPA)',
}


// Plain-text relevance breakdown for an optional section — which of the
// student's OWN selected countries make it worth filling in, which don't.
// Deliberately text, not a dot: a dot alone can't say WHICH countries, and
// that's the actual useful information here.
function RelevanceLine({ breakdown }: { breakdown: RelevanceBreakdown }) {
  return (
    <p className="text-xs text-muted-foreground/80 mb-2 leading-relaxed">
      {breakdown.relevantCountries.length > 0 && (
        <span className="text-primary font-semibold">Relevant for {breakdown.relevantCountries.map((c) => COUNTRY_NAMES[c] ?? c).join(', ')}.</span>
      )}
      {breakdown.relevantCountries.length > 0 && breakdown.notRelevantCountries.length > 0 && ' '}
      {breakdown.notRelevantCountries.length > 0 && (
        <span>Not much for {breakdown.notRelevantCountries.map((c) => COUNTRY_NAMES[c] ?? c).join(', ')}.</span>
      )}
    </p>
  )
}

type ProfileRow = {
  id: number
  targetCountries: string[]
  curriculum: string
  gradeValue: number
  preferredClimate: string
  preferredSector: string
  preferredRank: string
  intendedField: string
  intendedConcentration: string
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
  intendedConcentration: string
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
        {curriculum === 'CBSE_ICSE' && (
          <input type="number" min={0} max={100} placeholder="Overall %" value={y.percentage ?? ''} onChange={(e) => updateYear(year, { percentage: e.target.value ? clamp(Number(e.target.value), 0, 100) : undefined })} className="w-full bg-secondary border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary" />
        )}
        {curriculum === 'US_GPA' && (
          <input type="number" min={0} max={4} step={0.01} placeholder="GPA (0.0–4.0)" value={y.gpa ?? ''} onChange={(e) => updateYear(year, { gpa: e.target.value ? clamp(Number(e.target.value), 0, 4) : undefined })} className="w-full bg-secondary border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary" />
        )}
        {curriculum === 'IB_MYP' && (
          <input type="number" min={1} max={7} step={0.1} placeholder="Average (1–7)" value={y.ibAverage ?? ''} onChange={(e) => updateYear(year, { ibAverage: e.target.value ? clamp(Number(e.target.value), 1, 7) : undefined })} className="w-full bg-secondary border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary" />
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

  const IGCSE_COLS = ['aStar', 'a', 'b', 'c', 'd', 'e'] as const

  return (
    <div className="space-y-3">
      <div>
        <label className="text-[11px] text-muted-foreground block mb-1">Curriculum for 9th &amp; 10th grade</label>
        <select
          value={curriculum}
          onChange={(e) => onChange({ ...value, curriculum: e.target.value as NinthTenthCurriculum })}
          className="w-full bg-secondary border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary"
        >
          <option value="CBSE_ICSE">CBSE / ICSE / State Board / other percentage board</option>
          <option value="IB_MYP">IB (Middle Years Programme)</option>
          <option value="IGCSE">IGCSE</option>
          <option value="US_GPA">US (GPA)</option>
        </select>
      </div>
      {curriculum === 'IGCSE' ? (
        // Tally matrix — one compact table (rows: 9th/10th, columns: A*-E)
        // instead of two separate side-by-side grade-count grids that
        // happened to share the same six columns.
        <div className="space-y-2">
          <table className="w-full text-center border-separate border-spacing-1">
            <thead>
              <tr>
                <th className="text-[9px] text-muted-foreground/70 font-medium text-left w-14"></th>
                {IGCSE_COLS.map((k) => (
                  <th key={k} className="text-[9px] text-muted-foreground/70 font-medium">{k === 'aStar' ? 'A*' : k.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(['grade9', 'grade10'] as const).map((year) => (
                <tr key={year}>
                  <td className="text-[11px] text-muted-foreground font-medium text-left pr-1 whitespace-nowrap">{year === 'grade9' ? '9th' : '10th'}</td>
                  {IGCSE_COLS.map((k) => (
                    <td key={k}>
                      <input
                        type="number"
                        min={0}
                        value={value[year].igcse?.[k] ?? ''}
                        onChange={(e) => updateYear(year, { igcse: { ...value[year].igcse, [k]: e.target.value ? Number(e.target.value) : undefined } })}
                        className="w-full bg-secondary border border-border rounded-lg p-1.5 text-xs text-foreground text-center focus:outline-none focus:border-primary"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(['grade9', 'grade10'] as const).map((year) => (
              <input
                key={year}
                type="text"
                maxLength={150}
                placeholder={`${year === 'grade9' ? '9th' : '10th'} grade — school threshold / board result notes`}
                value={value[year].note ?? ''}
                onChange={(e) => updateYear(year, { note: e.target.value })}
                className="w-full bg-secondary border border-border rounded-lg p-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary"
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {yearBlock('grade9', '9th grade')}
          {yearBlock('grade10', '10th grade')}
        </div>
      )}
    </div>
  )
}

const IB_CORE_GRADES_LIST: IBCoreGrade[] = ['A', 'B', 'C', 'D', 'E']
function ibAlphabetical(subjects: readonly string[]): string[] {
  return [...subjects].sort((a, b) => a.localeCompare(b))
}

// Merges the 11th and 12th grade IB inputs into one 6-row table — one row
// per subject group (1-6, fixed under the IB Diploma), since a student
// doesn't switch subjects between the two years, just gets a different mark
// each year. Only meaningful for IB_DIPLOMA: every other curriculum lets a
// student add/drop subjects independently year to year, so there's no
// reliable row-for-row alignment to merge on — those keep the original
// stacked 12th-then-11th layout. Subject name and HL/SL level are edited
// once per row and kept in sync on both years' underlying AcademicDetail
// objects; only the mark differs per year. EE/TOK/CAS/Total stay solely on
// the grade-12 (diploma-level) object, same as before — those aren't
// meaningfully separate "11th grade" facts.
function IBRigorTable({
  grade12,
  eleventh,
  onGrade12Change,
  onEleventhChange,
  onAddEleventh,
  onRemoveEleventh,
}: {
  grade12: Extract<AcademicDetail, { curriculum: 'IB_DIPLOMA' }>
  eleventh: Extract<AcademicDetail, { curriculum: 'IB_DIPLOMA' }> | null
  onGrade12Change: (d: AcademicDetail) => void
  onEleventhChange: (d: AcademicDetail) => void
  onAddEleventh: () => void
  onRemoveEleventh: () => void
}) {
  const total = ibTotal(grade12)

  // Grade 11 no longer mirrors Grade 12 edits — IB students routinely swap
  // a subject or drop HL to SL between the two years, so each year's
  // subject/level has to be independently editable. New rows still START
  // matched via onAddEleventh/syncFromGrade12 below (the common case is
  // identical subjects), but editing Grade 12 afterward never silently
  // rewrites what's already on Grade 11, or vice versa.
  function updateMeta(i: number, patch: { subjectName?: string; level?: 'HL' | 'SL' }) {
    const subjects12 = [...grade12.subjects]
    subjects12[i] = { ...subjects12[i], ...patch }
    onGrade12Change({ ...grade12, subjects: subjects12 })
  }

  function updateEleventhMeta(i: number, patch: { subjectName?: string; level?: 'HL' | 'SL' }) {
    if (!eleventh) return
    const subjects11 = [...eleventh.subjects]
    subjects11[i] = { ...subjects11[i], ...patch }
    onEleventhChange({ ...eleventh, subjects: subjects11 })
  }

  // One-click bulk copy for the ~90% case where the subject roster didn't
  // change year to year — copies subject name + level from Grade 12. The
  // mark resets to the same neutral 4 every fresh row already starts at
  // (IBSubject.grade has no "unset" state), so the student still has to
  // deliberately enter their real transcript score rather than it
  // silently inheriting Grade 12's predicted mark. Never touches Grade 12.
  function syncFromGrade12() {
    if (!eleventh) return
    const subjects11 = grade12.subjects.map((s) => ({ group: s.group, subjectName: s.subjectName, level: s.level, grade: 4 }))
    onEleventhChange({ ...eleventh, subjects: subjects11 })
  }

  // Which rows have their Grade 11 subject/level editor expanded — closed
  // by default on every row (the 90% case never needs it), so the table
  // stays compact until a student actually has a row that changed.
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
  function toggleExpanded(i: number) {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-xs border-separate border-spacing-y-1.5 px-1">
          <thead>
            <tr className="text-[11px] text-foreground/90 uppercase tracking-wider border-b-2 border-border">
              <th className="text-left font-bold pl-2 pb-2">Subject</th>
              <th className="font-bold w-12 pb-2">Level</th>
              <th className="font-bold w-16 pb-2">Gr 11</th>
              <th className="font-bold w-20 pb-2">Gr 12 Pred.</th>
            </tr>
          </thead>
          <tbody>
            {grade12.subjects.map((s, i) => {
              const s11 = eleventh?.subjects[i]
              // A row only counts as "changed" once it actually diverges
              // from Grade 12 — right after a sync (or for a freshly added
              // 11th grade block, which starts identical) there's nothing
              // to flag.
              const changed = eleventh && s11 && (s11.subjectName !== s.subjectName || s11.level !== s.level)
              return (
              <tr key={s.group} className="bg-secondary/60 align-top">
                <td className="rounded-l-lg p-1.5 pl-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-muted-foreground shrink-0">{s.group}</span>
                    <select
                      className="w-full min-w-0 bg-transparent text-xs text-foreground focus:outline-none"
                      value={s.subjectName}
                      onChange={(e) => updateMeta(i, { subjectName: e.target.value })}
                    >
                      <option value="">{IB_SUBJECT_GROUPS[s.group - 1].name}</option>
                      {ibAlphabetical(ALL_IB_SUBJECTS).map((subj) => <option key={subj} value={subj}>{subj}</option>)}
                    </select>
                  </div>
                </td>
                <td className="p-1.5 text-center">
                  <button
                    type="button"
                    onClick={() => updateMeta(i, { level: s.level === 'HL' ? 'SL' : 'HL' })}
                    className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/30 rounded-md px-2 py-1 w-full"
                  >
                    {s.level}
                  </button>
                </td>
                <td className="p-1.5 text-center">
                  {eleventh && s11 ? (
                    <div className="space-y-1">
                      {expandedRows.has(i) && (
                        <div className="space-y-1 pb-1 border-b border-border/60 mb-1">
                          <select
                            className="w-full bg-secondary border border-border rounded-md p-1 text-[10px] text-foreground focus:outline-none focus:border-primary"
                            value={s11.subjectName}
                            onChange={(e) => updateEleventhMeta(i, { subjectName: e.target.value })}
                          >
                            <option value="">{IB_SUBJECT_GROUPS[s11.group - 1].name}</option>
                            {ibAlphabetical(ALL_IB_SUBJECTS).map((subj) => <option key={subj} value={subj}>{subj}</option>)}
                          </select>
                          <button
                            type="button"
                            onClick={() => updateEleventhMeta(i, { level: s11.level === 'HL' ? 'SL' : 'HL' })}
                            className="text-[9px] font-bold text-primary bg-primary/10 border border-primary/30 rounded-md px-1.5 py-0.5 w-full"
                          >
                            {s11.level}
                          </button>
                        </div>
                      )}
                      <select
                        className="w-full bg-secondary border border-border rounded-lg p-1.5 text-xs text-foreground text-center focus:outline-none focus:border-primary"
                        value={s11.grade}
                        onChange={(e) => {
                          const subjects11 = [...eleventh.subjects]
                          subjects11[i] = { ...subjects11[i], grade: Number(e.target.value) }
                          onEleventhChange({ ...eleventh, subjects: subjects11 })
                        }}
                      >
                        {[1, 2, 3, 4, 5, 6, 7].map((g) => <option key={g} value={g}>{g}</option>)}
                      </select>
                      {/* One toggle, three states: quiet invite by default,
                          amber flag once a row has actually diverged, and
                          "Done" while the mini-editor above is open —
                          never two buttons competing for the same slot. */}
                      <button
                        type="button"
                        onClick={() => toggleExpanded(i)}
                        className={`text-[9px] font-mono w-full truncate ${
                          expandedRows.has(i) ? 'text-muted-foreground hover:text-foreground' : changed ? 'text-amber-400' : 'text-muted-foreground/50 hover:text-foreground'
                        }`}
                      >
                        {expandedRows.has(i) ? 'Done' : changed ? 'Changed ✎' : 'Different subject?'}
                      </button>
                    </div>
                  ) : (
                    <span className="text-muted-foreground/40">—</span>
                  )}
                </td>
                <td className="rounded-r-lg p-1.5 text-center">
                  <select
                    className="w-full bg-secondary border border-border rounded-lg p-1.5 text-xs text-foreground text-center focus:outline-none focus:border-primary"
                    value={s.grade}
                    onChange={(e) => {
                      const subjects12 = [...grade12.subjects]
                      subjects12[i] = { ...subjects12[i], grade: Number(e.target.value) }
                      onGrade12Change({ ...grade12, subjects: subjects12 })
                    }}
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </td>
              </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {eleventh ? (
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <button type="button" onClick={onRemoveEleventh} className="text-[11px] text-muted-foreground hover:text-destructive flex items-center gap-1">
            <X className="w-3 h-3" /> Remove 11th grade marks
          </button>
          {/* Bulk re-sync for whenever Grade 12's subjects change after the
              fact (a late add/drop) — same copy as the "Add 11th grade
              marks" cold-start path, just re-runnable on demand instead of
              only available once. */}
          <button
            type="button"
            onClick={syncFromGrade12}
            className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 border border-emerald-500/20 bg-emerald-950/40 px-2.5 py-1 rounded-md transition-colors"
          >
            ⚡ Match Grade 12 Subjects
          </button>
        </div>
      ) : (
        <div>
          <p className="text-[10px] text-primary/80 font-medium mb-1">Optional — adding this helps strengthen your analysis.</p>
          <button type="button" onClick={onAddEleventh} className="text-[11px] text-primary font-medium flex items-center gap-1">
            <Plus className="w-3 h-3" /> Add 11th grade marks
          </button>
        </div>
      )}

      {/* Integrated core bar — EE/TOK/CAS/Total docked directly under the
          table instead of living in their own separate section. */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
        <div>
          <label className="text-[11px] text-muted-foreground block mb-1">Extended Essay</label>
          <select className="w-full bg-secondary border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary" value={grade12.eeGrade} onChange={(e) => onGrade12Change({ ...grade12, eeGrade: e.target.value as IBCoreGrade })}>
            {IB_CORE_GRADES_LIST.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[11px] text-muted-foreground block mb-1">Theory of Knowledge</label>
          <select className="w-full bg-secondary border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary" value={grade12.tokGrade} onChange={(e) => onGrade12Change({ ...grade12, tokGrade: e.target.value as IBCoreGrade })}>
            {IB_CORE_GRADES_LIST.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-xs text-foreground">
          <input type="checkbox" checked={grade12.casComplete} onChange={(e) => onGrade12Change({ ...grade12, casComplete: e.target.checked })} className="accent-primary" />
          CAS complete
        </label>
        <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg ${total === 'FAIL' ? 'text-destructive bg-destructive/10' : 'text-emerald-400 bg-emerald-950'}`}>
          {total === 'FAIL' ? 'EE/TOK: diploma-failing' : `Total: ${total} / 45`}
        </span>
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

// Modular per-activity entry — title/role/scope/impact, one card per real
// achievement, instead of a single free-text box a student would otherwise
// cram six unrelated achievements into as one run-on paragraph. Scope is a
// closed dropdown (not free text) specifically so the AI can reliably read
// competitive tier back out, rather than guessing it from prose.
type ActivityScope = '' | 'Personal' | 'School' | 'Regional/State' | 'National' | 'International'
type ActivityEntry = { title: string; role: string; scope: ActivityScope; impact: string }
const emptyEntry = (): ActivityEntry => ({ title: '', role: '', scope: '', impact: '' })

// Personal sits first — a self-directed pursuit with no institutional scope
// at all (a hobby, a solo project) is a distinct, smaller-than-School tier,
// not a variant of School itself.
const ACTIVITY_SCOPES: ActivityScope[] = ['Personal', 'School', 'Regional/State', 'National', 'International']

// Existing saved profiles have a flat string[] from the older free-text
// form (or an even older type+description form before that). Slots 0/1/2
// map to the three groups in order, same as before; anything beyond index
// 2 used to be silently dropped on every resave — now it survives as extra
// entries on the third group instead of vanishing. There's no reliable way
// to split old unstructured prose back into title/role/scope, so it's
// carried forward into the Impact field as-is — the student re-titles it
// once, rather than losing the content.
function entriesFromLegacy(extracurriculars: string[] | undefined, groupIndex: 0 | 1 | 2): ActivityEntry[] {
  const list = extracurriculars ?? []
  const raw = list[groupIndex]
  const first: ActivityEntry = raw ? { ...emptyEntry(), impact: raw } : emptyEntry()
  if (groupIndex !== 2) return [first]
  const extras = list.slice(3).filter(Boolean).map((impact) => ({ ...emptyEntry(), impact }))
  return [first, ...extras]
}

function formatEntry(entry: ActivityEntry): string {
  const title = entry.title.trim()
  const role = entry.role.trim()
  const impact = entry.impact.trim()
  if (!title && !impact) return ''
  const head = [title, role].filter(Boolean).join(' — ')
  const scopeTag = entry.scope ? ` [${entry.scope}]` : ''
  const parts = [head, impact].filter(Boolean)
  return `${parts.join(': ')}${scopeTag}`.trim()
}

// Emerald for National/International, amber for Regional/State, zinc for
// School — a quick-scan competitive tier at a glance across a long list,
// instead of every entry reading the same visual weight regardless of level.
function scopeBadgeClass(scope: ActivityScope): string {
  if (scope === 'National' || scope === 'International') return 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
  if (scope === 'Regional/State') return 'bg-amber-950 text-amber-400 border border-amber-500/30'
  if (scope === 'School') return 'bg-zinc-800 text-zinc-400 border border-white/5'
  // Personal gets its own dim tone, distinct from School's neutral gray —
  // it's a real, separate tier (no institution behind it at all), not just
  // an unstyled fallback.
  if (scope === 'Personal') return 'bg-zinc-900 text-zinc-500 border border-white/5'
  return 'bg-zinc-800 text-zinc-500 border border-white/5'
}

function ActivityGroupFields({
  label,
  examples,
  entries,
  onChange,
  onAdd,
  onRemove,
}: {
  label: string
  examples: string[]
  entries: ActivityEntry[]
  onChange: (idx: number, patch: Partial<ActivityEntry>) => void
  onAdd: () => void
  onRemove: (idx: number) => void
}) {
  // "Playlist" pattern: a filled-in entry collapses to a slim scannable row
  // (title, role, one-line impact, scope badge) instead of staying open as
  // a full edit form forever — a list of 5-6 activities was previously a
  // wall of open textboxes. Blank entries (new, or never filled in) stay
  // expanded by default since there's nothing to collapse to yet.
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const isFilled = (e: ActivityEntry) => e.title.trim().length > 0 || e.impact.trim().length > 0

  return (
    <div>
      <label className="text-sm font-semibold text-foreground/90 block mb-2">{label}</label>
      <div className="space-y-2">
        {entries.map((entry, idx) => {
          const collapsed = editingIndex !== idx && isFilled(entry)
          if (collapsed) {
            return (
              <div key={idx} className="bg-secondary/60 border border-border rounded-xl px-3 py-2.5 flex items-center gap-3">
                <button type="button" onClick={() => setEditingIndex(idx)} className="min-w-0 flex-1 text-left">
                  <div className="flex items-baseline gap-2 min-w-0">
                    <span className="font-semibold text-white text-xs truncate">{entry.title || 'Untitled activity'}</span>
                    {entry.role && <span className="text-zinc-400 text-[11px] truncate shrink-0">{entry.role}</span>}
                  </div>
                  {entry.impact && <p className="text-zinc-300 text-xs mt-0.5 truncate">{entry.impact}</p>}
                </button>
                {entry.scope && (
                  <span className={`shrink-0 text-[10px] font-mono px-2 py-0.5 rounded ${scopeBadgeClass(entry.scope)}`}>
                    {entry.scope === 'Regional/State' ? 'STATE / TIER 2' : entry.scope === 'School' ? 'SCHOOL' : entry.scope === 'Personal' ? 'PERSONAL' : `${entry.scope.toUpperCase()} / TIER 1`}
                  </span>
                )}
                <button type="button" onClick={() => setEditingIndex(idx)} aria-label="Edit this activity" className="shrink-0 text-muted-foreground hover:text-primary p-1">
                  <PenLine className="w-3.5 h-3.5" />
                </button>
                {entries.length > 1 && (
                  <button type="button" onClick={() => onRemove(idx)} aria-label="Remove this activity" className="shrink-0 text-muted-foreground hover:text-destructive p-1">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )
          }
          return (
            <div key={idx} className="bg-secondary/60 border border-border rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Title / Organization (e.g. State Roller Hockey Team)"
                  value={entry.title}
                  onChange={(e) => onChange(idx, { title: e.target.value })}
                  className="w-full bg-secondary border border-border rounded-lg p-2 text-xs font-semibold text-foreground placeholder:text-muted-foreground/60 placeholder:font-normal focus:outline-none focus:border-primary/50"
                />
                {isFilled(entry) && (
                  <button type="button" onClick={() => setEditingIndex(null)} className="shrink-0 text-[11px] font-semibold text-primary hover:brightness-125 px-1.5">
                    Done
                  </button>
                )}
                {entries.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemove(idx)}
                    aria-label="Remove this activity"
                    className="shrink-0 text-muted-foreground hover:text-destructive p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Role / Position (e.g. Captain)"
                  value={entry.role}
                  onChange={(e) => onChange(idx, { role: e.target.value })}
                  className="w-full bg-secondary border border-border rounded-lg p-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50"
                />
                {/* Closed set, not free text — a competitive tier the AI can
                    read back out directly, matching how Common App itself
                    buckets activity level. Neutral zinc styling, matching the
                    Title/Role/Impact inputs beside it — a lone amber border
                    here previously read as an accidental validation warning. */}
                <select
                  value={entry.scope}
                  onChange={(e) => onChange(idx, { scope: e.target.value as ActivityScope })}
                  className="w-full bg-secondary border border-border text-foreground rounded-lg px-2 py-2 text-xs font-medium focus:outline-none focus:border-primary/50"
                >
                  <option value="">Scope…</option>
                  {ACTIVITY_SCOPES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                maxLength={140}
                placeholder="Impact & numbers — e.g. Ranked 1st in state tournament; trained 15 varsity underclassmen"
                value={entry.impact}
                onChange={(e) => onChange(idx, { impact: e.target.value.slice(0, 140) })}
                className="w-full bg-secondary border border-border rounded-lg p-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50"
              />
              <div className={`text-[10px] text-right ${entry.impact.length >= 140 ? 'text-rose-400 font-semibold' : 'text-muted-foreground/70'}`}>{entry.impact.length}/140 characters</div>
            </div>
          )
        })}
      </div>
      <div className="flex items-start justify-between gap-2 mt-1.5">
        <ExamplesHint examples={examples} />
        <button
          type="button"
          onClick={() => {
            setEditingIndex(entries.length)
            onAdd()
          }}
          className="shrink-0 text-[11px] font-semibold text-primary hover:brightness-125 flex items-center gap-1"
        >
          <Plus className="w-3 h-3" /> Add entry
        </button>
      </div>
    </div>
  )
}

// isAdmin/onOpenAdmin make the ring itself the entry point for admin tools
// (a small "Admin" menu item, not a permanently-visible user-management
// panel taking up page space for the one account that can see it) — see
// showAdminPanel in ProfileForm.
function ProfileCompletionRing({ percent, isAdmin, onOpenAdmin }: { percent: number; isAdmin?: boolean; onOpenAdmin?: () => void }) {
  const size = 56
  const stroke = 5
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - percent / 100)
  const [menuOpen, setMenuOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const onClickOutside = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [menuOpen])

  const ring = (
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
  )

  if (!isAdmin) {
    return (
      <div className="shrink-0 flex flex-col items-center gap-1" title={`Profile ${percent}% complete`}>
        {ring}
        <span className="text-[10px] text-muted-foreground font-medium">Profile complete</span>
      </div>
    )
  }

  return (
    <div ref={rootRef} className="relative shrink-0 flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        title={`Profile ${percent}% complete — click for admin tools`}
        className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {ring}
      </button>
      <span className="text-[10px] text-muted-foreground font-medium">Profile complete</span>
      {menuOpen && (
        <div className="absolute top-full right-0 mt-1 z-30 w-36 bg-card border border-border rounded-xl shadow-xl overflow-hidden">
          <button
            type="button"
            onClick={() => {
              onOpenAdmin?.()
              setMenuOpen(false)
            }}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-left hover:bg-secondary transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
            Admin
          </button>
        </div>
      )}
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
  adminUsers,
}: {
  initialProfiles: ProfileRow[]
  latestProfile: LatestProfile
  suggestedActivities: SuggestedActivityRow[] | null
  adminUsers?: AdminUserRow[]
}) {
  const router = useRouter()
  // Segmented tabs replace one long scroll — academics (incl. AP courses and
  // standardized tests), activities/honors, and institutional preferences
  // each get their own view instead of being stacked one after another.
  const [activeTab, setActiveTab] = useState<'goals' | 'activities' | 'academics'>('goals')
  // Drives the sticky bar's single CTA: "Continue to X" on every tab but
  // the last, where it becomes the real submit action instead. Order here
  // is the actual tab order (Goals -> Academics -> Extracurriculars) — the
  // heavier academic tables stay mid-flow, the fastest, most personal
  // section (past achievements) closes it out.
  const TAB_ORDER = ['goals', 'academics', 'activities'] as const
  const TAB_LABELS: Record<(typeof TAB_ORDER)[number], string> = {
    goals: 'Target Intent',
    academics: 'Academics & Testing',
    activities: 'Extracurriculars',
  }
  const nextTab = TAB_ORDER[TAB_ORDER.indexOf(activeTab) + 1] ?? null

  const [activities, setActivities] = useState(suggestedActivities ?? [])
  const [activityPendingId, setActivityPendingId] = useState<number | null>(null)
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [showConcentrationInfo, setShowConcentrationInfo] = useState(false)

  async function handleMarkActivityDone(id: number) {
    setActivityPendingId(id)
    const res = await markSuggestedActivityDone(id)
    setActivityPendingId(null)
    if (res.success) setActivities((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'completed' } : a)))
  }

  const [pending, startTransition] = useTransition()
  // `saved` is a short-lived flash ("Saved!" for 3s, see handleSave) — good
  // for the button's own feedback, wrong for gating Run Match, which needs
  // to know "does a saved profile exist at all," a fact that shouldn't
  // disappear 3 seconds after saving. hasSavedProfile is that persistent
  // fact: true if the user already had a saved profile on page load
  // (initialProfiles non-empty) or once a save succeeds this session.
  const [saved, setSaved] = useState(false)
  const [hasSavedProfile, setHasSavedProfile] = useState(initialProfiles.length > 0)
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
  // Saved alongside intendedField, but programRankings has no
  // per-concentration column — see FIELD_CONCENTRATIONS' comment in
  // lib/academic-detail.ts. So this never changes which schools/ranks are
  // shown; it's passed to the AI as extra qualitative context (match
  // rationale, profile-strength copy) only.
  const [intendedConcentration, setIntendedConcentration] = useState(latestProfile?.intendedConcentration ?? 'No preference')
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
    setIntendedConcentration(p.intendedConcentration)
    setEc1(entriesFromLegacy(p.extracurriculars, 0))
    setEc2(entriesFromLegacy(p.extracurriculars, 1))
    setEc3(entriesFromLegacy(p.extracurriculars, 2))
    setApCourses(p.apCourses ?? [])
    setStandardizedTests(p.standardizedTests ?? {})
    setNinthTenth(p.priorGrades?.ninthTenth ?? { curriculum: defaultNinthTenthCurriculum(p.curriculum as Curriculum), grade9: {}, grade10: {} })
    setEleventh(p.priorGrades?.eleventh ?? null)
    setLoadedProfileId(p.id)
  }

  // `runMatchAfter` collapses the old two-button "Save profile" then
  // separately "Run Match" flow into the sticky bar's single CTA — Run
  // Match always re-reads the just-saved profile from the DB anyway
  // (getLatestProfile), so there's no reason saving and running were ever
  // two separate clicks.
  async function handleSave(runMatchAfter = false) {
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
      intendedConcentration,
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
        setHasSavedProfile(true)
        setTimeout(() => setSaved(false), 3000)
        if (runMatchAfter) router.push('/matches')
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

  // A simple checklist across the sections below, not a weighted score —
  // good enough to show real progress without pretending to judge quality.
  const hasPriorGradeYear = (y: { percentage?: number; gpa?: number; ibAverage?: number; igcse?: unknown }) =>
    y.percentage != null || y.gpa != null || y.ibAverage != null || y.igcse != null
  const completionChecklist = [
    targetCountries.length > 0,
    Boolean(standardizedTests.satMath || standardizedTests.satReadingWriting || standardizedTests.act || standardizedTests.jeePercentile || standardizedTests.jeeAdvancedRank || standardizedTests.neetScore || standardizedTests.clatRank || standardizedTests.cuetScore || standardizedTests.englishTestScore),
    [...ec1, ...ec2, ...ec3].some((e) => e.title.trim().length > 0 || e.impact.trim().length > 0),
    apCourses.length > 0,
    hasPriorGradeYear(ninthTenth.grade9) || hasPriorGradeYear(ninthTenth.grade10) || eleventh !== null,
    intendedField !== 'No preference',
  ]
  const completionPercent = Math.round((completionChecklist.filter(Boolean).length / completionChecklist.length) * 100)

  return (
    <>
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Admissions Profile</h1>
          <p className="text-sm text-muted-foreground">Calibrate your academic metrics, extracurricular spikes, and regional criteria.</p>
        </div>
        <div className="flex items-center gap-3">
          {suggestedActivities !== null && <EmeraldBadgeSmall />}
          <ProfileCompletionRing
            percent={completionPercent}
            isAdmin={!!adminUsers}
            onOpenAdmin={() => setShowAdminPanel((v) => !v)}
          />
        </div>
      </div>

      {adminUsers && showAdminPanel && <AdminUserManagement users={adminUsers} />}

      {/* Segmented tabs replace the old bottomless scroll — each tab groups
          related sections (academics/testing, activities/honors,
          institutional preferences) instead of stacking all seven one
          after another. The old "go fill this in, then head over to Build
          Your Dream" banner is gone entirely — it was pointing students
          away from this page before they'd even used it. */}
      <div className="mb-8 border-b border-border flex gap-6 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {([
          ['goals', '01. Target Intent'],
          ['academics', '02. Academics & Testing'],
          ['activities', '03. Extracurriculars'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`shrink-0 pb-3 pt-1 text-xs font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap ${
              activeTab === key ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Persistent, not just a post-save toast — edits below aren't kept
          until the profile is saved, and Run Match only ever reads the
          saved version, never the live draft. */}
      {!hasSavedProfile && (
        <p className="text-xs text-muted-foreground bg-secondary/40 border border-border rounded-xl px-4 py-2.5 mb-8">
          Remember to save your profile below — your matches and analysis are generated from your saved profile, not what's currently on screen.
        </p>
      )}

      <div className="space-y-12">
        {activeTab === 'academics' && <HowWeAnalyze />}

        {activeTab === 'goals' && (
        <>
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

        {/* Merged into this same tab — country + intended field/ranking
            together let a student define their whole target picture in one
            place, before ever touching an academic-detail dropdown. */}
        <section className="bg-card border border-border rounded-3xl p-6">
          <h2 className="text-xl font-extrabold tracking-tight text-primary mb-4 flex items-center gap-2"><Compass className="w-5 h-5 text-emerald-400" /> Academic &amp; career focus</h2>
          {/* 2x2: field/concentration (what to study) on the left,
              ranking/hub/climate (where to study) on the right — grouped by
              what they're actually deciding, not just alphabetically. */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-4">
            <div>
              <label htmlFor="field" className="text-[11px] text-muted-foreground block mb-1">Intended field of study</label>
              <SearchableSelect
                id="field"
                value={intendedField}
                onChange={(value) => {
                  setIntendedField(value)
                  setIntendedConcentration('No preference')
                }}
                options={['No preference', ...ACADEMIC_FIELDS]}
                placeholder="No preference"
              />
              {/* An optional, saved refinement — a student picking
                  "Engineering" shouldn't worry their actual interest
                  (Aerospace, say) isn't covered by that broad bucket. Saved
                  and passed to the AI as context, but never changes which
                  schools/ranks are shown (see intendedConcentration's
                  comment in lib/db/schema.ts). Nested visually under the
                  field select (left border + indent) since it's a
                  refinement of that choice, not a separate field. Renders
                  nothing for a field with no list above (left blank rather
                  than guessed at). */}
              {FIELD_CONCENTRATIONS[intendedField as keyof typeof FIELD_CONCENTRATIONS] && (
                <div className="mt-2.5 pl-3 border-l-2 border-border">
                  <label htmlFor="concentration" className="text-[11px] text-muted-foreground flex items-center gap-1 mb-1">
                    Concentration within {intendedField} (optional)
                    <button
                      type="button"
                      onClick={() => setShowConcentrationInfo((v) => !v)}
                      aria-expanded={showConcentrationInfo}
                      aria-label="What is a concentration?"
                      className="text-muted-foreground/60 hover:text-primary shrink-0"
                    >
                      <Info className="w-3 h-3" />
                    </button>
                  </label>
                  {showConcentrationInfo && (
                    <p className="text-[10.5px] text-muted-foreground/80 bg-secondary/60 border border-border rounded-lg p-2 mb-2 text-pretty leading-relaxed">
                      A specific track within your field (e.g. Aerospace within Engineering). Just gives the AI more context —
                      won't change which schools or ranks you see. Fine to leave as "No preference" if you're still deciding.
                    </p>
                  )}
                  <SearchableSelect
                    id="concentration"
                    value={intendedConcentration}
                    onChange={setIntendedConcentration}
                    options={['No preference', ...FIELD_CONCENTRATIONS[intendedField as keyof typeof FIELD_CONCENTRATIONS]!]}
                    placeholder="No preference"
                  />
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="rank" className="text-[11px] text-muted-foreground block mb-1">Preferred university ranking</label>
                <select id="rank" value={preferredRank} onChange={(e) => setPreferredRank(e.target.value)} className="w-full bg-secondary border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary">
                  <option>No preference</option><option>Top 50</option><option>Top 100</option><option>Top 200</option>
                </select>
              </div>
              <div>
                <label htmlFor="sector" className="text-[11px] text-muted-foreground block mb-1">Industry hub</label>
                <SearchableSelect id="sector" value={preferredSector} onChange={setPreferredSector} options={['No preference', ...INDUSTRY_HUBS]} placeholder="No preference" />
              </div>
              <div>
                <label htmlFor="climate" className="text-[11px] text-muted-foreground block mb-1">Preferred climate</label>
                <select id="climate" value={preferredClimate} onChange={(e) => setPreferredClimate(e.target.value)} className="w-full bg-secondary border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary">
                  <option>No preference</option><option>Balanced</option><option>Cold</option><option>Warm</option>
                </select>
              </div>
            </div>
          </div>
        </section>
        </>
        )}

        {/* Academics stays full width — same as every other section
            (Target countries above included), not squeezed into a grid
            column. The old inline 9th-11th grade input boxes are gone
            (per feedback: that detail is now considered covered by the
            country-relevance note in the side box, and cutting it
            shortens what was a genuinely long, tedious form). `relative`
            here is just the positioning context for that side box. */}
        {activeTab === 'academics' && (
        <>
        <div className="relative">
          <section className="bg-card border border-border rounded-3xl p-6">
            <h2 className="text-xl font-extrabold tracking-tight text-primary mb-4 flex items-center gap-2"><GraduationCap className="w-5 h-5 text-primary" /> Academics</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="curriculum" className="text-xs text-muted-foreground block mb-2">Curriculum / board</label>
                <select id="curriculum" value={curriculum} onChange={(e) => handleCurriculumChange(e.target.value as Curriculum)} className="w-full bg-secondary border border-border rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-primary">
                  <option value="CBSE">{CURRICULUM_LABELS.CBSE}</option>
                  <option value="ICSE">{CURRICULUM_LABELS.ICSE}</option>
                  <option value="STATE_BOARD">{CURRICULUM_LABELS.STATE_BOARD}</option>
                  <option value="A_LEVELS">{CURRICULUM_LABELS.A_LEVELS}</option>
                  <option value="INTL_A_LEVELS">{CURRICULUM_LABELS.INTL_A_LEVELS}</option>
                  <option value="IB_DIPLOMA">{CURRICULUM_LABELS.IB_DIPLOMA}</option>
                  <option value="US_GPA_PCT">{CURRICULUM_LABELS.US_GPA_PCT}</option>
                </select>
              </div>

              {curriculum === 'IB_DIPLOMA' && academicDetail.curriculum === 'IB_DIPLOMA' ? (
                // Unified 2-year rigor table — see IBRigorTable's own
                // comment for why this merge only applies to IB Diploma.
                <div>
                  <span className="text-sm font-bold text-primary bg-accent/50 px-2 py-0.5 rounded-lg inline-block mb-2">IB Diploma — Grade 11 &amp; 12</span>
                  <IBRigorTable
                    grade12={academicDetail}
                    eleventh={eleventh && eleventh.curriculum === 'IB_DIPLOMA' ? eleventh : null}
                    onGrade12Change={setAcademicDetail}
                    onEleventhChange={setEleventh}
                    onAddEleventh={() => setEleventh({
                      ...(defaultAcademicDetail(curriculum) as Extract<AcademicDetail, { curriculum: 'IB_DIPLOMA' }>),
                      subjects: academicDetail.subjects.map((s) => ({ ...s, grade: 4 })),
                    })}
                    onRemoveEleventh={() => setEleventh(null)}
                  />
                </div>
              ) : (
                <>
                  {/* Explicit "Grade 12" label — this whole block is the current/
                      final-year record that actually drives matches, but nothing
                      said so before; a student could easily mistake it for just
                      "your grades" with no sense of which year it covers. */}
                  <div>
                    <span className="text-sm font-bold text-primary bg-accent/50 px-2 py-0.5 rounded-lg inline-block mb-2">Grade 12</span>
                    <AcademicDetailInput detail={academicDetail} onChange={setAcademicDetail} />
                  </div>

                  <div className="p-3 bg-accent/60 border border-primary/25 rounded-2xl flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                    <div>
                      <div className="text-[10px] text-primary/90 uppercase tracking-wider font-semibold">Grade summary</div>
                      <div className="text-xs font-mono text-accent-foreground font-semibold">{badge}</div>
                    </div>
                  </div>

                  <div className="bg-secondary/40 border border-border rounded-2xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-primary">11th grade{(curriculum === 'A_LEVELS' || curriculum === 'INTL_A_LEVELS') && ' (AS-Level)'}</span>
                      {eleventh && (
                        <button type="button" onClick={() => setEleventh(null)} className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-0.5">
                          <X className="w-3 h-3" /> Remove
                        </button>
                      )}
                    </div>
                    {eleventh ? (
                      <div className="scale-[0.92] origin-top -mx-2 -mb-2">
                        <AcademicDetailInput detail={eleventh} onChange={setEleventh} variant={curriculum === 'A_LEVELS' || curriculum === 'INTL_A_LEVELS' ? 'as' : 'full'} />
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
                </>
              )}

              {/* 9th/10th stays outside the branch above — same for every
                  curriculum, IB included. */}
              <div className="space-y-4 pt-2 border-t border-border">
                <div className="bg-secondary/40 border border-border rounded-2xl p-3">
                  <span className="text-sm font-bold text-primary block mb-2">9th &amp; 10th grade</span>
                  <NinthTenthInput value={ninthTenth} onChange={setNinthTenth} />
                </div>
              </div>
            </div>
          </section>

          {/* Pokes outside the card entirely on large screens (left-full =
              right at the card's right edge, outside its width) — stacks
              back below, full width, in normal flow on smaller screens
              where there's no room beside it. Not sticky — scrolls away
              normally with the page, per feedback. */}
          <aside className="mt-4 lg:mt-0 lg:absolute lg:top-0 lg:left-full lg:ml-4 lg:w-64 bg-card border border-border rounded-3xl p-4">
            <span className="text-xs font-bold text-primary bg-accent/50 px-2 py-0.5 rounded-lg inline-block mb-2">Country relevance</span>
            <p className="text-[11px] text-muted-foreground/70 mb-2">
              Whether your 9th–11th grades matter depends on where you're applying — some of your target countries weigh them, some don't look at them at all. Either way, it's optional: Grade 12 is what actually drives your matches.
            </p>
            {targetCountries.length > 0 ? (
              <>
                <RelevanceLine breakdown={priorGradesRelevance(targetCountries)} />
                <details className="group mt-2">
                  <summary className="cursor-pointer list-none text-xs text-primary font-medium flex items-center gap-1 w-fit">
                    How each of your countries views this <ChevronDown className="w-3 h-3 transition-transform group-open:rotate-180" />
                  </summary>
                  <ul className="text-xs text-muted-foreground/80 mt-2 space-y-1">
                    {targetCountries.map((c) => GRADE_RELEVANCE[c] && (
                      <li key={c}><strong className="text-foreground/80">{c}:</strong> {GRADE_RELEVANCE[c]}</li>
                    ))}
                  </ul>
                </details>
              </>
            ) : (
              <p className="text-[11px] text-muted-foreground/60">Pick your target countries above to see this.</p>
            )}
          </aside>
        </div>

        {/* Advanced coursework lives immediately below the main curriculum
            block now — it was previously stranded near the bottom of the
            page, between activities and climate preferences, disconnected
            from the rest of the academic-rigor picture. */}
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
            <p className="text-xs text-muted-foreground/80 bg-secondary/60 border border-border rounded-xl p-2.5 mb-3 text-pretty">
              AP (Advanced Placement) is a US College Board program of college-level courses taught in high school, each ending in a standardized exam scored 1-5. Students on any curriculum worldwide can take AP exams alongside their main diploma — many international applicants use them to show extra academic depth for competitive/US-facing applications.
            </p>
          )}
          {targetCountries.length > 0 && <RelevanceLine breakdown={apCoursesRelevance(targetCountries)} />}
          <p className="text-xs text-muted-foreground mb-3">Optional — add any real AP courses you've taken, alongside your main curriculum.</p>

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
            <h2 className="text-xl font-extrabold tracking-tight text-primary mb-1 flex items-center gap-2"><Award className="w-5 h-5 text-chart-4" /> Standardized tests</h2>
            <p className="text-xs text-muted-foreground/70 mb-4">These apply regardless of curriculum or target country. All optional.</p>
            <div className="space-y-5">
              <div>
                <div className="text-sm font-semibold text-foreground/90 mb-1.5">English proficiency test — if you've taken one</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground/70 block mb-1">Test</label>
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
                    <label className="text-xs text-muted-foreground/70 block mb-1">Score</label>
                    <input
                      type="number"
                      disabled={!standardizedTests.englishTestType}
                      min={standardizedTests.englishTestType ? ENGLISH_TEST_RANGES[standardizedTests.englishTestType].min : undefined}
                      max={standardizedTests.englishTestType ? ENGLISH_TEST_RANGES[standardizedTests.englishTestType].max : undefined}
                      step={standardizedTests.englishTestType ? ENGLISH_TEST_RANGES[standardizedTests.englishTestType].step : undefined}
                      placeholder={standardizedTests.englishTestType ? `${ENGLISH_TEST_RANGES[standardizedTests.englishTestType].min}–${ENGLISH_TEST_RANGES[standardizedTests.englishTestType].max}` : 'Pick a test first'}
                      value={standardizedTests.englishTestScore ?? ''}
                      onChange={(e) => setStandardizedTests((t) => {
                        if (!e.target.value || !t.englishTestType) return { ...t, englishTestScore: e.target.value ? Number(e.target.value) : undefined }
                        const range = ENGLISH_TEST_RANGES[t.englishTestType]
                        return { ...t, englishTestScore: clamp(Number(e.target.value), range.min, range.max) }
                      })}
                      className="w-full bg-secondary border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
              {targetCountries.includes('US') && (
                <div>
                  <div className="text-sm font-semibold text-foreground/90 mb-1.5">SAT / ACT (United States)</div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground/70 block mb-1">SAT Math</label>
                      <input
                        type="number"
                        step={10}
                        min={200}
                        max={800}
                        placeholder="200–800"
                        value={standardizedTests.satMath ?? ''}
                        onChange={(e) => setStandardizedTests((t) => ({ ...t, satMath: e.target.value ? clamp(Number(e.target.value), 200, 800) : undefined }))}
                        className="w-full bg-secondary border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground/70 block mb-1">SAT Reading & Writing</label>
                      <input
                        type="number"
                        step={10}
                        min={200}
                        max={800}
                        placeholder="200–800"
                        value={standardizedTests.satReadingWriting ?? ''}
                        onChange={(e) => setStandardizedTests((t) => ({ ...t, satReadingWriting: e.target.value ? clamp(Number(e.target.value), 200, 800) : undefined }))}
                        className="w-full bg-secondary border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground/70 block mb-1">ACT</label>
                      <input type="number" min={1} max={36} placeholder="1–36" value={standardizedTests.act ?? ''} onChange={(e) => setStandardizedTests((t) => ({ ...t, act: e.target.value ? clamp(Number(e.target.value), 1, 36) : undefined }))} className="w-full bg-secondary border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary" />
                    </div>
                  </div>
                  {satComposite(standardizedTests) !== null && (
                    <p className="text-xs text-muted-foreground mt-1.5">SAT Composite: <span className="text-emerald-400 font-mono font-bold">{satComposite(standardizedTests)}</span> / 1600</p>
                  )}
                </div>
              )}
              {targetCountries.includes('IN') && (
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-semibold text-foreground/90 mb-1.5">JEE (India) — engineering</div>
                    {indiaExamFieldNote('JEE', intendedField) && (
                      <p className="text-xs text-muted-foreground/70 mb-1.5">{indiaExamFieldNote('JEE', intendedField)}</p>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground/70 block mb-1">JEE Main percentile</label>
                        <input type="number" min={0} max={100} step={0.01} placeholder="0–100" value={standardizedTests.jeePercentile ?? ''} onChange={(e) => setStandardizedTests((t) => ({ ...t, jeePercentile: e.target.value ? clamp(Number(e.target.value), 0, 100) : undefined }))} className="w-full bg-secondary border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground/70 block mb-1">JEE Advanced rank (if you sat it)</label>
                        <input type="number" min={1} placeholder="All India Rank" value={standardizedTests.jeeAdvancedRank ?? ''} onChange={(e) => setStandardizedTests((t) => ({ ...t, jeeAdvancedRank: e.target.value ? clamp(Number(e.target.value), 1, Infinity) : undefined }))} className="w-full bg-secondary border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground/90 mb-1.5">NEET (India) — medicine</div>
                    {indiaExamFieldNote('NEET', intendedField) && (
                      <p className="text-xs text-muted-foreground/70 mb-1.5">{indiaExamFieldNote('NEET', intendedField)}</p>
                    )}
                    <label className="text-xs text-muted-foreground/70 block mb-1">NEET score</label>
                    <input type="number" min={0} max={720} placeholder="0–720" value={standardizedTests.neetScore ?? ''} onChange={(e) => setStandardizedTests((t) => ({ ...t, neetScore: e.target.value ? clamp(Number(e.target.value), 0, 720) : undefined }))} className="w-full bg-secondary border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground/90 mb-1.5">CLAT (India) — law</div>
                    {indiaExamFieldNote('CLAT', intendedField) && (
                      <p className="text-xs text-muted-foreground/70 mb-1.5">{indiaExamFieldNote('CLAT', intendedField)}</p>
                    )}
                    <label className="text-xs text-muted-foreground/70 block mb-1">CLAT All India Rank</label>
                    <input type="number" min={1} placeholder="All India Rank" value={standardizedTests.clatRank ?? ''} onChange={(e) => setStandardizedTests((t) => ({ ...t, clatRank: e.target.value ? clamp(Number(e.target.value), 1, Infinity) : undefined }))} className="w-full bg-secondary border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground/90 mb-1.5">CUET UG (India) — central/state universities, any field</div>
                    <label className="text-xs text-muted-foreground/70 block mb-1">CUET total score</label>
                    <input type="number" min={0} placeholder="From your scorecard" value={standardizedTests.cuetScore ?? ''} onChange={(e) => setStandardizedTests((t) => ({ ...t, cuetScore: e.target.value ? clamp(Number(e.target.value), 0, Infinity) : undefined }))} className="w-full bg-secondary border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary" />
                  </div>
                </div>
              )}
            </div>
        </section>
        </>
        )}

        {/* Suggested activities (from Build Your Dream roadmaps) used to
            live here, wedged between past-fact entry and future-planning
            content. That belongs exclusively in Build Your Dream — this
            page documents what a student has already done, not what they
            might do next — so it's gone from here entirely. */}
        {activeTab === 'activities' && (
        <div className="relative">
          <section className="bg-card border border-border rounded-3xl p-6">
            <h2 className="text-xl font-extrabold tracking-tight text-primary mb-1 flex items-center gap-2"><Trophy className="w-5 h-5 text-primary" /> Extracurriculars</h2>
            <p className="text-xs text-muted-foreground/70 mb-4">Admissions committees evaluate impact, leadership scope, and spikes.</p>
            <div className="space-y-6">
              <ActivityGroupFields
                label="Honors & national-level achievements"
                examples={HONORS_EXAMPLES}
                entries={ec1}
                {...activityHandlers(setEc1)}
              />
              <ActivityGroupFields
                label="Leadership, service & work experience"
                examples={SERVICE_EXAMPLES}
                entries={ec2}
                {...activityHandlers(setEc2)}
              />
              <ActivityGroupFields
                label="Creative pursuits, sports & personal projects"
                examples={PROJECT_EXAMPLES}
                entries={ec3}
                {...activityHandlers(setEc3)}
              />
            </div>
          </section>

          {/* Docked as a collapsed accordion below the real activity entries
              — these are speculative, future-facing suggestions from Build
              Your Dream ("things you might still do"), not documented past
              achievements, so they read as tactical advice rather than more
              form to fill in. Collapsed by default unless there's something
              new (not yet marked completed) to surface. */}
          {suggestedActivities !== null && activities.length > 0 && (
            <details className="group bg-card border border-border rounded-3xl p-6 mt-4" open={activities.some((a) => a.status !== 'completed')}>
              <summary className="cursor-pointer list-none flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold flex items-center gap-2"><Trophy className="w-4 h-4 text-primary" /> Admissions Spike Recommendations</h3>
                <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 transition-transform group-open:rotate-180" />
              </summary>
              <p className="text-[11px] text-muted-foreground mt-2 mb-3">From your Build Your Dream roadmaps — mark one completed to fold it into your activities above.</p>
              <ul className="space-y-1.5">
                {activities.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-2 text-xs bg-secondary border border-border rounded-xl px-3 py-2">
                    <span className="flex items-center gap-1.5 min-w-0">
                      {a.country && (
                        <span
                          title={`From your ${APPLICATION_INFO[a.country]?.name ?? a.country} Build Your Dream roadmap — a suggestion specific to that country's application, not a general one`}
                          className="shrink-0 text-sm font-bold uppercase px-1.5 py-0.5 rounded border text-muted-foreground border-border bg-card"
                        >
                          {a.country}
                        </span>
                      )}
                      <span className={a.status === 'completed' ? 'text-muted-foreground line-through' : 'text-foreground/90'}>{a.text}</span>
                    </span>
                    {a.status === 'completed' ? (
                      <span className="shrink-0 text-[10px] font-semibold text-primary uppercase flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Completed</span>
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
            </details>
          )}

          {/* Same "pokes outside the card" placement as the Academics tab's
              Country relevance aside — the payoff for having already picked
              target countries in the Goals tab: this now speaks in their
              own selected countries instead of a generic disclaimer. */}
          <aside className="mt-4 lg:mt-0 lg:absolute lg:top-0 lg:left-full lg:ml-4 lg:w-64 bg-card border border-border rounded-3xl p-4">
            <span className="text-xs font-bold text-primary bg-accent/50 px-2 py-0.5 rounded-lg inline-block mb-2">Country relevance</span>
            {targetCountries.length > 0 ? (
              <>
                <p className="text-[11px] text-muted-foreground/80 mb-2 leading-relaxed">
                  Since you selected <span className="text-primary font-semibold">{targetCountries.map((c) => COUNTRY_NAMES[c] ?? c).join(' & ')}</span>: extracurriculars carry real weight in your evaluation — spikes at the State/National level or higher meaningfully improve reach odds there.
                </p>
                <RelevanceLine breakdown={extracurricularsRelevance(targetCountries)} />
              </>
            ) : (
              <p className="text-[11px] text-muted-foreground/60">Pick your target countries in the Goals tab to see how much these weigh for you.</p>
            )}
          </aside>
        </div>
        )}

      </div>
    </main>

    {/* Sibling of <main>, not a child — <main> is capped at max-w-3xl, and
        this bar needs to span the full viewport width edge-to-edge, not
        just that center column. `sticky` (not `fixed`) so it docks to the
        bottom of the page's own scroll flow rather than floating over
        content regardless of scroll position; on this page (always taller
        than the viewport once there's real form content) that keeps it
        permanently visible without ever overlapping the tab content above it. */}
    <div className="sticky bottom-0 z-40 w-full bg-zinc-950/90 backdrop-blur-xl border-t border-white/10 px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-3 min-w-0 overflow-x-auto">
          <span className="text-xs font-mono text-zinc-400 whitespace-nowrap flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${saved ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
            {saved ? 'All inputs synchronized' : hasSavedProfile ? 'Saved to cloud' : 'Not saved yet'}
          </span>
          {initialProfiles.length > 0 && (
            <div className="relative flex items-center gap-1.5 shrink-0">
              <History className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              {/* A plain chooser — pick which saved profile you want, full
                  stop. The old popover listed every snapshot's full detail
                  card permanently in view; this just lets you choose one. */}
              <select
                value={loadedProfileId ?? ''}
                onChange={(e) => {
                  const p = initialProfiles.find((row) => row.id === Number(e.target.value))
                  if (p) loadProfile(p)
                }}
                className="bg-transparent text-xs text-zinc-400 hover:text-foreground focus:outline-none whitespace-nowrap max-w-[160px] sm:max-w-none"
              >
                <option value="" disabled>Version History ({initialProfiles.length})</option>
                {initialProfiles.map((p) => (
                  <option key={p.id} value={p.id} className="bg-card text-foreground">
                    {p.targetCountries.join(', ')} · {p.curriculum} · {new Date(p.createdAt).toLocaleDateString('en-US')}
                  </option>
                ))}
              </select>
            </div>
          )}
          {error && <p ref={errorRef} tabIndex={-1} className="text-xs text-destructive outline-none truncate" role="alert">{error}</p>}
        </div>

        <button
          type="button"
          onClick={() => (nextTab ? setActiveTab(nextTab) : handleSave(true))}
          disabled={pending}
          className="shrink-0 w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs px-5 py-2.5 rounded-lg transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {pending ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
          ) : nextTab ? (
            <>Continue to {TAB_LABELS[nextTab]} <ArrowRight className="w-3.5 h-3.5" /></>
          ) : (
            <>Save &amp; Run Admissions Match <ArrowRight className="w-3.5 h-3.5" /></>
          )}
        </button>
      </div>
    </>
  )
}
