import { Percent, Info } from 'lucide-react'
import type { AcceptanceRateInfo } from '@/lib/db/schema'

// One small line showing the school's own acceptance rate — or the honest
// absence of one. Distinct from the match card's tier badge, which is the
// student's personalized chance. See lib/db/schema.ts (AcceptanceRateInfo)
// and components/how-we-analyze.tsx for the plain-language explainer.
export function AcceptanceRateLine({ info, className = '' }: { info: AcceptanceRateInfo; className?: string }) {
  if (!info) return null

  if (info.kind === 'official') {
    return (
      <span
        className={`inline-flex items-center gap-1 text-[11px] text-muted-foreground ${className}`}
        title={`Source: ${info.source}`}
      >
        <Percent className="w-3 h-3 text-chart-2" />
        Acceptance rate <strong className="font-semibold text-foreground/90">{info.rate}%</strong>
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
