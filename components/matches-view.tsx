'use client'

import { useState, useTransition, useRef, useEffect, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, GraduationCap, Compass, Bookmark, BookmarkCheck, User, ArrowRight } from 'lucide-react'
import { runMatch } from '@/app/actions/match'
import { gradeBadge } from '@/lib/grade'
import { satComposite } from '@/lib/standardized-tests'
import type { AcademicDetail } from '@/lib/academic-detail'
import type { MatchResult } from '@/lib/db/schema'
import type { StandardizedTests } from '@/lib/standardized-tests'
import { ProbabilityGraph } from '@/components/probability-graph'
import { UniversityCard } from '@/components/university-card'
import { TargetUniversityAnalysis, type TargetUniversityAnalysisHandle } from '@/components/target-university-analysis'
import { LoadingDots } from '@/components/loading-dots'
import { RevealGroup } from '@/components/reveal-group'
import { ProgressiveFluxLoader, type ProgressiveFluxPhase } from '@/components/ui/progressive-flux-loader'
import { saveSchool, unsaveSchool, getSavedSchoolIds } from '@/app/actions/saved-schools'
import { getMatchState, setMatchState, subscribeMatchState, getMatchServerSnapshot } from '@/lib/match-results-store'

// Mirrors the actual stages runMatch() goes through server-side (see
// app/actions/match.ts) — reading the profile, filtering the catalog by
// rank/field, running the AI batches, then merging results — so the label
// keeps reassuring the student the run is still progressing, not stalled.
const MATCH_PHASES: ProgressiveFluxPhase[] = [
  { at: 0, label: 'reading your profile' },
  { at: 20, label: 'scanning the catalog' },
  { at: 45, label: 'weighing academics & fit' },
  { at: 70, label: 'checking selectivity' },
  { at: 90, label: 'finalizing your matches' },
]

const CONTEXT: Record<string, { formula: string; detail: string }> = {
  US: {
    formula: '~50% Academic / ~50% Holistic',
    detail: 'Weighs your academic baseline alongside holistic leadership, essays, and passion projects.',
  },
  UK: {
    formula: '~85% Subject Mastery',
    detail: 'Focuses heavily on subject mastery and course-relevant academic depth.',
  },
  AU: {
    formula: '~100% Academic Cutoff',
    detail: 'Evaluated almost entirely on academic cutoff thresholds and ATAR equivalents.',
  },
  SG: {
    formula: 'Academic-first',
    detail: 'Strong academics weighed first, with essays and interviews as secondary factors.',
  },
  HK: {
    formula: 'Academics + Interview',
    detail: 'Blends strong academics with interviews and some holistic review.',
  },
  IN: {
    formula: 'Varies by school',
    detail: 'Holistic universities blend board marks with essays and interviews; IITs are purely exam-driven.',
  },
  DE: {
    formula: '~100% Final GPA',
    detail: 'Admits almost purely on your final secondary-school GPA (Abitur equivalent) — extracurriculars and essays barely count.',
  },
  FR: {
    formula: '~90% Grades / Concours',
    detail: 'Public licence programs are essentially non-selective; grandes écoles weigh grades and concours performance heavily.',
  },
}

type ProfileRow = {
  targetCountries: string[]
  curriculum: string
  academicDetail: AcademicDetail | null
  standardizedTests: StandardizedTests
  preferredClimate: string
  preferredSector: string
  preferredRank: string
  intendedField: string
  extracurriculars: string[]
  apCourses: string[]
} | null

