export const MATCH_TIERS = ['Safety', 'Good Chance', 'Reach', 'Ultra Reach'] as const
export type MatchTier = (typeof MATCH_TIERS)[number]

// Single source of truth for tier colors — previously duplicated across
// probability-graph.tsx, university-card.tsx, saved-schools-view.tsx, and
// dashboard/page.tsx independently. chart-5 (blue) was previously unused;
// chart-4 (purple) is now the unused one.
const TIER_BADGE_CLASSES: Record<MatchTier, string> = {
  Safety: 'bg-primary/15 text-primary border-primary/25',
  'Good Chance': 'bg-chart-5/15 text-chart-5 border-chart-5/25',
  Reach: 'bg-chart-2/15 text-chart-2 border-chart-2/25',
  'Ultra Reach': 'bg-chart-3/15 text-chart-3 border-chart-3/25',
}

const TIER_BAR_CLASSES: Record<MatchTier, string> = {
  Safety: 'bg-primary',
  'Good Chance': 'bg-chart-5',
  Reach: 'bg-chart-2',
  'Ultra Reach': 'bg-chart-3',
}

const FALLBACK_BADGE = 'bg-secondary text-muted-foreground border-border'
const FALLBACK_BAR = 'bg-muted-foreground'

// Old saved rows may still carry the pre-rename 'Target' tier (or any other
// unrecognized string) — degrade to a neutral fallback instead of an
// undefined/invisible style.
export function tierBadgeClass(tier: string): string {
  return TIER_BADGE_CLASSES[tier as MatchTier] ?? FALLBACK_BADGE
}

export function tierBarClass(tier: string): string {
  return TIER_BAR_CLASSES[tier as MatchTier] ?? FALLBACK_BAR
}
