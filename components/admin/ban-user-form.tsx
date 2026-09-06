'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { banUserByEmail } from '@/app/actions/admin'

export function BanUserForm() {
  const [email, setEmail] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const result = await banUserByEmail(email, reason)
      if (result.ok) {
        setSuccess(true)
        setEmail('')
        setReason('')
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="border border-border rounded-xl p-4 space-y-3 bg-secondary/40">
      <div>
        <label className="text-xs text-muted-foreground block mb-1">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@example.com"
          className="w-full bg-secondary border border-border rounded-lg p-2 text-sm text-foreground focus:outline-none focus:border-primary"
        />
      </div>
      <div>
        <label className="text-xs text-muted-foreground block mb-1">Reason</label>
        <input
          type="text"
          required
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason shown to the user"
          className="w-full bg-secondary border border-border rounded-lg p-2 text-sm text-foreground focus:outline-none focus:border-primary"
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {success && <p className="text-xs text-primary">Account banned.</p>}
      <Button type="submit" variant="destructive" size="sm" disabled={isPending}>
        {isPending ? 'Banning…' : 'Ban user'}
      </Button>
    </form>
  )
}
