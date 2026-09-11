'use client'

import { cn } from '@/lib/utils'

export interface VelarisProps {
  bg?: string
  colors?: string[]
  height?: string
  className?: string
  children?: React.ReactNode
}

// Was a live WebGL noise shader (continuous requestAnimationFrame loop,
// canvas context, shader compilation) — replaced entirely with a static CSS
// gradient after repeated real-device reports of the landing page freezing
// on load with scroll input getting captured-then-dumped as a big jump. The
// WebGL loop was never conclusively proven as the direct cause (removing
// Lenis, below, is the more likely fix for the scroll half of that bug),
// but it was a real, continuously-running piece of main-thread work with no
// payoff worth the risk on a page this reliability-sensitive — a plain CSS
// background paints synchronously with the rest of the page, can't stutter,
// can't run a moment behind, and has no "is it ready yet" question to
// answer at all. Static by design (not just by omission) — matches the
// explicit ask to keep this "the same throughout" rather than animating.
const DEFAULT_COLORS = ['#00ccab', '#007a66', '#062420', '#0b0d11']
const DEFAULT_BG = '#0b0d11'

const Velaris = ({ bg = DEFAULT_BG, colors = DEFAULT_COLORS, height = '100vh', className, children }: VelarisProps) => {
  const [c1, c2, c3] = colors

  return (
    <div style={{ height, background: bg }} className={cn('relative w-full overflow-hidden', className)}>
      <div
        className="absolute inset-0"
        style={{
          background: [
            `radial-gradient(60% 50% at 50% 32%, ${c1}59 0%, transparent 70%)`,
            `radial-gradient(50% 45% at 28% 72%, ${c2}42 0%, transparent 70%)`,
            `radial-gradient(45% 42% at 76% 62%, ${c3}38 0%, transparent 70%)`,
          ].join(', '),
        }}
      />
      <div className="relative z-10 h-full w-full">{children}</div>
    </div>
  )
}

export default Velaris
