'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { authClient } from '@/lib/auth-client'
import { LiquidButton } from '@/components/ui/liquid-glass-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { TurnstileWidget } from '@/components/turnstile-widget'
import { AppLogo } from '@/components/app-logo'

// Seconds to disable the "Resend code" button after a send, so a frustrated
// user can't walk straight into the server's rate limit.
const RESEND_COOLDOWN_SECONDS = 30

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const errorRef = useRef<HTMLParagraphElement>(null)
  const [loading, setLoading] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  // Turnstile tokens are single-use; bump this to force a fresh widget when
  // the user comes back to the credentials step after a failed attempt.
  const [captchaKey, setCaptchaKey] = useState(0)
  const [termsAccepted, setTermsAccepted] = useState(false)

  // 'credentials' = name/email/password; 'otp' = enter the emailed 6-digit
  // code. An account has no usable session until the code is verified.
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials')
  const [otp, setOtp] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const [resendIn, setResendIn] = useState(0)

  const isSignUp = mode === 'sign-up'

  useEffect(() => {
    if (error) errorRef.current?.focus()
  }, [error])

  useEffect(() => {
    if (resendIn <= 0) return
    const t = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [resendIn])

  const goToOtpStep = (message: string) => {
    setStep('otp')
    setError(null)
    setNotice(message)
    setResendIn(RESEND_COOLDOWN_SECONDS)
    setOtp('')
  }

  const backToCredentials = () => {
    setStep('credentials')
    setError(null)
    setNotice(null)
    setOtp('')
    setCaptchaToken(null)
    setCaptchaKey((k) => k + 1)
  }

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!captchaToken) {
      setError('Please complete the verification check before continuing.')
      return
    }

    if (isSignUp && !termsAccepted) {
      setError('Please agree to the Terms of Service & Privacy Policy to continue.')
      return
    }

    setLoading(true)
    const fetchOptions = { headers: { 'x-captcha-response': captchaToken } }

    if (isSignUp) {
      const { data, error } = await authClient.signUp.email({ email, password, name, termsAcceptedAt: new Date(), fetchOptions })
      setLoading(false)
      if (error) {
        setError(error.message ?? 'Something went wrong')
        setCaptchaToken(null)
        setCaptchaKey((k) => k + 1)
        return
      }
      // When email verification is enforced server-side, sign-up returns no
      // session (data.token is null) and the next step is the emailed code.
      // When it isn't enforced, a session is issued straight away — go in.
      if (data?.token) {
        window.location.href = '/dashboard'
        return
      }
      goToOtpStep(`We sent a 6-digit code to ${email}. Enter it below to finish creating your account.`)
      return
    }

    const { error } = await authClient.signIn.email({ email, password, fetchOptions })
    setLoading(false)
    if (error) {
      if (error.code === 'EMAIL_NOT_VERIFIED') {
        // Server has just emailed a fresh code (emailVerification.sendOnSignIn).
        goToOtpStep(`This email isn't verified yet. We sent a 6-digit code to ${email} — enter it below.`)
        return
      }
      setError(error.message ?? 'Something went wrong')
      setCaptchaToken(null)
      setCaptchaKey((k) => k + 1)
      return
    }
    window.location.href = '/dashboard'
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await authClient.emailOtp.verifyEmail({ email, otp })
    setLoading(false)
    if (error) {
      setError(error.message ?? 'That code didn’t work. Check it and try again.')
      return
    }
    // autoSignInAfterVerification issues the session cookie on success.
    window.location.href = '/dashboard'
  }

  const handleResend = async () => {
    if (resendIn > 0) return
    setError(null)
    setNotice(null)
    setResendIn(RESEND_COOLDOWN_SECONDS)
    const { error } = await authClient.emailOtp.sendVerificationOtp({ email, type: 'email-verification' })
    if (error) {
      setError(error.message ?? 'Could not resend the code. Try again in a moment.')
      return
    }
    setNotice(`New code sent to ${email}.`)
  }

  return (
    <main className="min-h-svh bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-sm p-6 rounded-3xl">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-5">
            <AppLogo className="h-7 w-auto" />
            <span className="text-base font-bold tracking-tight">Shortlisted</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
            {step === 'otp' ? 'Check your email' : isSignUp ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 text-pretty">
            {step === 'otp'
              ? 'Enter the 6-digit verification code we just emailed you.'
              : isSignUp
                ? 'Save your profile and get matched to universities.'
                : 'Sign in to see your saved matches.'}
          </p>
        </div>

        {step === 'otp' ? (
          <form onSubmit={handleOtpSubmit} className="flex flex-col gap-4">
            {notice && (
              <p className="text-sm text-muted-foreground text-pretty" role="status">
                {notice}
              </p>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="otp">Verification code</Label>
              <Input
                id="otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                autoFocus
                className="tracking-[0.5em] text-center text-lg font-mono"
              />
            </div>

            {error && (
              <p ref={errorRef} tabIndex={-1} className="text-sm text-destructive outline-none" role="alert">
                {error}
              </p>
            )}

            <LiquidButton type="submit" disabled={loading || otp.length !== 6} fullWidth>
              {loading ? 'Verifying…' : 'Verify and continue'}
            </LiquidButton>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendIn > 0}
                className="text-muted-foreground underline-offset-4 hover:underline hover:text-foreground disabled:no-underline disabled:opacity-60"
              >
                {resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend code'}
              </button>
              <button
                type="button"
                onClick={backToCredentials}
                className="text-muted-foreground underline-offset-4 hover:underline hover:text-foreground"
              >
                Use a different email
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleCredentialsSubmit} className="flex flex-col gap-4">
            {isSignUp && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {!isSignUp && (
                  <Link href="/forgot-password" className="text-xs text-muted-foreground underline-offset-4 hover:underline hover:text-foreground">
                    Forgot password?
                  </Link>
                )}
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
              />
            </div>

            {isSignUp && (
              <label className="flex items-start gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  required
                  className="mt-0.5 accent-primary shrink-0"
                />
                <span>
                  I agree to the{' '}
                  <Link href="/terms" target="_blank" className="text-foreground font-medium underline-offset-4 hover:underline">
                    Terms of Service &amp; Privacy Policy
                  </Link>
                  , including how my data is used.
                </span>
              </label>
            )}

            <TurnstileWidget key={captchaKey} onToken={setCaptchaToken} onExpire={() => setCaptchaToken(null)} />

            {error && (
              <p ref={errorRef} tabIndex={-1} className="text-sm text-destructive outline-none" role="alert">
                {error}
              </p>
            )}

            <LiquidButton type="submit" disabled={loading || (isSignUp && !termsAccepted)} fullWidth>
              {loading ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}
            </LiquidButton>
          </form>
        )}

        {step === 'credentials' && (
          <p className="text-sm text-muted-foreground text-center mt-6">
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <Link
              href={isSignUp ? '/sign-in' : '/sign-up'}
              className="text-foreground font-medium underline-offset-4 hover:underline"
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </Link>
          </p>
        )}
      </Card>
    </main>
  )
}
