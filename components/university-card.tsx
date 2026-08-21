'use client'

import { MapPin, Sun, ArrowRight, Lightbulb } from 'lucide-react'
import type { MatchResult } from '@/lib/db/schema'

const TIER_BADGE: Record<MatchResult['matchTier'], string> = {
  Safety: 'bg-primary/15 text-primary border-primary/25',
  Target: 'bg-chart-2/15 text-chart-2 border-chart-2/25',
  Reach: 'bg-chart-3/15 text-chart-3 border-chart-3/25',
  'Ultra Reach': 'bg-chart-4/15 text-chart-4 border-chart-4/25',
}

export function UniversityCard({ uni }: { uni: MatchResult }) {
  return (
    <article className="bg-card border border-border rounded-3xl p-6 transition-colors hover:border-foreground/20">
      <div className="flex justify-between items-start gap-4 mb-4">
        <div>
          <h4 className="text-lg font-bold text-balance">{uni.name}</h4>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {uni.location}
            </span>
            <span className="flex items-center gap-1">
              <Sun className="w-3 h-3 text-chart-2" /> {uni.climate}
            </span>
          </div>
        </div>
        <span
          className={`text-xs font-bold px-3 py-1.5 rounded-xl border whitespace-nowrap ${TIER_BADGE[uni.matchTier]}`}
        >
          {uni.matchTier} · {uni.acceptanceProbability}%
        </span>
      </div>

      {/* AI rationale */}
      <p className="text-xs text-muted-foreground leading-relaxed mb-4 text-pretty">
        {uni.rationale}
      </p>

      <div className="mb-4">
        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Requirements
        </div>
        <div className="flex flex-wrap gap-2">
          {uni.requirements.map((req, idx) => (
            <span
              key={idx}
              className="text-[11px] bg-secondary border border-border text-foreground/90 px-2.5 py-1 rounded-lg"
            >
              {req}
            </span>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-border flex flex-wrap justify-between items-center gap-2 text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Lightbulb className="w-3.5 h-3.5 text-chart-2" />
          <strong className="text-foreground font-medium">Placements:</strong>{' '}
          {uni.internshipProgram}
        </span>
        <a
          href={uni.link}
          target="_blank"
          rel="noreferrer"
          className="text-primary hover:brightness-125 font-semibold flex items-center gap-1"
        >
          Explore <ArrowRight className="w-3 h-3" />
        </a>
      </div>
    </article>
  )
}
