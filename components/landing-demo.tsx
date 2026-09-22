'use client'

// The live landing page — "Ignition Terminal" hero + 5-stage modal
// walkthrough. Wired in from app/page.tsx.
//
// Stages auto-advance on a timer (self-filling segmented progress bar,
// same mechanism as the earlier inline auto-play version) — no Continue
// button. Each stage's content reveals one item at a time on its own
// stagger, same as before. "Back" is the only manual control: it steps
// backward through stages, and from stage 1 it exits the whole sequence
// back to the hero.
//
// Numbers throughout are real: 3,500+ universities / 8 countries is the
// actual catalog size; 7,700+ program-specific rankings / 1,400+
// universities with sourced program data is this session's actual
// program-ranking build (see the many scripts/seed-program-rankings-*.mjs
// files). Sample odds in Stage 3 are explicitly labeled a sample — never
// presented as a real prediction for the visitor.

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence, useAnimation, type PanInfo } from 'framer-motion'
import {
  ArrowRight,
  ArrowLeft,
  X,
  MapPin,
  Sun,
  Award,
  ScanSearch,
  GitCompareArrows,
  SlidersHorizontal,
  Library,
  BadgeCheck,
  ShieldCheck,
} from 'lucide-react'
import RotatingEarth from '@/components/ui/wireframe-dotted-globe'
import Velaris from '@/components/ui/velaris'
import { AppLogo } from '@/components/app-logo'
import { LiquidButton } from '@/components/ui/liquid-glass-button'
import { Footer } from '@/components/ui/footer-section'
import { TestimonialCard, type TestimonialAuthor } from '@/components/ui/testimonial-card'
import { tierBadgeClass } from '@/lib/match-tier'

const STAGE_COUNT = 5

// Real student feedback, collected directly — no handles/photos attached
// since these aren't public social accounts.
const LANDING_TESTIMONIALS: Array<{ author: TestimonialAuthor; text: string }> = [
  { author: { name: 'Mahi Singh', badge: 'IBDP Student' }, text: "Ngl this saved me so much time. I used to spend hours cross checking schools myself, now I just get a straight answer." },
  { author: { name: 'Ishan Chabria', badge: 'IBDP Student' }, text: "What I liked most is it actually tells you which universities you have a real shot at and which ones are a stretch, instead of just leaving you to guess." },
  { author: { name: 'Anaya Kadam', badge: 'ICSE Student' }, text: "Genuinely such a wonderful tool, it made the whole process feel a lot less overwhelming." },
  { author: { name: 'Rida Khalfay', badge: 'IBDP Student' }, text: "The Build Your Dream feature is my favorite part fr. It helped me figure out exactly what to work on in my profile." },
  { author: { name: 'Chirayu Pinjarkar', badge: 'CBSE Student' }, text: "As a CBSE student there's barely anything built with us in mind, so this one actually stood out." },
  { author: { name: 'Mannat Bathija', badge: 'IBDP Student' }, text: "The program specific rankings are what sold me tbh. It's not just \"this school is good\", it actually breaks down how strong they are in the exact major I'm applying to." },
  { author: { name: 'Geet Doshi', badge: 'IBDP Student' }, text: "I was so lost trying to figure out where I even had a shot, this actually gave me a clear starting point instead of just a random list of names." },
  { author: { name: 'Prithviraj Ranavat', badge: 'State Board Student' }, text: "Being on State Board, most tools abroad don't even know what to do with my marks. This one actually converted everything properly instead of just guessing." },
  { author: { name: 'Katyayini Sinha', badge: 'IBDP Student' }, text: "The bias-checked analysis is what got me honestly, felt like an actually honest read on my predicted grades instead of just telling me what I wanted to hear." },
  { author: { name: 'Neel Bode', badge: 'A-Levels Student' }, text: "Applying to the US with A-Levels always felt confusing until this. It actually explained how my grades stack up instead of leaving me to guess." },
]

const COUNTRY_CHIPS = [
  { label: 'United States', stat: '1600+ universities' },
  { label: 'United Kingdom', stat: '220+ universities' },
  { label: 'Germany', stat: '440+ universities' },
  { label: 'India', stat: '540+ universities' },
  { label: 'France', stat: '420+ universities' },
  { label: 'Singapore & Hong Kong', stat: '35+ universities' },
]

