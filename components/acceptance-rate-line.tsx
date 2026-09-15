'use client'

import { useState } from 'react'
import { Percent, Info } from 'lucide-react'
import type { AcceptanceRateInfo } from '@/lib/db/schema'

// Why "offer rate" isn't the same question as "acceptance rate" for UK (and
// AU/VTAC) schools: UK providers publish offers ÷ applications — the real
// answer to "what's my chance of getting an offer." A generic "acceptance
// rate" as sometimes reported elsewhere can instead mean enrolled ÷ offers
// received (i.e. how many people who ALREADY had an offer chose to take it
// up) — a totally different, much less useful number for a prospective
// applicant, since it says nothing about the odds of being made an offer in
// the first place. We show offer rate because that's the number that
// actually answers the question a student asking "what are my chances" is
// asking.
const OFFER_RATE_EXPLAINER =
  "This is the school's real published offer rate — offers made ÷ applications received. That's different from a raw \"acceptance rate,\" which can instead mean how many students who'd already been offered a place chose to enrol. That enrollment figure doesn't tell you anything about your odds of getting an offer in the first place, which is what actually matters when you're applying — so we show offer rate instead."

// One small line showing the school's own acceptance rate — or the honest
// absence of one. Distinct from the match card's tier badge, which is the
// student's personalized chance. See lib/db/schema.ts (AcceptanceRateInfo)
// and components/how-we-analyze.tsx for the plain-language explainer.
export function AcceptanceRateLine({ info, className = '' }: { info: AcceptanceRateInfo; className?: string }) {
  const [showExplainer, setShowExplainer] = useState(false)

  if (!info) return null

  if (info.kind === 'official') {
    // A UCAS / VTAC offer rate is a real published figure and means the same
    // thing for the applicant (an offer is the admission), but label it
    // accurately so the tooltip and the number agree.
    const isOfferRate = /offer rate/i.test(info.source)
    const label = isOfferRate ? 'Offer rate' : 'Acceptance rate'
    // Some schools' real rate is only published as a range (varies by
    // course) rather than one flat figure — if the cited source spells one
    // out (e.g. "16-21%"), show that range instead of the single
    // representative number stored in the rate column.
    const rangeMatch = info.source.match(/(\d{1,3})\s*[-–]\s*(\d{1,3})%/)
    const displayRate = rangeMatch ? `${rangeMatch[1]}-${rangeMatch[2]}%` : `${info.rate}%`
    return (
      <span
        className={`relative inline-flex items-center gap-1 text-[11px] text-muted-foreground ${showExplainer ? 'z-[999]' : ''} ${className}`}
        title={isOfferRate ? undefined : `Source: ${info.source}`}
      >
        <Percent className="w-3 h-3 text-chart-2" />
        {label} <strong className="font-semibold text-foreground/90">{displayRate}</strong>
        {isOfferRate && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setShowExplainer((v) => !v)
            }}
            className="text-muted-foreground/70 hover:text-primary shrink-0"
            aria-label="Why we show offer rate instead of acceptance rate"
          >
            <Info className="w-3 h-3" />
          </button>
        )}
        {isOfferRate && showExplainer && (
          <span
            role="tooltip"
            className="absolute z-[999] top-full left-0 mt-1.5 w-64 bg-popover border border-border rounded-xl shadow-2xl p-3 text-[11px] font-normal text-foreground/80 leading-relaxed normal-case isolate"
          >
            {OFFER_RATE_EXPLAINER}
            <span className="block mt-1.5 text-muted-foreground/70">Source: {info.source}</span>
          </span>
        )}
      </span>
    )
  }

  if (info.kind === 'estimated') {
    return (
      <span
        className={`inline-flex items-center gap-1 text-[11px] text-muted-foreground ${className}`}
        title={info.note}
      >
        <Info className="w-3 h-3 text-chart-4" />
        Est. acceptance rate <strong className="font-semibold text-foreground/90">~{info.rate}%</strong>
        <span className="text-muted-foreground/70">(our estimate)</span>
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] text-muted-foreground/80 ${className}`}
      title={info.note}
    >
      <Info className="w-3 h-3 text-muted-foreground/60" />
      No published acceptance rate
    </span>
  )
}
