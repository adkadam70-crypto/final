'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, TrendingUp, AlertTriangle, ListChecks, Sparkles } from 'lucide-react'
import { analyzeTargetUniversity, type TargetAnalysisResult } from '@/app/actions/analyze-target-university'
import { tierBadgeClass } from '@/lib/match-tier'
import { LoadingDots } from '@/components/loading-dots'
import { RevealGroup } from '@/components/reveal-group'
import { EarlyAdmissionPanel } from '@/components/early-admission-panel'
import { ProgressiveFluxLoader, type ProgressiveFluxPhase } from '@/components/ui/progressive-flux-loader'
import { AcceptanceRateLine } from '@/components/acceptance-rate-line'

// Mirrors the actual stages analyzeTargetUniversity() goes through
// server-side (see app/actions/analyze-target-university.ts) — catalog-only
// now, so this is just grounding lookup then the analysis call.
const ANALYSIS_PHASES: ProgressiveFluxPhase[] = [
  { at: 0, label: 'checking our database' },
  { at: 40, label: 'comparing your profile' },
  { at: 80, label: 'finalizing your breakdown' },
]

export function TargetUniversityAnalysis({ hasProfile }: { hasProfile: boolean }) {
  const [name, setName] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const errorRef = useRef<HTMLParagraphElement>(null)
  const [result, setResult] = useState<TargetAnalysisResult | null>(null)
  // Same reasoning as MatchesView: the real request finishing doesn't mean
  // the bar has visually caught up to 100% yet, so the result is held until
  // it has.
  const [finishing, setFinishing] = useState(false)
  const pendingResultRef = useRef<TargetAnalysisResult | null>(null)

  useEffect(() => {
    if (error) errorRef.current?.focus()
  }, [error])

  async function handleAnalyze() {
    if (!name.trim()) return
    setError(null)
    setPending(true)
    try {
      const res = await analyzeTargetUniversity(name)
      if ('needsProfile' in res) {
        setError('Set up your profile first — we need your academics to analyze a specific school.')
        setPending(false)
        return
      }
      pendingResultRef.current = res
      setFinishing(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong analyzing this school.')
      setPending(false)
    }
  }

  // See MatchesView's identical timer for why this can't just be the
  // loader's own onComplete — that fires the instant `value` hits 100, not
  // once the fill transition has actually finished playing.
  useEffect(() => {
    if (!finishing) return
    const timer = setTimeout(() => {
      const pending = pendingResultRef.current
      pendingResultRef.current = null
      setFinishing(false)
      setPending(false)
      if (pending) setResult(pending)
    }, 650)
    return () => clearTimeout(timer)
  }, [finishing])

  return (
    <section className="bg-card border border-border rounded-3xl p-6">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-2"><Search className="w-4 h-4 text-primary" /> Target university analysis</h2>
      <p className="text-xs text-muted-foreground mb-4">Get a rigorous, school-specific breakdown: your odds, strengths, gaps, and exactly what to do about them.</p>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          placeholder="e.g. Stanford University"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
          disabled={!hasProfile}
          className="flex-1 min-w-0 bg-secondary border border-border rounded-xl p-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary disabled:opacity-60"
        />
        <button
          onClick={handleAnalyze}
          disabled={pending || !hasProfile || !name.trim()}
          className="flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold text-xs px-5 py-3 rounded-xl hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
        >
          {pending ? <><LoadingDots /> Analyzing…</> : 'Analyze'}
        </button>
      </div>

      {!hasProfile && <p className="text-[11px] text-muted-foreground mt-2">Set up your profile below to use this.</p>}
      {pending && (
        <div className="mt-3">
          <ProgressiveFluxLoader
            phases={ANALYSIS_PHASES}
            // analyze-target-university.ts documents the non-catalog merged
            // search+analysis call at ~11-13s live-tested; catalog-matched
            // schools (the common case) are a single call and faster. Sized
            // with headroom so the sweep completes in one pass rather than
            // visibly looping for the common case; `loop` is still the
            // safety net for a slower live-research run.
            duration={16}
            loop={!finishing}
            value={finishing ? 100 : undefined}
          />
        </div>
      )}
      {error && <p ref={errorRef} tabIndex={-1} className="text-xs text-destructive mt-3 outline-none" role="alert">{error}</p>}

      {result && (
        <RevealGroup className="mt-5 pt-5 border-t border-border space-y-4" replay={result} y={12}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h3 className="text-sm font-bold">{result.resolvedUniversityName}</h3>
            <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border whitespace-nowrap ${tierBadgeClass(result.matchTier)}`}>
              {result.matchTier} · {result.acceptanceProbability}%
            </span>
          </div>

          {result.acceptanceRate && <AcceptanceRateLine info={result.acceptanceRate} />}

          <p className="text-xs text-muted-foreground leading-relaxed text-pretty">{result.admissionChanceSummary}</p>

          <EarlyAdmissionPanel info={result.earlyAdmission} admissionsContext={result.admissionsContext} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-[11px] font-semibold text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> Strengths</div>
              <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
                {result.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-chart-2 uppercase tracking-wider mb-2 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Weaknesses</div>
              <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
                {result.weaknesses.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-chart-5 uppercase tracking-wider mb-2 flex items-center gap-1.5"><ListChecks className="w-3.5 h-3.5" /> Action steps</div>
              <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
                {result.actionSteps.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          </div>
        </RevealGroup>
      )}

      {!result && !error && (
        <p className="text-[11px] text-muted-foreground mt-3 flex items-center gap-1.5"><Sparkles className="w-3 h-3 text-primary" /> Separate from "Run match" below — this is a deep dive on one specific school.</p>
      )}
    </section>
  )
}