// Real catalog schools, real-shaped tiers/probabilities — labeled as a
// sample so nobody mistakes it for their own run.
const SAMPLE_RESULTS = [
  { name: 'University of Michigan Ann Arbor', location: 'Ann Arbor, Michigan', climate: 'Cold', tier: 'Good Chance', probability: 62, rank: 'Rank #21 overall (U.S. News)' },
  { name: 'University of Toronto', location: 'Toronto, Ontario', climate: 'Cold', tier: 'Reach', probability: 34, rank: 'Rank #29 (QS World)' },
  { name: 'Purdue University Main Campus', location: 'West Lafayette, Indiana', climate: 'Cold', tier: 'Safety', probability: 84, rank: '#12 in Engineering (U.S. News)' },
  { name: 'Imperial College London', location: 'London, England', climate: 'Balanced', tier: 'Ultra Reach', probability: 11, rank: 'Rank #2 (Complete University Guide)' },
]

const PROCESS_STEPS = [
  { icon: ScanSearch, title: 'Profile Parsing', body: "Your curriculum, grades, test scores, and activities — read on your own curriculum's own terms, not forced onto a US-style scale." },
  { icon: GitCompareArrows, title: 'Historical Cohort Matching', body: 'Checked against real, sourced selectivity data for each school — not a single generic prestige score reused everywhere.' },
  { icon: SlidersHorizontal, title: 'Rigor Normalization', body: 'IB, A-Levels, AP, or a national board — every curriculum is weighed on its own terms before any school comparison happens.' },
]

// Real research figures from this catalog — see scripts/seed-program-
// rankings-*.mjs (dozens of them, one per source/country/field batch).
const RESEARCH_FACTS = [
  { icon: Library, value: '7,700+', label: 'Program-specific rankings', body: 'Not just "this school is good" — which major, at which school, ranked by which named source.' },
  { icon: BadgeCheck, value: '1,400+', label: 'Universities with sourced data', body: 'NIRF, QS by Subject, Complete University Guide, EduRank, College Factual, Thotis, ARWU — citable, every time.' },
  { icon: ShieldCheck, value: '0', label: 'Invented numbers', body: 'If a real published figure doesn’t exist for a school yet, we say so — never a guess dressed up as fact.' },
]

const slideVariants = {
  enter: { opacity: 0, x: 24 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
}

// Per-stage timing (ms): how long each stage's items take to stagger in,
// how long it holds after the last item before auto-advancing, and the
// total (used to drive the segment's own fill animation). Stage 5 has no
// "total" — it's the end of the line, no auto-advance, Back only.
const STAGE_TIMING = {
  1: { stagger: 500, itemCount: PROCESS_STEPS.length, holdAfter: 1800 },
  2: { stagger: 500, itemCount: COUNTRY_CHIPS.length, holdAfter: 1600 },
  3: { stagger: 320, itemCount: SAMPLE_RESULTS.length, holdAfter: 1800 },
  4: { stagger: 550, itemCount: RESEARCH_FACTS.length, holdAfter: 2000 },
} as const

function stageDuration(stage: number) {
  const t = STAGE_TIMING[stage as keyof typeof STAGE_TIMING]
  if (!t) return 0
  return t.stagger * t.itemCount + t.holdAfter
}

// Segmented progress bar — completed stages are solid, the active stage
// fills itself over that stage's real duration (linear CSS transition
// re-triggered on stage entry via the two-frame mount flag below), future
// stages stay empty.
function SegmentedProgress({ current }: { current: number }) {
  const [fillActive, setFillActive] = useState(false)

  useEffect(() => {
    setFillActive(false)
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => setFillActive(true))
      return () => cancelAnimationFrame(raf2)
    })
    return () => cancelAnimationFrame(raf1)
  }, [current])

  const duration = stageDuration(current)

  return (
    <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden flex gap-0.5">
      {Array.from({ length: STAGE_COUNT }).map((_, i) => {
        const segment = i + 1
        const isPast = segment < current
        const isActive = segment === current
        return (
          <div key={i} className="flex-1 h-full rounded-full overflow-hidden bg-white/5">
            <div
              className="h-full bg-emerald-400"
              style={{
                width: isPast ? '100%' : isActive && fillActive ? '100%' : '0%',
                transitionProperty: 'width',
                transitionDuration: isActive ? `${duration}ms` : '300ms',
                transitionTimingFunction: isActive ? 'linear' : 'ease-out',
              }}
            />
          </div>
        )
      })}
    </div>
  )
}

