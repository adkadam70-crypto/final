'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { authClient } from '@/lib/auth-client'
import { Settings, LogOut, ChevronDown } from 'lucide-react'

export function ProfileMenu({ userName, userEmail }: { userName: string; userEmail: string }) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 0, right: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // The header this trigger lives in has a mask-image fade effect applied
  // for visual polish — CSS masks clip overflowing descendants along with
  // everything else, so a dropdown positioned relative to it (and extending
  // below the header's own short bounding box) would silently render
  // invisible. Portaling straight to document.body sidesteps that
  // entirely, same as any tooltip/popover that needs to escape a clipped or
  // transformed ancestor.
  useEffect(() => {
    if (!open) return
    function updatePosition() {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (rect) setCoords({ top: rect.bottom + 8, right: window.innerWidth - rect.right })
    }
    updatePosition()
    window.addEventListener('resize', updatePosition)
    return () => window.removeEventListener('resize', updatePosition)
  }, [open])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node
      if (triggerRef.current?.contains(target)) return
      if (menuRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleSignOut() {
    await authClient.signOut()
    window.location.href = '/sign-in'
  }

  const initials = userName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl px-1.5 py-1 hover:bg-muted transition-colors"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <div className="w-8 h-8 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center shrink-0">{initials}</div>
        <span className="hidden sm:block text-xs text-muted-foreground max-w-[100px] truncate">{userName}</span>
        <ChevronDown className={`hidden sm:block w-3.5 h-3.5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ position: 'fixed', top: coords.top, right: coords.right }}
            className="w-56 bg-card border border-border rounded-2xl shadow-lg overflow-hidden z-[100]"
          >
            <div className="px-4 py-3 border-b border-border">
              <p className="text-sm font-semibold truncate">{userName}</p>
              <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
            </div>
            <Link
              href="/account"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <Settings className="w-4 h-4" /> Account settings
            </Link>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors border-t border-border"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>,
          document.body,
        )}
    </>
  )
}
