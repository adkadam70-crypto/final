'use client'

import type { MatchResult } from '@/lib/db/schema'

// Plain module-level singleton, deliberately NOT React state and NOT
// sessionStorage/localStorage. /matches, /profile, and /saved are separate
// route segments (each with its own layout.tsx, no shared layout below
// root), so navigating between them fully unmounts MatchesView — plain
// useState there was wiping the results the moment a student clicked away
// to check their profile. A module-level variable survives that unmount
// (the module itself stays loaded for the life of the page), while still
// resetting on an actual browser refresh (the module re-executes from
// scratch then) — sessionStorage would wrongly survive a refresh too.
type MatchState = { results: MatchResult[]; summary: string }

const EMPTY_STATE: MatchState = { results: [], summary: '' }
let state: MatchState = EMPTY_STATE
const listeners = new Set<() => void>()

export function getMatchState(): MatchState {
  return state
}

// Replaces wholesale (never merged) — a fresh match run should fully
// replace the previous one, never blend with it.
export function setMatchState(next: MatchState) {
  state = next
  listeners.forEach((listener) => listener())
}

export function subscribeMatchState(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// The server never has a match result to render (matches only exist after
// a client-side AI call), so its snapshot is always the same empty state —
// matches the pre-existing initial useState([]) behavior exactly.
export function getMatchServerSnapshot(): MatchState {
  return EMPTY_STATE
}
