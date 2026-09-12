'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { UserCog, Globe2, Target, ChevronDown } from 'lucide-react'
import { HeroScrollVideoReveal, type TagItem } from '@/components/ui/hero-scroll-video-pin-reveal'
import { GlobeFocusReveal } from '@/components/globe-focus-reveal'
import { LiquidButton } from '@/components/ui/liquid-glass-button'
import Velaris from '@/components/ui/velaris'
import { marigold } from '@/lib/fonts'
import { AppLogo } from '@/components/app-logo'
import { useIsReturningUser } from '@/lib/returning-user'
import { LiveStatsCounter } from '@/components/live-stats-counter'
import { Footer } from '@/components/ui/footer-section'

// A visitor previously had no way to know HOW the product works, or to
// sign up, without scrolling well past the hero and the country/globe
// section — this is what actually explains the mechanism. Lives inside the
// hero's own first screen (not a separate section below). Plain content,
// no scroll-jacking/GSAP — this whole page's scroll history this session
// is a long list of bugs caused by exactly that, on sections that didn't
// need it. A static grid needs no animation to be effective.
const HOW_IT_WORKS = [
  { icon: UserCog, title: 'Build your profile', body: "Enter your curriculum, grades, test scores, and activities — on your own curriculum's own terms, not forced onto a US-style scale." },
  { icon: Globe2, title: 'Pick your countries', body: 'Target one country or all eight at once. The same profile is checked against every one of them in parallel.' },
  { icon: Target, title: 'See your real odds', body: 'A tiered chance estimate per university — reach, target, or safety — grounded in real selectivity data, never a guess.' },
]

// The heading/tags section starts at opacity:0 baked directly into the
// server-rendered HTML (see hero-scroll-video-pin-reveal.tsx) — it only
// becomes visible once React hydrates and that component's own scroll
// effect runs. Real report: scrolling into that section during the brief
// window before hydration finishes showed a blank gap (right content
// height reserved, nothing rendered in it yet), which resolved itself
// exactly when Velaris's WebGL background started animating — the same
// moment hydration completes. Blocking input until that same signal fires
// means the user only ever sees the fully-hydrated, correctly-revealed
// page, never the pre-hydration blank window. Safe to do now in a way it
// wasn't before: Lenis (removed) used to fight any input-blocking overlay
// via its own capture-phase listener; native scroll has no such listener
// to fight, so a plain overlay + overflow:hidden is enough on its own.
const READY_SETTLE_MS = 150

// Dark box + teal border/text (matching the step cards) rather than a
// filled bright pill — the boxed-card treatment moved here from the stats
// row above it, which now floats with no box instead. "970+ real
// universities" dropped entirely since the stats row right above already
// shows that exact number — no need to repeat it a second time immediately
// below.
const FEATURE_TAGS: TagItem[] = [
  { text: 'US · UK · AU · SG · HK · IN · DE · FR', background: 'var(--card)', color: 'var(--primary)', border: 'var(--primary)' },
  { text: 'Tiered acceptance odds', background: 'var(--card)', color: 'var(--primary)', border: 'var(--primary)' },
  { text: 'Bias-checked analysis', background: 'var(--card)', color: 'var(--primary)', border: 'var(--primary)' },
  { text: 'Personalized action plan', background: 'var(--card)', color: 'var(--primary)', border: 'var(--primary)' },
]

// Real catalog numbers (Sept 2026 snapshot) — same convention as the "970+"
// figure already used elsewhere on this page, never an invented number.
// Labels deliberately worded differently from the near-identical category
// names other admissions tools use for the same 4 numbers (universities/
// countries/curricula/fields), even though the underlying facts are the same.
const STATS = [
  { value: '970+', label: 'Real universities' },
  { value: '8', label: 'Countries we cover' },
  { value: '7', label: 'Grading systems handled' },
]

