'use client'

import { useRef, type ReactNode } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import Link from 'next/link'

// Unified action+metric card: pairs a live number (this card's own data
// binding, animated in via the same GSAP count-up as before) with the
// action that made sense to place right underneath it, instead of the
// action living in a separate card stacked on top of this one.
export function StatCard({
  icon,
  label,
  value,
  suffix = '',
  valueClassName = 'text-white',
  description,
  hint,
  actionHref,
  actionLabel,
}: {
  icon: ReactNode
  label: string
  value: number
  suffix?: string
  valueClassName?: string
  description: string
  hint: string
  actionHref: string
  actionLabel: string
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
    <div className="bg-zinc-900/60 border border-white/10 hover:border-white/20 rounded-2xl p-5 flex flex-col justify-between transition-all backdrop-blur-xl">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 text-zinc-400">
          {icon}
          <span className="text-[11px] font-mono tracking-wider">{label}</span>
        </div>
        <span className={`text-3xl font-bold font-mono ${valueClassName}`}>
          <span ref={numRef}>0{suffix}</span>
        </span>
      </div>
      <div>
        <p className="text-xs text-zinc-300 mt-3 leading-relaxed min-h-[2.5rem]">{description}</p>
        <p className="text-[11px] font-mono text-zinc-500 mt-1">{hint}</p>
      </div>
      <Link
        href={actionHref}
        className="text-xs font-semibold text-white flex items-center gap-1.5 hover:text-emerald-400 transition-colors pt-4 border-t border-white/5 mt-4"
      >
        {actionLabel} →
      </Link>
    </div>
  )
}
