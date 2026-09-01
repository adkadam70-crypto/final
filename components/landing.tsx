'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { HeroScrollVideoReveal, type TagItem } from '@/components/ui/hero-scroll-video-pin-reveal'
import { LiquidMetalButton } from '@/components/ui/liquid-metal-button'
import { marigold } from '@/lib/fonts'
import { AppLogo } from '@/components/app-logo'

const CAMPUS_BACKGROUND_URL = 'https://upload.wikimedia.org/wikipedia/commons/e/e1/Main_quad_looking_east_at_the_University_of_Rochester.jpg'

const FEATURE_TAGS: TagItem[] = [
  { text: 'US · UK · AU · SG · HK · India', background: 'var(--primary)', color: 'var(--primary-foreground)' },
  { text: '400+ real universities', background: 'var(--chart-5)', color: '#ffffff' },
  { text: 'Tiered acceptance odds', background: 'var(--chart-2)', color: '#1a1a1a' },
  { text: 'Bias-checked analysis', background: 'var(--chart-3)', color: '#ffffff' },
]

// Real names pulled from this app's own university catalog — spans all six
// supported countries. Kept as a static list (not a DB fetch) since this is
// a purely decorative background field, not data the user can act on.
const CENTERPIECE_UNIVERSITIES = [
  'Stanford University',
  'MIT',
  'University of Oxford',
  'National University of Singapore',
  'University of Hong Kong',
  'Indian Institute of Technology Delhi',
  'Harvard University',
  'University of Cambridge',
  'University of Melbourne',
  'Nanyang Technological University',
  'Imperial College London',
  'University of Toronto',
  'Princeton University',
  'University College London',
  'Australian National University',
  'Hong Kong University of Science and Technology',
  'Yale University',
  'University of Edinburgh',
  'University of Sydney',
  'Indian Institute of Technology Bombay',
  'Columbia University',
  'London School of Economics',
  'University of New South Wales',
  'Chinese University of Hong Kong',
  'University of Delhi',
  'Cornell University',
  'University of Manchester',
  'Monash University',
  'University of California, Berkeley',
  'Duke University',
  'University of Chicago',
  'Johns Hopkins University',
  'University of Pennsylvania',
  'Northwestern University',
]

export function Landing() {
  const router = useRouter()
  return (
    <main className="min-h-svh bg-background text-foreground">
      <HeroScrollVideoReveal
        topBrand={
          <div className="flex items-center gap-2.5">
            <AppLogo className="w-9 h-9 rounded-xl" />
            <span className="text-2xl font-bold tracking-tight">Shortlisted</span>
          </div>
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
            Across six countries.
          </span>
        }
        tags={FEATURE_TAGS}
        subText="Every recommendation is grounded in real selectivity data for real universities — not vibes, and not guesswork."
        centerpieceNames={CENTERPIECE_UNIVERSITIES}
        centerpieceBackgroundUrl={CAMPUS_BACKGROUND_URL}
        bottomText={
          <span className={marigold.className}>
            Stop guessing.
            <br />
            See exactly where you stand.
          </span>
        }
      >
        <section className="px-4 pb-24 pt-4 flex flex-col items-center">
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <LiquidMetalButton label="Get Started" onClick={() => router.push('/sign-up')} />
            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center gap-2 border border-border text-foreground font-semibold text-sm px-6 py-3.5 rounded-2xl hover:bg-muted hover:-translate-y-0.5 transition-all"
            >
              Sign In
            </Link>
          </div>
          <p className="text-center text-sm font-semibold text-primary mt-10">Shortlisted</p>
        </section>
      </HeroScrollVideoReveal>
    </main>
  )
}
