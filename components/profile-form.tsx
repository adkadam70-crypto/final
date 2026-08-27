'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import Link from 'next/link'
import { GraduationCap, Globe, Flame, Compass, Loader2, CheckCircle2, Award, ChevronDown, History, ArrowRight, Plus, X } from 'lucide-react'
import { saveProfile, type SaveProfileInput } from '@/app/actions/profile'
import { LiquidMetalButton } from '@/components/ui/liquid-metal-button'
import { gradeBadge } from '@/lib/grade'
import { AcademicDetailInput } from '@/components/academic-detail-input'
import { defaultAcademicDetail, ACADEMIC_FIELDS, type AcademicDetail } from '@/lib/academic-detail'
import { satComposite, type StandardizedTests } from '@/lib/standardized-tests'
import {
  GRADE_RELEVANCE,
  defaultNinthTenthCurriculum,
  type PriorGrades,
  type NinthTenthGrades,
  type NinthTenthYear,
  type NinthTenthCurriculum,
} from '@/lib/prior-grades'
import { HowWeAnalyze } from '@/components/how-we-analyze'

type Curriculum = 'CBSE' | 'IB_DIPLOMA' | 'A_LEVELS' | 'US_GPA_PCT'

const CURRICULUM_LABELS: Record<Curriculum, string> = {
  CBSE: 'CBSE / ISC (India)',
  IB_DIPLOMA: 'IB Diploma',
  A_LEVELS: 'A-Levels',
  US_GPA_PCT: 'US (GPA)',
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
  academicDetail: AcademicDetail | null
  standardizedTests: StandardizedTests
  priorGrades: PriorGrades | null
  extracurriculars: string[]
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
          <option value="IGCSE">IGCSE</option>
          <option value="CBSE_ICSE">CBSE / ICSE / other percentage board</option>
          <option value="US_GPA">US (GPA)</option>
          <option value="IB_MYP">IB (Middle Years Programme)</option>
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

export function ProfileForm({ initialProfiles, latestProfile }: { initialProfiles: ProfileRow[]; latestProfile: LatestProfile }) {
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
  const [ec1, setEc1] = useState(latestProfile?.extracurriculars?.[0] ?? '')
  const [ec2, setEc2] = useState(latestProfile?.extracurriculars?.[1] ?? '')
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
    setEc1(p.extracurriculars?.[0] ?? '')
    setEc2(p.extracurriculars?.[1] ?? '')
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
      extracurriculars: [ec1, ec2].map((s) => s.trim()).filter(Boolean),
    }
    startTransition(async () => {
      try {
        await saveProfile(input)
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
    { code: 'US', label: 'USA' },
    { code: 'UK', label: 'UK' },
    { code: 'AU', label: 'Australia' },
    { code: 'SG', label: 'Singapore' },
    { code: 'HK', label: 'Hong Kong' },
    { code: 'IN', label: 'India' },
  ]

  const onlyAustralia = targetCountries.length === 1 && targetCountries[0] === 'AU'

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">Your Profile</h1>
        <p className="text-sm text-muted-foreground">Tell us about your academics and preferences. This powers your match results and university recommendations.</p>
      </div>

      <div className="space-y-5">
        <HowWeAnalyze />

        <section className="bg-card border border-border rounded-3xl p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-2"><Globe className="w-4 h-4 text-primary" /> Target countries</h2>
          <p className="text-[11px] text-muted-foreground/70 mb-3">Select one or more — matches run across every country you pick.</p>
          <div className="grid grid-cols-3 gap-2">
            {COUNTRIES.map((c) => {
              const active = targetCountries.includes(c.code)
              return (
                <button key={c.code} onClick={() => toggleCountry(c.code)} aria-pressed={active} className={`p-3 rounded-2xl text-xs font-medium transition-all border ${active ? 'bg-accent border-primary text-accent-foreground' : 'bg-secondary border-border text-muted-foreground hover:border-foreground/20'}`}>{c.label}</button>
              )
            })}
          </div>
          <Link href="/application-info" className="mt-4 flex items-center justify-between gap-2 p-3 bg-accent/40 border border-primary/25 rounded-2xl text-xs text-accent-foreground hover:bg-accent/60 transition-colors">
            <span>Want the specifics for your selected countries — how to apply, what to submit, what each one prioritizes?</span>
            <span className="flex items-center gap-1 text-primary font-semibold shrink-0"><ArrowRight className="w-3.5 h-3.5" /></span>
          </Link>
        </section>

        <section className="bg-card border border-border rounded-3xl p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2"><GraduationCap className="w-4 h-4 text-primary" /> Academics</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="curriculum" className="text-xs text-muted-foreground block mb-2">Curriculum / board</label>
              <select id="curriculum" value={curriculum} onChange={(e) => handleCurriculumChange(e.target.value as Curriculum)} className="w-full bg-secondary border border-border rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-primary">
                <option value="CBSE">CBSE / ISC (India)</option>
                <option value="IB_DIPLOMA">IB Diploma</option>
                <option value="A_LEVELS">A-Levels</option>
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
                    <span className="text-[11px] font-semibold text-foreground/80">11th grade</span>
                    {eleventh && (
                      <button type="button" onClick={() => setEleventh(null)} className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-0.5">
                        <X className="w-3 h-3" /> Remove
                      </button>
                    )}
                  </div>
                  {eleventh ? (
                    <div className="scale-[0.92] origin-top -mx-2 -mb-2">
                      <AcademicDetailInput detail={eleventh} onChange={setEleventh} />
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

        {(targetCountries.includes('US') || targetCountries.includes('IN')) && (
          <section className="bg-card border border-border rounded-3xl p-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-2"><Award className="w-4 h-4 text-chart-4" /> Standardized tests</h2>
            <p className="text-[11px] text-muted-foreground/70 mb-4">Shown because of your selected countries — these apply regardless of curriculum. All optional.</p>
            <div className="space-y-4">
              {targetCountries.includes('US') && (
                <div>
                  <div className="text-[11px] text-muted-foreground mb-1.5">SAT / ACT (United States)</div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-muted-foreground/70 block mb-1">SAT Math</label>
                      <input type="number" min={200} max={800} placeholder="200–800" value={standardizedTests.satMath ?? ''} onChange={(e) => setStandardizedTests((t) => ({ ...t, satMath: e.target.value ? Number(e.target.value) : undefined }))} className="w-full bg-secondary border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary" />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground/70 block mb-1">SAT Reading & Writing</label>
                      <input type="number" min={200} max={800} placeholder="200–800" value={standardizedTests.satReadingWriting ?? ''} onChange={(e) => setStandardizedTests((t) => ({ ...t, satReadingWriting: e.target.value ? Number(e.target.value) : undefined }))} className="w-full bg-secondary border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary" />
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
        )}

        {!onlyAustralia && (
          <section className="bg-card border border-border rounded-3xl p-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2"><Flame className="w-4 h-4 text-chart-2" /> Extracurricular flexes</h2>
            <div className="space-y-4">
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1.5">Honors & national-level achievements</label>
                <input type="text" maxLength={200} placeholder="e.g. National Physics Olympiad medalist" value={ec1} onChange={(e) => setEc1(e.target.value)} className="w-full bg-secondary border border-border rounded-xl p-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-chart-2" />
                <div className="flex items-start justify-between gap-2">
                  <ExamplesHint examples={HONORS_EXAMPLES} />
                  <div className="text-[10px] text-muted-foreground/70 shrink-0 mt-1.5">{ec1.length}/200</div>
                </div>
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1.5">Community & service activities</label>
                <input type="text" maxLength={200} placeholder="e.g. 2 years volunteering with a local literacy NGO" value={ec2} onChange={(e) => setEc2(e.target.value)} className="w-full bg-secondary border border-border rounded-xl p-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-chart-2" />
                <div className="flex items-start justify-between gap-2">
                  <ExamplesHint examples={SERVICE_EXAMPLES} />
                  <div className="text-[10px] text-muted-foreground/70 shrink-0 mt-1.5">{ec2.length}/200</div>
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="bg-card border border-border rounded-3xl p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2"><Compass className="w-4 h-4 text-chart-4" /> Climate, sector & ranking</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="climate" className="text-[11px] text-muted-foreground block mb-1">Preferred climate</label>
              <select id="climate" value={preferredClimate} onChange={(e) => setPreferredClimate(e.target.value)} className="w-full bg-secondary border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary">
                <option>No preference</option><option>Warm</option><option>Balanced</option><option>Cold</option>
              </select>
            </div>
            <div>
              <label htmlFor="sector" className="text-[11px] text-muted-foreground block mb-1">Industry hub</label>
              <select id="sector" value={preferredSector} onChange={(e) => setPreferredSector(e.target.value)} className="w-full bg-secondary border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary">
                <option>No preference</option>
                <option>Tech Hub</option>
                <option>Finance Capital</option>
                <option>Business</option>
                <option>Creative Hub</option>
                <option>Research</option>
                <option>Healthcare & Biotech Hub</option>
                <option>Government & Policy Hub</option>
                <option>Manufacturing & Engineering Hub</option>
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
          <LiquidMetalButton label="Save profile" onClick={handleSave} fullWidth />
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
