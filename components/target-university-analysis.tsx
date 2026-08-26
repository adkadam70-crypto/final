'use client'

import { useState } from 'react'
import { Search, Loader2, TrendingUp, AlertTriangle, ListChecks, Sparkles } from 'lucide-react'
import { analyzeTargetUniversity, type TargetAnalysisResult } from '@/app/actions/analyze-target-university'
import { tierBadgeClass } from '@/lib/match-tier'

export function TargetUniversityAnalysis({ hasProfile }: { hasProfile: boolean }) {
  const [name, setName] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<TargetAnalysisResult | null>(null)

  async function handleAnalyze() {
    if (!name.trim()) return
    setError(null)
    setPending(true)
    try {
      const res = await analyzeTargetUniversity(name)
      if ('needsProfile' in res && res.needsProfile) {
        setError('Set up your profile first — we need your academics to analyze a specific school.')
        return
      }
      setResult(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong analyzing this school.')
    } finally {
      setPending(false)
    }
  }

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
          {pending ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing…</> : 'Analyze'}
        </button>
      </div>

      {!hasProfile && <p className="text-[11px] text-muted-foreground mt-2">Set up your profile below to use this.</p>}
      {error && <p className="text-xs text-destructive mt-3" role="alert">{error}</p>}

      {result && (
        <div className="mt-5 pt-5 border-t border-border space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h3 className="text-sm font-bold">{result.resolvedUniversityName}</h3>
            <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border whitespace-nowrap ${tierBadgeClass(result.matchTier)}`}>
              {result.matchTier} · {result.acceptanceProbability}%
            </span>
          </div>

          {!result.usedCatalogGrounding && (
            <p className="text-[11px] text-chart-2 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Not in our verified catalog — based on general knowledge of this school, not our selectivity data.</p>
          )}

          <p className="text-xs text-muted-foreground leading-relaxed text-pretty">{result.admissionChanceSummary}</p>

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
        </div>
      )}

      {!result && !error && (
        <p className="text-[11px] text-muted-foreground mt-3 flex items-center gap-1.5"><Sparkles className="w-3 h-3 text-primary" /> Separate from "Run match" below — this is a deep dive on one specific school.</p>
      )}
    </section>
  )
}
