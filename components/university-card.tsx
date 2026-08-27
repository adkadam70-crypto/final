'use client'

import { useState } from 'react'
import { MapPin, Sun, ArrowRight, Lightbulb, ChevronDown, Sparkles } from 'lucide-react'
import type { MatchResult } from '@/lib/db/schema'
import { tierBadgeClass } from '@/lib/match-tier'
import { GlowCard } from '@/components/ui/spotlight-card'

export function UniversityCard({ uni }: { uni: MatchResult }) {
  const [tipsOpen, setTipsOpen] = useState(false)
  const tips = uni.improvementTips ?? []

  return (
    <GlowCard className="rounded-3xl block">
    <article className="bg-card border border-border rounded-3xl p-6 transition-colors hover:border-foreground/20">
      <div className="flex justify-between items-start gap-4 mb-4 pr-9">
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
          className={`text-xs font-bold px-3 py-1.5 rounded-xl border whitespace-nowrap ${tierBadgeClass(uni.matchTier)}`}
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

      {tips.length > 0 && (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setTipsOpen((v) => !v)}
            className="w-full flex items-center justify-between text-[11px] font-semibold text-primary uppercase tracking-wider py-1"
          >
            <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Improve your odds here</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${tipsOpen ? 'rotate-180' : ''}`} />
          </button>
          {tipsOpen && (
            <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside mt-2">
              {tips.map((tip, idx) => <li key={idx}>{tip}</li>)}
            </ul>
          )}
        </div>
      )}

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
    </GlowCard>
  )
}
