'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Info, X } from 'lucide-react'
import { getProfileLevel, type ProfileLevelResult } from '@/app/actions/profile-level'
import { EmeraldIcon } from '@/components/emerald-icon'

const LAST_SEEN_LEVEL_KEY = 'shortlisted-emerald-last-seen-level'
const CACHED_RESULT_KEY = 'shortlisted-emerald-cached-result'

// Navbar remounts fresh on every top-level route change (each layout —
// /dream, /profile, /dashboard — renders its own <Navbar>), so a badge
// that only ever starts from `data: null` blanks out and reloads on every
// single navigation — that's the "keeps disappearing" report. Hydrating
// synchronously from a locally-cached copy of the LAST successful fetch
// means the badge renders immediately on mount with (very slightly) stale
// numbers while a fresh fetch quietly updates it in the background,
// instead of flashing to nothing every time.
function readCachedResult(): ProfileLevelResult | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(CACHED_RESULT_KEY)
    return raw ? (JSON.parse(raw) as ProfileLevelResult) : null
  } catch {
    return null
  }
}

function useProfileLevel() {
  const [data, setData] = useState<ProfileLevelResult | null>(() => readCachedResult())
  const [justLeveledUp, setJustLeveledUp] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getProfileLevel()
      .then((result) => {
        if (cancelled) return
        setData(result)
        localStorage.setItem(CACHED_RESULT_KEY, JSON.stringify(result))
        const lastSeen = Number(localStorage.getItem(LAST_SEEN_LEVEL_KEY) ?? 0)
        if (lastSeen > 0 && result.level > lastSeen) setJustLeveledUp(true)
        localStorage.setItem(LAST_SEEN_LEVEL_KEY, String(result.level))
      })
      .catch((err) => {
        if (cancelled) return
        console.error('getProfileLevel failed:', err)
        setError((prev) => (readCachedResult() ? prev : err instanceof Error ? err.message : 'Failed to load profile level'))
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { data, justLeveledUp, error }
}

// Small modal explaining what the emerald actually represents — reachable
// from the (i) button next to the gem inside the popover, same pattern as
// Build Your Dream's own info modal (components/dream-builder.tsx).
function EmeraldInfoModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-3xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-3">
          <h2 className="text-base font-bold tracking-tight">What is this emerald?</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-2.5 text-xs text-muted-foreground leading-relaxed">
          <p>It's a visual read on how strong and complete your Shortlisted profile is — a single gem that grows and brightens as you do more of the real work that actually improves your odds.</p>
          <p>The score is a composite of 4 things, weighted by how much they actually matter:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><span className="font-semibold text-foreground">Main profile (40 pts)</span> — the foundation everything else builds on</li>
            <li><span className="font-semibold text-foreground">Build Your Dream (20 pts)</span> — onboarding, a confirmed field, countries added</li>
            <li><span className="font-semibold text-foreground">Universities tracked (20 pts)</span> — real schools you're actively building toward</li>
            <li><span className="font-semibold text-foreground">AI matches &amp; analyses (20 pts)</span> — actually using the tools, not just filling in forms</li>
          </ul>
          <p>5 levels: Uncut, Rough-Cut, Polished, Faceted, Brilliant — the gem itself changes shape and glow at each one, with a brief animation the moment you level up.</p>
        </div>
      </div>
    </div>
  )
}

// The actual breakdown content — used by the navbar's popover, the only
// place this shows now (no longer also duplicated as a standing box on the
// profile page).
function EmeraldDetail({ data, iconSize, animate, onInfoClick }: { data: ProfileLevelResult; iconSize: number; animate: boolean; onInfoClick: () => void }) {
  const { breakdown } = data
  const rows: { label: string; value: number; max: number }[] = [
    { label: 'Main profile', value: breakdown.profile, max: 40 },
    { label: 'Build Your Dream', value: breakdown.dream, max: 20 },
    { label: 'Universities tracked', value: breakdown.universities, max: 20 },
    { label: 'AI matches & analyses', value: breakdown.aiActivity, max: 20 },
  ]
  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      {/* An (i) button sitting on the gem's own corner used to overlap and
          visually hide part of the crystal at this icon's small size — it
          lives next to the level name instead now, clear of the image. */}
      <div className="shrink-0">
        <EmeraldIcon level={data.level} size={iconSize} animate={animate} />
      </div>
      <div className="flex-1 w-full min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <p className="text-xl font-extrabold tracking-tight text-foreground">{data.levelName}</p>
          <p className="text-sm font-semibold text-primary">{data.score}/100</p>
          <button
            type="button"
            onClick={onInfoClick}
            aria-label="What does this represent?"
            className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/15 text-primary hover:bg-primary/25 transition-colors shrink-0"
          >
            <Info className="w-3 h-3" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground mb-4">{data.nextLevelScore != null ? `${data.nextLevelScore - data.score} points to your next level.` : "You've reached the top level."}</p>
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.label}>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-muted-foreground">{r.label}</span>
                <span className="text-foreground/70 font-medium">{r.value}/{r.max}</span>
              </div>
              <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(r.value / r.max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-primary font-medium mt-4">{data.hint}</p>
      </div>
    </div>
  )
}

// Small, ALWAYS-visible badge next to the account area on every
// authenticated page (it lives in Navbar) — clicking it opens the detail
// breakdown in a popover.
//
// The popover is rendered through a PORTAL straight into document.body,
// not as a normal absolutely-positioned child here — Navbar's own <nav>
// has a CSS mask-image (for the bottom fade-out effect), and a mask
// clips the ENTIRE painted output of that element, including any
// absolutely-positioned descendant that visually extends below it. The
// popover was invisible every time: not a z-index problem, the mask was
// erasing it before it ever reached the screen. Rendering it through a
// portal escapes that ancestor entirely.
export function EmeraldBadgeSmall() {
  const { data, justLeveledUp } = useProfileLevel()
  const [open, setOpen] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [coords, setCoords] = useState<{ top: number; right: number } | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const updateCoords = () => {
      const rect = buttonRef.current?.getBoundingClientRect()
      if (rect) setCoords({ top: rect.bottom + 8, right: window.innerWidth - rect.right })
    }
    updateCoords()
    window.addEventListener('resize', updateCoords)
    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (buttonRef.current?.contains(target) || popoverRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => {
      window.removeEventListener('resize', updateCoords)
      document.removeEventListener('mousedown', onClickOutside)
    }
  }, [open])

  if (!data) return null

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={`${data.levelName} (${data.score}/100) — click for details`}
        className="flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 pl-1 pr-2.5 py-1 hover:border-primary/40 transition-colors shrink-0"
      >
        <EmeraldIcon level={data.level} size={22} animate={justLeveledUp} />
        <span className="text-sm font-semibold text-foreground/80">{data.score}</span>
      </button>
      {open &&
        coords &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={popoverRef}
            className="fixed w-80 max-w-[90vw] bg-card border border-border rounded-3xl p-5 shadow-2xl z-[65]"
            style={{ top: coords.top, right: coords.right }}
          >
            <EmeraldDetail data={data} iconSize={72} animate={justLeveledUp} onInfoClick={() => setShowInfo(true)} />
          </div>,
          document.body,
        )}
      {/* Same masked-<nav>-ancestor problem as the popover above — this has
          to portal out too, or it renders but never becomes visible. */}
      {showInfo && typeof document !== 'undefined' && createPortal(<EmeraldInfoModal onClose={() => setShowInfo(false)} />, document.body)}
    </>
  )
}
