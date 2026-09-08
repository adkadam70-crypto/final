'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { LiquidButton } from '@/components/ui/liquid-glass-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle2, Lock, Eye, EyeOff } from 'lucide-react'
import { AppLogo } from '@/components/app-logo'
import { AuthShell } from '@/components/auth-shell'

export function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const tokenError = searchParams.get('error')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const errorRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (error) errorRef.current?.focus()
  }, [error])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (!token) {
      setError('Reset link is missing its token — request a new one below.')
      return
    }

    setLoading(true)
    const { error } = await authClient.resetPassword({ newPassword, token })
    setLoading(false)

    if (error) {
      setError(error.message ?? 'Something went wrong')
      return
    }

    setDone(true)
  }

  const invalidLink = !token || tokenError === 'INVALID_TOKEN'

  return (
    <AuthShell>
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-5">
            <AppLogo className="h-7 w-auto" />
            <span className="text-base font-bold tracking-tight">Shortlisted</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">Set a new password</h1>
        </div>

        {done ? (
          <div className="flex flex-col items-center text-center gap-3 py-4">
            <CheckCircle2 className="w-10 h-10 text-primary" />
            <p className="text-sm text-foreground">Password updated</p>
            <Link href="/sign-in" className="text-sm text-primary font-medium underline-offset-4 hover:underline mt-2">
              Sign in with your new password
            </Link>
          </div>
        ) : invalidLink ? (
          <div className="flex flex-col items-center text-center gap-3 py-4">
            <p className="text-sm text-foreground">This reset link is invalid or has expired.</p>
            <Link href="/forgot-password" className="text-sm text-primary font-medium underline-offset-4 hover:underline mt-2">
              Request a new link
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="newPassword">New password</Label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
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
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="pl-9"
                />
              </div>
            </div>

            {error && (
              <p ref={errorRef} tabIndex={-1} className="text-sm text-destructive outline-none" role="alert">
                {error}
              </p>
            )}

            <LiquidButton type="submit" disabled={loading} fullWidth>{loading ? 'Updating…' : 'Update password'}</LiquidButton>
          </form>
        )}
    </AuthShell>
  )
}