export function Landing() {
  const router = useRouter()
  // First-time visitors never see the top-right Sign In/Sign Up — it's
  // only for returning users who have an account and are currently signed
  // out (see lib/returning-user.ts). New visitors still get Sign In/Get
  // Started further down, once they've scrolled to the bottom CTA.
  const isReturningUser = useIsReturningUser()
  const [ready, setReady] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ready) return
    const html = document.documentElement
    const prevOverflow = html.style.overflow
    html.style.overflow = 'hidden'
    return () => {
      html.style.overflow = prevOverflow
    }
  }, [ready])

  useEffect(() => {
    if (ready) return
    const el = overlayRef.current
    if (!el) return
    // Real (non-React-synthetic) listeners, not JSX onWheel/onTouchMove —
    // React attaches those as passive by default for wheel/touch, which
    // silently makes preventDefault() a no-op. {passive:false} here is
    // what actually blocks the gesture. overflow:hidden above covers most
    // browsers on its own; this covers touch scroll's more inconsistent
    // cross-browser behavior. Clicks are blocked too, purely by this
    // element sitting on top of everything in the DOM hit-test — no
    // separate click handler needed for that part.
    const block = (e: Event) => {
      e.preventDefault()
      e.stopPropagation()
    }
    el.addEventListener('wheel', block, { passive: false })
    el.addEventListener('touchmove', block, { passive: false })
    return () => {
      el.removeEventListener('wheel', block)
      el.removeEventListener('touchmove', block)
    }
  }, [ready])

  return (
    <main className="min-h-svh text-foreground">
      {/* Opaque until the background has actually rendered (plus a short
          settle buffer for the rest of the page's own scroll-reveal effects
          to have mounted too) — see the effects above and Velaris's
          onReady below. Hides the whole page underneath (not just blocking
          input) so the very first thing shown is the fully-hydrated,
          already-animating page, never a static/blank in-between frame. */}
      {!ready && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6 bg-[#0b0d11]"
          aria-hidden="true"
        >
          <AppLogo className="h-12 w-auto animate-pulse" />
          <div
            className="h-8 w-8 rounded-full border-2 border-primary/25 border-t-primary animate-spin"
            style={{ animationDuration: '0.8s' }}
          />
        </div>
      )}
      {/* Fixed (not scrolled-with-content) so one shader instance covers the
          entire page — every section below is transparent so this shows
          through everywhere, not just inside the pinned reveal circle.
          Deliberately no negative z-index: <body> paints its own opaque
          --background color as the page root, and a negative z-index here
          renders behind that root paint instead of in front of it. Plain
          DOM order (this first, real content after) stacks correctly
          without fighting that. */}
      <Velaris
        height="100vh"
        className="fixed inset-0"
        onReady={() => {
          window.setTimeout(() => setReady(true), READY_SETTLE_MS)
        }}
      />
      <HeroScrollVideoReveal
        topBrand={
          <div className="flex items-center gap-2.5">
            <AppLogo className="h-8 w-auto sm:h-9" />
            {/* Wordmark hidden below sm — at mobile widths this, plus the
                Sign In/Sign Up text on the right, don't both fit without
                overlapping. Icon alone is enough for the corner. */}
            <span className="hidden sm:inline text-2xl font-bold tracking-tight">Shortlisted</span>
          </div>
        }
        topRight={
          // Lives only on this first screen and scrolls away with it —
          // it used to be page-level `fixed`, which kept it pinned over
          // every later section (including the globe reveal's cards),
          // which is exactly what it shouldn't do.
          isReturningUser ? (
            <div className="flex items-center gap-5 sm:gap-6">
              <button
                type="button"
                onClick={() => router.push('/sign-in')}
                className="text-sm font-semibold text-foreground/90 hover:text-foreground transition-colors"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => router.push('/sign-up')}
                className="text-sm font-semibold text-foreground/90 hover:text-foreground transition-colors"
              >
                Sign Up
              </button>
            </div>
          ) : undefined
        }
        topText={
          <span className={marigold.className}>
            Admissions season is full of guesses.
            <br />
            We replaced ours with data.
          </span>
        }
        topCta={
          <>
            {/* Live counter sits right under the headline, before any CTA —
                real proof before the ask, not after it. */}
            <div className="mt-6">
              <LiveStatsCounter />
            </div>

            {/* Folded into this same first screen (not a separate section
                below) so a visitor sees the whole pitch — headline, proof,
                mechanism, and CTA — with zero scrolling on desktop. */}
            <div className="w-full max-w-5xl mx-auto mt-20 sm:mt-28">
              <p className="text-center text-xs font-bold uppercase tracking-widest text-primary mb-2">The Shortlisted method</p>
              <h2 className="text-center text-[clamp(1.25rem,2.5vw,2rem)] font-bold tracking-tight text-balance mb-8">
                One profile, eight countries, zero guesswork.
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {HOW_IT_WORKS.map((step, i) => (
                  <div key={step.title} className="bg-card border border-border rounded-3xl p-6 text-left">
                    <div className="w-10 h-10 rounded-xl bg-accent/60 flex items-center justify-center mb-4">
                      <step.icon className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1.5">Step {i + 1}</p>
                    <h3 className="text-lg font-bold tracking-tight mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA now sits below the mechanism, not above it — a visitor
                reads what they're signing up for before being asked to. */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mt-12">
              <LiquidButton onClick={() => router.push('/sign-up')}>Get Started</LiquidButton>
              <Link
                href="/sign-in"
                className="inline-flex items-center justify-center gap-2 border border-border text-foreground font-semibold text-sm px-6 py-3.5 rounded-2xl hover:bg-muted hover:-translate-y-0.5 transition-all"
              >
                Sign In
              </Link>
            </div>

            <Link
              href="/about"
              className="block text-center text-sm font-semibold text-foreground/80 hover:text-primary underline underline-offset-4 decoration-foreground/30 hover:decoration-primary transition-colors mt-7"
            >
              Why we built Shortlisted
            </Link>

            {/* Scroll-down hint, right side of the first screen. */}
            <div className="hidden sm:flex absolute right-4 sm:right-8 bottom-8 flex-col items-center gap-1.5 text-muted-foreground/60 animate-bounce">
              <span className="text-[10px] font-semibold uppercase tracking-widest [writing-mode:vertical-rl]">Scroll</span>
              <ChevronDown className="w-4 h-4" />
            </div>
          </>
        }
        headingText={
          <span className={marigold.className}>
            Real odds. Real universities.
            <br />
            Across eight countries.
          </span>
        }
        aboveTags={
          // Floating — no box/border, just the numbers directly on the
          // gradient (the boxed-card treatment lives on the tags row below
          // instead).
          <div className="flex flex-wrap justify-center gap-x-8 sm:gap-x-12 gap-y-4 mb-6 sm:mb-8">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-extrabold text-primary tabular-nums">{s.value}</p>
                <p className="text-xs sm:text-sm font-semibold text-foreground/80 uppercase tracking-wider mt-1 leading-tight">{s.label}</p>
              </div>
            ))}
          </div>
        }
        tags={FEATURE_TAGS}
        subText="Every recommendation is grounded in real selectivity data for real universities — not guesswork."
        // Mounted immediately (not gated on `ready`) so its data fetch and
        // dot-generation work start in parallel with everything else,
        // exactly like every other section — it has 280vh of scroll runway
        // before the user reaches it, so it needs a head start, not a
        // delay. The dot-generation loop itself is chunked across idle
        // callbacks now (see wireframe-dotted-globe.tsx) so it no longer
        // blocks the main thread for seconds the way it used to; that was
        // the real fix, not deferring when this mounts.
        afterBenefit={<GlobeFocusReveal />}
        bottomText={
          <span className={marigold.className}>
            Stop guessing.
            <br />
            See exactly where you stand.
          </span>
        }
      >
        <section className="relative z-10 px-4 pb-24 pt-4 flex flex-col items-center">
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <LiquidButton onClick={() => router.push('/sign-up')}>Get Started</LiquidButton>
            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center gap-2 border border-border text-foreground font-semibold text-sm px-6 py-3.5 rounded-2xl hover:bg-muted hover:-translate-y-0.5 transition-all"
            >
              Sign In
            </Link>
          </div>
          <div className="text-center mt-12 max-w-2xl px-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Sourced from real, credible publications</p>
            <p className="text-xs text-muted-foreground leading-relaxed text-pretty">
              Every ranking and acceptance rate we cite is pulled from named, citable sources — U.S. News &amp; World Report,
              the U.S. Department of Education&apos;s College Scorecard, NIRF (India&apos;s official government ranking framework),
              The Complete University Guide (UK), Times Higher Education (Australia, Germany &amp; France), and QS World
              University Rankings (Singapore &amp; Hong Kong). Where a real published number doesn&apos;t exist yet for a
              school, we say so — never a guess dressed up as fact.
            </p>
          </div>
          <p className="text-center text-sm font-semibold text-primary mt-8">Shortlisted</p>
        </section>
      </HeroScrollVideoReveal>
      <Footer />
    </main>
  )
}
