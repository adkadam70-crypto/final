import { createAuthClient } from 'better-auth/react'
import { emailOTPClient } from 'better-auth/client/plugins'

export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' ? window.location.origin : undefined,
  // Mirrors the server's emailOTP plugin (lib/auth.ts) — adds
  // authClient.emailOtp.verifyEmail / sendVerificationOtp for the
  // code-entry step of sign-up and unverified sign-in.
  plugins: [emailOTPClient()],
})

export const { signIn, signUp, signOut, useSession } = authClient
