'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, User, Search, TrendingUp, AlertTriangle, RotateCcw, Sparkles, CheckCircle2, GraduationCap, ChevronDown, Lightbulb, PlusCircle, ExternalLink } from 'lucide-react'
import { tierBadgeClass } from '@/lib/match-tier'
import {
  analyzeDreamProfile,
  generateDreamRoadmap,
  saveDreamChecklist,
  toggleDreamUniversityTask,
  addSuggestedActivity,
  markSuggestedActivityDone,
  generateActivitiesPlan,
  saveActivitiesPlan,
  type DreamCountryProfileRow,
  type DreamUniversityTrackRow,
  type SuggestedActivityRow,
} from '@/app/actions/dream'
import { DreamUniversitySearch } from '@/components/dream-university-search'
import { mergeChecklistProgress, overallCompletionPct, getSectionCoverage } from '@/lib/dream-checklist'
import { APPLICATION_INFO } from '@/lib/application-info'
import { COMMON_APP_SECTIONS, PER_UNIVERSITY_TASK_DETAILS } from '@/lib/common-app-sections'
import { LoadingDots } from '@/components/loading-dots'
import type { StandardizedTests } from '@/lib/standardized-tests'

type WorkspaceProfile = {
  academicDetail: unknown
  standardizedTests: StandardizedTests
  extracurriculars: string[]
  curriculum: string
  apCourses: string[]
}

// Simple circular completion ring — SVG stroke-dashoffset trick, no chart
// library needed for one number.
function CompletionRing({ pct, size = 96 }: { pct: number; size?: number }) {
  const stroke = 8
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(100, Math.max(0, pct)) / 100) * circumference
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--secondary)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-primary">{pct}%</span>
      </div>
    </div>
  )
}

