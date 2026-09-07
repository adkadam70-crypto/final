import { betterAuth, APIError } from 'better-auth'
import { captcha, emailOTP } from 'better-auth/plugins'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '@/lib/db'
import * as authSchema from '@/lib/db/auth-schema'
import { signupFingerprints } from '@/lib/db/schema'
import { and, eq, gte, sql } from 'drizzle-orm'
import { ipFromHeaders, deviceHashFromHeaders } from '@/lib/request-fingerprint'
import { Resend } from 'resend'
import { notifyAdmin } from '@/lib/notify'

// Turnstile + the per-account AI rate limits (lib/rate-limit.ts) both reset
// the moment someone signs up with a new email — so a user willing to make
// several accounts can multiply their AI-call budget. Deliberately NOT
// gating this on IP: an IP is shared by everyone on the same network (a
// school, an office, a household), so blocking on it risks locking out
// genuine different people who just happen to share a connection — exactly
// the failure mode we want to avoid. Device fingerprint doesn't have that
// problem — it only accumulates when the same browser/device repeats — so
// it's the only signal used to actually block signups. The limit is
// deliberately tight (most real people signing up more than twice from one
// browser in a day is unusual) since we're no longer relying on IP to catch
// the cases device alone might miss.
const SIGNUP_LIMIT_PER_DEVICE = 3
const SIGNUP_WINDOW_HOURS = 24

// Purely observational — never blocks anything. Device fingerprint above is
// the only thing that actually stops signups, deliberately not IP, since an
// IP is shared by everyone on a school/office network. This just tells the
// owner when one IP has made an unusual number of accounts, so they can look
// closer and decide manually rather than the system guessing wrong and
// locking out real students on a shared connection.
const SAME_IP_SIGNUP_ALERT_THRESHOLD = 5

// Resend's shared sandbox sender — works immediately with zero domain setup,
// which is what we want while this is on a *.vercel.app testing URL. Once a
// real domain is bought and verified in the Resend dashboard, swap this to
// an address on that domain (e.g. 'Shortlisted <noreply@yourdomain.com>').
const EMAIL_FROM = 'Shortlisted <onboarding@resend.dev>'

// How long a signup/sign-in verification OTP stays valid, in seconds.
const EMAIL_OTP_EXPIRES_IN = 10 * 60

// Single choke point for every transactional email this app sends, so the
// "is the API key even set" check lives in exactly one place.
async function sendMail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is not set — transactional emails cannot be sent')
  }
  const { error } = await new Resend(apiKey).emails.send({ from: EMAIL_FROM, to, subject, html })
  if (error) {
    throw new Error(`Failed to send email: ${error.message}`)
  }
}

