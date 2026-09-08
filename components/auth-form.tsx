'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { LiquidButton } from '@/components/ui/liquid-glass-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GoogleIcon } from '@/components/ui/google-icon'
import { TurnstileWidget } from '@/components/turnstile-widget'
import { AppLogo } from '@/components/app-logo'
import { AuthShell } from '@/components/auth-shell'

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
  const [showPassword, setShowPassword] = useState(false)
  const [focusedInput, setFocusedInput] = useState<'name' | 'email' | 'password' | null>(null)
  const [googleLoading, setGoogleLoading] = useState(false)

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

  // Redirects the whole page to Google's own account chooser/consent screen
  // (not a popup) and back to callbackURL on success — the standard
  // better-auth social sign-in flow. Errors here (e.g. Google not yet
  // configured server-side — see lib/auth.ts) surface through the same
  // error banner as every other auth error on this form.
  const handleGoogleSignIn = async () => {
    setError(null)
    setGoogleLoading(true)
    // callbackURL covers a returning user; newUserCallbackURL is the
    // separate redirect better-auth uses the FIRST time someone signs in via
    // this provider (a distinct account-creation path) — without it, a
    // brand-new Google sign-in fell back to better-auth's default target
    // instead of /dashboard, landing back on '/' looking like sign-in never
    // happened.
    const { error } = await authClient.signIn.social({
      provider: 'google',
      callbackURL: '/dashboard',
      newUserCallbackURL: '/dashboard',
      errorCallbackURL: '/sign-in',
    })
    if (error) {
      setGoogleLoading(false)
      setError(error.message ?? 'Could not sign in with Google. Please try again.')
    }
    // On success the browser is already navigating to Google — no further
    // local state update needed (or reachable).
  }

  return (
    <AuthShell>
      <div className="mb-6">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', duration: 0.7 }}
          className="flex items-center gap-2 mb-5"
        >
          <AppLogo className="h-7 w-auto" />
          <span className="text-base font-bold tracking-tight">Shortlisted</span>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-2xl font-semibold tracking-tight text-foreground text-balance"
        >
          {step === 'otp' ? 'Check your email' : isSignUp ? 'Create your account' : 'Welcome back'}
        </motion.h1>
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
                <div className="relative flex items-center">
                  <User className={`absolute left-3 w-4 h-4 transition-colors duration-300 pointer-events-none ${focusedInput === 'name' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onFocus={() => setFocusedInput('name')}
                    onBlur={() => setFocusedInput(null)}
                    required
                    autoComplete="name"
                    className="pl-9"
                  />
                </div>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative flex items-center">
                <Mail className={`absolute left-3 w-4 h-4 transition-colors duration-300 pointer-events-none ${focusedInput === 'email' ? 'text-primary' : 'text-muted-foreground'}`} />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                  required
                  autoComplete="email"
                  className="pl-9"
                />
              </div>
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
              <div className="relative flex items-center">
                <Lock className={`absolute left-3 w-4 h-4 transition-colors duration-300 pointer-events-none ${focusedInput === 'password' ? 'text-primary' : 'text-muted-foreground'}`} />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                  required
                  minLength={8}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  className="pl-9 pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors duration-300"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
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

            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-border" />
              <span className="mx-3 text-xs text-muted-foreground">or</span>
              <div className="flex-grow border-t border-border" />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full h-10 rounded-lg border border-border bg-secondary/60 hover:bg-secondary hover:border-primary/30 transition-colors duration-300 flex items-center justify-center gap-2 text-sm font-medium text-foreground disabled:opacity-60 disabled:pointer-events-none"
            >
              <GoogleIcon className="w-4 h-4" />
              {googleLoading ? 'Redirecting…' : isSignUp ? 'Sign up with Google' : 'Sign in with Google'}
            </motion.button>
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
    </AuthShell>
  )
}
