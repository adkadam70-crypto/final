'use client'

import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

// Shared full-page chrome for every auth surface (sign-in, sign-up,
// forgot-password, reset-password) — a dark glass card over an animated
// teal glow, replacing the old plain <Card> wrapper. Colors are pulled from
// the app's existing theme tokens (--background/--card/--primary/--border in
// app/globals.css, already a near-black + teal palette), not a new
// hardcoded palette. Extracted once so this markup isn't duplicated across
// four form files.
//
// The border-light-beam effect below is a direct port of the reference
// "sign-in-card-2" component's animation structure (four independently-timed
// beams chasing around the perimeter, permanently animating — not
// hover-triggered), recolored from white/purple to the app's teal --primary.
// The reference also had a mouse-position 3D tilt on this card — dropped per
// feedback, kept only the glowing border strip.
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-svh bg-background relative overflow-hidden flex items-center justify-center px-4 py-10">
      {/* Soft top-down teal glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />
      <motion.div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[120vh] h-[60vh] rounded-b-full bg-primary/15 blur-[100px]"
        animate={{ opacity: [0.35, 0.6, 0.35], scale: [0.98, 1.02, 0.98] }}
        transition={{ duration: 8, repeat: Infinity, repeatType: 'mirror' }}
      />
      <div className="absolute left-1/4 top-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px]" />
      <div className="absolute right-1/4 bottom-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="relative">
          <div className="relative group">
            {/* Pulsing card glow, brighter on hover */}
            <motion.div
              className="absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-70 transition-opacity duration-700"
              animate={{
                boxShadow: [
                  '0 0 10px 2px color-mix(in oklch, var(--primary) 15%, transparent)',
                  '0 0 18px 6px color-mix(in oklch, var(--primary) 25%, transparent)',
                  '0 0 10px 2px color-mix(in oklch, var(--primary) 15%, transparent)',
                ],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', repeatType: 'mirror' }}
            />

            {/* Four light beams permanently traveling around the border, each
                offset in time so together they read as one continuous light
                chasing the perimeter — not tied to hover or cursor position. */}
            <div className="absolute -inset-px rounded-3xl overflow-hidden pointer-events-none">
              <motion.div
                className="absolute top-0 left-0 h-[2px] w-1/2 bg-gradient-to-r from-transparent via-primary to-transparent opacity-70"
                animate={{ left: ['-50%', '100%'], opacity: [0.3, 0.8, 0.3] }}
                transition={{
                  left: { duration: 2.5, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1 },
                  opacity: { duration: 1.2, repeat: Infinity, repeatType: 'mirror' },
                }}
              />
              <motion.div
                className="absolute top-0 right-0 w-[2px] h-1/2 bg-gradient-to-b from-transparent via-primary to-transparent opacity-70"
                animate={{ top: ['-50%', '100%'], opacity: [0.3, 0.8, 0.3] }}
                transition={{
                  top: { duration: 2.5, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1, delay: 0.6 },
                  opacity: { duration: 1.2, repeat: Infinity, repeatType: 'mirror', delay: 0.6 },
                }}
              />
              <motion.div
                className="absolute bottom-0 right-0 h-[2px] w-1/2 bg-gradient-to-r from-transparent via-primary to-transparent opacity-70"
                animate={{ right: ['-50%', '100%'], opacity: [0.3, 0.8, 0.3] }}
                transition={{
                  right: { duration: 2.5, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1, delay: 1.2 },
                  opacity: { duration: 1.2, repeat: Infinity, repeatType: 'mirror', delay: 1.2 },
                }}
              />
              <motion.div
                className="absolute bottom-0 left-0 w-[2px] h-1/2 bg-gradient-to-b from-transparent via-primary to-transparent opacity-70"
                animate={{ bottom: ['-50%', '100%'], opacity: [0.3, 0.8, 0.3] }}
                transition={{
                  bottom: { duration: 2.5, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1, delay: 1.8 },
                  opacity: { duration: 1.2, repeat: Infinity, repeatType: 'mirror', delay: 1.8 },
                }}
              />

              {/* Corner glow spots, right where the beams hand off to each other */}
              <motion.div className="absolute top-0 left-0 h-[6px] w-[6px] rounded-full bg-primary blur-[1px]" animate={{ opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 2, repeat: Infinity, repeatType: 'mirror' }} />
              <motion.div className="absolute top-0 right-0 h-[8px] w-[8px] rounded-full bg-primary blur-[2px]" animate={{ opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 2.4, repeat: Infinity, repeatType: 'mirror', delay: 0.5 }} />
              <motion.div className="absolute bottom-0 right-0 h-[8px] w-[8px] rounded-full bg-primary blur-[2px]" animate={{ opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 2.2, repeat: Infinity, repeatType: 'mirror', delay: 1 }} />
              <motion.div className="absolute bottom-0 left-0 h-[6px] w-[6px] rounded-full bg-primary blur-[1px]" animate={{ opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 2.3, repeat: Infinity, repeatType: 'mirror', delay: 1.5 }} />
            </div>

            {/* Card border glow, brighter on hover */}
            <div className="absolute -inset-px rounded-3xl bg-gradient-to-r from-primary/5 via-primary/15 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative bg-card/80 backdrop-blur-xl rounded-3xl p-6 border border-border shadow-2xl overflow-hidden">
              {children}
            </div>
          </div>
        </div>
      </motion.div>
    </main>
  )
}
