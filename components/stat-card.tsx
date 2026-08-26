'use client'

import { useRef, type ReactNode } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'

export function StatCard({
  icon,
  label,
  value,
  suffix = '',
  hint,
}: {
  icon: ReactNode
  label: string
  value: number
  suffix?: string
  hint: string
}) {
  const numRef = useRef<HTMLSpanElement>(null)

  useGSAP(() => {
    if (!numRef.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      numRef.current.textContent = value + suffix
      return
    }
    const counter = { val: 0 }
    gsap.to(counter, {
      val: value,
      duration: 0.8,
      ease: 'power2.out',
      onUpdate: () => {
        if (numRef.current) numRef.current.textContent = Math.round(counter.val) + suffix
      },
    })
  }, [value, suffix])

  return (
    <div className="bg-card border border-border rounded-3xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-primary/10 p-2.5 rounded-xl">{icon}</div>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-3xl font-bold mb-1">
        <span ref={numRef}>0{suffix}</span>
      </div>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}
