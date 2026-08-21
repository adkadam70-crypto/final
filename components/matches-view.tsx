'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Compass, GraduationCap, Globe, Flame, Loader2, Wand2, CheckCircle2, Bookmark, BookmarkCheck } from 'lucide-react'
import { runMatch, type StudentInput, type SavedMatch } from '@/app/actions/match'
import { gradeBadge } from '@/lib/grade'
import type { MatchResult } from '@/lib/db/schema'
import { ProbabilityGraph } from '@/components/probability-graph'
import { UniversityCard } from '@/components/university-card'
import { SavedRuns } from '@/components/saved-runs'
import { saveSchool, unsaveSchool, getSavedSchoolIds } from '@/app/actions/saved-schools'

type Curriculum = 'CBSE' | 'IB_DIPLOMA' | 'A_LEVELS' | 'US_GPA_PCT'

const COUNTRIES = [
  { code: 'US', label: 'USA' },
  { code: 'UK', label: 'UK' },
  { code: 'AU', label: 'Australia' },
  { code: 'SG', label: 'Singapore' },
  { code: 'HK', label: 'Hong Kong' },
  { code: 'IN', label: 'India' },
]

const CONTEXT: Record<string, string> = {
  US: 'US universities weigh your academic baseline (~50%) alongside holistic leadership, essays, and passion projects (~50%).',
  UK: 'UK universities focus heavily (~85%) on subject mastery and course-relevant academic depth.',
  AU: 'Australia evaluates applicants almost entirely on academic cutoff thresholds and ATAR equivalents (~100%).',
  SG: 'Singapore weighs strong academics first, with essays and interviews as secondary factors.',
  HK: 'Hong Kong blends strong academics with interviews and some holistic review.',
  IN: 'Holistic Indian universities blend board marks with essays and interviews; IITs are purely exam-driven.',
}

