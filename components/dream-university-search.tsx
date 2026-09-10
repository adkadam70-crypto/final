'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, TrendingUp, AlertTriangle, ListChecks, PlusCircle, CheckCircle2 } from 'lucide-react'
import { analyzeTargetUniversity, getUniversityNames, type TargetAnalysisResult } from '@/app/actions/analyze-target-university'
import { addUniversityToDreamList } from '@/app/actions/dream'
import { UNIVERSITY_ALIASES } from '@/lib/university-aliases'
import { tierBadgeClass } from '@/lib/match-tier'
import { LoadingDots } from '@/components/loading-dots'
import { RevealGroup } from '@/components/reveal-group'
import { EarlyAdmissionPanel } from '@/components/early-admission-panel'
import { ProgressiveFluxLoader, type ProgressiveFluxPhase } from '@/components/ui/progressive-flux-loader'
import { AcceptanceRateLine } from '@/components/acceptance-rate-line'

const ANALYSIS_PHASES: ProgressiveFluxPhase[] = [
  { at: 0, label: 'checking our database' },
  { at: 40, label: 'comparing your profile' },
  { at: 80, label: 'finalizing your breakdown' },
]

const MAX_SUGGESTIONS = 8

// Deliberately its own component rather than reusing TargetUniversityAnalysis
// — the user asked for this Build Your Dream search view to look and behave
// differently (monospace/"toolbar" styling, a checklist instead of prose
// action-step bullets, and an "add to list" action that persists into
// dreamUniversityTracks) rather than sharing the generic component and
// risking regressing it.
export function DreamUniversitySearch({ country, hasProfile }: { country: string; hasProfile: boolean }) {
  const [name, setName] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const errorRef = useRef<HTMLParagraphElement>(null)
  const [result, setResult] = useState<TargetAnalysisResult | null>(null)
  const [finishing, setFinishing] = useState(false)
  const pendingResultRef = useRef<TargetAnalysisResult | null>(null)
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set())
  const [addPending, setAddPending] = useState(false)

  const [catalogNames, setCatalogNames] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputWrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getUniversityNames(country).then(setCatalogNames).catch(() => {})
  }, [country])

  useEffect(() => {
    if (error) errorRef.current?.focus()
  }, [error])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (inputWrapperRef.current && !inputWrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const query = name.trim().toLowerCase()
  const suggestions = query
    ? [
        ...Object.entries(UNIVERSITY_ALIASES).filter(([alias]) => alias.startsWith(query)).map(([, realName]) => realName),
        ...catalogNames.filter((n) => n.toLowerCase().startsWith(query)),
      ]
        .filter((n, i, arr) => arr.indexOf(n) === i)
        .slice(0, MAX_SUGGESTIONS)
    : []

  async function handleAnalyze(nameOverride?: string) {
    const targetName = (nameOverride ?? name).trim()
    if (!targetName) return
    setShowSuggestions(false)
    setError(null)
    setPending(true)
    try {
      const res = await analyzeTargetUniversity(targetName, undefined, true, country)
      if ('needsProfile' in res) {
        setError('Set up your profile first — we need your academics to analyze a specific school.')
        setPending(false)
        return
      }
      if ('notInCatalog' in res) {
        setError(`"${res.universityName}" isn't in our ${country} catalog yet.`)
        setPending(false)
        return
      }
      if ('rateLimited' in res) {
        setError(res.message)
        setPending(false)
        return
      }
      if ('error' in res) {
        setError(res.message)
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

  async function handleAddToList() {
    if (!result) return
    setAddPending(true)
    const res = await addUniversityToDreamList(
      country,
      result.universityId,
      result.resolvedUniversityName,
      result.strengths,
      result.weaknesses,
      result.actionSteps,
      result.acceptanceProbability,
      result.matchTier,
      result.imageUrl,
      result.link,
    )
    setAddPending(false)
    if (res.success) setAddedIds((prev) => new Set(prev).add(result.universityId))
  }

  const alreadyAdded = result ? addedIds.has(result.universityId) : false

  return (
    <section className="bg-card border border-primary/20 rounded-3xl p-6 font-mono">
      <h2 className="text-xs font-bold uppercase tracking-widest text-primary mb-1 flex items-center gap-2"><Search className="w-4 h-4" /> Deep target search</h2>
      <p className="text-[11px] text-muted-foreground mb-4">Analyze a {country} school, then add it straight to your list to start tracking its application tasks. Only {country} schools are searchable here.</p>

      <div className="flex flex-col sm:flex-row gap-2">
        <div ref={inputWrapperRef} className="relative flex-1 min-w-0">
          <input
            type="text"
            placeholder="e.g. Stanford University"
            value={name}
            onChange={(e) => { setName(e.target.value); setShowSuggestions(true) }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAnalyze(); if (e.key === 'Escape') setShowSuggestions(false) }}
            disabled={!hasProfile}
            autoComplete="off"
            className="w-full bg-secondary border border-primary/30 rounded-lg p-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary disabled:opacity-60"
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-20 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-56 overflow-y-auto py-1">
              {suggestions.map((s) => (
                <li key={s}>
                  <button type="button" onClick={() => { setName(s); setShowSuggestions(false) }} className="w-full text-left px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors">{s}</button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          onClick={() => handleAnalyze()}
          disabled={pending || !hasProfile || !name.trim()}
          className="flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold text-xs px-5 py-3 rounded-lg hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
        >
          {pending ? <><LoadingDots /> ANALYZING</> : 'ANALYZE'}
        </button>
      </div>

      {!hasProfile && <p className="text-[11px] text-muted-foreground mt-2">Set up your main profile first.</p>}
      {pending && (
        <div className="mt-3">
          <ProgressiveFluxLoader phases={ANALYSIS_PHASES} duration={16} loop={!finishing} value={finishing ? 100 : undefined} />
        </div>
      )}
      {error && <p ref={errorRef} tabIndex={-1} className="text-xs text-destructive mt-3 outline-none" role="alert">{error}</p>}

      {result && (
        <RevealGroup className="mt-5 pt-5 border-t border-dashed border-primary/30 space-y-4" replay={result} y={12}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h3 className="text-sm font-bold">{result.resolvedUniversityName}</h3>
            <span className={`text-xs font-bold px-3 py-1.5 rounded-lg border whitespace-nowrap ${tierBadgeClass(result.matchTier)}`}>
              {result.matchTier} · {result.acceptanceProbability}%
            </span>
          </div>

          {result.acceptanceRate && <AcceptanceRateLine info={result.acceptanceRate} />}
          <p className="text-xs text-muted-foreground leading-relaxed text-pretty">{result.admissionChanceSummary}</p>
          <EarlyAdmissionPanel info={result.earlyAdmission} admissionsContext={result.admissionsContext} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-[11px] font-bold text-primary uppercase tracking-widest mb-2 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> Strengths</div>
              <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
                {result.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
            <div>
              <div className="text-[11px] font-bold text-chart-2 uppercase tracking-widest mb-2 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Weaknesses</div>
              <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
                {result.weaknesses.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          </div>

          {/* Requirements checklist — same underlying content as the generic
              "action steps" elsewhere, restyled as concrete tasks since this
              view's whole point is to feed a per-school task list, not prose. */}
          <div className="bg-secondary/60 border border-border rounded-2xl p-4">
            <div className="text-[11px] font-bold text-chart-5 uppercase tracking-widest mb-2 flex items-center gap-1.5"><ListChecks className="w-3.5 h-3.5" /> Requirements checklist</div>
            <ul className="space-y-1.5">
              {result.actionSteps.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-foreground/90">
                  <span className="w-3.5 h-3.5 mt-0.5 shrink-0 rounded border border-muted-foreground/40" />
                  {s}
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={handleAddToList}
            disabled={addPending || alreadyAdded}
            className="w-full flex items-center justify-center gap-2 bg-primary/10 border border-primary/30 text-primary font-bold text-xs py-3 rounded-lg hover:bg-primary/20 disabled:opacity-60 transition-all"
          >
            {addPending ? <LoadingDots /> : alreadyAdded ? <><CheckCircle2 className="w-4 h-4" /> ADDED TO {country} LIST</> : <><PlusCircle className="w-4 h-4" /> ADD TO {country} LIST</>}
          </button>
        </RevealGroup>
      )}
    </section>
  )
}
