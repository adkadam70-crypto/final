'use client'

import { useState } from 'react'
import { TrendingUp, Sparkles, RotateCcw, ChevronDown, CircleCheck, CircleMinus } from 'lucide-react'
import { analyzeProfileStrength, type ProfileStrengthResult } from '@/app/actions/profile-strength'
import { LoadingDots } from '@/components/loading-dots'

export function ProfileStrengthCard({ hasProfile }: { hasProfile: boolean }) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ProfileStrengthResult | null>(null)
  // Collapsed by default — the score/headline/hint alone already answers
  // "how am I doing"; the strengths/weaknesses breakdown is for a student
  // who specifically wants to know why, one click away rather than always
  // taking up space.
  const [showWhy, setShowWhy] = useState(false)

  async function handleAnalyze() {
    setPending(true)
    setError(null)
    setShowWhy(false)
    try {
      const res = await analyzeProfileStrength()
      if ('needsProfile' in res && res.needsProfile) {
        setError('Set up your profile first.')
        return
      }
      if ('error' in res) {
        setError(res.message)
        return
      }
      setResult(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="bg-card border border-border rounded-3xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-primary/10 p-2.5 rounded-xl">
          <TrendingUp className="w-5 h-5 text-primary" />
        </div>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Profile Strength</span>
      </div>

      {result ? (
        <>
          <div className="text-3xl font-bold mb-1">{result.score}%</div>
          <p className="text-xs text-muted-foreground text-pretty">{result.headline}</p>
          {result.hint && <p className="text-[11px] text-muted-foreground/80 mt-1.5 text-pretty">{result.hint}</p>}

          {(result.strengths.length > 0 || result.weaknesses.length > 0) && (
            <button
              onClick={() => setShowWhy((v) => !v)}
              aria-expanded={showWhy}
              className="text-[11px] text-primary font-medium mt-2.5 flex items-center gap-1 hover:brightness-125"
            >
              <ChevronDown className={`w-3 h-3 transition-transform ${showWhy ? 'rotate-180' : ''}`} />
              {showWhy ? 'Hide why' : 'Why this score?'}
            </button>
          )}
          {showWhy && (
            <div className="mt-2.5 pt-2.5 border-t border-border space-y-2">
              {result.strengths.length > 0 && (
                <ul className="space-y-1">
                  {result.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-[11px] text-foreground/90">
                      <CircleCheck className="w-3 h-3 mt-0.5 shrink-0 text-chart-2" />
                      <span className="text-pretty">{s}</span>
                    </li>
                  ))}
                </ul>
              )}
              {result.weaknesses.length > 0 && (
                <ul className="space-y-1">
                  {result.weaknesses.map((w, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-[11px] text-foreground/90">
                      <CircleMinus className="w-3 h-3 mt-0.5 shrink-0 text-destructive" />
                      <span className="text-pretty">{w}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={pending}
            className="text-[11px] text-primary font-medium mt-3 flex items-center gap-1 hover:brightness-125 disabled:opacity-50"
          >
            {pending ? <LoadingDots /> : <><RotateCcw className="w-3 h-3" /> Re-analyze</>}
          </button>
        </>
      ) : pending ? (
        <div className="py-2">
          <LoadingDots className="text-primary" />
          <p className="text-[11px] text-muted-foreground mt-2">Reading your profile…</p>
        </div>
      ) : (
        <>
          <div className="text-3xl font-bold mb-1 text-muted-foreground/40">—</div>
          <button
            onClick={handleAnalyze}
            disabled={!hasProfile}
            className="text-xs text-primary font-semibold flex items-center gap-1.5 hover:brightness-125 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100"
          >
            <Sparkles className="w-3.5 h-3.5" /> Determine your profile strength
          </button>
          {!hasProfile && <p className="text-[11px] text-muted-foreground mt-1.5">Set up your profile first</p>}
        </>
      )}

      {error && <p className="text-[11px] text-destructive mt-2">{error}</p>}
    </div>
  )
}
