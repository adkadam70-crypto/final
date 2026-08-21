import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '@/lib/db'
import * as authSchema from '@/lib/db/auth-schema'

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
  },
})
