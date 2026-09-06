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
        await unbanUser(userId)
        setDone(true)
      })}
    >
      {isPending ? 'Unbanning…' : 'Unban'}
    </Button>
  )
}
