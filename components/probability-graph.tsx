'use client'

import { useState } from 'react'
import type { MatchResult } from '@/lib/db/schema'
import { MATCH_TIERS, tierBarClass, tierBadgeClass } from '@/lib/match-tier'

export function ProbabilityGraph({ results }: { results: MatchResult[] }) {
  const [hovered, setHovered] = useState<MatchResult | null>(null)

  return (
    <section className="bg-card border border-border rounded-3xl p-6">
      <div className="flex flex-wrap justify-between items-start gap-3 mb-6">
        <div>
          <h3 className="text-base font-bold">Acceptance probability</h3>
          <p className="text-xs text-muted-foreground">
            AI estimates plotted by match strength — click a bar to jump to that school
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 text-[10px] font-medium">
          {MATCH_TIERS.map((tier) => (
            <span key={tier} className={`px-2.5 py-1 rounded-full border ${tierBadgeClass(tier)}`}>{tier}</span>
          ))}
        </div>
      </div>

      <div className="relative h-52 bg-secondary/60 border border-border rounded-2xl p-4 flex items-end gap-3 overflow-x-auto">
        {results.map((u) => (
          <a
            key={u.universityId}
            href={`#university-${u.universityId}`}
            className="flex-1 min-w-[52px] flex flex-col items-center gap-2 group cursor-pointer"
            onMouseEnter={() => setHovered(u)}
            onMouseLeave={() => setHovered((h) => (h === u ? null : h))}
          >
            <div className="text-[10px] font-mono text-muted-foreground group-hover:text-foreground transition-colors">
              {u.acceptanceProbability}%
            </div>
            <div className="w-full flex items-end" style={{ height: 120 }}>
              <div
                style={{ height: `${u.acceptanceProbability}%` }}
                className={`w-full rounded-t-lg transition-all duration-500 group-hover:brightness-125 ${tierBarClass(u.matchTier)}`}
              />
            </div>
            <div className="text-[10px] text-muted-foreground font-medium truncate max-w-[72px] text-center">
              {u.name.split(' ')[0]}
            </div>
          </a>
        ))}

        {hovered && (
          <div className="pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 bg-popover border border-border rounded-xl px-3 py-2 text-[11px] shadow-lg z-10 whitespace-nowrap">
            <div className="font-semibold text-foreground">{hovered.name}</div>
            <div className="text-muted-foreground">{hovered.matchTier} · {hovered.acceptanceProbability}%</div>
          </div>
        )}
      </div>
    </section>
  )
}