// No hardcoded fallback — a fallback secret sitting in source would let
// anyone who's seen this file forge session tokens the moment a deploy ever
// ran without the env var set. Fail loudly instead, same as every other
// required secret in this app.
const authSecret = process.env.BETTER_AUTH_SECRET
if (!authSecret) {
  throw new Error('BETTER_AUTH_SECRET environment variable is not set')
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: authSchema,
  }),

  // Surfaces user.banned/banReason (see auth-schema.ts) on the session
  // object so lib/get-user-id.ts can reject banned users. `input: false` on
  // both means no client-facing endpoint (sign-up, update-user) can ever
  // set them — only a direct DB write can.
  user: {
    additionalFields: {
      banned: { type: 'boolean', defaultValue: false, input: false },
      banReason: { type: 'string', required: false, input: false },
    },
  },

  baseURL: {
    allowedHosts: [
      'auraadmit-smoky.vercel.app',
      '*.vercel.app',
      'localhost:3000',
      'shortlisted.space',
      'www.shortlisted.space',
    ],
  },

  secret: authSecret,

  // "memory" (the default) resets on every serverless cold start on Vercel,
  // which makes it a near-no-op in production — "database" persists through
  // the same shared Postgres everything else here already uses.
  rateLimit: {
    enabled: true,
    storage: 'database',
    window: 60,
    max: 20,
    customRules: {
      // Sign-in is the brute-force target — tightest limit.
      '/sign-in/email': { window: 60, max: 5 },
      // Sign-up is cheaper to abuse for spam accounts than to brute-force,
      // but still worth capping well below the global default.
      '/sign-up/email': { window: 60, max: 5 },
      // Better Auth's actual route is /request-password-reset, not
      // /forget-password — verified directly against api/routes/password.mjs
      // after noticing the captcha plugin's own default endpoint list uses
      // this name. The old key was a silent no-op (never matched anything).
      '/request-password-reset': { window: 60, max: 5 },
      '/reset-password': { window: 60, max: 5 },
      // OTP endpoints: cheap to abuse as an email-spam vector (each call
      // sends a real email), so cap resends hard. Verification attempts get
      // a little more room so a genuine typo isn't an instant lockout — the
      // plugin also enforces its own 3-wrong-guesses-per-code limit.
      '/email-otp/send-verification-otp': { window: 300, max: 3 },
      '/email-otp/verify-email': { window: 60, max: 5 },
    },
  },

  // Cloudflare Turnstile on sign-up, sign-in, and password-reset-request —
  // Better Auth's own default endpoint list for this plugin, left as-is
  // rather than narrowed, since brute-force protection on sign-in is as
  // valuable as spam-account protection on sign-up. Server-side only: the
  // client attaches the solved token via an `x-captcha-response` header
  // (see components/turnstile-widget.tsx + auth-form.tsx) — this plugin
  // never touches the client bundle.
  plugins: [
    captcha({
      provider: 'cloudflare-turnstile',
      secretKey: (() => {
        const key = process.env.TURNSTILE_SECRET_KEY
        if (!key) throw new Error('TURNSTILE_SECRET_KEY environment variable is not set')
        return key
      })(),
    }),

    // Email verification by one-time code. `overrideDefaultEmailVerification`
    // swaps Better Auth's usual "click this link" verification for a 6-digit
    // OTP everywhere it's triggered — on sign-up (see emailVerification
    // below) and on any sign-in attempt by an unverified account. Combined
    // with `emailAndPassword.requireEmailVerification`, this means an account
    // is unusable until the person proves they control the inbox: no session
    // is ever issued for an unverified email, so signing up with a fake or
    // mistyped address gets you nowhere.
    emailOTP({
      overrideDefaultEmailVerification: true,
      otpLength: 6,
      expiresIn: EMAIL_OTP_EXPIRES_IN,
      sendVerificationOTP: async ({ email, otp, type }) => {
        const heading =
          type === 'sign-in' ? 'Your Shortlisted sign-in code' : 'Confirm your email for Shortlisted'
        await sendMail({
          to: email,
          subject: `${otp} is your Shortlisted verification code`,
          html: `
            <p>${heading}:</p>
            <p style="font-size:28px;font-weight:700;letter-spacing:4px;font-family:monospace">${otp}</p>
            <p>This code expires in ${Math.round(EMAIL_OTP_EXPIRES_IN / 60)} minutes. If you didn't request it, you can ignore this email.</p>
          `,
        })
      },
    }),
  ],

  // Signup-by-device-fingerprint throttle — see the comment above
  // SIGNUP_LIMIT_PER_DEVICE for why IP isn't used to block here. `before`
  // blocks account creation once the device has made SIGNUP_LIMIT_PER_DEVICE
  // accounts within the window; `after` records the fingerprint for the
  // account that was just allowed through. IP is still stored on the row
  // (useful for manual abuse investigation later) but never checked here.
  databaseHooks: {
    user: {
      create: {
        before: async (_user, context) => {
          if (!context?.headers) return
          const deviceHash = deviceHashFromHeaders(context.headers)
          const since = new Date(Date.now() - SIGNUP_WINDOW_HOURS * 60 * 60 * 1000)

          const [deviceRow] = await db
            .select({ count: sql<number>`count(*)` })
            .from(signupFingerprints)
            .where(and(eq(signupFingerprints.deviceHash, deviceHash), gte(signupFingerprints.createdAt, since)))
          if (Number(deviceRow.count) >= SIGNUP_LIMIT_PER_DEVICE) {
            throw new APIError('TOO_MANY_REQUESTS', {
              message: 'Too many accounts have been created from this device recently. Please try again later.',
            })
          }
        },
        after: async (user, context) => {
          const ip = context?.headers ? ipFromHeaders(context.headers) : 'unknown'
          if (context?.headers) {
            await db.insert(signupFingerprints).values({
              userId: user.id,
              ipAddress: ip,
              deviceHash: deviceHashFromHeaders(context.headers),
            })

            if (ip !== 'unknown') {
              const since = new Date(Date.now() - SIGNUP_WINDOW_HOURS * 60 * 60 * 1000)
              const [ipRow] = await db
                .select({ count: sql<number>`count(*)` })
                .from(signupFingerprints)
                .where(and(eq(signupFingerprints.ipAddress, ip), gte(signupFingerprints.createdAt, since)))
              // Fires once, right when the count first reaches the threshold —
              // not on every signup after, so one busy IP doesn't send an
              // email per additional account.
              if (Number(ipRow.count) === SAME_IP_SIGNUP_ALERT_THRESHOLD) {
                void notifyAdmin(
                  'Unusual signup activity: same IP',
                  `<p><strong>${SAME_IP_SIGNUP_ALERT_THRESHOLD} accounts</strong> have been created from IP <strong>${ip}</strong> in the last ${SIGNUP_WINDOW_HOURS} hours.</p><p>This is informational only — nothing was blocked. Could be a shared network (school/office) or one person farming accounts.</p>`,
                )
              }
            }
          }
          void notifyAdmin(
            'New Shortlisted signup',
            `<p>New account created:</p><p><strong>${user.name}</strong> — ${user.email}</p><p>IP: ${ip}</p>`,
          )
        },
      },
    },
  },

  advanced: {
    database: {
      generateId: 'uuid',
    },
    useSecureCookies: process.env.NODE_ENV === 'production',
    defaultCookieAttributes: {
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
  },

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    // No session is issued until the email is verified (via the OTP flow in
    // the emailOTP plugin above). An unverified sign-in attempt is rejected
    // with EMAIL_NOT_VERIFIED and a fresh code is emailed (sendOnSignIn).
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendMail({
        to: user.email,
        subject: 'Reset your Shortlisted password',
        html: `
          <p>Someone (hopefully you) requested a password reset for your Shortlisted account.</p>
          <p><a href="${url}">Click here to reset your password</a>. This link expires in 1 hour.</p>
          <p>If you didn't request this, you can safely ignore this email.</p>
        `,
      })
    },
  },

  emailVerification: {
    // Fire the OTP email as soon as someone signs up, and again if an
    // unverified account tries to sign in. After a successful verification
    // the person is signed straight in — they've just proven both the
    // password (checked before the code is requested) and the inbox.
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    expiresIn: EMAIL_OTP_EXPIRES_IN,
  },
})