export function MatchesView({ initialSaved }: { initialSaved: SavedMatch[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedIds, setSavedIds] = useState<Set<string | number>>(new Set())

  const [targetCountry, setTargetCountry] = useState('US')
  const [curriculum, setCurriculum] = useState<Curriculum>('CBSE')
  const [gradeValue, setGradeValue] = useState(92)
  const [preferredClimate, setPreferredClimate] = useState('Warm')
  const [preferredSector, setPreferredSector] = useState('Tech Hub')
  const [ec1, setEc1] = useState('')
  const [ec2, setEc2] = useState('')

  const [results, setResults] = useState<MatchResult[]>([])
  const [summary, setSummary] = useState('')
  const [saved, setSaved] = useState<SavedMatch[]>(initialSaved)

  const isIB = curriculum === 'IB_DIPLOMA'
  const badge = gradeBadge(curriculum, gradeValue)

  async function handleRun() {
    setError(null)
    setIsRunning(true)
    const input: StudentInput = {
      targetCountry, curriculum, gradeValue, preferredClimate, preferredSector,
      extracurriculars: [ec1, ec2].map((s) => s.trim()).filter(Boolean),
    }
    try {
      const res = await runMatch(input)
      setResults(res.results)
      setSummary(res.summary)
      startTransition(() => router.refresh())
      setSaved((prev) => [{ id: Date.now(), targetCountry, gradeBadge: res.gradeBadge, summary: res.summary, results: res.results, createdAt: new Date() }, ...prev])
      const ids = await getSavedSchoolIds()
      setSavedIds(new Set(ids))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong running the match.')
    } finally {
      setIsRunning(false)
    }
  }

  async function toggleSave(uni: MatchResult) {
    if (savedIds.has(uni.universityId)) {
      await unsaveSchool(uni.universityId)
      setSavedIds((prev) => { const n = new Set(prev); n.delete(uni.universityId); return n })
    } else {
      await saveSchool({ universityId: uni.universityId, universityName: uni.name, universityLocation: uni.location, matchTier: uni.matchTier, acceptanceProbability: uni.acceptanceProbability })
      setSavedIds((prev) => new Set(prev).add(uni.universityId))
    }
  }

  function loadSaved(m: SavedMatch) {
    setTargetCountry(m.targetCountry)
    setResults(m.results)
    setSummary(m.summary)
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">Find Matches</h1>
        <p className="text-sm text-muted-foreground">Set your profile and run AI matching to discover your best-fit universities.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-5">
          <section className="bg-card border border-border rounded-3xl p-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2"><Globe className="w-4 h-4 text-primary" /> 1. Target country</h2>
            <div className="grid grid-cols-3 gap-2">
              {COUNTRIES.map((c) => (
                <button key={c.code} onClick={() => setTargetCountry(c.code)} className={`p-3 rounded-2xl text-xs font-medium transition-all border ${targetCountry === c.code ? 'bg-accent border-primary text-accent-foreground' : 'bg-secondary border-border text-muted-foreground hover:border-foreground/20'}`}>{c.label}</button>
              ))}
            </div>
          </section>

          <section className="bg-card border border-border rounded-3xl p-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2"><GraduationCap className="w-4 h-4 text-primary" /> 2. Academics</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="curriculum" className="text-xs text-muted-foreground block mb-2">Curriculum / board</label>
                <select id="curriculum" value={curriculum} onChange={(e) => { const next = e.target.value as Curriculum; setCurriculum(next); if (next === 'IB_DIPLOMA') setGradeValue((g) => Math.min(45, Math.max(24, Math.round((g / 100) * 45) || 38))); else setGradeValue((g) => (g <= 45 ? 90 : g)); }} className="w-full bg-secondary border border-border rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-primary">
                  <option value="CBSE">CBSE / ISC (India)</option>
                  <option value="IB_DIPLOMA">IB Diploma</option>
                  <option value="A_LEVELS">A-Levels</option>
                  <option value="US_GPA_PCT">US (percentage)</option>
                </select>
              </div>
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-2"><span>Grade / score</span><span className="text-primary font-mono font-bold">{isIB ? `${gradeValue} / 45` : `${gradeValue}%`}</span></div>
                <input type="range" min={isIB ? 24 : 60} max={isIB ? 45 : 100} value={gradeValue} onChange={(e) => setGradeValue(Number(e.target.value))} className="w-full accent-primary h-2 rounded-lg cursor-pointer" aria-label="Grade or score" />
              </div>
              <div className="p-3 bg-accent/60 border border-primary/25 rounded-2xl flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <div className="text-[10px] text-primary/90 uppercase tracking-wider font-semibold">Grade translation</div>
                  <div className="text-xs font-mono text-accent-foreground font-semibold">{badge}</div>
                </div>
              </div>
            </div>
          </section>

          {targetCountry !== 'AU' && (
            <section className="bg-card border border-border rounded-3xl p-6">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2"><Flame className="w-4 h-4 text-chart-2" /> 3. Extracurricular flexes</h2>
              <div className="space-y-3">
                {[{ v: ec1, set: setEc1, ph: 'e.g. Founded an AI non-profit, scaled to 5k users' }, { v: ec2, set: setEc2, ph: 'e.g. National debate finalist / published research' }].map((f, i) => (
                  <div key={i}>
                    <input type="text" maxLength={200} placeholder={f.ph} value={f.v} onChange={(e) => f.set(e.target.value)} className="w-full bg-secondary border border-border rounded-xl p-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-chart-2" />
                    <div className="text-[10px] text-muted-foreground/70 text-right mt-1">{f.v.length}/200</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="bg-card border border-border rounded-3xl p-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2"><Compass className="w-4 h-4 text-chart-4" /> 4. Climate & sector</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="climate" className="text-[11px] text-muted-foreground block mb-1">Preferred climate</label>
                <select id="climate" value={preferredClimate} onChange={(e) => setPreferredClimate(e.target.value)} className="w-full bg-secondary border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary"><option>Warm</option><option>Balanced</option><option>Cold</option></select>
              </div>
              <div>
                <label htmlFor="sector" className="text-[11px] text-muted-foreground block mb-1">Industry hub</label>
                <select id="sector" value={preferredSector} onChange={(e) => setPreferredSector(e.target.value)} className="w-full bg-secondary border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary"><option>Tech Hub</option><option>Finance Capital</option><option>Creative Hub</option><option>Research</option></select>
              </div>
            </div>
          </section>

          <button onClick={handleRun} disabled={isRunning} className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold text-sm py-4 rounded-2xl hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
            {isRunning ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing your profile…</> : <><Wand2 className="w-4 h-4" /> Run AI match</>}
          </button>

          {error && <p className="text-xs text-destructive text-center" role="alert">{error}</p>}

          <SavedRuns saved={saved} onLoad={loadSaved} />
        </div>

        <div className="lg:col-span-7 space-y-6">
          <section className="bg-card border border-border rounded-3xl p-6">
            <div className="text-xs font-semibold text-primary uppercase tracking-widest mb-1.5">Admissions context: {targetCountry}</div>
            <p className="text-xs text-muted-foreground leading-relaxed text-pretty">{CONTEXT[targetCountry]}</p>
          </section>

          {results.length === 0 && !isRunning ? (
            <section className="bg-card border border-border border-dashed rounded-3xl p-12 text-center">
              <div className="inline-flex bg-secondary p-3 rounded-2xl mb-4"><Wand2 className="w-6 h-6 text-primary" /></div>
              <h3 className="text-base font-bold mb-1">No matches yet</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto text-pretty">Set your profile on the left and hit <span className="text-foreground font-medium">Run AI match</span> to get tiered, AI-estimated acceptance odds.</p>
            </section>
          ) : isRunning && results.length === 0 ? (
            <section className="bg-card border border-border rounded-3xl p-12 text-center">
              <Loader2 className="w-7 h-7 text-primary animate-spin mx-auto mb-4" />
              <p className="text-xs text-muted-foreground">Our model is weighing your academics, extracurriculars, and each school&apos;s selectivity…</p>
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
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recommended universities ({results.length})</h3>
                {results.map((r) => (
                  <div key={r.universityId} className="relative">
                    <UniversityCard uni={r} />
                    <button onClick={() => toggleSave(r)} className="absolute top-4 right-4 p-2 rounded-xl bg-secondary border border-border hover:border-primary/30 transition-colors" aria-label={savedIds.has(r.universityId) ? 'Unsave school' : 'Save school'}>
                      {savedIds.has(r.universityId) ? <BookmarkCheck className="w-4 h-4 text-primary" /> : <Bookmark className="w-4 h-4 text-muted-foreground" />}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
