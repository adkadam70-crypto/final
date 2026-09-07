import Link from 'next/link'
import { AppLogo } from '@/components/app-logo'

export const metadata = {
  title: 'Why we built Shortlisted',
}

export default function AboutPage() {
  return (
    <main className="min-h-svh bg-background text-foreground px-4 sm:px-8 py-12">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="flex items-center gap-2 mb-8 w-fit">
          <AppLogo className="h-7 w-auto" />
          <span className="text-base font-bold tracking-tight">Shortlisted</span>
        </Link>

        <h1 className="text-2xl font-bold tracking-tight mb-1">Why we built Shortlisted</h1>
        <p className="text-sm text-muted-foreground mb-10">The problem, and what we did about it.</p>

        <div className="space-y-8 text-sm text-muted-foreground leading-relaxed [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mb-2 [&_strong]:text-foreground">
          <section>
            <h2>The problem</h2>
            <p>
              Almost every college-chances tool out there assumes one thing: you&apos;re a US student with a
              4.0-scale GPA. Type in a CBSE percentage, A-Level grades, or an IB score, and most of them either
              break, force a rough conversion that throws away real information, or just don&apos;t exist for your
              curriculum at all. If you&apos;re applying outside the US — or with a non-US curriculum to any
              country — you&apos;re mostly on your own, guessing.
            </p>
          </section>

          <section>
            <h2>What we built instead</h2>
            <p>
              Shortlisted was built to actually handle real curricula — CBSE, A-Levels/AS-Levels, IB Diploma, and
              US GPA — properly, not as an afterthought. It covers 750+ real universities across eight countries
              (US, UK, Australia, Singapore, Hong Kong, India, Germany &amp; France), and every match or acceptance
              estimate is grounded in named, citable sources: U.S. News &amp; World Report, the U.S. Department of
              Education&apos;s College Scorecard, NIRF, The Complete University Guide, Times Higher Education, and
              QS World University Rankings — never a made-up number.
            </p>
          </section>

          <section>
            <h2>Who it&apos;s for</h2>
            <p>
              Mainly 11th and 12th graders trying to build a realistic shortlist — schools that are genuine
              reaches, solid matches, and safeties, based on their actual profile and actual data, not vibes. We
              also built in tools to track your target schools, understand your profile&apos;s strengths and gaps,
              and get a deep-dive analysis on any specific university you&apos;re considering.
            </p>
          </section>

          <section>
            <h2>What we&apos;re not</h2>
            <p>
              We&apos;re not a guarantee, and we say so directly when we don&apos;t have a real published number
              for a school rather than inventing one. Shortlisted is meant to replace guesswork with data — not
              replace your school counselor, and not promise an outcome no one can promise.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