export function MatchesView({ profile, catalogScope }: { profile: ProfileRow; catalogScope?: number | null }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const errorRef = useRef<HTMLParagraphElement>(null)
  const targetAnalysisRef = useRef<TargetUniversityAnalysisHandle>(null)
  // Two distinct journeys ("show me every fit" vs "what are my odds at
  // this one school") used to be forced into a single stacked page with a
  // disclaimer explaining why there were two buttons. Both sections stay
  // mounted at all times (never unmounted) so switching tabs never loses
  // in-progress search text or a previous deep-dive result — only which
  // one is visible changes.
  const [mode, setMode] = useState<'comprehensive' | 'single'>('comprehensive')

  // "Get a deeper analysis" on a match card runs the same target-university
  // analysis instead of making the student re-type the name — switches to
  // that tab and scrolls it into view once the tab's content is visible.
  function handleDeepAnalysis(universityName: string) {
    setMode('single')
    targetAnalysisRef.current?.analyzeFor(universityName)
    requestAnimationFrame(() => {
      document.getElementById('target-university-analysis')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }
  // String ids throughout — MatchResult.universityId is a string and
  // getSavedSchoolIds() now returns strings, so `.has()` actually matches.
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (error) errorRef.current?.focus()
  }, [error])

  // Load which schools are already saved on mount — results now persist
  // across navigation (the module store below), so a student returning to
  // /matches sees their list without re-running, and the bookmark icons
  // need to reflect the real saved state, not wait for the next run.
  useEffect(() => {
    getSavedSchoolIds()
      .then((ids) => setSavedIds(new Set(ids)))
      .catch(() => {})
  }, [])

  // Sourced from a module-level store, not local useState — /matches is a
  // separate route segment from /profile and /saved, so plain component
  // state here was wiped every time a student navigated away and back. See
  // lib/match-results-store.ts for why this survives that but still clears
  // on an actual page refresh.
  const matchState = useSyncExternalStore(subscribeMatchState, getMatchState, getMatchServerSnapshot)
  const results = matchState.results
  const summary = matchState.summary
  // The real request finishing doesn't mean the loader bar has visually
  // caught up to 100% yet — `finishing` snaps the bar to complete and holds
  // the result in `pendingResult` for one beat so results only ever appear
  // once the bar has actually reached the end, never before.
  const [finishing, setFinishing] = useState(false)
  const pendingResultRef = useRef<{ results: MatchResult[]; summary: string } | null>(null)

  const targetCountries = profile?.targetCountries?.length ? profile.targetCountries : ['US']
  const badge = profile?.academicDetail ? gradeBadge(profile.academicDetail) : null

  async function handleRun() {
    setError(null)
    setIsRunning(true)
    try {
      const res = await runMatch()
      if ('needsProfile' in res && res.needsProfile) {
        setError('Set up your profile first — we need your academics and preferences to run a match.')
        setIsRunning(false)
        return
      }
      if ('error' in res) {
        setError(res.message)
        setIsRunning(false)
        return
      }
      pendingResultRef.current = { results: res.results, summary: res.summary }
      setFinishing(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong running the match.')
      setIsRunning(false)
    }
  }

  // ProgressiveFluxLoader's own onComplete fires the instant the `value` prop
  // crosses 100, not once the fill has visually caught up — so this timer
  // (matching the loader's 0.55s fill transition, plus a hair) is what
  // actually gates the reveal on the bar looking complete, not just being
  // told to be.
  useEffect(() => {
    if (!finishing) return
    const timer = setTimeout(async () => {
      const pending = pendingResultRef.current
      pendingResultRef.current = null
      setFinishing(false)
      setIsRunning(false)
      if (!pending) return
      setMatchState({ results: pending.results, summary: pending.summary })
      startTransition(() => router.refresh())
      const ids = await getSavedSchoolIds()
      setSavedIds(new Set(ids))
    }, 650)
    return () => clearTimeout(timer)
  }, [finishing])

  async function toggleSave(uni: MatchResult) {
    if (savedIds.has(uni.universityId)) {
      await unsaveSchool(uni.universityId)
      setSavedIds((prev) => { const n = new Set(prev); n.delete(uni.universityId); return n })
    } else {
      await saveSchool({ universityId: uni.universityId, universityName: uni.name, universityLocation: uni.location, matchTier: uni.matchTier, acceptanceProbability: uni.acceptanceProbability })
      setSavedIds((prev) => new Set(prev).add(uni.universityId))
    }
  }

  const testSummary = profile ? formatCompactTests(profile.standardizedTests) : null

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">Find Matches</h1>
        <p className="text-sm text-muted-foreground">Calibrated against your saved profile.</p>
      </div>

      {/* Replaces the old apologetic helper text ("Separate from 'Run match'
          below...") — that sentence existing at all was a sign the page was
          forcing two different journeys (broad discovery vs. one-school
          diagnostic) into a single stack. A segmented switcher makes the
          split the actual information architecture instead of a footnote. */}
      <div className="inline-flex bg-secondary border border-border rounded-2xl p-1 mb-6">
        <button
          type="button"
          onClick={() => setMode('comprehensive')}
          className={`text-xs font-semibold px-4 py-2 rounded-xl transition-colors ${mode === 'comprehensive' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Comprehensive match
        </button>
        <button
          type="button"
          onClick={() => setMode('single')}
          className={`text-xs font-semibold px-4 py-2 rounded-xl transition-colors ${mode === 'single' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Target school deep-dive
        </button>
      </div>

      {/* Kept permanently mounted (never unmounted) regardless of `mode` so
          switching tabs never resets an in-progress search or clears a
          previous result — only visibility toggles. */}
      <div className={mode === 'single' ? '' : 'hidden'}>
        <TargetUniversityAnalysis ref={targetAnalysisRef} hasProfile={!!profile?.academicDetail} />
      </div>

      <div className={mode === 'comprehensive' ? 'grid grid-cols-1 lg:grid-cols-12 gap-5' : 'hidden'}>
        <section className="lg:col-span-5 bg-card border border-border rounded-3xl p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2"><User className="w-4 h-4 text-primary" /> Active profile snapshot</h2>
          {profile?.academicDetail ? (
            <div className="space-y-3">
              <div className="p-3 bg-accent/60 border border-primary/25 rounded-2xl flex items-center gap-3">
                <GraduationCap className="w-5 h-5 text-primary shrink-0" />
                <div className="text-xs font-mono text-accent-foreground font-semibold">{badge}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                {testSummary && <span className="text-[11px] font-mono bg-emerald-950/50 border border-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-lg">{testSummary}</span>}
                {profile.targetCountries.map((c) => (
                  <span key={c} className="text-[11px] bg-secondary border border-border px-2.5 py-1 rounded-lg text-foreground/90">{c}</span>
                ))}
                <span className="text-[11px] bg-secondary border border-border px-2.5 py-1 rounded-lg text-foreground/90">{profile.preferredClimate}</span>
                <span className="text-[11px] bg-secondary border border-border px-2.5 py-1 rounded-lg text-foreground/90">{profile.preferredSector}</span>
                {profile.intendedField !== 'No preference' && <span className="text-[11px] bg-secondary border border-border px-2.5 py-1 rounded-lg text-foreground/90">{profile.intendedField}</span>}
                {profile.preferredRank !== 'No preference' && <span className="text-[11px] bg-secondary border border-border px-2.5 py-1 rounded-lg text-foreground/90">{profile.preferredRank}</span>}
              </div>
              {/* Compact pills instead of a raw bullet-point paragraph dump
                  — still the student's real, exact text (never a fabricated
                  tier/spike classification this app doesn't compute), just
                  presented as scannable badges instead of a wall of prose. */}
              {profile.extracurriculars.length > 0 && (
                <div>
                  <div className="text-[10px] font-mono text-muted-foreground tracking-wider mb-1.5">ACTIVITIES ({profile.extracurriculars.length})</div>
                  {/* Full text, wrapped — not truncated with an ellipsis
                      mid-sentence. There's no stored field splitting these
                      free-text entries into a clean "activity name" + "tier"
                      pair, so faking one (e.g. "Roller Hockey [National]")
                      would mean guessing at a classification this app
                      doesn't actually have; showing the real, complete text
                      is the honest version of "not a wall of prose." */}
                  <div className="space-y-1">
                    {profile.extracurriculars.map((ec, i) => (
                      <div key={i} className="text-[11px] bg-secondary border border-border text-foreground/80 px-2.5 py-1.5 rounded-lg leading-snug">{ec}</div>
                    ))}
                  </div>
                </div>
              )}
              {profile.apCourses.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {profile.apCourses.map((c) => (
                    <span key={c} className="text-[10px] bg-secondary border border-border text-foreground/80 px-2 py-0.5 rounded-md">{c}</span>
                  ))}
                </div>
              )}
              <a href="/profile" className="text-xs text-primary font-medium flex items-center gap-1 hover:brightness-125">Edit profile <ArrowRight className="w-3 h-3" /></a>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-xs text-muted-foreground mb-3">No profile saved yet — set one up to run a match.</p>
              <a href="/profile" className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold text-sm px-5 py-2.5 rounded-2xl hover:brightness-110 transition-all">Set up profile <ArrowRight className="w-4 h-4" /></a>
            </div>
          )}
        </section>

        <section className="lg:col-span-7 bg-card border border-border rounded-3xl p-6 flex flex-col">
          <h2 className="text-sm font-semibold mb-1.5">Admissions pool evaluation</h2>
          <p className="text-xs text-muted-foreground leading-relaxed text-pretty mb-4">
            Compares your academic profile and activities against admissions bands across the catalog, sorted into Safety, Target, and Reach tiers.
          </p>
          {/* Real, known-before-running facts, styled as a labeled
              diagnostic box — fills the space between the description and
              the button with the actual scope of the run instead of empty
              air. Every row here is a real value already on the profile or
              a live DB count (catalogScope, computed server-side in
              app/matches/page.tsx) — deliberately NOT adding an "Odds
              Calibration: CDS Verified"-style row, since this app doesn't
              actually cross-reference the Common Data Set specifically;
              that would be a fabricated methodology claim, not a real one. */}
          {profile?.academicDetail && (
            <div className="mb-5 rounded-xl bg-zinc-950/60 border border-white/5 p-3.5 divide-y divide-white/5">
              <div className="flex items-center justify-between pb-2 text-[11px] font-mono">
                <span className="text-muted-foreground font-semibold uppercase tracking-wider">Target regions</span>
                <span className="text-emerald-400 font-semibold">{targetCountries.join(' · ')}</span>
              </div>
              {catalogScope !== null && catalogScope !== undefined && (
                <div className="flex items-center justify-between py-2 text-[11px] font-mono">
                  <span className="text-muted-foreground font-semibold uppercase tracking-wider">Institutional scope</span>
                  <span className="text-foreground">{catalogScope} universities</span>
                </div>
              )}
              {(profile.intendedField !== 'No preference' || profile.preferredRank !== 'No preference') && (
                <div className="flex items-center justify-between pt-2 text-[11px] font-mono">
                  <span className="text-muted-foreground font-semibold uppercase tracking-wider">Active filters</span>
                  <span className="text-foreground/80">{[profile.intendedField !== 'No preference' && profile.intendedField, profile.preferredRank !== 'No preference' && profile.preferredRank].filter(Boolean).join(' · ')}</span>
                </div>
              )}
            </div>
          )}
          <div className="mt-auto">
          {isRunning ? (
            <button disabled className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold text-sm py-4 rounded-2xl opacity-60 cursor-not-allowed">
              <LoadingDots /> Analyzing your profile…
            </button>
          ) : (
            // Was <LiquidButton> (dark gradient pill, teal glow only on
            // hover) — sitting next to the single-school tab's always-bright
            // emerald "Analyze" button, it read as inactive/disabled at
            // rest. Both primary CTAs now share the same emerald treatment.
            <button
              onClick={handleRun}
              disabled={!profile?.academicDetail}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm py-3 px-6 rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Run Match <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
          {error && <p ref={errorRef} tabIndex={-1} className="text-xs text-destructive text-center outline-none mt-3" role="alert">{error}</p>}
          </div>
        </section>
      </div>

      <div className="mt-6 space-y-6">
        <div className={mode === 'comprehensive' ? 'space-y-6' : 'hidden'}>
        {results.length === 0 && !isRunning ? (
          <section className="bg-card border border-border border-dashed rounded-3xl p-12 text-center">
            <div className="inline-flex bg-secondary p-3 rounded-2xl mb-4"><Compass className="w-6 h-6 text-primary" /></div>
            <h3 className="text-base font-bold mb-1">No matches yet</h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto text-pretty">Your results will populate here once the evaluation finishes.</p>
          </section>
        ) : isRunning && results.length === 0 ? (
          <section className="bg-card border border-border rounded-3xl p-12 text-center">
            <ProgressiveFluxLoader
              phases={MATCH_PHASES}
              // A single AI call assesses MAX_CATALOG_FOR_AI schools at once
              // (see match.ts) — no parallel batching, that was tried and
              // reverted (see the comment there). Dropping from 20 to
              // 14-15 schools confirmed live to meaningfully cut run time.
              // loop is deliberately false: with it on, a run that outlasts
              // `duration` made the bar visibly restart from 0 and sweep
              // again, reading as "it loaded twice" — confusing even though
              // the real reveal was always correctly gated on the actual
              // API response (see the `finishing` effect below), never on
              // the bar's own animation. Now it plays through once and
              // holds at full while still waiting, and only actually
              // reveals results once `finishing` flips `value` to 100 for
              // real.
              duration={36}
              loop={false}
              value={finishing ? 100 : undefined}
            />
          </section>
        ) : (
          <>
            {summary && (
              <div className="bg-accent/50 border border-primary/25 rounded-3xl p-5 flex gap-3">
                <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-accent-foreground leading-relaxed text-pretty">{summary}</p>
              </div>
            )}
            <ProbabilityGraph results={results} />
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Recommended universities ({results.length})</h3>
              <RevealGroup className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start" replay={results} stagger={0.08}>
                {results.map((r) => (
                  <div key={r.universityId} id={`university-${r.universityId}`} className="relative scroll-mt-24 match-card-target rounded-3xl">
                    <UniversityCard uni={r} onDeepAnalysis={handleDeepAnalysis} />
                    <button onClick={() => toggleSave(r)} className="absolute top-4 right-4 p-2 rounded-xl bg-secondary border border-border hover:border-primary/30 transition-colors" aria-label={savedIds.has(r.universityId) ? 'Unsave school' : 'Save school'}>
                      {savedIds.has(r.universityId) ? <BookmarkCheck className="w-4 h-4 text-primary" /> : <Bookmark className="w-4 h-4 text-muted-foreground" />}
                    </button>
                  </div>
                ))}
              </RevealGroup>
            </div>
          </>
        )}
        </div>

        {/* Only in Comprehensive mode — showing France/Australia/Singapore
            weighting while auditing one specific US school (single-school
            mode) made the page feel uncalibrated to what the student was
            actually doing. Moved below the results (was between the
            trigger and the results, which pushed a freshly-run match below
            the fold — a student would click "Run match" and see nothing
            change at the top, looking stalled). Compact weight-bar rows
            instead of 4 separate paragraph cards. */}
        <div className={mode === 'comprehensive' ? '' : 'hidden'}>
          <section className="bg-zinc-900/30 border border-white/5 rounded-2xl p-4">
            <h2 className="text-xs font-bold font-mono text-foreground/90 tracking-wider uppercase mb-3">Regional weighting engine</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {targetCountries.map((c) => {
                const ctx = CONTEXT[c]
                return (
                  <div key={c} className="bg-zinc-950/40 border border-white/5 rounded-xl p-4">
                    <div className="text-xs font-semibold text-foreground mb-1">{c}</div>
                    <div className="font-mono text-[11px] text-emerald-400 mb-1.5">{ctx?.formula ?? 'Competitive'}</div>
                    <div className="text-[11px] text-zinc-400 leading-snug">{ctx?.detail ?? 'Standard competitive admissions environment.'}</div>
                  </div>
                )
              })}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}

// Short pill version of formatStandardizedTests — that helper is written
// for AI-prompt prose ("SAT 1450/1600 (Math 790, Reading & Writing 660)");
// this trims to just the composite for a compact badge, falling back to the
// next-most-relevant real score the student entered. Returns null (renders
// nothing) rather than a fabricated number when no test is on file.
function formatCompactTests(t: StandardizedTests): string | null {
  const composite = satComposite(t)
  if (composite !== null) return `SAT ${composite} (M:${t.satMath}, R:${t.satReadingWriting})`
  if (t.act !== undefined) return `ACT ${t.act}/36`
  if (t.jeePercentile !== undefined) return `JEE ${t.jeePercentile}th pctl`
  if (t.jeeAdvancedRank !== undefined) return `JEE Adv. AIR ${t.jeeAdvancedRank}`
  if (t.neetScore !== undefined) return `NEET ${t.neetScore}/720`
  if (t.clatRank !== undefined) return `CLAT AIR ${t.clatRank}`
  return null
}
