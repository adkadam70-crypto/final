import Link from 'next/link'
import { AppLogo } from '@/components/app-logo'
import { ADMIN_EMAIL } from '@/lib/admin'

export const metadata = {
  title: 'Terms of Service — Shortlisted',
}

export default function TermsPage() {
  return (
    <main className="min-h-svh bg-background text-foreground px-4 sm:px-8 py-12">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="flex items-center gap-2 mb-8 w-fit">
          <AppLogo className="h-7 w-auto" />
          <span className="text-base font-bold tracking-tight">Shortlisted</span>
        </Link>

        <h1 className="text-2xl font-bold tracking-tight mb-1">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-10">
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          {' · '}
          See also our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
        </p>

        <div className="space-y-8 text-sm text-muted-foreground leading-relaxed [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mb-2 [&_strong]:text-foreground">
          <section>
            <h2>1. What Shortlisted is</h2>
            <p>
              Shortlisted is a college-admissions tool. You enter your academic profile — grades, curriculum, test
              scores, and target countries/fields of study — and we generate university match tiers, acceptance-odds
              estimates, and per-school analyses. Estimates are generated with the help of an AI model and grounded
              in named, citable sources (see the &quot;Sourced from&quot; section on the landing page) — they are
              informational only, not a guarantee of any admissions outcome, and should not replace advice from your
              school counselor or the universities themselves.
            </p>
          </section>

          <section>
            <h2>2. Account &amp; eligibility</h2>
            <p>
              You need an account to use Shortlisted, either by email/password or by signing in with Google.
              You&apos;re responsible for keeping your credentials secure and for any activity under your account.
              Shortlisted is intended for prospective students (typically high-school age); if you are under 18, you
              should have a parent or guardian&apos;s permission to use it. Do not create more than one account, or
              use false information at sign-up.
            </p>
          </section>

          <section>
            <h2>3. Your data</h2>
            <p>
              What we collect, why, and who we share it with is covered in full in our{' '}
              <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link> — including what
              data Google shares with us if you sign in with Google.
            </p>
          </section>

          <section>
            <h2>4. Fair use &amp; account suspension</h2>
            <p>
              To keep the service free and fast for everyone, AI-powered features (match runs, school lookups,
              profile-strength checks) are rate-limited per account. Accounts found abusing the service — automated
              scraping, deliberately circumventing rate limits, creating multiple accounts to evade them, or any
              other bad-faith use — may be suspended, with the reason communicated to you directly.
            </p>
          </section>

          <section>
            <h2>5. Changes to these terms</h2>
            <p>
              We may update this page as the product changes. Material changes will be reflected here with an
              updated date at the top; continued use of Shortlisted after a change means you accept the update.
            </p>
          </section>

          <section>
            <h2>6. Contact</h2>
            <p>
              Questions about these terms or your data? Email <a href={`mailto:${ADMIN_EMAIL}`} className="text-primary hover:underline">{ADMIN_EMAIL}</a>.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
