'use client'

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Search, TrendingUp, AlertTriangle, ListChecks, CalendarDays, CircleCheck, ExternalLink, CalendarPlus } from 'lucide-react'
import { analyzeTargetUniversity, getUniversityNames, type TargetAnalysisResult } from '@/app/actions/analyze-target-university'
import { UNIVERSITY_ALIASES } from '@/lib/university-aliases'
import { tierBadgeClass } from '@/lib/match-tier'
import { LoadingDots } from '@/components/loading-dots'
import { RevealGroup } from '@/components/reveal-group'
import { EarlyAdmissionPanel } from '@/components/early-admission-panel'
import { ProgressiveFluxLoader, type ProgressiveFluxPhase } from '@/components/ui/progressive-flux-loader'
import { AcceptanceRateLine } from '@/components/acceptance-rate-line'
import { BorderBeam } from '@/components/ui/border-beam-search'
import { ADMISSIONS_DEADLINES } from '@/lib/admissions-deadlines'
import { parseDeadlineDate, daysUntil, googleCalendarUrl } from '@/lib/deadline-date-utils'

// Mirrors the actual stages analyzeTargetUniversity() goes through
// server-side (see app/actions/analyze-target-university.ts) — catalog-only
// now, so this is just grounding lookup then the analysis call.
const ANALYSIS_PHASES: ProgressiveFluxPhase[] = [
  { at: 0, label: 'checking our database' },
  { at: 40, label: 'comparing your profile' },
  { at: 80, label: 'finalizing your breakdown' },
]

// Longest common catalog name is well under this; a query longer than it
// can't possibly still be narrowing toward a real match.
const MAX_SUGGESTIONS = 8

