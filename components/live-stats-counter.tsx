'use client'

import { useEffect, useRef, useState } from 'react'
import { getLiveStats, type LiveStats } from '@/app/actions/stats'

// Counts up from 0 to the real value once the section scrolls into view —
// IntersectionObserver-triggered, not scroll-jacked (see this whole page's
// history of bugs from exactly that on sections that didn't need it). The
// numbers themselves are a real DB query (see app/actions/stats.ts), never
// padded — this site's whole pitch is "real data, never a guess," so this
// counter has to hold to that too, even while the real numbers are small.
//
// Linear, time-locked climb: progress is driven off elapsed wall-clock time
// (via requestAnimationFrame), not a fixed per-integer delay — a fixed delay
// per step means a bigger target (e.g. 177) takes proportionally longer no
// matter how small durationMs is set, which is what made this feel slow.
// Tied to actual time, the whole climb always finishes in durationMs
// regardless of the target's size.
//
// The counter now polls for fresh real numbers while the page stays open
// (see POLL_INTERVAL_MS below), so `target` can change more than once.
// Only the FIRST activation animates from 0 — later target changes (a real
// new match/profile came in since the last poll) animate from whatever is
// currently on screen up to the new number, so a live update reads as a
// small bump, not the counter resetting itself back to zero.
function useCountUp(target: number, active: boolean, durationMs = 600) {
  const [value, setValue] = useState(0)
  const valueRef = useRef(0)
  const hasStarted = useRef(false)

  useEffect(() => {
    if (!active) return
    if (target <= 0) {
      setValue(0)
      valueRef.current = 0
      return
    }
    const from = hasStarted.current ? valueRef.current : 0
    hasStarted.current = true
    if (from === target) return

    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      const next = Math.round(from + (target - from) * t)
      valueRef.current = next
      setValue(next)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, active, durationMs])

  return value
}

// How often to re-check the real DB numbers while the page is open — real
// students matching/signing up elsewhere should show up here without a
// page refresh. Not aggressive: this is a cheap aggregate COUNT(*), and a
// visitor sitting on the landing page for many minutes is the rare case,
// not the common one.
const POLL_INTERVAL_MS = 20000

export function LiveStatsCounter() {
  const [stats, setStats] = useState<LiveStats | null>(null)
  const [inView, setInView] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    const load = () => {
      getLiveStats()
        .then((s) => {
          if (!cancelled) setStats(s)
        })
        .catch(() => {
          if (!cancelled) setStats((prev) => prev ?? { matchesRun: 0, studentsConnected: 0 })
        })
    }
    load()
    const interval = setInterval(load, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.4 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const matchesRun = useCountUp(stats?.matchesRun ?? 0, inView && stats !== null)
  const studentsConnected = useCountUp(stats?.studentsConnected ?? 0, inView && stats !== null)

  return (
    <div ref={ref} className="flex flex-wrap justify-center gap-x-12 gap-y-4">
      {/* No box/border — floats directly on the hero gradient. A flat gray
          failed depending on where the gradient's brightness happened to
          sit at that scroll position; plain white read as too bold/heavy
          against the bright glow. A light teal (close to --primary) with a
          dark drop-shadow keeps contrast everywhere without being either. */}
      <div className="text-center">
        <p className="text-3xl sm:text-4xl font-bold text-[#a8f0d8] tabular-nums [filter:drop-shadow(0_2px_6px_rgb(0_0_0_/_0.55))]">{matchesRun.toLocaleString()}</p>
        <p className="text-xs sm:text-sm font-bold text-white/90 uppercase tracking-wider mt-1.5 flex items-center justify-center gap-1.5 [filter:drop-shadow(0_1px_3px_rgb(0_0_0_/_0.5))]">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Matches run
        </p>
      </div>
      <div className="text-center">
        <p className="text-3xl sm:text-4xl font-bold text-[#a8f0d8] tabular-nums [filter:drop-shadow(0_2px_6px_rgb(0_0_0_/_0.55))]">{studentsConnected.toLocaleString()}+</p>
        <p className="text-xs sm:text-sm font-bold text-white/90 uppercase tracking-wider mt-1.5 flex items-center justify-center gap-1.5 [filter:drop-shadow(0_1px_3px_rgb(0_0_0_/_0.5))]">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Students connected
        </p>
      </div>
    </div>
  )
}
