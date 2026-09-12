'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { HeroScrollVideoReveal, type TagItem } from '@/components/ui/hero-scroll-video-pin-reveal'
import { GlobeFocusReveal } from '@/components/globe-focus-reveal'
import { LiquidButton } from '@/components/ui/liquid-glass-button'
import Velaris from '@/components/ui/velaris'
import { marigold } from '@/lib/fonts'
import { AppLogo } from '@/components/app-logo'
import { useIsReturningUser } from '@/lib/returning-user'

const FEATURE_TAGS: TagItem[] = [
  { text: 'US · UK · AU · SG · HK · India · Germany · France', background: 'var(--primary)', color: 'var(--primary-foreground)' },
  { text: '970+ real universities', background: 'var(--chart-5)', color: '#ffffff' },
  { text: 'Tiered acceptance odds', background: 'var(--chart-2)', color: '#1a1a1a' },
  { text: 'Bias-checked analysis', background: 'var(--chart-3)', color: '#ffffff' },
]

export function Landing() {
  const router = useRouter()
  // First-time visitors never see the top-right Sign In/Sign Up — it's
  // only for returning users who have an account and are currently signed
  // out (see lib/returning-user.ts). New visitors still get Sign In/Get
  // Started further down, once they've scrolled to the bottom CTA.
  const isReturningUser = useIsReturningUser()

  return (
    <main className="min-h-svh text-foreground">
      {/* Fixed (not scrolled-with-content) so one shader instance covers the
          entire page — every section below is transparent so this shows
          through everywhere, not just inside the pinned reveal circle.
          Deliberately no negative z-index: <body> paints its own opaque
          --background color as the page root, and a negative z-index here
          renders behind that root paint instead of in front of it. Plain
          DOM order (this first, real content after) stacks correctly
          without fighting that. */}
      <Velaris height="100vh" className="fixed inset-0" />
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
        headingText={
          <span className={marigold.className}>
            Real odds. Real universities.
            <br />
            Across eight countries.
          </span>
        }
        tags={FEATURE_TAGS}
        subText="Every recommendation is grounded in real selectivity data for real universities — not vibes, and not guesswork."
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
    </main>
  )
}
