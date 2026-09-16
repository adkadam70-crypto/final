import Link from 'next/link'
import { AppLogo } from '@/components/app-logo'
import { ADMIN_EMAIL } from '@/lib/admin'

export const metadata = {
  title: 'Privacy Policy — Shortlisted',
}

export default function PrivacyPage() {
  return (
    <main className="min-h-svh bg-background text-foreground px-4 sm:px-8 py-12">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="flex items-center gap-2 mb-8 w-fit">
          <AppLogo className="h-7 w-auto" />
          <span className="text-base font-bold tracking-tight">Shortlisted</span>
        </Link>

        <h1 className="text-2xl font-bold tracking-tight mb-1">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

        <div className="space-y-8 text-sm text-muted-foreground leading-relaxed [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mb-2 [&_strong]:text-foreground">
          <section>
            <h2>1. Overview</h2>
            <p>
              This Privacy Policy explains what personal data Shortlisted (&quot;we,&quot; &quot;us&quot;) collects
              when you use shortlisted.space, why we collect it, how it&apos;s used, who it&apos;s shared with, and
              the choices you have. It applies to every way of signing in, including signing in with Google. See
              our <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link> for the
              rules of using the product itself.
            </p>
          </section>

          <section>
            <h2>2. What data we collect</h2>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Account data:</strong> the name and email you sign up with, and a securely hashed password (we never store your password in plain text) — or, if you sign in with Google, the name, email address, and profile picture Google shares with us for that purpose.</li>
              <li><strong>Academic profile data:</strong> whatever you choose to enter — curriculum, grades/scores, extracurriculars, intended field of study, and target countries.</li>
              <li><strong>Usage &amp; abuse-prevention data:</strong> your IP address and a coarse device fingerprint (derived from your browser&apos;s user-agent and language, not a tracking cookie) are logged on sign-up and on AI requests, solely to detect spam accounts and enforce fair-use rate limits.</li>
              <li><strong>Session data:</strong> a single secure session cookie that keeps you signed in. We don&apos;t use third-party advertising or analytics trackers.</li>
            </ul>
          </section>

          <section>
            <h2>3. Data from &quot;Sign in with Google&quot;</h2>
            <p><strong>What Google user data we access:</strong> if you choose to sign in with Google, we request only
              the standard OAuth <code>openid</code>, <code>email</code>, and <code>profile</code> scopes. Through
              these, Google shares your name, email address, and profile picture with us. We never request, and are
              never given, access to your Gmail, Google Drive, Google Contacts, Calendar, or any other Google
              product or data beyond that basic profile information.
            </p>
            <p className="mt-3">
              <strong>How we use it:</strong> that name, email address, and profile picture are used solely to
              create and authenticate your Shortlisted account (i.e. to know who you are when you sign in) and to
              display your name/picture back to you inside the product. It is never used for advertising, never
              used to train any AI model, and never analyzed for any purpose beyond running your own account.
            </p>
            <p className="mt-3">
              <strong>Who we share it with:</strong> your Google account data (name, email, profile picture) is
              stored only in our own database (hosted by Neon, see Section 5) and is <strong>not</strong> sent to
              OpenAI, not sent to any analytics or advertising service, and not sold, rented, or disclosed to any
              third party — with the sole exception of a legal obligation (e.g. a valid court order) or the
              infrastructure providers strictly necessary to operate the account itself (Section 5).
            </p>
            <p className="mt-3">
              Your use of Google Sign-In is also subject to{' '}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Google&apos;s own Privacy Policy
              </a>. Our use and transfer of information received from Google APIs adheres to the{' '}
              <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Google API Services User Data Policy
              </a>, including the Limited Use requirements.
            </p>
          </section>

          <section>
            <h2>4. How your data is used</h2>
            <p>
              Your academic profile is sent to an AI model (OpenAI) to generate match results and analyses. That
              request is deliberately stripped of your name and any signal of ethnicity, nationality, or gender
              before it&apos;s sent — the AI only ever sees academic and preference data, specifically so it
              can&apos;t factor identity into your results. We do not sell your data, and we do not share it with
              advertisers. The only outside parties that ever touch your data are the infrastructure providers that
              run the service (below), each acting strictly on our instructions.
            </p>
          </section>

          <section>
            <h2>5. Who we share data with</h2>
            <p>Shortlisted is built on a small number of infrastructure providers, each processing only what&apos;s necessary for their role:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Google</strong> — provides Sign in with Google, if you choose to use it. Google user data (name, email, profile picture) is used only for this purpose and is not forwarded by us to any of the other providers below (see Section 3).</li>
              <li><strong>OpenAI</strong> — generates match/analysis results from your de-identified academic profile data only — never your name, email, or any Google account data.</li>
              <li><strong>Neon</strong> — hosts our database (your account and profile data, including any data received from Google).</li>
              <li><strong>Vercel</strong> — hosts the application itself.</li>
              <li><strong>Resend</strong> — sends transactional emails (e.g. password resets, verification codes) on our behalf, using only your email address.</li>
              <li><strong>Cloudflare (Turnstile)</strong> — verifies you&apos;re not a bot at sign-up/sign-in; subject to Cloudflare&apos;s own privacy policy.</li>
            </ul>
            <p className="mt-3">
              We do not sell, rent, or trade any personal data — including Google user data — to third parties for
              their own marketing or advertising purposes, and we do not use it for any purpose beyond providing and
              improving Shortlisted itself.
            </p>
          </section>

          <section>
            <h2>6. Data security</h2>
            <p>
              Passwords are never stored in plain text — they&apos;re one-way hashed before being saved, so we
              ourselves cannot read them back. Data in transit between your browser and our servers is encrypted
              (HTTPS/TLS). Sign-in and sign-up are protected against automated bot and brute-force attacks (rate
              limiting plus Cloudflare Turnstile). Your database is hosted by Neon behind access controls that
              restrict it to our own application&apos;s servers. No method of transmission or storage is 100%
              secure, but these are the concrete measures in place to protect your account data, including any data
              received from Google.
            </p>
          </section>

          <section>
            <h2>7. Cookies</h2>
            <p>
              We use a single, strictly-necessary session cookie to keep you signed in. It is not used for
              advertising, cross-site tracking, or analytics, and we do not use any third-party advertising or
              analytics cookies.
            </p>
          </section>

          <section>
            <h2>8. Data retention &amp; deletion</h2>
            <p>
              We keep your account and profile data for as long as your account exists. There isn&apos;t yet a
              self-service &quot;delete my account&quot; button — to request access to, correction of, or deletion
              of your account and all associated data, email{' '}
              <a href={`mailto:${ADMIN_EMAIL}`} className="text-primary hover:underline">{ADMIN_EMAIL}</a> and
              we&apos;ll process it promptly.
            </p>
          </section>

          <section>
            <h2>9. Children&apos;s privacy</h2>
            <p>
              Shortlisted is intended for prospective students, typically of high-school age. If you are under 18,
              you should have a parent or guardian&apos;s permission to use the service. We do not knowingly collect
              more data from a minor than is described in this policy, and a parent or guardian may contact us at
              the email above to review or request deletion of a minor&apos;s data.
            </p>
          </section>

          <section>
            <h2>10. International users</h2>
            <p>
              Shortlisted serves students applying to universities across multiple countries. Your data may be
              processed by the infrastructure providers listed above in countries other than your own; each is
              contractually bound to process it only for the purposes described here.
            </p>
          </section>

          <section>
            <h2>11. Changes to this policy</h2>
            <p>
              We may update this page as the product changes. Material changes will be reflected here with an
              updated date at the top.
            </p>
          </section>

          <section>
            <h2>12. Contact</h2>
            <p>
              Questions about this policy or your data? Email{' '}
              <a href={`mailto:${ADMIN_EMAIL}`} className="text-primary hover:underline">{ADMIN_EMAIL}</a>.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
