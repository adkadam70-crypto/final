'use client'

import { useState, useTransition } from 'react'
import { banUserById, unbanUser, type AdminUserRow } from '@/app/actions/admin'
import { BanUserForm } from '@/components/admin/ban-user-form'

function BanRowButton({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-destructive hover:underline"
      >
        Ban
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="text"
        autoFocus
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason"
        className="w-32 bg-secondary border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary"
      />
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            setError(null)
            const res = await banUserById(userId, reason)
            if (!res.ok) setError(res.error)
            else setOpen(false)
          })
        }
        className="text-xs font-semibold text-destructive-foreground bg-destructive rounded-lg px-2 py-1 disabled:opacity-50"
      >
        {isPending ? '…' : 'Confirm'}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-xs text-muted-foreground hover:text-foreground">
        Cancel
      </button>
      {error && <span className="text-[10px] text-destructive">{error}</span>}
    </div>
  )
}

function UnbanRowButton({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition()
  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await unbanUser(userId)
        })
      }
      className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
    >
      {isPending ? 'Unbanning…' : 'Unban'}
    </button>
  )
}

export function AdminUserManagement({ users }: { users: AdminUserRow[] }) {
  const [query, setQuery] = useState('')
  const filtered = users.filter(
    (u) => u.name.toLowerCase().includes(query.toLowerCase()) || u.email.toLowerCase().includes(query.toLowerCase()),
  )
  const bannedCount = users.filter((u) => u.banned).length

  return (
    <div className="bg-card border border-border rounded-3xl p-5 mb-8">
      <div className="flex items-center justify-between gap-3 mb-1">
        <p className="text-sm font-bold">Admin: User management</p>
        <p className="text-[11px] text-muted-foreground">
          {users.length} user{users.length === 1 ? '' : 's'} · {bannedCount} banned
        </p>
      </div>
      <p className="text-xs text-muted-foreground mb-4">See who's banned, who isn't, and ban or unban an account.</p>

      <BanUserForm />

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name or email..."
        className="w-full bg-secondary border border-border rounded-lg p-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary mt-5 mb-3"
      />

      <div className="border border-border rounded-xl overflow-hidden max-h-96 overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-secondary">
            <tr className="text-left text-muted-foreground">
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Email</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-t border-border">
                <td className="px-3 py-2 font-medium">{u.name}</td>
                <td className="px-3 py-2 text-muted-foreground">{u.email}</td>
                <td className="px-3 py-2">
                  {u.banned ? (
                    <span className="text-destructive font-medium">Banned{u.banReason ? ` — ${u.banReason}` : ''}</span>
                  ) : (
                    <span className="text-muted-foreground">Active</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right">{u.banned ? <UnbanRowButton userId={u.id} /> : <BanRowButton userId={u.id} />}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                  No matching users.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
