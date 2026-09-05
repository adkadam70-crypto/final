import { betterAuth, APIError } from 'better-auth'
import { captcha } from 'better-auth/plugins'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '@/lib/db'
import * as authSchema from '@/lib/db/auth-schema'
import { signupFingerprints } from '@/lib/db/schema'
import { and, eq, gte, sql } from 'drizzle-orm'
import { ipFromHeaders, deviceHashFromHeaders } from '@/lib/request-fingerprint'
import { Resend } from 'resend'

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

// Resend's shared sandbox sender — works immediately with zero domain setup,
// which is what we want while this is on a *.vercel.app testing URL. Once a
// real domain is bought and verified in the Resend dashboard, swap this to
// an address on that domain (e.g. 'Shortlisted <noreply@yourdomain.com>').
const RESET_PASSWORD_FROM = 'Shortlisted <onboarding@resend.dev>'

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
          if (!context?.headers) return
          await db.insert(signupFingerprints).values({
            userId: user.id,
            ipAddress: ipFromHeaders(context.headers),
            deviceHash: deviceHashFromHeaders(context.headers),
          })
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
    sendResetPassword: async ({ user, url }) => {
      const apiKey = process.env.RESEND_API_KEY
      if (!apiKey) {
        throw new Error('RESEND_API_KEY environment variable is not set — password reset emails cannot be sent')
      }
      const resend = new Resend(apiKey)
      const { error } = await resend.emails.send({
        from: RESET_PASSWORD_FROM,
        to: user.email,
        subject: 'Reset your Shortlisted password',
        html: `
          <p>Someone (hopefully you) requested a password reset for your Shortlisted account.</p>
          <p><a href="${url}">Click here to reset your password</a>. This link expires in 1 hour.</p>
          <p>If you didn't request this, you can safely ignore this email.</p>
        `,
      })
      if (error) {
        throw new Error(`Failed to send password reset email: ${error.message}`)
      }
    },
  },
})
