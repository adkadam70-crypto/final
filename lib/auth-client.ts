import { createAuthClient } from 'better-auth/react'
import { emailOTPClient, inferAdditionalFields } from 'better-auth/client/plugins'
import type { auth } from '@/lib/auth'

export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' ? window.location.origin : undefined,
  // emailOTPClient mirrors the server's emailOTP plugin (lib/auth.ts) —
  // adds authClient.emailOtp.verifyEmail / sendVerificationOtp for the
  // code-entry step of sign-up and unverified sign-in. inferAdditionalFields
  // types custom user fields (e.g. termsAcceptedAt) declared server-side.
  plugins: [emailOTPClient(), inferAdditionalFields<typeof auth>()],
})

export const { signIn, signUp, signOut, useSession } = authClient
