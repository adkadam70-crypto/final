import { betterAuth } from 'better-auth'
import { captcha } from 'better-auth/plugins'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '@/lib/db'
import * as authSchema from '@/lib/db/auth-schema'
import { Resend } from 'resend'

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