export function DreamCountryWorkspace({
  country,
  confirmedField,
  initialCountryProfile,
  initialUniversityTracks,
  initialSuggestedActivities,
  profile,
}: {
  country: string
  confirmedField: string
  initialCountryProfile: NonNullable<DreamCountryProfileRow>
  initialUniversityTracks: DreamUniversityTrackRow[]
  initialSuggestedActivities: SuggestedActivityRow[]
  profile: WorkspaceProfile | null
}) {
  const router = useRouter()
  const [tab, setTab] = useState<'profile' | 'search' | 'universities'>('profile')
  const [countryProfile, setCountryProfile] = useState(initialCountryProfile)
  const [universityTracks, setUniversityTracks] = useState(initialUniversityTracks)
  const [suggestedActivities, setSuggestedActivities] = useState(initialSuggestedActivities)
  const [analysisPending, setAnalysisPending] = useState(false)
  const [roadmapPending, setRoadmapPending] = useState(false)
  const [customActivity, setCustomActivity] = useState('')
  const [activityPendingId, setActivityPendingId] = useState<number | 'custom' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [expandedStep, setExpandedStep] = useState<number | null>(null)
  const [expandedUniversity, setExpandedUniversity] = useState<number | null>(null)
  const [expandedTask, setExpandedTask] = useState<string | null>(null)
  // Checklist toggles are drafted locally and only persisted on "Save
  // changes" — no more save-on-every-click (see saveDreamChecklist in
  // app/actions/dream.ts).
  const [checklistDraft, setChecklistDraft] = useState(initialCountryProfile.checklist)
  const [checklistSaving, setChecklistSaving] = useState(false)
  const checklistDirty = JSON.stringify(checklistDraft) !== JSON.stringify(countryProfile.checklist)
  const [activitiesPending, setActivitiesPending] = useState(false)
  const [manualActivity, setManualActivity] = useState('')
  const [manualActivityPending, setManualActivityPending] = useState(false)

  const countryInfo = APPLICATION_INFO[country]
  const hasAnalysis = !!(countryProfile.analysisStrengths?.length || countryProfile.analysisGaps?.length)
  const hasProfile = !!profile?.academicDetail

  // US gets the real, researched Common App section list (see
  // lib/common-app-sections.ts) instead of the generic per-country
  // requirements text every other country still uses — that generic list
  // stays the fallback until the same research pass is done for them too.
  const checklistDefs = country === 'US' ? COMMON_APP_SECTIONS.map((s) => s.label) : (countryInfo?.requirements ?? [])

  const checklistItems =
    checklistDefs.length && profile
      ? mergeChecklistProgress(checklistDefs, checklistDraft, {
          standardizedTests: profile.standardizedTests,
          extracurriculars: profile.extracurriculars,
        })
      : []
  const commonAppCompletionPct = overallCompletionPct(checklistItems)

  const universityCompletionPcts = universityTracks.map((u) => {
    if (u.tasks.length === 0) return 0
    const done = u.tasks.filter((t) => (u.taskProgress[t] ?? 0) >= 100).length
    return Math.round((done / u.tasks.length) * 100)
  })
  const overallPct =
    universityTracks.length > 0
      ? Math.round((commonAppCompletionPct + universityCompletionPcts.reduce((a, b) => a + b, 0)) / (1 + universityTracks.length))
      : commonAppCompletionPct

  async function handleAnalyze() {
    setAnalysisPending(true)
    setError(null)
    const res = await analyzeDreamProfile(country)
    setAnalysisPending(false)
    if ('error' in res && res.error) return setError(res.message)
    if ('rateLimited' in res && res.rateLimited) return setError(res.message)
    if (('needsOnboarding' in res && res.needsOnboarding) || ('needsField' in res && res.needsField) || ('needsCountry' in res && res.needsCountry) || ('needsProfile' in res && res.needsProfile)) {
      return setError('Complete the steps on the Build Your Dream home page first.')
    }
    setCountryProfile((c) => ({ ...c, analysisStrengths: res.strengths, analysisGaps: res.gaps }))
  }

  async function handleGenerateRoadmap() {
    setRoadmapPending(true)
    setError(null)
    const res = await generateDreamRoadmap(country)
    setRoadmapPending(false)
    if ('error' in res && res.error) return setError(res.message)
    if ('rateLimited' in res && res.rateLimited) return setError(res.message)
    if (('needsOnboarding' in res && res.needsOnboarding) || ('needsField' in res && res.needsField) || ('needsCountry' in res && res.needsCountry) || ('needsProfile' in res && res.needsProfile)) {
      return setError('Complete the steps on the Build Your Dream home page first.')
    }
    setCountryProfile((c) => ({ ...c, roadmapSummary: res.timeframeSummary, roadmapSteps: res.steps }))
  }

  async function handleAddSuggestedActivity(text: string, key: number | 'custom') {
    setActivityPendingId(key)
    const res = await addSuggestedActivity(text)
    setActivityPendingId(null)
    if (!res.success) return setError(res.message)
    if (key === 'custom') setCustomActivity('')
    setSuggestedActivities((prev) => [...prev, { id: Date.now(), userId: '', text, status: 'shortlisted', createdAt: new Date() }])
  }

  async function handleMarkActivityDone(id: number) {
    setActivityPendingId(id)
    const res = await markSuggestedActivityDone(id)
    setActivityPendingId(null)
    if (!res.success) return setError(res.message)
    setSuggestedActivities((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'completed' } : a)))
  }

  async function handleGenerateActivitiesPlan() {
    setActivitiesPending(true)
    setError(null)
    const res = await generateActivitiesPlan(country)
    setActivitiesPending(false)
    if (!res.success || !res.slots) return setError(res.message)
    setCountryProfile((c) => ({ ...c, activitiesPlan: res.slots! }))
  }

  async function handleAddManualActivitySlot() {
    const text = manualActivity.trim()
    if (!text) return
    const plan = countryProfile.activitiesPlan ?? []
    if (plan.length >= 10) return setError('Common App allows at most 10 activities.')
    setManualActivityPending(true)
    setError(null)
    const nextPlan = [...plan, { category: 'Self-described', position: '', description: text }]
    const res = await saveActivitiesPlan(country, nextPlan)
    setManualActivityPending(false)
    if (!res.success) return setError(res.message)
    setCountryProfile((c) => ({ ...c, activitiesPlan: nextPlan }))
    setManualActivity('')
  }

  function handleToggleChecklist(item: string, done: boolean) {
    setChecklistDraft((c) => ({ ...c, [item]: done ? 100 : 0 }))
  }

  async function handleSaveChecklist() {
    setChecklistSaving(true)
    setError(null)
    const res = await saveDreamChecklist(country, checklistDraft)
    setChecklistSaving(false)
    if (!res.success) return setError(res.message)
    setCountryProfile((c) => ({ ...c, checklist: checklistDraft }))
  }

  async function handleToggleUniversityTask(universityId: number, task: string, done: boolean) {
    setUniversityTracks((tracks) =>
      tracks.map((t) => (t.universityId === universityId ? { ...t, taskProgress: { ...t.taskProgress, [task]: done ? 100 : 0 } } : t)),
    )
    await toggleDreamUniversityTask(country, universityId, task, done)
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 pb-10">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.push('/dream')} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Build Your Dream
        </button>
        <div className="flex items-center gap-1 bg-secondary border border-border rounded-2xl p-1">
          <button
            onClick={() => setTab('profile')}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-colors ${tab === 'profile' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <User className="w-3.5 h-3.5" /> Profile
          </button>
          <button
            onClick={() => setTab('search')}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-colors ${tab === 'search' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Search className="w-3.5 h-3.5" /> Search
          </button>
          <button
            onClick={() => setTab('universities')}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-colors ${tab === 'universities' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <GraduationCap className="w-3.5 h-3.5" /> My Universities
          </button>
        </div>
      </div>

      <div className="mb-6 flex items-center gap-5">
        <CompletionRing pct={overallPct} />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">{countryInfo?.name ?? country}</h1>
          <p className="text-sm text-muted-foreground">Target field: {confirmedField}</p>
          <p className="text-[11px] text-muted-foreground/70 mt-0.5">{overallPct}% of your overall application work is done</p>
        </div>
      </div>

      {tab === 'profile' ? (
        <div className="space-y-6">
          <section className="bg-card border border-border rounded-3xl p-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Profile analysis
            </h2>
            {hasAnalysis ? (
              <div className="space-y-3">
                {countryProfile.analysisStrengths && countryProfile.analysisStrengths.length > 0 && (
                  <div>
                    <div className="text-[11px] font-semibold text-primary uppercase tracking-wider mb-1.5">Strengths</div>
                    <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                      {countryProfile.analysisStrengths.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}
                {countryProfile.analysisGaps && countryProfile.analysisGaps.length > 0 && (
                  <div>
                    <div className="text-[11px] font-semibold text-chart-2 uppercase tracking-wider mb-1.5 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Gaps</div>
                    <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                      {countryProfile.analysisGaps.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}
                <button onClick={handleAnalyze} disabled={analysisPending} className="text-[11px] text-primary font-medium mt-2 flex items-center gap-1 hover:brightness-125 disabled:opacity-50">
                  {analysisPending ? <LoadingDots /> : <><RotateCcw className="w-3 h-3" /> Re-analyze</>}
                </button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-xs text-muted-foreground mb-3">See how your profile stacks up for {confirmedField} in {countryInfo?.name ?? country}.</p>
                <button
                  onClick={handleAnalyze}
                  disabled={analysisPending || !hasProfile}
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold text-xs px-4 py-2.5 rounded-xl hover:brightness-110 disabled:opacity-50 transition-all"
                >
                  {analysisPending ? <LoadingDots /> : <><Sparkles className="w-3.5 h-3.5" /> Analyze my profile</>}
                </button>
              </div>
            )}
            {error && <p className="text-[11px] text-destructive mt-3">{error}</p>}
          </section>

          {/* "Build your own profile" — a forward-looking, time-aware plan
              (what to DO next, paced against how much runway is left), sits
              above the application checklist since it's meant to inform what
              a student is building before they get to the paperwork below. */}
          {country === 'US' && (
            <section className="bg-card border border-border rounded-3xl p-6">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-chart-5" /> Build your own profile
              </h2>
              {countryProfile.roadmapSteps && countryProfile.roadmapSteps.length > 0 ? (
                <div className="space-y-4">
                  {countryProfile.roadmapSummary && <p className="text-xs text-muted-foreground leading-relaxed text-pretty">{countryProfile.roadmapSummary}</p>}
                  <ul className="space-y-2">
                    {countryProfile.roadmapSteps.map((step, i) => {
                      const already = suggestedActivities.some((a) => a.text === step.title)
                      const stepExpanded = expandedStep === i
                      return (
                        <li key={i} className="p-3 rounded-xl border border-border bg-secondary">
                          <div className="flex items-start justify-between gap-3">
                            <button
                              type="button"
                              onClick={() => setExpandedStep(stepExpanded ? null : i)}
                              aria-expanded={stepExpanded}
                              className="min-w-0 flex-1 text-left flex items-center gap-1.5"
                            >
                              <ChevronDown className={`w-3.5 h-3.5 shrink-0 text-muted-foreground/60 transition-transform ${stepExpanded ? 'rotate-180' : ''}`} />
                              <p className="text-xs font-semibold text-foreground">{i + 1}. {step.title}</p>
                            </button>
                            <button
                              type="button"
                              disabled={already || activityPendingId === i}
                              onClick={() => handleAddSuggestedActivity(step.title, i)}
                              className="shrink-0 flex items-center gap-1 text-[11px] font-medium text-primary hover:brightness-125 disabled:opacity-50 disabled:text-muted-foreground"
                            >
                              <PlusCircle className="w-3.5 h-3.5" /> {already ? 'Added' : 'Add to my profile'}
                            </button>
                          </div>
                          {stepExpanded && (
                            <div className="mt-2 ml-5 space-y-2">
                              <p className="text-[11px] text-muted-foreground text-pretty">{step.detail}</p>
                              {step.howTo && step.howTo.length > 0 && (
                                <div className="p-2.5 bg-card border border-border rounded-lg">
                                  <p className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-1">How to actually do this</p>
                                  <ol className="text-[11px] text-muted-foreground space-y-1 list-decimal list-inside">
                                    {step.howTo.map((h, j) => <li key={j}>{h}</li>)}
                                  </ol>
                                </div>
                              )}
                            </div>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                  <button onClick={handleGenerateRoadmap} disabled={roadmapPending} className="text-[11px] text-primary font-medium flex items-center gap-1 hover:brightness-125 disabled:opacity-50">
                    {roadmapPending ? <LoadingDots /> : <><RotateCcw className="w-3 h-3" /> Regenerate</>}
                  </button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-xs text-muted-foreground mb-3">Get a personalized, time-paced plan for what to build before you apply — based on where you stand and how much time you have left.</p>
                  <button
                    onClick={handleGenerateRoadmap}
                    disabled={roadmapPending || !hasProfile}
                    className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold text-xs px-4 py-2.5 rounded-xl hover:brightness-110 disabled:opacity-50 transition-all"
                  >
                    {roadmapPending ? <LoadingDots /> : <><Sparkles className="w-3.5 h-3.5" /> Build my plan</>}
                  </button>
                </div>
              )}

              {suggestedActivities.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Your shortlisted activities</p>
                  <ul className="space-y-1.5">
                    {suggestedActivities.map((a) => (
                      <li key={a.id} className="flex items-center justify-between gap-2 text-xs">
                        <span className={a.status === 'completed' ? 'text-muted-foreground line-through' : 'text-foreground/90'}>{a.text}</span>
                        {a.status === 'completed' ? (
                          <span className="shrink-0 text-[10px] font-semibold text-chart-2 uppercase flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Completed</span>
                        ) : (
                          <button
                            type="button"
                            disabled={activityPendingId === a.id}
                            onClick={() => handleMarkActivityDone(a.id)}
                            className="shrink-0 text-[10px] font-semibold text-primary uppercase hover:brightness-125 disabled:opacity-50"
                          >
                            Mark completed
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={customActivity}
                  onChange={(e) => setCustomActivity(e.target.value)}
                  maxLength={200}
                  placeholder="Add your own activity"
                  className="flex-1 min-w-0 bg-secondary border border-border rounded-lg p-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary"
                />
                <button
                  type="button"
                  disabled={!customActivity.trim() || activityPendingId === 'custom'}
                  onClick={() => handleAddSuggestedActivity(customActivity.trim(), 'custom')}
                  className="shrink-0 text-xs font-semibold text-primary px-3 py-2 rounded-lg border border-primary/30 hover:bg-primary/10 disabled:opacity-50"
                >
                  {activityPendingId === 'custom' ? <LoadingDots /> : 'Add'}
                </button>
              </div>
            </section>
          )}

          {/* Section 1: the country-wide application checklist (Common App's
              real sections for US; the generic per-country list for
              everyone else until that research pass is done too). */}
          <section className="bg-card border border-border rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-chart-2" /> {country === 'US' ? 'Common App checklist' : 'Application checklist'}
              </h2>
              <span className="text-xs font-bold text-primary">{commonAppCompletionPct}%</span>
            </div>
            {country === 'US' && (
              <a href="https://www.commonapp.org" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-primary font-medium hover:brightness-125 mb-3">
                <ExternalLink className="w-3 h-3" /> Open the Common App
              </a>
            )}
            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden mb-4">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${commonAppCompletionPct}%` }} />
            </div>
            {checklistItems.length > 0 ? (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {checklistItems.map(({ requirement, progress, autoDetected }) => {
                  const sectionInfo = COMMON_APP_SECTIONS.find((s) => s.label === requirement)
                  const coverage = profile ? getSectionCoverage(requirement, { standardizedTests: profile.standardizedTests, extracurriculars: profile.extracurriculars, curriculum: profile.curriculum, apCourses: profile.apCourses }) : null
                  const expanded = expandedSection === requirement
                  return (
                    <li key={requirement} className="p-2.5 rounded-xl border border-border bg-secondary">
                      <div className="flex items-start gap-2">
                        <button
                          type="button"
                          disabled={autoDetected}
                          onClick={() => !autoDetected && handleToggleChecklist(requirement, progress < 100)}
                          className={`flex-1 min-w-0 text-left text-xs flex items-start gap-2 ${autoDetected ? 'cursor-default' : 'cursor-pointer'}`}
                        >
                          <CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${progress >= 100 ? 'text-primary' : 'text-muted-foreground/40'}`} />
                          <span className={progress >= 100 ? 'text-muted-foreground line-through' : 'text-foreground/90'}>{requirement}</span>
                          {autoDetected && <span className="shrink-0 text-[9px] text-muted-foreground/60 uppercase">auto</span>}
                        </button>
                        {sectionInfo && (
                          <button
                            type="button"
                            onClick={() => setExpandedSection(expanded ? null : requirement)}
                            aria-expanded={expanded}
                            aria-label={`What goes in ${requirement}`}
                            className="shrink-0 text-muted-foreground/60 hover:text-primary p-0.5"
                          >
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                          </button>
                        )}
                      </div>
                      {sectionInfo && <p className="text-[10px] text-muted-foreground/70 mt-1 ml-5.5 text-pretty">{sectionInfo.description}</p>}
                      {expanded && sectionInfo && (
                        <div className="mt-2 ml-5.5 p-2.5 bg-card border border-border rounded-lg space-y-2">
                          {coverage && (
                            <div className="space-y-1.5 pb-2 border-b border-border/60">
                              <p className="text-[10px]"><span className="font-semibold text-chart-2 uppercase tracking-wider">You already have: </span><span className="text-muted-foreground">{coverage.have}</span></p>
                              <p className="text-[10px]"><span className="font-semibold text-chart-5 uppercase tracking-wider">Still need: </span><span className="text-muted-foreground">{coverage.need}</span></p>
                            </div>
                          )}
                          <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">What to put here</p>
                          <ul className="text-[11px] text-muted-foreground space-y-1 list-disc list-inside">
                            {sectionInfo.whatToInclude.map((w, i) => <li key={i}>{w}</li>)}
                          </ul>
                          {sectionInfo.example && (
                            <p className="text-[10px] text-muted-foreground/80 italic pt-1 border-t border-border/60 mt-1.5">{sectionInfo.example}</p>
                          )}
                          {sectionInfo.essayExampleLinks && sectionInfo.essayExampleLinks.length > 0 && (
                            <div className="pt-1.5 border-t border-border/60 space-y-1">
                              <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">Real essay examples</p>
                              {sectionInfo.essayExampleLinks.map((l) => (
                                <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[11px] text-primary hover:brightness-125">
                                  <ExternalLink className="w-3 h-3 shrink-0" /> {l.label}
                                </a>
                              ))}
                            </div>
                          )}
                          {requirement === 'Activities' && (
                            <div className="pt-1.5 border-t border-border/60 space-y-2">
                              <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">Your 10 Common App slots</p>
                              {(countryProfile.activitiesPlan?.length ?? 0) > 0 ? (
                                <ol className="space-y-1.5">
                                  {countryProfile.activitiesPlan!.map((slot, i) => (
                                    <li key={i} className="text-[11px] bg-secondary/60 border border-border rounded-lg p-2">
                                      <span className="font-semibold text-foreground">{i + 1}. {slot.category}</span>
                                      {slot.position && <span className="text-muted-foreground"> — {slot.position}</span>}
                                      <p className="text-muted-foreground mt-0.5">{slot.description}</p>
                                    </li>
                                  ))}
                                </ol>
                              ) : (
                                <p className="text-[11px] text-muted-foreground">Format your real extracurriculars (and any shortlisted activities) into real Common App entries.</p>
                              )}
                              <button
                                type="button"
                                onClick={handleGenerateActivitiesPlan}
                                disabled={activitiesPending}
                                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary hover:brightness-125 disabled:opacity-50"
                              >
                                {activitiesPending ? <LoadingDots /> : <><Sparkles className="w-3.5 h-3.5" /> {(countryProfile.activitiesPlan?.length ?? 0) > 0 ? 'Re-format' : 'Format for Common App'}</>}
                              </button>
                              {(countryProfile.activitiesPlan?.length ?? 0) < 10 && (
                                <div className="flex gap-2 pt-1">
                                  <input
                                    type="text"
                                    value={manualActivity}
                                    onChange={(e) => setManualActivity(e.target.value)}
                                    maxLength={170}
                                    placeholder={`Slot ${(countryProfile.activitiesPlan?.length ?? 0) + 1} — type your own`}
                                    className="flex-1 min-w-0 bg-secondary border border-border rounded-lg p-2 text-[11px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary"
                                  />
                                  <button
                                    type="button"
                                    disabled={!manualActivity.trim() || manualActivityPending}
                                    onClick={handleAddManualActivitySlot}
                                    className="shrink-0 text-[11px] font-semibold text-primary px-3 py-2 rounded-lg border border-primary/30 hover:bg-primary/10 disabled:opacity-50"
                                  >
                                    {manualActivityPending ? <LoadingDots /> : 'Add'}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      <div className="h-1 w-full bg-border rounded-full overflow-hidden mt-2">
                        <div className={`h-full rounded-full transition-all ${progress >= 100 ? 'bg-chart-2' : 'bg-primary/50'}`} style={{ width: `${progress}%` }} />
                      </div>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">No checklist data for this country yet.</p>
            )}
            {checklistItems.length > 0 && (
              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSaveChecklist}
                  disabled={!checklistDirty || checklistSaving}
                  className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground font-semibold text-xs px-4 py-2 rounded-xl hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {checklistSaving ? <LoadingDots /> : 'Save changes'}
                </button>
                {checklistDirty && !checklistSaving && <span className="text-[11px] text-muted-foreground">You have unsaved changes</span>}
              </div>
            )}
          </section>
        </div>
      ) : tab === 'search' ? (
        <DreamUniversitySearch country={country} hasProfile={hasProfile} />
      ) : (
        // "My Universities" — its own tab, separate from Profile: only the
        // schools added from this country's Search tab live here, tracked
        // with their own per-college tasks, not mixed into the Common App
        // checklist above.
        <section className="bg-card border border-border rounded-3xl p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-chart-4" /> My universities
          </h2>
          {universityTracks.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              None added yet — use the <button onClick={() => setTab('search')} className="text-primary font-medium underline underline-offset-2">Search</button> tab to analyze a school and add it here.
            </p>
          ) : (
            <div className="space-y-4">
              {universityTracks.map((track) => {
                  const done = track.tasks.filter((t) => (track.taskProgress[t] ?? 0) >= 100).length
                  const pct = track.tasks.length ? Math.round((done / track.tasks.length) * 100) : 0
                  const uniExpanded = expandedUniversity === track.universityId
                  return (
                    <div key={track.universityId} className="border border-border rounded-2xl p-4">
                      <div className="flex items-start gap-3 mb-2">
                        {/* Left-side thumbnail — same catalog imageUrl the main match
                            cards use (see components/university-card.tsx), snapshotted
                            at add-time so this doesn't need a join back to `universities`. */}
                        {track.universityImageUrl ? (
                          <div className="w-11 h-11 rounded-lg bg-white border border-border shrink-0 flex items-center justify-center overflow-hidden">
                            <img src={track.universityImageUrl} alt={`${track.universityName} logo`} loading="lazy" className="max-w-full max-h-full object-contain" />
                          </div>
                        ) : (
                          <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-accent to-secondary shrink-0 flex items-center justify-center" aria-hidden="true">
                            <GraduationCap className="w-5 h-5 text-primary/50" />
                          </div>
                        )}
                        <button type="button" onClick={() => setExpandedUniversity(uniExpanded ? null : track.universityId)} aria-expanded={uniExpanded} className="flex-1 min-w-0 text-left">
                          <span className="flex items-center gap-1.5 min-w-0">
                            <ChevronDown className={`w-3.5 h-3.5 shrink-0 text-muted-foreground/60 transition-transform ${uniExpanded ? 'rotate-180' : ''}`} />
                            <span className="text-sm font-bold truncate">{track.universityName}</span>
                          </span>
                          <span className="flex items-center gap-2 mt-1 flex-wrap">
                            {track.matchTier && track.acceptanceProbability != null && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${tierBadgeClass(track.matchTier)}`}>{track.matchTier} · {track.acceptanceProbability}% chance</span>
                            )}
                            <span className="text-[11px] font-bold text-primary">{pct}% · {done}/{track.tasks.length} tasks</span>
                          </span>
                        </button>
                        {track.universityLink && (
                          <a
                            href={track.universityLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Visit ${track.universityName}'s website`}
                            className="shrink-0 text-muted-foreground/60 hover:text-primary p-1"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                      <div className="h-1 w-full bg-secondary rounded-full overflow-hidden mb-3">
                        <div className="h-full bg-chart-4 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      {uniExpanded && (track.strengths.length > 0 || track.weaknesses.length > 0) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 p-3 bg-secondary/60 rounded-xl">
                          {track.strengths.length > 0 && (
                            <div>
                              <p className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-1">Strengths</p>
                              <ul className="text-[11px] text-muted-foreground space-y-1 list-disc list-inside">
                                {track.strengths.map((s, i) => <li key={i}>{s}</li>)}
                              </ul>
                            </div>
                          )}
                          {track.weaknesses.length > 0 && (
                            <div>
                              <p className="text-[10px] font-semibold text-chart-2 uppercase tracking-wider mb-1">Weaknesses</p>
                              <ul className="text-[11px] text-muted-foreground space-y-1 list-disc list-inside">
                                {track.weaknesses.map((s, i) => <li key={i}>{s}</li>)}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                      <ul className="space-y-1.5">
                        {track.tasks.map((task) => {
                          const taskDone = (track.taskProgress[task] ?? 0) >= 100
                          const taskKey = `${track.universityId}:${task}`
                          const detail = PER_UNIVERSITY_TASK_DETAILS[task]
                          const taskExpanded = expandedTask === taskKey
                          return (
                            <li key={task}>
                              <div className="flex items-start gap-2">
                                <button
                                  onClick={() => handleToggleUniversityTask(track.universityId, task, !taskDone)}
                                  className="flex-1 min-w-0 flex items-start gap-2 text-left text-xs"
                                >
                                  <CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${taskDone ? 'text-primary' : 'text-muted-foreground/40'}`} />
                                  <span className={taskDone ? 'text-muted-foreground line-through' : 'text-foreground/90'}>{task}</span>
                                </button>
                                {detail && (
                                  <button
                                    type="button"
                                    onClick={() => setExpandedTask(taskExpanded ? null : taskKey)}
                                    aria-expanded={taskExpanded}
                                    aria-label={`More on: ${task}`}
                                    className="shrink-0 text-muted-foreground/60 hover:text-primary p-0.5"
                                  >
                                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${taskExpanded ? 'rotate-180' : ''}`} />
                                  </button>
                                )}
                              </div>
                              {taskExpanded && detail && (
                                <p className="text-[11px] text-muted-foreground mt-1.5 ml-5.5 p-2.5 bg-secondary/60 border border-border rounded-lg text-pretty">{detail}</p>
                              )}
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
      )}
    </main>
  )
}
