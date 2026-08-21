'use client'

import type { MatchResult } from '@/lib/db/schema'

const TIER_COLOR: Record<MatchResult['matchTier'], string> = {
  Safety: 'bg-primary',
  Target: 'bg-chart-2',
  Reach: 'bg-chart-3',
  'Ultra Reach': 'bg-chart-4',
}

export function ProbabilityGraph({ results }: { results: MatchResult[] }) {
  return (
    <section className="bg-card border border-border rounded-3xl p-6">
      <div className="flex flex-wrap justify-between items-start gap-3 mb-6">
        <div>
          <h3 className="text-base font-bold">Acceptance probability</h3>
          <p className="text-xs text-muted-foreground">
            AI estimates plotted by match strength
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 text-[10px] font-medium">
          <Legend className="bg-primary/15 text-primary border-primary/25" label="Safety" />
          <Legend className="bg-chart-2/15 text-chart-2 border-chart-2/25" label="Target" />
          <Legend className="bg-chart-3/15 text-chart-3 border-chart-3/25" label="Reach" />
          <Legend className="bg-chart-4/15 text-chart-4 border-chart-4/25" label="Ultra" />
        </div>
      </div>

      <div className="h-52 bg-secondary/60 border border-border rounded-2xl p-4 flex items-end gap-3 overflow-x-auto">
        {results.map((u) => (
          <div
            key={u.universityId}
            className="flex-1 min-w-[52px] flex flex-col items-center gap-2 group"
            title={`${u.name}: ${u.acceptanceProbability}% (${u.matchTier})`}
          >
            <div className="text-[10px] font-mono text-muted-foreground group-hover:text-foreground transition-colors">
              {u.acceptanceProbability}%
            </div>
            <div className="w-full flex items-end" style={{ height: 120 }}>
              <div
                style={{ height: `${u.acceptanceProbability}%` }}
                className={`w-full rounded-t-lg transition-all duration-500 group-hover:brightness-125 ${TIER_COLOR[u.matchTier]}`}
              />
            </div>
            <div className="text-[10px] text-muted-foreground font-medium truncate max-w-[72px] text-center">
              {u.name.split(' ')[0]}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function Legend({ label, className }: { label: string; className: string }) {
  return (
    <span className={`px-2.5 py-1 rounded-full border ${className}`}>{label}</span>
  )
}
