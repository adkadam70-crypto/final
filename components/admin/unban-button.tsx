'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { unbanUser } from '@/app/actions/admin'

export function UnbanButton({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)

  if (done) return <span className="text-xs text-muted-foreground">Unbanned</span>

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => startTransition(async () => {
        const res = await unbanUser(userId)
        if (res.ok) setDone(true)
      })}
    >
      {isPending ? 'Unbanning…' : 'Unban'}
    </Button>
  )
}
