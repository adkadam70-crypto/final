'use client'

import { useState, useRef, useEffect } from 'react'
import { authClient } from '@/lib/auth-client'
import { LiquidMetalButton } from '@/components/ui/liquid-metal-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { CheckCircle2, KeyRound, User } from 'lucide-react'

export function AccountSettingsForm({ userName, userEmail }: { userName: string; userEmail: string }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const errorRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (error) errorRef.current?.focus()
  }, [error])

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)

    const { error } = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    })

    setLoading(false)

    if (error) {
      setError(error.message ?? 'Something went wrong')
      return
    }

    setCurrentPassword('')
    setNewPassword('')
    setSuccess(true)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Account settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account details and password.</p>
      </div>

      <Card className="p-6 rounded-3xl">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">Your details</h2>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium">{userName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{userEmail}</span>
          </div>
        </div>
      </Card>

      <Card className="p-6 rounded-3xl">
        <div className="flex items-center gap-2 mb-4">
          <KeyRound className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">Change password</h2>
        </div>

        <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="currentPassword">Current password</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="newPassword">New password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          {error && (
            <p ref={errorRef} tabIndex={-1} className="text-sm text-destructive outline-none" role="alert">
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-primary flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Password updated. Your other sessions have been signed out.
            </p>
          )}

          <LiquidMetalButton
            type="submit"
            disabled={loading}
            fullWidth
            label={loading ? 'Updating…' : 'Update password'}
          />
        </form>
      </Card>
    </div>
  )
}
