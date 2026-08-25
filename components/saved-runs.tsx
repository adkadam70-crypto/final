'use client'

import { useState, useTransition } from 'react'
import { History, Trash2 } from 'lucide-react'
import { deleteMatch, type SavedMatch } from '@/app/actions/match'

export function SavedRuns({
  saved,
  onLoad,
}: {
  saved: SavedMatch[]
  onLoad: (m: SavedMatch) => void
}) {
  const [items, setItems] = useState(saved)
  const [, startTransition] = useTransition()

  // keep local list in sync when parent passes a new array
  if (saved !== items && saved.length !== items.length) {
    setItems(saved)
  }

  if (items.length === 0) return null

  async function handleDelete(id: number) {
    setItems((prev) => prev.filter((m) => m.id !== id))
    startTransition(async () => {
      try {
        await deleteMatch(id)
      } catch {
        // ignore; optimistic list already updated
      }
    })
  }

  return (
    <section className="bg-card border border-border rounded-3xl p-6">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
        <History className="w-4 h-4 text-primary" /> Saved runs
      </h2>
      <ul className="space-y-2">
        {items.slice(0, 6).map((m) => (
          <li
            key={m.id}
            className="group flex items-center justify-between gap-2 bg-secondary/60 border border-border rounded-xl px-3 py-2.5"
          >
            <button
              onClick={() => onLoad(m)}
              className="flex-1 text-left min-w-0"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold">{m.targetCountry}</span>
                <span className="text-[10px] text-muted-foreground truncate">
                  {m.gradeBadge.split('→')[0].trim()}
                </span>
              </div>
              <div className="text-[10px] text-muted-foreground/70 truncate">
                {m.results.length} schools ·{' '}
                {new Date(m.createdAt).toLocaleDateString('en-US')}
              </div>
            </button>
            <button
              onClick={() => handleDelete(m.id)}
              className="text-muted-foreground/50 hover:text-destructive transition-colors p-1 shrink-0"
              aria-label="Delete run"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
