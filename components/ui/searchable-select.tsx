'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'

// Plain <select> stopped being usable once the field/sector lists grew
// (25 academic fields, 11 industry hubs) — a long unscannable native
// dropdown with no way to type-to-filter. This is a minimal combobox: text
// input filters the option list live, click/Enter selects, click-outside
// or Escape closes. Not a full listbox/ARIA combobox implementation —
// deliberately simple, matching this form's existing plain-select styling
// rather than pulling in a full component library for two fields.
export function SearchableSelect({
  id,
  value,
  onChange,
  options,
  placeholder,
}: {
  id?: string
  value: string
  onChange: (value: string) => void
  options: readonly string[]
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    const onClickOutside = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  const filtered = query.trim() ? options.filter((o) => o.toLowerCase().includes(query.trim().toLowerCase())) : options

  function select(v: string) {
    onChange(v)
    setOpen(false)
    setQuery('')
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        id={id}
        onClick={() => {
          setOpen((v) => !v)
          setTimeout(() => inputRef.current?.focus(), 0)
        }}
        className="w-full flex items-center justify-between gap-2 bg-secondary border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary text-left"
      >
        <span className={value ? '' : 'text-muted-foreground/60'}>{value || placeholder || 'Select...'}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground/60 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-full bg-card border border-border rounded-xl shadow-xl overflow-hidden">
          <div className="flex items-center gap-1.5 px-2.5 py-2 border-b border-border">
            <Search className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setOpen(false)
                  setQuery('')
                } else if (e.key === 'Enter' && filtered.length > 0) {
                  select(filtered[0])
                }
              }}
              placeholder="Type to filter..."
              className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
            />
          </div>
          <ul className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 && <li className="px-3 py-2 text-xs text-muted-foreground/60">No matches.</li>}
            {filtered.map((o) => (
              <li key={o}>
                <button
                  type="button"
                  onClick={() => select(o)}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-secondary transition-colors ${o === value ? 'text-primary font-semibold' : 'text-foreground/90'}`}
                >
                  {o}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
