import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '@/lib/db'
import * as authSchema from '@/lib/db/auth-schema'
import { Resend } from 'resend'

// Resend's shared sandbox sender — works immediately with zero domain setup,
// which is what we want while this is on a *.vercel.app testing URL. Once a
// real domain is bought and verified in the Resend dashboard, swap this to
// an address on that domain (e.g. 'Shortlisted <noreply@yourdomain.com>').
const RESET_PASSWORD_FROM = 'Shortlisted <onboarding@resend.dev>'

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
    ],
  },

  secret: process.env.BETTER_AUTH_SECRET || 'fallback_secret_key_auraadmit_32chars',

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
