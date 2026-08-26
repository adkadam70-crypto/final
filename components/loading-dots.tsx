'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'

/**
 * Three-dot bounce loader — replaces the generic spinner icon for moments
 * where the model is actively "thinking," so it reads as a live process
 * rather than a static "AI is loading" glyph.
 */
export function LoadingDots({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (!ref.current) return
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      gsap.set(ref.current.children, { clearProps: 'transform' })
      gsap.timeline({ repeat: -1 }).to(ref.current.children, {
        y: -6,
        duration: 0.35,
        stagger: { each: 0.12, yoyo: true, repeat: 1 },
        ease: 'power1.inOut',
      })
    },
    { scope: ref },
  )

  return (
    <div ref={ref} className={`flex items-center gap-1 ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
    </div>
  )
}
