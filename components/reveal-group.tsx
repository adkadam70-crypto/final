'use client'

import { useRef, type ReactNode } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'

/**
 * Staggers its direct children in on mount (and whenever `replay` changes,
 * e.g. when a new set of results replaces the old one). Respects
 * prefers-reduced-motion by skipping straight to the final state.
 */
export function RevealGroup({
  children,
  className,
  stagger = 0.06,
  y = 16,
  replay,
}: {
  children: ReactNode
  className?: string
  stagger?: number
  y?: number
  replay?: unknown
}) {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const count = ref.current?.children.length ?? 0
      if (!ref.current || count === 0) return
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      // Cap the total stagger spread so long lists (e.g. 100+ match results)
      // don't take many seconds for the last item to reveal.
      const maxTotalSpread = 0.6
      const each = count > 1 ? Math.min(stagger, maxTotalSpread / count) : stagger
      gsap.set(ref.current.children, { opacity: 0, y })
      gsap.to(ref.current.children, { opacity: 1, y: 0, duration: 0.4, stagger: each, ease: 'power2.out' })
    },
    { scope: ref, dependencies: [replay] },
  )

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
