'use client'

import type { EmeraldLevel } from '@/lib/emerald-levels'

// Real generated crystal renders (public/emerald/level-{1-5}.png) — all
// re-exported with the black background chroma-keyed out to real alpha
// (brightness itself became the alpha channel), so the crystal sits
// directly on the page's own background instead of inside a visible black
// square. All 5 are .png now (the format itself is what makes the alpha
// channel possible — the originals were opaque .jpg).
function imageSrc(level: EmeraldLevel) {
  return `/emerald/level-${level}.png`
}

// Each image already has its own baked-in glow (dull/none at level 1,
// escalating to a bright cluster at level 5) — this is an ADDITIONAL
// ambient CSS glow layered behind/around it so the badge itself radiates
// into the surrounding UI, not just within the image's own frame. Defined
// at the 104px "big" reference size and scaled down by actual icon size
// below — these used to be flat px values applied at ANY size, so the
// 22px navbar badge got the exact same ~100px blur radius as the 104px
// profile version, visually ballooning far past its own box and
// overlapping/breaking the compact admin navbar's layout next to it.
const GLOW_STRENGTH_AT_104: Record<EmeraldLevel, number> = {
  1: 0,
  2: 16,
  3: 30,
  4: 46,
  5: 64,
}
const GLOW_REFERENCE_SIZE = 104

export function EmeraldIcon({ level, size = 64, animate = false }: { level: EmeraldLevel; size?: number; animate?: boolean }) {
  const glow = GLOW_STRENGTH_AT_104[level] * (size / GLOW_REFERENCE_SIZE)
  return (
    <div
      className={animate ? 'animate-[emerald-level-up_0.9s_ease-out]' : undefined}
      style={{
        width: size,
        height: size,
        position: 'relative',
        display: 'inline-block',
        filter: glow > 0 ? `drop-shadow(0 0 ${glow / 3}px hsl(150 95% 50% / 0.95)) drop-shadow(0 0 ${glow}px hsl(150 90% 55% / 0.6)) drop-shadow(0 0 ${glow * 1.6}px hsl(150 85% 50% / 0.35))` : undefined,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageSrc(level)} alt={`Emerald level ${level}`} width={size} height={size} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    </div>
  )
}
