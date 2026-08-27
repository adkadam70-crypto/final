'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, GraduationCap, Wand2, Bookmark, BookmarkCheck, User, ArrowRight } from 'lucide-react'
import { runMatch } from '@/app/actions/match'
import { gradeBadge } from '@/lib/grade'
import type { AcademicDetail } from '@/lib/academic-detail'
import type { MatchResult } from '@/lib/db/schema'
import { ProbabilityGraph } from '@/components/probability-graph'
import { UniversityCard } from '@/components/university-card'
import { TargetUniversityAnalysis } from '@/components/target-university-analysis'
import { LoadingDots } from '@/components/loading-dots'
import { RevealGroup } from '@/components/reveal-group'
import { LiquidMetalButton } from '@/components/ui/liquid-metal-button'
import { saveSchool, unsaveSchool, getSavedSchoolIds } from '@/app/actions/saved-schools'

const CONTEXT: Record<string, string> = {
  US: 'US universities weigh your academic baseline (~50%) alongside holistic leadership, essays, and passion projects (~50%).',
  UK: 'UK universities focus heavily (~85%) on subject mastery and course-relevant academic depth.',
  AU: 'Australia evaluates applicants almost entirely on academic cutoff thresholds and ATAR equivalents (~100%).',
  SG: 'Singapore weighs strong academics first, with essays and interviews as secondary factors.',
  HK: 'Hong Kong blends strong academics with interviews and some holistic review.',
  IN: 'Holistic Indian universities blend board marks with essays and interviews; IITs are purely exam-driven.',
}

type ProfileRow = {
  targetCountry: string
  curriculum: string
  academicDetail: AcademicDetail | null
  preferredClimate: string
  preferredSector: string
  preferredRank: string
  intendedField: string
  extracurriculars: string[]
} | null

export function MatchesView({ profile }: { profile: ProfileRow }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const errorRef = useRef<HTMLParagraphElement>(null)
  const [savedIds, setSavedIds] = useState<Set<string | number>>(new Set())

  useEffect(() => {
    if (error) errorRef.current?.focus()
  }, [error])

  const [results, setResults] = useState<MatchResult[]>([])
  const [summary, setSummary] = useState('')

  const targetCountry = profile?.targetCountry ?? 'US'
  const badge = profile?.academicDetail ? gradeBadge(profile.academicDetail) : null

  async function handleRun() {
    setError(null)
    setIsRunning(true)
    try {
      const res = await runMatch()
      if ('needsProfile' in res && res.needsProfile) {
        setError('Set up your profile first — we need your academics and preferences to run a match.')
        return
      }
      setResults(res.results)
      setSummary(res.summary)
      startTransition(() => router.refresh())
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

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">Find Matches</h1>
        <p className="text-sm text-muted-foreground">Powered by your saved profile.</p>
      </div>

      <TargetUniversityAnalysis hasProfile={!!profile?.academicDetail} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
        <section className="bg-card border border-border rounded-3xl p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2"><User className="w-4 h-4 text-primary" /> Your profile</h2>
          {profile?.academicDetail ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <span className="text-[11px] bg-secondary border border-border px-2.5 py-1 rounded-lg text-foreground/90">{profile.targetCountry}</span>
                <span className="text-[11px] bg-secondary border border-border px-2.5 py-1 rounded-lg text-foreground/90">{profile.preferredClimate}</span>
                <span className="text-[11px] bg-secondary border border-border px-2.5 py-1 rounded-lg text-foreground/90">{profile.preferredSector}</span>
                {profile.intendedField !== 'No preference' && <span className="text-[11px] bg-secondary border border-border px-2.5 py-1 rounded-lg text-foreground/90">{profile.intendedField}</span>}
                {profile.preferredRank !== 'No preference' && <span className="text-[11px] bg-secondary border border-border px-2.5 py-1 rounded-lg text-foreground/90">{profile.preferredRank}</span>}
              </div>
              <div className="p-3 bg-accent/60 border border-primary/25 rounded-2xl flex items-center gap-3">
                <GraduationCap className="w-5 h-5 text-primary shrink-0" />
                <div className="text-xs font-mono text-accent-foreground font-semibold">{badge}</div>
              </div>
              {profile.extracurriculars.length > 0 && (
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  {profile.extracurriculars.map((ec, i) => <li key={i}>{ec}</li>)}
                </ul>
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

        <div className="flex flex-col justify-center gap-3">
          {isRunning ? (
            <button disabled className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold text-sm py-4 rounded-2xl opacity-60 cursor-not-allowed">
              <LoadingDots /> Analyzing your profile…
            </button>
          ) : (
            <LiquidMetalButton label="Run match" onClick={handleRun} disabled={!profile?.academicDetail} fullWidth />
          )}

          {error && <p ref={errorRef} tabIndex={-1} className="text-xs text-destructive text-center outline-none" role="alert">{error}</p>}
        </div>
      </div>

      <div className="mt-6 space-y-6">
        <section className="bg-card border border-border rounded-3xl p-6">
          <div className="text-xs font-semibold text-primary uppercase tracking-widest mb-1.5">Admissions context: {targetCountry}</div>
          <p className="text-xs text-muted-foreground leading-relaxed text-pretty">{CONTEXT[targetCountry]}</p>
        </section>

        {results.length === 0 && !isRunning ? (
          <section className="bg-card border border-border border-dashed rounded-3xl p-12 text-center">
            <div className="inline-flex bg-secondary p-3 rounded-2xl mb-4"><Wand2 className="w-6 h-6 text-primary" /></div>
            <h3 className="text-base font-bold mb-1">No matches yet</h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto text-pretty">Set your profile and hit <span className="text-foreground font-medium">Run match</span> to get tiered acceptance odds.</p>
          </section>
        ) : isRunning && results.length === 0 ? (
          <section className="bg-card border border-border rounded-3xl p-12 text-center">
            <LoadingDots className="justify-center text-primary mb-4" />
            <p className="text-xs text-muted-foreground">Weighing your academics, extracurriculars, and each school&apos;s selectivity…</p>
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
                    <UniversityCard uni={r} />
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
    </main>
  )
}