// The "Ignition Terminal" — a console-styled card: macOS-dot header, live
// status line, and a slide-to-launch track with a draggable thumb
// (click/tap on either the track or the handle also launches — no
// drag-only dead end for mobile/keyboard users).
function IgnitionTerminal({ onLaunch }: { onLaunch: () => void }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const controls = useAnimation()
  const [launching, setLaunching] = useState(false)

  const fire = () => {
    if (launching) return
    setLaunching(true)
    const track = trackRef.current
    // Track padding is p-2 (8px each side) and the thumb is now 48px wide.
    controls.start({ x: track ? track.clientWidth - 48 - 16 : 380, transition: { type: 'spring', stiffness: 400, damping: 30 } })
    window.setTimeout(onLaunch, 260)
  }

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const track = trackRef.current
    const width = track?.clientWidth ?? 380
    if (info.offset.x > width * 0.75 - 48) {
      fire()
    } else {
      controls.start({ x: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } })
    }
  }

  return (
    // mt-16/mt-20 (64-80px) of breathing room above the terminal, and a
    // larger card overall (max-w-lg, taller track, bigger thumb target) —
    // per landing-page CTA research: 40-60px+ separation from surrounding
    // content, and 44-72px thumb targets read as more confidently tappable
    // than a button sitting right at the minimum.
    <div className="w-full max-w-lg mx-auto mt-8 sm:mt-10 bg-zinc-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-2xl shadow-emerald-950/40 relative">
      {/* Header strip */}
      <div className="flex items-center justify-between mb-5">
        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Admission Engine</span>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full bg-emerald-400 ${launching ? '' : 'animate-pulse'}`} />
          <span className="text-[10px] font-mono text-zinc-400 tracking-wider">
            STATUS: {launching ? 'LAUNCHING' : 'IDLE'}
          </span>
        </div>
      </div>

      {/* Slide-to-launch track */}
      <div
        ref={trackRef}
        role="button"
        tabIndex={0}
        onClick={fire}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fire()}
        className="h-16 bg-black/70 rounded-xl border border-white/10 relative flex items-center px-2 overflow-hidden select-none cursor-pointer"
      >
        <span className="absolute inset-0 flex items-center justify-center text-xs font-mono uppercase tracking-[0.2em] text-zinc-400 select-none pointer-events-none">
          See your real chances &nbsp;➔
        </span>
        <motion.div
          drag="x"
          dragConstraints={trackRef}
          dragElastic={0.05}
          onDragEnd={handleDragEnd}
          animate={controls}
          whileTap={{ scale: 0.96 }}
          onClick={(e) => {
            e.stopPropagation()
            fire()
          }}
          className="relative z-10 w-12 h-12 rounded-lg bg-emerald-400 text-zinc-950 flex items-center justify-center font-bold shadow-lg shadow-emerald-500/20 cursor-grab active:cursor-grabbing"
        >
          <ArrowRight className="w-5 h-5" />
        </motion.div>
      </div>
    </div>
  )
}

// Small, always-visible strip of auto-scrolling testimonials — sits inside
// the hero itself (not a separate below-the-fold section) so a first-time
// visitor sees real feedback without having to scroll. Full-bleed width
// (breaks out of the hero's centered/padded column) so the loop always has
// enough content to flow continuously, even on wide screens.
function TestimonialsMarqueeStrip({ testimonials }: { testimonials: Array<{ author: TestimonialAuthor; text: string }> }) {
  return (
    <div className="relative mt-8 min-[1800px]:mt-14 w-screen left-1/2 -translate-x-1/2 overflow-hidden">
      <div className="flex overflow-hidden [--gap:0.75rem] [gap:var(--gap)] [--duration:32s]">
        <div className="flex shrink-0 [gap:var(--gap)] animate-[marquee_var(--duration)_linear_infinite] hover:[animation-play-state:paused]">
          {[...Array(2)].map((_, setIndex) =>
            testimonials.map((testimonial, i) => (
              <TestimonialCard
                key={`${setIndex}-${i}`}
                {...testimonial}
                size="compact"
                variant="glass"
                className="w-[220px] p-3 sm:w-[270px] sm:p-3.5"
              />
            )),
          )}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-32 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-32 bg-gradient-to-l from-background to-transparent" />
    </div>
  )
}

export function LandingDemo() {
  const router = useRouter()
  const [isLaunched, setIsLaunched] = useState(false)
  const [currentStage, setCurrentStage] = useState(1)
  const [itemsShown, setItemsShown] = useState(0)
  // Tracks whether the auto-play has reached stage 5 yet — Back first
  // appears there, then stays available on every earlier stage too so it
  // can be clicked all the way back to the hero, not just once.
  const [hasReachedEnd, setHasReachedEnd] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  // Stage 2's globe fetches these two JSON files itself on mount, but that
  // stage is only ~4.6s on screen total — starting both fetches cold right
  // as the user arrives there was a real chunk of why it looked like it was
  // still loading. Warm the browser's HTTP cache for them as soon as the
  // page itself mounts, well before the user ever clicks in, so by the time
  // the globe's own fetch runs it resolves from cache instead of the network.
  useEffect(() => {
    fetch('/ne-110m-land.json').catch(() => {})
    fetch('/ne-50m-our-countries.json').catch(() => {})
  }, [])

  const after = (ms: number, fn: () => void) => {
    const id = setTimeout(fn, ms)
    timers.current.push(id)
  }
  const clearTimers = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }

  useEffect(() => clearTimers, [])

  const launchSequence = () => {
    setCurrentStage(1)
    setHasReachedEnd(false)
    setIsLaunched(true)
  }
  const exitSequence = () => {
    clearTimers()
    setIsLaunched(false)
    setCurrentStage(1)
    setItemsShown(0)
    setHasReachedEnd(false)
  }
  // The only manual control: steps backward. From stage 1, it exits the
  // whole sequence back to the hero ("click back, back, back... and come
  // to the front page again").
  const back = () => {
    if (currentStage === 1) {
      exitSequence()
    } else {
      clearTimers()
      setCurrentStage((s) => s - 1)
    }
  }

  // Drives the per-stage item stagger + auto-advance. Stage 5 has no
  // timing entry — it's the end of the line, Back only.
  useEffect(() => {
    if (!isLaunched) return
    clearTimers()
    setItemsShown(0)
    const timing = STAGE_TIMING[currentStage as keyof typeof STAGE_TIMING]
    if (!timing) {
      // Only stage 5 has no timing entry — the end of the auto-play run.
      setHasReachedEnd(true)
      return
    }
    for (let i = 0; i < timing.itemCount; i++) {
      after(timing.stagger * (i + 1), () => setItemsShown(i + 1))
    }
    after(timing.stagger * timing.itemCount + timing.holdAfter, () => {
      setCurrentStage((s) => Math.min(STAGE_COUNT, s + 1))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLaunched, currentStage])

  return (
    <main className="dark min-h-svh text-foreground bg-background font-sans">
      <Velaris height="100vh" className="fixed inset-0" />

      {/* ---------- STICKY HEADER ---------- */}
      <header className="fixed top-0 inset-x-0 z-20 h-12 flex items-center justify-between px-6 sm:px-8 border-b border-white/5 bg-white/[0.02] backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <AppLogo className="h-7 w-auto sm:h-8" />
          <span className="hidden sm:inline text-xl font-bold tracking-tight">Shortlisted</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push('/sign-in')}
            className="text-sm font-semibold text-foreground/70 hover:text-foreground transition-colors"
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => router.push('/sign-up')}
            className="text-sm font-semibold rounded-full border border-white/15 bg-white/[0.04] backdrop-blur-xl px-4 py-1.5 hover:bg-white/[0.08] hover:border-white/25 transition-colors"
          >
            Sign Up
          </button>
        </div>
      </header>

      {/* ---------- HERO: distraction-free "Ignition Terminal" ---------- */}
      <section
        className="min-h-[min(80vh,620px)] flex flex-col items-center justify-center px-4 pt-20 pb-10 min-[1800px]:pt-28 min-[1800px]:pb-16 relative overflow-hidden"
        style={{
          backgroundImage: 'radial-gradient(circle at center, rgba(6,78,59,0.25), rgba(9,9,11,0.0) 60%)',
        }}
      >
        <div className="flex flex-col items-center text-center space-y-4 max-w-3xl mx-auto relative z-10">
          <span className="text-[11px] font-mono tracking-widest text-emerald-400/90 bg-emerald-950/50 border border-emerald-500/20 px-3 py-1 rounded-full inline-block">
            ✦ AI ADMISSIONS INTELLIGENCE
          </span>

          {/* Headline restored to the styling from before the Ignition
              Terminal rebuild — gradient fade instead of flat white, which
              was reported as blending into the background. */}
          <h1 className="text-[clamp(2.25rem,6vw,5rem)] font-bold tracking-tight text-balance leading-[1.05] bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent max-w-3xl mx-auto">
            Stop guessing your reach schools.
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 max-w-lg mx-auto font-normal leading-relaxed">
            Run your GPA, test scores, and activities through our predictive admissions model.
          </p>
        </div>

        {/* Keyed on isLaunched so exiting the sequence remounts the
            terminal fresh — otherwise its internal "launching" state (and
            the STATUS label) stays stuck on LAUNCHING after Back/Exit. */}
        <IgnitionTerminal key={String(isLaunched)} onLaunch={launchSequence} />

        <p className="mt-8 text-xs font-mono text-zinc-300 text-center tracking-wide relative z-10">
          ✦ Benchmarked against 3,500+ universities across 8 countries
        </p>

        <TestimonialsMarqueeStrip testimonials={LANDING_TESTIMONIALS} />
      </section>

      <Footer />

      {/* ---------- 5-STAGE CINEMATIC OVERLAY ---------- */}
      <AnimatePresence>
        {isLaunched && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            // Transparent (not solid black) so the same Velaris animated
            // background from the hero/main landing page shows through
            // every stage — only a light dark wash + blur for text
            // legibility, not an opaque cover.
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xl flex flex-col justify-between p-6 md:p-12"
          >
            {/* Top nav */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AppLogo className="h-7 w-auto" />
                <span className="hidden sm:inline text-lg font-bold tracking-tight text-white">Shortlisted</span>
              </div>
              <SegmentedProgress current={currentStage} />
              <button
                type="button"
                onClick={exitSequence}
                aria-label="Exit"
                className="w-9 h-9 rounded-full border border-white/10 bg-white/[0.04] flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stage container */}
            <div className="flex-1 flex items-center justify-center overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStage}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="w-full max-w-4xl mx-auto px-4"
                >
                  {currentStage === 1 && <StageProcess shown={itemsShown} />}
                  {currentStage === 2 && <StageGlobe shown={itemsShown} />}
                  {currentStage === 3 && <StageOdds shown={itemsShown} />}
                  {currentStage === 4 && <StageEngine shown={itemsShown} />}
                  {currentStage === 5 && <StageSignup router={router} />}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bottom controls — Back first appears once auto-play has
                finished (stage 5, the final page); stages 1-4 advance
                themselves, so a manual control isn't needed to arrive here.
                From then on it stays visible on every stage, so a student
                can keep clicking Back through 5→4→3→2→1 and then out to the
                hero, not just once. No Continue: every stage advances
                itself once its items have finished revealing. */}
            <div className="flex items-center justify-between h-9">
              {hasReachedEnd && (
                <button
                  type="button"
                  onClick={back}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              )}
              <span />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}

// ---------- STAGE CONTENT ----------
// Every stage reveals its items one at a time (`shown` = how many are
// visible so far), same stagger-reveal pattern as the earlier inline
// auto-play version — just replayed inside this horizontal-progress
// overlay instead.

function StageHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <div className="text-center mb-10">
      <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-emerald-400/80 mb-3">{eyebrow}</p>
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white text-balance mb-2">{title}</h2>
      <p className="text-sm text-zinc-400 max-w-lg mx-auto text-pretty">{subtitle}</p>
    </div>
  )
}

function RevealItem({ visible, children }: { visible: boolean; children: React.ReactNode }) {
  return (
    <div
      className="transition-all duration-500 ease-out"
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)' }}
    >
      {children}
    </div>
  )
}

function StageProcess({ shown }: { shown: number }) {
  return (
    <div>
      <StageHeading eyebrow="Stage 1 of 5" title="How We Analyze Your Profile" subtitle="Three passes, every time — before a single school is compared." />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {PROCESS_STEPS.map((step, i) => (
          <RevealItem key={step.title} visible={i < shown}>
            <div className="rounded-3xl border border-border bg-card p-6 text-left h-full">
              <div className="w-10 h-10 rounded-xl bg-accent/60 flex items-center justify-center mb-4">
                <step.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-base font-bold tracking-tight mb-2 text-white">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>
            </div>
          </RevealItem>
        ))}
      </div>
    </div>
  )
}

function StageGlobe({ shown }: { shown: number }) {
  return (
    <div className="flex flex-col items-center">
      <StageHeading eyebrow="Stage 2 of 5" title="Global Admissions Footprint" subtitle="One profile, checked against every country you're targeting — in parallel." />
      <RotatingEarth width={300} height={300} interactive={false} />
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl w-full">
        {COUNTRY_CHIPS.map((c, i) => (
          <RevealItem key={c.label} visible={i < shown}>
            <div className="rounded-xl border border-border bg-card px-3 py-2.5 text-center">
              <p className="text-xs font-bold text-white">{c.label}</p>
              <p className="text-[11px] font-semibold text-primary mt-0.5 font-mono">{c.stat}</p>
            </div>
          </RevealItem>
        ))}
      </div>
    </div>
  )
}

function StageOdds({ shown }: { shown: number }) {
  return (
    <div>
      <StageHeading eyebrow="Stage 3 of 5" title="Predictive Clarity" subtitle="A sample run — reach, target, and safety, never a flat guess. Yours is built from your own profile." />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
        {SAMPLE_RESULTS.map((r, i) => (
          <RevealItem key={r.name} visible={i < shown}>
            <div className="rounded-3xl border border-border bg-card p-5 text-left">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h4 className="text-base font-bold text-balance text-white">{r.name}</h4>
                <span className={`shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full border ${tierBadgeClass(r.tier)}`}>{r.tier}</span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-3">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {r.location}</span>
                <span className="flex items-center gap-1"><Sun className="w-3 h-3 text-chart-2" /> {r.climate}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-chart-4 mb-2">
                <Award className="w-3 h-3" /> {r.rank}
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: i < shown ? `${r.probability}%` : '0%' }} />
              </div>
              <p className="mt-1.5 text-xs font-semibold text-primary font-mono">{r.probability}% estimated chance</p>
            </div>
          </RevealItem>
        ))}
      </div>
    </div>
  )
}

function StageEngine({ shown }: { shown: number }) {
  return (
    <div>
      <StageHeading eyebrow="Stage 4 of 5" title="Deterministic Modeling" subtitle="No other admissions site has done this research — every ranking is per program, per school, per named source." />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
        {RESEARCH_FACTS.map((fact, i) => (
          <RevealItem key={fact.label} visible={i < shown}>
            <div className="rounded-3xl border border-border bg-card p-6 text-left h-full">
              <div className="w-10 h-10 rounded-xl bg-accent/60 flex items-center justify-center mb-4">
                <fact.icon className="w-5 h-5 text-primary" />
              </div>
              <p className="text-2xl font-bold tracking-tight font-mono text-primary">{fact.value}</p>
              <h3 className="text-sm font-bold tracking-tight mt-1 mb-2 text-white">{fact.label}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{fact.body}</p>
            </div>
          </RevealItem>
        ))}
      </div>
    </div>
  )
}

// Reuses the exact closing pitch from the live landing page
// (components/landing.tsx's bottomText/final CTA) instead of a mocked-up
// profile-intake form — a fake form here didn't make sense since the real
// profile intake is the actual sign-up flow, not a preview of one.
function StageSignup({ router }: { router: ReturnType<typeof useRouter> }) {
  return (
    <div className="flex flex-col items-center text-center">
      <h2 className="text-[clamp(1.75rem,5vw,3.25rem)] font-bold tracking-tight text-balance max-w-2xl bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent">
        Stop guessing.
        <br />
        See exactly where you stand.
      </h2>
      <div className="mt-10 flex flex-col items-center gap-2">
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <LiquidButton onClick={() => router.push('/sign-up')}>Get Started</LiquidButton>
          <button
            type="button"
            onClick={() => router.push('/sign-in')}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] backdrop-blur-xl text-white font-semibold text-sm px-6 py-3.5 hover:bg-white/[0.08] hover:-translate-y-0.5 transition-all"
          >
            Sign In
          </button>
        </div>
        <p className="text-xs font-mono text-muted-foreground/70 mt-1">Free · No credit card required</p>
      </div>
    </div>
  )
}
