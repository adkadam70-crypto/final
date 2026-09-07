import Link from 'next/link'
import { AppLogo } from '@/components/app-logo'
import { ADMIN_EMAIL } from '@/lib/admin'

export const metadata = {
  title: 'Terms & Privacy — Shortlisted',
}

export default function TermsPage() {
  return (
    <main className="min-h-svh bg-background text-foreground px-4 sm:px-8 py-12">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="flex items-center gap-2 mb-8 w-fit">
          <AppLogo className="h-7 w-auto" />
          <span className="text-base font-bold tracking-tight">Shortlisted</span>
        </Link>

        <h1 className="text-2xl font-bold tracking-tight mb-1">Terms of Service &amp; Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

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
              You need an account to use Shortlisted. You&apos;re responsible for keeping your password secure and
              for any activity under your account. Shortlisted is intended for prospective students (typically
              high-school age); if you are under 18, you should have a parent or guardian&apos;s permission to use
              it. Do not create more than one account, or use false information at sign-up.
            </p>
          </section>

          <section>
            <h2>3. What data we collect</h2>
            <p>We collect only what&apos;s needed to run the product:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Account data:</strong> the name and email you sign up with, and a securely hashed password (we never store your password in plain text).</li>
              <li><strong>Academic profile data:</strong> whatever you enter — curriculum, grades/scores, extracurriculars, intended field of study, and target countries.</li>
              <li><strong>Usage &amp; abuse-prevention data:</strong> your IP address and a coarse device fingerprint (derived from your browser&apos;s user-agent and language, not a tracking cookie) are logged on sign-up and on AI requests, solely to detect spam accounts and enforce fair-use rate limits.</li>
              <li><strong>Session data:</strong> a single secure session cookie that keeps you signed in. We don&apos;t use third-party advertising or analytics trackers.</li>
            </ul>
          </section>

          <section>
            <h2>4. How your data is used</h2>
            <p>
              Your academic profile is sent to an AI model (OpenAI) to generate match results and analyses. That
              request is deliberately stripped of your name and any signal of ethnicity, nationality, or gender
              before it&apos;s sent — the AI only ever sees academic and preference data, specifically so it can&apos;t
              factor identity into your results. We do not sell your data, and we do not share it with advertisers.
              The only outside parties that ever touch your data are the infrastructure providers that run the
              service (see below), each acting strictly on our instructions.
            </p>
          </section>

          <section>
            <h2>5. Who we share data with</h2>
            <p>Shortlisted is built on a small number of infrastructure providers, each processing only what&apos;s necessary for their role:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>OpenAI</strong> — generates match/analysis results from your (de-identified) academic data.</li>
              <li><strong>Neon</strong> — hosts our database (your account and profile data).</li>
              <li><strong>Vercel</strong> — hosts the application itself.</li>
              <li><strong>Resend</strong> — sends transactional emails (e.g. password resets) on our behalf.</li>
              <li><strong>Cloudflare (Turnstile)</strong> — verifies you&apos;re not a bot at sign-up/sign-in; subject to Cloudflare&apos;s own privacy policy.</li>
            </ul>
          </section>

          <section>
            <h2>6. Data retention &amp; deletion</h2>
            <p>
              We keep your account and profile data for as long as your account exists. There isn&apos;t yet a
              self-service &quot;delete my account&quot; button — to request deletion of your account and all
              associated data, email <a href={`mailto:${ADMIN_EMAIL}`} className="text-primary hover:underline">{ADMIN_EMAIL}</a> and
              we&apos;ll process it promptly.
            </p>
          </section>

          <section>
            <h2>7. Fair use &amp; account suspension</h2>
            <p>
              To keep the service free and fast for everyone, AI-powered features (match runs, school lookups,
              profile-strength checks) are rate-limited per account. Accounts found abusing the service — automated
              scraping, deliberately circumventing rate limits, creating multiple accounts to evade them, or any
              other bad-faith use — may be suspended, with the reason communicated to you directly.
            </p>
          </section>

          <section>
            <h2>8. Changes to these terms</h2>
            <p>
              We may update this page as the product changes. Material changes will be reflected here with an
              updated date at the top; continued use of Shortlisted after a change means you accept the update.
            </p>
          </section>

          <section>
            <h2>9. Contact</h2>
            <p>
              Questions about these terms or your data? Email <a href={`mailto:${ADMIN_EMAIL}`} className="text-primary hover:underline">{ADMIN_EMAIL}</a>.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
