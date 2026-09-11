'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

// Only LiquidButton (+ its own variants/filter) from the source component —
// this file already has a shadcn Button (components/ui/button.tsx) with a
// different variant system, so re-exporting a second "Button"/"buttonVariants"
// here would collide with it. MetalButton wasn't requested, so it's dropped
// rather than kept as unused dead code.
const liquidButtonVariants = cva(
  "relative inline-flex items-center transition-colors justify-center cursor-pointer gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-[3px] focus-visible:ring-primary/50",
  {
    variants: {
      variant: {
        // Teal glow ring on hover — same look the WebGL liquid-metal button
        // used (0 0 0 1px var(--primary) + a soft primary-tinted spread),
        // recreated here as plain CSS since this button has no JS hover state.
        // Base is transparent by default in the source component, which lets
        // whatever's behind it (our teal landing gradient) bleed through the
        // glass — an explicit dark gradient fill keeps it reading as a solid
        // black pill on any background, matching the reference look.
        // Solid ring, zero blur radius — a blurred glow bled its teal color
        // into the SVG glass-distortion filter underneath and came out as a
        // streaky smear across the button face instead of a clean edge.
        default:
          'bg-[linear-gradient(180deg,#202020_0%,#000000_100%)] hover:scale-[1.03] duration-300 transition text-foreground hover:shadow-[0_0_0_2px_var(--primary)]',
        // Plain frosted glass — no solid black fill, no primary-color glow
        // ring. Just a faint white tint over whatever's behind it (so the
        // liquid-distortion filter reads as glass, not as a dark pill) that
        // brightens slightly on hover.
        glass: 'bg-white/10 hover:bg-white/15 hover:scale-[1.03] duration-300 transition text-foreground border border-white/15',
      },
      size: {
        default: 'h-11 px-10 has-[>svg]:px-4',
        sm: 'h-9 text-xs gap-1.5 px-4 has-[>svg]:px-4',
        lg: 'h-12 px-8 has-[>svg]:px-6',
        icon: 'size-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function LiquidButton({
  className,
  variant,
  size,
  asChild = false,
  fullWidth,
  children,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof liquidButtonVariants> & {
    asChild?: boolean
    /** Stretch to the width of its container instead of the intrinsic size. */
    fullWidth?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(liquidButtonVariants({ variant, size, className }), fullWidth && 'w-full')}
      {...props}
    >
      <div
        className="absolute top-0 left-0 z-0 h-full w-full rounded-full
            shadow-[0_0_6px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.08),inset_3px_3px_0.5px_-3px_rgba(0,0,0,0.9),inset_-3px_-3px_0.5px_-3px_rgba(0,0,0,0.85),inset_1px_1px_1px_-0.5px_rgba(0,0,0,0.6),inset_-1px_-1px_1px_-0.5px_rgba(0,0,0,0.6),inset_0_0_6px_6px_rgba(0,0,0,0.12),inset_0_0_2px_2px_rgba(0,0,0,0.06),0_0_12px_rgba(255,255,255,0.15)]
        transition-all
        dark:shadow-[0_0_8px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.08),inset_3px_3px_0.5px_-3.5px_rgba(255,255,255,0.09),inset_-3px_-3px_0.5px_-3.5px_rgba(255,255,255,0.85),inset_1px_1px_1px_-0.5px_rgba(255,255,255,0.6),inset_-1px_-1px_1px_-0.5px_rgba(255,255,255,0.6),inset_0_0_6px_6px_rgba(255,255,255,0.12),inset_0_0_2px_2px_rgba(255,255,255,0.06),0_0_12px_rgba(0,0,0,0.15)]"
      />
      <div
        className="absolute top-0 left-0 isolate -z-10 h-full w-full overflow-hidden rounded-full"
        style={{ backdropFilter: 'url("#liquid-glass-button-filter")' }}
      />
      <div className="pointer-events-none z-10 flex items-center gap-2">{children}</div>
      <GlassFilter />
    </Comp>
  )
}

function GlassFilter() {
  return (
    <svg className="hidden">
      <defs>
        <filter id="liquid-glass-button-filter" x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.05 0.05" numOctaves="1" seed="1" result="turbulence" />
          <feGaussianBlur in="turbulence" stdDeviation="2" result="blurredNoise" />
          <feDisplacementMap in="SourceGraphic" in2="blurredNoise" scale="70" xChannelSelector="R" yChannelSelector="B" result="displaced" />
          <feGaussianBlur in="displaced" stdDeviation="4" result="finalBlur" />
          <feComposite in="finalBlur" in2="finalBlur" operator="over" />
        </filter>
      </defs>
    </svg>
  )
}

export { LiquidButton, liquidButtonVariants }
