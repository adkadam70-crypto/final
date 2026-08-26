'use client'

import React, { useEffect, useRef, type ReactNode } from 'react'

interface GlowCardProps {
  children: ReactNode
  className?: string
  /** HSL hue for the glow. Defaults to the app's teal/turquoise primary. */
  hue?: number
}

/**
 * Wraps children with a cursor-tracking spotlight glow on the border,
 * revealed on hover. Doesn't impose its own background/border/radius —
 * composes on top of whatever styling the child already has, so it can
 * wrap existing cards (bg-card, border, rounded-3xl, etc.) without a clash.
 */
export function GlowCard({ children, className = '', hue = 172 }: GlowCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const syncPointer = (e: PointerEvent) => {
      const card = cardRef.current
      if (!card) return
      const rect = card.getBoundingClientRect()
      card.style.setProperty('--x', (e.clientX - rect.left).toFixed(2))
      card.style.setProperty('--y', (e.clientY - rect.top).toFixed(2))
    }
    document.addEventListener('pointermove', syncPointer)
    return () => document.removeEventListener('pointermove', syncPointer)
  }, [])

  return (
    <div
      ref={cardRef}
      data-glow
      style={
        {
          '--hue': hue,
          '--spotlight-size': '260px',
          position: 'relative',
        } as React.CSSProperties
      }
      className={`group/glow isolate ${className}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover/glow:opacity-100"
        style={{
          background: `radial-gradient(var(--spotlight-size) var(--spotlight-size) at calc(var(--x, 50) * 1px) calc(var(--y, 50) * 1px), hsl(var(--hue) 85% 60% / 0.35), transparent 70%)`,
          padding: '1.5px',
          WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover/glow:opacity-100"
        style={{
          background: `radial-gradient(calc(var(--spotlight-size) * 1.4) calc(var(--spotlight-size) * 1.4) at calc(var(--x, 50) * 1px) calc(var(--y, 50) * 1px), hsl(var(--hue) 85% 55% / 0.08), transparent 70%)`,
        }}
      />
      {children}
    </div>
  )
}
