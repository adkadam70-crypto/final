'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, User, Search, TrendingUp, AlertTriangle, RotateCcw, Sparkles, CheckCircle2 } from 'lucide-react'
import { analyzeDreamProfile, toggleDreamChecklistItem, type DreamCountryProfileRow } from '@/app/actions/dream'
import { TargetUniversityAnalysis } from '@/components/target-university-analysis'
import { mergeChecklistProgress, overallCompletionPct } from '@/lib/dream-checklist'
import { APPLICATION_INFO } from '@/lib/application-info'
import { LoadingDots } from '@/components/loading-dots'
import type { StandardizedTests } from '@/lib/standardized-tests'

type WorkspaceProfile = {
  academicDetail: unknown
  standardizedTests: StandardizedTests
  extracurriculars: string[]
}

export function DreamCountryWorkspace({
  country,
  confirmedField,
  initialCountryProfile,
  profile,
}: {
  country: string
  confirmedField: string
  initialCountryProfile: NonNullable<DreamCountryProfileRow>
  profile: WorkspaceProfile | null
}) {
  const router = useRouter()
  const [tab, setTab] = useState<'profile' | 'search'>('profile')
  const [countryProfile, setCountryProfile] = useState(initialCountryProfile)
  const [analysisPending, setAnalysisPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const countryInfo = APPLICATION_INFO[country]
  const hasAnalysis = !!(countryProfile.analysisStrengths?.length || countryProfile.analysisGaps?.length)
  const hasProfile = !!profile?.academicDetail

  const checklistItems =
    countryInfo && profile
      ? mergeChecklistProgress(countryInfo.requirements, countryProfile.checklist, {
          standardizedTests: profile.standardizedTests,
          extracurriculars: profile.extracurriculars,
        })
      : []
  const completionPct = overallCompletionPct(checklistItems)

  const dreamContext = hasAnalysis
    ? `For ${confirmedField} in ${countryInfo?.name ?? country}, this student's saved profile analysis found — Strengths: ${(countryProfile.analysisStrengths ?? []).join('; ') || 'none on file'}. Gaps: ${(countryProfile.analysisGaps ?? []).join('; ') || 'none on file'}.`
    : undefined

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

  async function handleToggleChecklist(item: string, done: boolean) {
    setCountryProfile((c) => ({ ...c, checklist: { ...c.checklist, [item]: done ? 100 : 0 } }))
    await toggleDreamChecklistItem(country, item, done)
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
        </div>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">{countryInfo?.name ?? country}</h1>
        <p className="text-sm text-muted-foreground">Target field: {confirmedField}</p>
      </div>

      {tab === 'profile' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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

          <section className="bg-card border border-border rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-chart-2" /> Application checklist</h2>
              <span className="text-xs font-bold text-primary">{completionPct}%</span>
            </div>
            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden mb-4">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${completionPct}%` }} />
            </div>
            {checklistItems.length > 0 ? (
              <ul className="space-y-2">
                {checklistItems.map(({ requirement, progress, autoDetected }) => (
                  <li key={requirement} className="p-2.5 rounded-xl border border-border bg-secondary">
                    <button
                      type="button"
                      disabled={autoDetected}
                      onClick={() => !autoDetected && handleToggleChecklist(requirement, progress < 100)}
                      className={`w-full text-left text-xs flex items-start gap-2 ${autoDetected ? 'cursor-default' : 'cursor-pointer'} ${progress >= 100 ? 'text-muted-foreground' : 'text-foreground/90'}`}
                    >
                      <CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${progress >= 100 ? 'text-primary' : 'text-muted-foreground/40'}`} />
                      <span className={progress >= 100 ? 'line-through' : ''}>{requirement}</span>
                      {autoDetected && <span className="ml-auto shrink-0 text-[9px] text-muted-foreground/60 uppercase">auto</span>}
                    </button>
                    <div className="h-1 w-full bg-border rounded-full overflow-hidden mt-2">
                      <div className={`h-full rounded-full transition-all ${progress >= 100 ? 'bg-chart-2' : 'bg-primary/50'}`} style={{ width: `${progress}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">No checklist data for this country yet.</p>
            )}
          </section>
        </div>
      ) : (
        <TargetUniversityAnalysis hasProfile={hasProfile} dreamContext={dreamContext} />
      )}
    </main>
  )
}
