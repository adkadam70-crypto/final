'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { authClient } from '@/lib/auth-client'
import { LiquidMetalButton } from '@/components/ui/liquid-metal-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { CheckCircle2 } from 'lucide-react'
import { TurnstileWidget } from '@/components/turnstile-widget'
import { AppLogo } from '@/components/app-logo'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const errorRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (error) errorRef.current?.focus()
  }, [error])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!captchaToken) {
      setError('Please complete the verification check before continuing.')
      return
    }

    setLoading(true)

    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: '/reset-password',
      fetchOptions: { headers: { 'x-captcha-response': captchaToken } },
    })

    setLoading(false)

    if (error) {
      setError(error.message ?? 'Something went wrong')
      return
    }

    setSent(true)
  }

  return (
    <main className="min-h-svh bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-sm p-6 rounded-3xl">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-5">
            <AppLogo className="w-7 h-7 rounded-lg" />
            <span className="text-base font-bold tracking-tight">Shortlisted</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">Reset your password</h1>
          <p className="text-sm text-muted-foreground mt-1 text-pretty">
            Enter the email you signed up with and we&apos;ll send you a reset link.
          </p>
        </div>

        {sent ? (
          <div className="flex flex-col items-center text-center gap-3 py-4">
            <CheckCircle2 className="w-10 h-10 text-primary" />
            <p className="text-sm text-foreground">Check your email</p>
            <p className="text-xs text-muted-foreground text-pretty">
              If an account exists for <span className="text-foreground font-medium">{email}</span>, a reset link is on its way. It expires in 1 hour.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

            <TurnstileWidget onToken={setCaptchaToken} onExpire={() => setCaptchaToken(null)} />

            {error && (
              <p ref={errorRef} tabIndex={-1} className="text-sm text-destructive outline-none" role="alert">
                {error}
              </p>
            )}

            <LiquidMetalButton type="submit" disabled={loading} fullWidth label={loading ? 'Sending…' : 'Send reset link'} />
          </form>
        )}

        <p className="text-sm text-muted-foreground text-center mt-6">
          <Link href="/sign-in" className="text-foreground font-medium underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </p>
      </Card>
    </main>
  )
}
