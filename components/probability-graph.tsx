'use client'

import { useState } from 'react'
import type { MatchResult } from '@/lib/db/schema'
import { MATCH_TIERS, tierBadgeClass, tierDotClass } from '@/lib/match-tier'

// SVG canvas in data units (0-100 on both axes), with padding reserved for
// axis lines/labels. Kept as constants so the coordinate math below (scaleX/
// scaleY, the zone-line positions, the tooltip's percentage placement) all
// derive from the same source instead of duplicating magic numbers.
const W = 600
const H = 320
const PAD_LEFT = 42
const PAD_RIGHT = 14
const PAD_TOP = 28
const PAD_BOTTOM = 36
const PLOT_W = W - PAD_LEFT - PAD_RIGHT
const PLOT_H = H - PAD_TOP - PAD_BOTTOM

function scaleX(selectivity: number) {
  return PAD_LEFT + (selectivity / 100) * PLOT_W
}
function scaleY(probability: number) {
  return PAD_TOP + (1 - probability / 100) * PLOT_H
}

// Approximate probability bands behind each AI-assigned tier (see the
// TIER DEFINITIONS block in app/actions/match.ts) — drawn as the horizontal
// zone boundaries so the chart's zones match what the AI actually used to
// classify each school, rather than an arbitrary/invented cutoff.
const ZONE_BOUNDARIES = [72, 42, 15]
const TICKS = [0, 25, 50, 75, 100]

export function ProbabilityGraph({ results }: { results: MatchResult[] }) {
  const [hovered, setHovered] = useState<MatchResult | null>(null)

  const tooltipLeftPct = hovered ? Math.min(88, Math.max(12, (scaleX(hovered.baselineSelectivity) / W) * 100)) : 50
  const tooltipTopPct = hovered ? Math.min(85, Math.max(4, (scaleY(hovered.acceptanceProbability) / H) * 100)) : 0

  return (
    <>
      <section className="bg-card border border-border rounded-3xl p-6">
        <div className="flex flex-wrap justify-between items-start gap-3 mb-6">
          <div>
            <h3 className="text-base font-bold">Acceptance probability by selectivity</h3>
            <p className="text-xs text-muted-foreground">
              Each dot is a school — click it to jump to that card below
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5 text-[10px] font-medium">
            {MATCH_TIERS.map((tier) => (
              <span key={tier} className={`px-2.5 py-1 rounded-full border ${tierBadgeClass(tier)}`}>{tier}</span>
            ))}
          </div>
        </div>

        <div className="relative bg-secondary/60 border border-border rounded-2xl p-4">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block" role="img" aria-label="Scatter plot of acceptance probability versus selectivity for each recommended university">
            {/* Axis gridlines + tick labels */}
            {TICKS.map((t) => (
              <g key={`x-${t}`}>
                <line x1={scaleX(t)} y1={PAD_TOP} x2={scaleX(t)} y2={H - PAD_BOTTOM} className="stroke-border" strokeWidth={1} />
                <text x={scaleX(t)} y={H - PAD_BOTTOM + 16} textAnchor="middle" className="fill-muted-foreground text-[10px]">{t}</text>
              </g>
            ))}
            {TICKS.map((t) => (
              <g key={`y-${t}`}>
                <line x1={PAD_LEFT} y1={scaleY(t)} x2={W - PAD_RIGHT} y2={scaleY(t)} className="stroke-border" strokeWidth={1} />
                <text x={PAD_LEFT - 8} y={scaleY(t) + 3} textAnchor="end" className="fill-muted-foreground text-[10px]">{t}</text>
              </g>
            ))}

            {/* Tier zone boundaries — approximate probability cutoffs the AI uses per tier */}
            {ZONE_BOUNDARIES.map((b) => (
              <line
                key={b}
                x1={PAD_LEFT}
                y1={scaleY(b)}
                x2={W - PAD_RIGHT}
                y2={scaleY(b)}
                className="stroke-muted-foreground"
                strokeWidth={1.5}
                strokeDasharray="5 4"
                opacity={0.6}
              />
            ))}

            {/* Axis lines */}
            <line x1={PAD_LEFT} y1={PAD_TOP} x2={PAD_LEFT} y2={H - PAD_BOTTOM} className="stroke-foreground/30" strokeWidth={1.5} />
            <line x1={PAD_LEFT} y1={H - PAD_BOTTOM} x2={W - PAD_RIGHT} y2={H - PAD_BOTTOM} className="stroke-foreground/30" strokeWidth={1.5} />

            {/* Axis titles */}
            <text x={(PAD_LEFT + (W - PAD_RIGHT)) / 2} y={H - 4} textAnchor="middle" className="fill-muted-foreground text-[11px] font-medium">
              Selectivity (higher = more competitive)
            </text>
            <text x={PAD_LEFT} y={14} textAnchor="start" className="fill-muted-foreground text-[11px] font-medium">
              Chance %
            </text>

            {/* Data points */}
            {results.map((u) => {
              const isHovered = hovered?.universityId === u.universityId
              return (
                <a key={u.universityId} href={`#university-${u.universityId}`} tabIndex={0}>
                  <circle
                    cx={scaleX(u.baselineSelectivity)}
                    cy={scaleY(u.acceptanceProbability)}
                    r={isHovered ? 8 : 6}
                    className={`${tierDotClass(u.matchTier)} stroke-background cursor-pointer transition-[r]`}
                    strokeWidth={2}
                    onMouseEnter={() => setHovered(u)}
                    onMouseLeave={() => setHovered((h) => (h === u ? null : h))}
                    onFocus={() => setHovered(u)}
                    onBlur={() => setHovered((h) => (h === u ? null : h))}
                  />
                </a>
              )
            })}
          </svg>

          {hovered && (
            <div
              className="pointer-events-none absolute bg-popover border border-border rounded-xl px-3 py-2 text-[11px] shadow-lg z-10 whitespace-nowrap -translate-x-1/2 -translate-y-full"
              style={{ left: `${tooltipLeftPct}%`, top: `${tooltipTopPct}%`, marginTop: '-10px' }}
            >
              <div className="font-semibold text-foreground">{hovered.name}</div>
              <div className="text-muted-foreground">{hovered.matchTier} · {hovered.acceptanceProbability}% chance · {hovered.baselineSelectivity}/100 selectivity</div>
            </div>
          )}
        </div>
      </section>

      <section className="bg-card border border-border rounded-3xl p-6">
        <h3 className="text-sm font-bold mb-3">How to interpret this chart</h3>
        <ul className="text-xs text-muted-foreground space-y-2">
          <li><strong className="text-foreground font-semibold">Selectivity (x-axis):</strong> how competitive each school is to get into (0–100, higher = more competitive).</li>
          <li><strong className="text-foreground font-semibold">Chance % (y-axis):</strong> the AI&apos;s estimated probability you&apos;re admitted to that specific school, given your profile.</li>
          <li><span className="text-primary font-semibold">Safety zone:</span> ~75%+ chance — you comfortably exceed the typical bar.</li>
          <li><span className="text-chart-5 font-semibold">Good Chance zone:</span> ~45–70% chance — competitive, on par with typical admits.</li>
          <li><span className="text-chart-2 font-semibold">Reach zone:</span> ~15–40% chance — below the typical bar but plausible.</li>
          <li><span className="text-chart-3 font-semibold">Ultra Reach zone:</span> below ~15% chance — extremely selective, long odds.</li>
          <li>Each dot is one recommended school, color-coded by its tier — click a dot (or a card below) to jump straight to it.</li>
        </ul>
      </section>
    </>
  )
}
