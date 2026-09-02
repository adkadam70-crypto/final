'use client'

import { useState } from 'react'
import { Info } from 'lucide-react'
import type { EarlyAdmissionInfo } from '@/lib/db/schema'

/**
 * Shown directly (not gated behind a plan picker) whenever a school has real
 * Early Decision / Early Action / Regular-Decision-only data on file — see
 * EarlyAdmissionInfo in lib/db/schema.ts. Renders nothing if there's nothing
 * real to show, so it's safe to drop into any card unconditionally.
 */
export function EarlyAdmissionPanel({
  info,
  admissionsContext = null,
  compact = false,
}: {
  info: EarlyAdmissionInfo
  admissionsContext?: { note: string; source: string } | null
  compact?: boolean
}) {
  const [explainerOpen, setExplainerOpen] = useState(false)

  const rounds: Array<{ label: string; chance: number }> = []
  if (info?.earlyDecision) rounds.push({ label: 'Early Decision', chance: info.earlyDecision.yourChance })
  if (info?.earlyAction) rounds.push({ label: 'Early Action', chance: info.earlyAction.yourChance })

  const showPublishedNote =
    info?.publishedOverallRate != null && info.regularDecision != null && info.publishedOverallRate !== info.regularDecision.realRate

  if (rounds.length === 0 && !showPublishedNote && !admissionsContext) return null

  return (
    <div className={compact ? 'mt-2' : 'mt-3 pt-3 border-t border-border'}>
      {(rounds.length > 0 || showPublishedNote) && (
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className={`font-semibold uppercase tracking-wider text-muted-foreground ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
            Your odds by application round
          </span>
          <button
            type="button"
            onClick={() => setExplainerOpen((v) => !v)}
            className="text-primary hover:brightness-125"
            aria-label="What is Early Decision / Early Action, and why does it change my odds?"
            aria-expanded={explainerOpen}
          >
            <Info className="w-3 h-3" />
          </button>
        </div>
      )}

      {rounds.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {rounds.map((r) => (
            <span
              key={r.label}
              className="text-[11px] bg-secondary border border-border text-foreground/90 px-2 py-1 rounded-lg"
              title={`Real published ${r.label} rate: ${(r.label === 'Early Decision' ? info!.earlyDecision : info!.earlyAction)?.realRate}% — this is your estimated personal chance under that rate.`}
            >
              If {r.label}: <strong className="font-semibold">{r.chance}%</strong>
            </span>
          ))}
        </div>
      )}

      {showPublishedNote && (
        <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
          Published overall rate is {info!.publishedOverallRate}% — that blends in an easier early-round pool; {info!.regularDecision!.realRate}% (used above) is the more realistic baseline for a Regular Decision applicant.
        </p>
      )}

      {admissionsContext && (
        <p className={`text-[11px] text-muted-foreground leading-relaxed ${rounds.length > 0 || showPublishedNote ? 'mt-2 pt-2 border-t border-border/60' : ''}`} title={`Source: ${admissionsContext.source}`}>
          <strong className="text-foreground">Why this rate looks so low: </strong>
          {admissionsContext.note}
        </p>
      )}

      {explainerOpen && (
        <div className="mt-2 text-[11px] text-muted-foreground bg-secondary/60 border border-border rounded-xl p-3 space-y-1.5 leading-relaxed">
          <p>
            <strong className="text-foreground">Early Decision</strong> is a <strong>binding</strong> commitment — if admitted, you must enroll and withdraw every other application. Schools admit ED applicants at meaningfully higher rates because an ED admit is guaranteed to enroll ("yield protection"), which lets them take chances they wouldn&apos;t in the regular pool.
          </p>
          <p>
            <strong className="text-foreground">Early Action</strong> runs on the same early timeline but isn&apos;t binding — you keep every option open — which is also why it usually carries a smaller boost than ED.
          </p>
          <p>The trade-off with ED: you can&apos;t compare financial aid offers, and you commit before hearing from anywhere else. Only apply ED somewhere you&apos;re certain is your first choice.</p>
          <p className="text-[10px] opacity-75">Source: {info!.source}. This is a US-specific mechanism — there&apos;s no binding equivalent in the UK, Australia, Singapore, Hong Kong, or India.</p>
        </div>
      )}
    </div>
  )
}