// This is the country's general admissions calendar/requirements (from the
// same static, no-web-search data that backs the Build Your Dream
// "admissions calendar" tab — see lib/admissions-deadlines.ts and
// lib/application-info.ts), not a university-specific lookup: we don't
// store per-university deadlines, and most schools within a country do
// follow that country's shared platform/dates (Common App, UCAS, etc.), so
// this is labeled honestly as the country's system rather than implied to
// be this exact school's own page.
function DeadlinesAndRequirements({ country, requirements }: { country: string; requirements: string[] }) {
  const deadlines = ADMISSIONS_DEADLINES[country]
  if (!deadlines) return null

  const parsedRounds = deadlines.rounds.map((round) => {
    const parsed = parseDeadlineDate(round.date)
    return { round, parsed, days: parsed ? daysUntil(parsed) : null }
  })
  const upcoming = parsedRounds.filter((r) => r.days !== null && r.days >= 0)
  const nextDeadlineLabel = upcoming.length > 0 ? upcoming.reduce((a, b) => (b.days! < a.days! ? b : a)).round.label : null

  return (
    <div className="pt-4 border-t border-border">
      <div className="text-[11px] font-semibold text-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
        <CalendarDays className="w-3.5 h-3.5 text-primary" /> Deadlines &amp; requirements
      </div>
      <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed text-pretty">
        Deadlines below are {deadlines.name}&apos;s general admissions calendar — most {deadlines.name} universities follow these shared dates, but always confirm against this specific school&apos;s own page. Requirements are this school&apos;s own, from our catalog.
      </p>

      <div className={`grid grid-cols-1 sm:grid-cols-2 ${parsedRounds.length >= 3 ? 'lg:grid-cols-3' : ''} gap-3 mb-4`}>
        {parsedRounds.map(({ round, parsed, days }, i) => {
          const isNext = round.label === nextDeadlineLabel
          return (
            <div
              key={round.label}
              className={`rounded-xl p-3 flex flex-col ${isNext ? 'bg-accent/40 border-2 border-primary/40' : 'bg-secondary/50 border border-border'}`}
            >
              <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                <span className="text-[9px] font-mono text-muted-foreground">
                  {isNext ? 'NEXT DEADLINE' : `ROUND ${String(i + 1).padStart(2, '0')}`}
                </span>
                {days !== null && (
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border whitespace-nowrap ${days < 0 ? 'bg-secondary text-muted-foreground border-border' : 'bg-emerald-950/60 text-emerald-400 border-emerald-500/20'}`}>
                    {days < 0 ? 'PASSED' : days === 0 ? 'TODAY' : `T-${days}D`}
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-pretty">{round.label}</p>
              <p className="text-xs font-mono font-semibold text-primary">{round.date}</p>
              {round.note && <p className="text-[10px] text-muted-foreground mt-1 leading-snug text-pretty">{round.note}</p>}
              {parsed && (
                <a
                  href={googleCalendarUrl(`${deadlines.name}: ${round.label}`, parsed, round.note ?? '')}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] font-mono text-muted-foreground hover:text-emerald-400 flex items-center gap-1 mt-auto pt-2"
                >
                  <CalendarPlus className="w-2.5 h-2.5" /> Add to Cal
                </a>
              )}
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">What {deadlines.name} applicants generally submit</div>
          <ul className="space-y-1">
            {deadlines.checklist.map((item) => (
              <li key={item} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                <CircleCheck className="w-3 h-3 mt-0.5 shrink-0 text-primary" />
                <span className="text-pretty">{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">This school&apos;s own requirements</div>
          {requirements.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {requirements.map((req, i) => (
                <span key={i} className="text-[11px] bg-secondary border border-border text-foreground/90 px-2 py-1 rounded-lg">{req}</span>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground">None on file for this school yet — see the general checklist alongside.</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        {deadlines.sources.map((l) => (
          <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] bg-secondary border border-border text-primary px-2 py-1 rounded-lg hover:border-primary/40 transition-colors">
            {l.label} <ExternalLink className="w-2.5 h-2.5" />
          </a>
        ))}
      </div>
    </div>
  )
}

export type TargetUniversityAnalysisHandle = {
  /** Fills the search box with `universityName` and runs the analysis
   * immediately — used by a "Get a deeper analysis" button on a match
   * result card so the student doesn't have to re-type the name. */
  analyzeFor: (universityName: string) => void
}

export const TargetUniversityAnalysis = forwardRef<TargetUniversityAnalysisHandle, { hasProfile: boolean }>(function TargetUniversityAnalysis(
  { hasProfile },
  ref,
) {
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

  // Fetched once and filtered client-side as the user types — lets someone
  // pick a real catalog name directly instead of typing blind and finding
  // out afterward it's not in our catalog. Free-text entry still works
  // (analyzeTargetUniversity still does its own catalog check), this is
  // purely a faster, more guided way to get there.
  const [catalogNames, setCatalogNames] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputWrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getUniversityNames().then(setCatalogNames).catch(() => {})
  }, [])

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
        // Abbreviations first (e.g. "NUS" -> National University of
        // Singapore, "nu" -> still shows it) — these don't appear as a
        // prefix of the real name, so the plain catalog scan below would
        // never surface them at all, in any country.
        ...Object.entries(UNIVERSITY_ALIASES)
          .filter(([alias]) => alias.startsWith(query))
          .map(([, realName]) => realName),
        ...catalogNames.filter((n) => n.toLowerCase().startsWith(query)),
      ]
        .filter((n, i, arr) => arr.indexOf(n) === i)
        .slice(0, MAX_SUGGESTIONS)
    : []

  function selectSuggestion(suggestion: string) {
    setName(suggestion)
    setShowSuggestions(false)
  }

  async function handleAnalyze(nameOverride?: string) {
    const targetName = (nameOverride ?? name).trim()
    if (!targetName) return
    setShowSuggestions(false)
    setError(null)
    setPending(true)
    try {
      const res = await analyzeTargetUniversity(targetName)
      if ('needsProfile' in res) {
        setError('Set up your profile first — we need your academics to analyze a specific school.')
        setPending(false)
        return
      }
      if ('notInCatalog' in res) {
        setError(`We're really sorry — "${res.universityName}" isn't in our university catalog yet. Try one of the universities we support.`)
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

  useImperativeHandle(ref, () => ({
    analyzeFor(universityName: string) {
      setName(universityName)
      handleAnalyze(universityName)
    },
  }))

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
    <section id="target-university-analysis" className="bg-card border border-border rounded-3xl p-6 scroll-mt-24">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-2"><Search className="w-4 h-4 text-primary" /> Target university analysis</h2>
      <p className="text-xs text-muted-foreground mb-4">Get a rigorous, school-specific breakdown: your odds, strengths, gaps, and exactly what to do about them.</p>

      <div className="flex flex-col sm:flex-row gap-2">
        <div ref={inputWrapperRef} className="relative flex-1 min-w-0">
          {/* The moving glow itself is real and intentional — the bug was
              that BorderBeam's "line" variant deliberately bleeds its bloom
              layer 10px past its own box (a soft glow, by design) with
              overflow:visible, and this wrapper had no clip of its own to
              contain that bleed to the input's rounded shape. It escaped
              asymmetrically past the corners as a smear. Wrapping it in a
              rounded-xl + overflow-hidden container clips the bleed to
              exactly the input's shape, keeping the animated beam intact. */}
          <div className="rounded-xl overflow-hidden">
            {/* colorVariant="ocean" is the closest built-in preset to this
                site's teal, then shifted the rest of the way there with a
                --beam-hue-base hue-rotate override (ocean's blue/purple sits
                around 220-260deg). -55deg read as blue, -85deg overshot into
                plain green — -70deg is the middle ground that actually lands
                on teal-green, matching --primary's real hue (~178deg). */}
            <BorderBeam
              size="line"
              colorVariant="ocean"
              theme="dark"
              duration={6.5}
              hueRange={5}
              borderRadius={20}
              brightness={1.7}
              saturation={1.6}
              style={{ '--beam-hue-base': '-70deg' } as React.CSSProperties}
            >
              <input
                type="text"
                placeholder="e.g. Stanford University"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setShowSuggestions(true)
                }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAnalyze()
                  if (e.key === 'Escape') setShowSuggestions(false)
                }}
                disabled={!hasProfile}
                autoComplete="off"
                className="w-full bg-secondary border border-border rounded-xl p-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary disabled:opacity-60"
              />
            </BorderBeam>
          </div>
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-20 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-lg max-h-56 overflow-y-auto py-1">
              {suggestions.map((suggestion) => (
                <li key={suggestion}>
                  <button
                    type="button"
                    onClick={() => selectSuggestion(suggestion)}
                    className="w-full text-left px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors"
                  >
                    {suggestion}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          onClick={() => handleAnalyze()}
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

          <DeadlinesAndRequirements country={result.country} requirements={result.requirements} />
        </RevealGroup>
      )}

      {/* Before a result exists, this tab was near-empty below the search
          bar. Filled with what the audit actually produces (matching the
          three real output categories above — matchTier/probability,
          strengths/weaknesses, action steps — not invented framework names
          like "Common Data Set percentile" this app doesn't reference) plus
          one-click launches for a few well-known catalog schools. */}
      {!result && !pending && (
        <div className="mt-6 bg-zinc-900/40 border border-white/10 rounded-2xl p-6">
          <h3 className="text-[10px] font-mono text-zinc-500 tracking-wider uppercase mb-4">How the audit works</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <div className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-primary" /> Acceptance odds &amp; tier</div>
              <p className="text-[11px] text-zinc-400 leading-snug">Weighs your academics, tests, and activities against this school's real published or researched acceptance rate to place you in a Safety, Target, or Reach tier.</p>
            </div>
            <div>
              <div className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-chart-2" /> Strengths &amp; gaps</div>
              <p className="text-[11px] text-zinc-400 leading-snug">Names the specific parts of your profile that help or hurt your odds at this school, cited from your actual grades, scores, and activities.</p>
            </div>
            <div>
              <div className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1.5"><ListChecks className="w-3.5 h-3.5 text-chart-5" /> Concrete action steps</div>
              <p className="text-[11px] text-zinc-400 leading-snug">What to actually do next to close a gap, not generic advice — tied to this specific school's requirements.</p>
            </div>
            <div>
              <div className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5 text-primary" /> Deadlines &amp; requirements</div>
              <p className="text-[11px] text-zinc-400 leading-snug">This school's own on-file requirements, plus its country's general admissions calendar and submission checklist.</p>
            </div>
          </div>
          {hasProfile && (
            <div className="mt-5 pt-5 border-t border-white/5">
              <div className="text-[11px] text-zinc-500 mb-2">Quick audits:</div>
              <div className="flex flex-wrap gap-2">
                {['Stanford University', 'University of California, Berkeley', 'National University of Singapore', 'New York University'].map((school) => (
                  <button
                    key={school}
                    type="button"
                    onClick={() => handleAnalyze(school)}
                    className="text-[11px] bg-secondary border border-border text-foreground/80 hover:border-primary/40 hover:text-foreground px-2.5 py-1 rounded-lg transition-colors"
                  >
                    {school}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
})
