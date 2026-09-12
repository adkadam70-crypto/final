'use client'

import { useEffect, useRef, useState } from 'react'
import { getLiveStats, type LiveStats } from '@/app/actions/stats'

// Counts up from 0 to the real value once the section scrolls into view —
// IntersectionObserver-triggered, not scroll-jacked (see this whole page's
// history of bugs from exactly that on sections that didn't need it). The
// numbers themselves are a real DB query (see app/actions/stats.ts), never
// padded — this site's whole pitch is "real data, never a guess," so this
// counter has to hold to that too, even while the real numbers are small.
function useCountUp(target: number, active: boolean, durationMs = 1200) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!active) return
    if (target <= 0) {
      setValue(0)
      return
    }
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      // ease-out cubic — fast start, gentle settle, reads as "counting up"
      // rather than a linear tick.
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(Math.round(eased * target))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, active, durationMs])

  return value
}

export function LiveStatsCounter() {
  const [stats, setStats] = useState<LiveStats | null>(null)
  const [inView, setInView] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getLiveStats().then(setStats).catch(() => setStats({ matchesRun: 0, studentsConnected: 0 }))
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
