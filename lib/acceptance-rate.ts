import type { AcceptanceRateInfo } from '@/lib/db/schema'

// Resolves the four raw universities columns into the one fact the UI and
// the AI prompts should use. Priority: a real published rate always wins;
// then our own estimate; then an explicit "no rate" note; then null.
// See lib/db/schema.ts (AcceptanceRateInfo) and
// scripts/migrate-add-estimated-acceptance-rate.mjs for the discipline.
export function resolveAcceptanceRate(u: {
  actualAcceptanceRate: number | null
  acceptanceRateSource: string | null
  estimatedAcceptanceRate: number | null
  acceptanceRateNote: string | null
}): AcceptanceRateInfo {
  if (u.actualAcceptanceRate != null && u.acceptanceRateSource) {
    return { kind: 'official', rate: u.actualAcceptanceRate, source: u.acceptanceRateSource }
  }
  if (u.estimatedAcceptanceRate != null && u.acceptanceRateNote) {
    return { kind: 'estimated', rate: u.estimatedAcceptanceRate, note: u.acceptanceRateNote }
  }
  if (u.acceptanceRateNote) {
    return { kind: 'unspecified', note: u.acceptanceRateNote }
  }
  return null
}

// The line handed to the AI prompts. Real rates are cited plainly; estimates
// are flagged hard so the model never presents them with the confidence of a
// published figure; "unspecified" tells the model there is nothing to lean on.
export function acceptanceRateForPrompt(info: AcceptanceRateInfo): string {
  if (!info) return 'Not on file.'
  if (info.kind === 'official') {
    return `${info.rate}% overall admit rate, per ${info.source} — a real published figure, not an estimate.`
  }
  if (info.kind === 'estimated') {
    return `~${info.rate}% is OUR RESEARCH ESTIMATE, not a figure the university certifies (${info.note}). Anchor acceptanceProbability on it exactly as you would a real published rate, then adjust proportionately for this student's grades, tests, activities and country fit — but in the rationale say explicitly that the rate is an estimate, never state it as fact. baselineSelectivity was derived from this same number, so don't treat the two as separate signals.`
  }
  return `No published or credibly estimable acceptance rate — ${info.note} Ground selectivity on ranking and baselineSelectivity instead, and do not invent a percentage.`
}
