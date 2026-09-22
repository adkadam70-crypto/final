'use client'

import { useState } from 'react'
import { User, RotateCcw, ChevronDown, CircleCheck, CircleMinus } from 'lucide-react'
import Link from 'next/link'
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

  // This card is the single most important next action for a student who
  // hasn't run an analysis yet — everything else on the dashboard is more
  // useful once this exists. Give it a visibly distinct "start here" state
  // until a score exists, then fold back into the same neutral treatment
  // as the other two cards.
  const isRequiredFirstStep = !result

  return (
    <div
      className={`rounded-2xl p-5 flex flex-col justify-between transition-all backdrop-blur-xl border bg-zinc-950/70 ${
        isRequiredFirstStep
          ? 'border-emerald-500/40 shadow-lg shadow-emerald-950/40 hover:border-emerald-500/60'
          : 'border-white/10 hover:border-white/20'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        {/* Pill sits on its own row below the label instead of inline next
            to it — inline competed with the "—"/score value for width and
            wrapped mid-word on narrower grid columns. */}
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2 text-zinc-400">
            <User className="w-4 h-4 shrink-0" />
            <span className="text-[11px] font-mono tracking-wider whitespace-nowrap">PROFILE STRENGTH</span>
          </div>
          {isRequiredFirstStep && (
            <span className="self-start text-[9px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded whitespace-nowrap">
              REQUIRED STEP
            </span>
          )}
        </div>
        <span className={`text-2xl font-bold font-mono ${result ? 'text-emerald-400' : 'text-zinc-500'}`}>{result ? `${result.score}%` : '—'}</span>
      </div>

      <div className="flex-1">
        {result ? (
          <>
            <p className="text-xs text-zinc-300 mt-3 leading-relaxed text-pretty min-h-[2.5rem]">{result.headline}</p>
            {result.hint && <p className="text-[11px] font-mono text-zinc-500 mt-1 text-pretty">{result.hint}</p>}

            {(result.strengths.length > 0 || result.weaknesses.length > 0) && (
              <button
                onClick={() => setShowWhy((v) => !v)}
                aria-expanded={showWhy}
                className="text-[11px] text-emerald-400/80 font-mono mt-2.5 flex items-center gap-1 hover:text-emerald-400"
              >
                <ChevronDown className={`w-3 h-3 transition-transform ${showWhy ? 'rotate-180' : ''}`} />
                {showWhy ? 'Hide why' : 'Why this score?'}
              </button>
            )}
            {showWhy && (
              <div className="mt-2.5 pt-2.5 border-t border-white/5 space-y-2">
                {result.strengths.length > 0 && (
                  <ul className="space-y-1">
                    {result.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-[11px] text-zinc-300">
                        <CircleCheck className="w-3 h-3 mt-0.5 shrink-0 text-emerald-400" />
                        <span className="text-pretty">{s}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {result.weaknesses.length > 0 && (
                  <ul className="space-y-1">
                    {result.weaknesses.map((w, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-[11px] text-zinc-300">
                        <CircleMinus className="w-3 h-3 mt-0.5 shrink-0 text-red-400" />
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
              className="text-[11px] text-emerald-400/80 font-mono mt-3 flex items-center gap-1 hover:text-emerald-400 disabled:opacity-50"
            >
              {pending ? <LoadingDots /> : <><RotateCcw className="w-3 h-3" /> Re-analyze</>}
            </button>
          </>
        ) : pending ? (
          <div className="mt-3">
            <LoadingDots className="text-emerald-400" />
            <p className="text-[11px] text-zinc-400 font-mono mt-2">Reading your profile…</p>
          </div>
        ) : (
          <>
            {/* Description + one secondary line, matching Card 2/3's
                two-line body shape — without this second line, this
                card's natural content height fell short of the other
                two on mobile, where cards stack in one column and
                nothing stretches them to match. The CTA itself still
                lives only in the one bottom link, not duplicated here. */}
            <p className="text-xs text-zinc-300 mt-2 leading-relaxed min-h-[2.5rem]">
              Input your GPA, course rigor, and extracurriculars to calculate your baseline admissions index.
            </p>
            <p className="text-[11px] font-mono text-zinc-500 mt-1">{hasProfile ? 'Ready to calculate' : 'Set up your profile first'}</p>
          </>
        )}

        {error && <p className="text-[11px] text-red-400 mt-2">{error}</p>}
      </div>

      {/* One bottom CTA carries the card's real intent — "determine your
          strength" is the thing a student actually wants, not "set up a
          profile" (which reads as admin busywork). It still does the right
          underlying thing per state: routes to the profile form if there's
          nothing to analyze yet, triggers the real analysis once there is,
          and offers editing once a score already exists (re-running lives
          in the "Re-analyze" control above instead of duplicating here). */}
      {!hasProfile ? (
        <Link
          href="/profile"
          className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition-colors pt-4 border-t border-white/5 mt-4"
        >
          Determine Profile Strength →
        </Link>
      ) : result ? (
        <Link
          href="/profile"
          className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition-colors pt-4 border-t border-white/5 mt-4"
        >
          Edit Profile →
        </Link>
      ) : (
        <button
          onClick={handleAnalyze}
          disabled={pending}
          className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition-colors pt-4 border-t border-white/5 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Determine Profile Strength →
        </button>
      )}
    </div>
  )
}
