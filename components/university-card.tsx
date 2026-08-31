'use client'

import { useState } from 'react'
import { MapPin, Sun, ArrowRight, Lightbulb, ChevronDown, Sparkles, GraduationCap, Globe, Award } from 'lucide-react'
import type { MatchResult } from '@/lib/db/schema'
import { tierBadgeClass } from '@/lib/match-tier'
import { GlowCard } from '@/components/ui/spotlight-card'
import { EarlyAdmissionPanel } from '@/components/early-admission-panel'

export function UniversityCard({ uni }: { uni: MatchResult }) {
  const [tipsOpen, setTipsOpen] = useState(false)
  const tips = uni.improvementTips ?? []

  return (
    <GlowCard className="rounded-3xl block">
    <article className="bg-card border border-border rounded-3xl overflow-hidden transition-colors hover:border-foreground/20">
      {/* Real campus photo sourced from Wikimedia Commons (see
          scripts/fetch-university-images.mjs). When no good match was
          found, fall back to a plain branded placeholder — never a random
          unrelated photo, since that would misrepresent the school. */}
      {uni.imageUrl ? (
        <img
          src={uni.imageUrl}
          alt={`${uni.name} campus`}
          loading="lazy"
          className="w-full h-32 object-cover"
        />
      ) : (
        <div className="w-full h-32 bg-gradient-to-br from-accent to-secondary flex items-center justify-center" aria-hidden="true">
          <GraduationCap className="w-8 h-8 text-primary/50" />
        </div>
      )}

      <div className="p-6">
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
              {uni.rankBadge && (
                <span
                  className="flex items-center gap-1 bg-chart-4/15 border border-chart-4/25 text-chart-4 rounded-full px-2 py-0.5 font-medium"
                  title={`Source: ${uni.rankBadge.source}. Published rankings often include ties — multiple schools can legitimately share the same position, especially outside the top 10.`}
                >
                  <Award className="w-3 h-3" />
                  {uni.rankBadge.type === 'program' ? `#${uni.rankBadge.rankValue} in ${uni.rankBadge.field}` : `Rank #${uni.rankBadge.rankValue}`}
                </span>
              )}
              {uni.globalRank && (
                <span
                  className="flex items-center gap-1 bg-secondary border border-border rounded-full px-2 py-0.5"
                  title={uni.globalRank.source}
                >
                  <Globe className="w-3 h-3 text-primary" /> Globally #{uni.globalRank.value}
                </span>
              )}
            </div>
          </div>
          <span
            className={`text-xs font-bold px-3 py-1.5 rounded-xl border whitespace-nowrap ${tierBadgeClass(uni.matchTier)}`}
          >
            {uni.matchTier} · {uni.acceptanceProbability}%
          </span>
        </div>

        {/* AI rationale */}
        <p className="text-xs text-muted-foreground leading-relaxed text-pretty">
          {uni.rationale}
        </p>

        <EarlyAdmissionPanel info={uni.earlyAdmission} compact />

        <div className="mb-4 mt-4">
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
            Explore more <ArrowRight className="w-3 h-3" />
          </a>
        </div>
      </div>
    </article>
    </GlowCard>
  )
}
