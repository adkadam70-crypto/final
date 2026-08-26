'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Sparkles, LayoutDashboard, User, Search, Bookmark, LogOut, Menu, X } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/matches', label: 'Find Matches', icon: Search },
  { href: '/saved', label: 'Saved Schools', icon: Bookmark },
]

export function Navbar({ userName }: { userName: string }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleSignOut() {
    await authClient.signOut()
    window.location.href = '/sign-in'
  }

  const initials = userName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-md"
      style={{
        maskImage: 'linear-gradient(to bottom, black 75%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, black 75%, transparent 100%)',
      }}
    >
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-4 h-16">
        <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
          <div className="bg-primary text-primary-foreground p-2 rounded-xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-lg font-bold tracking-tight">Shortlisted</span>
            <span className="text-[11px] text-muted-foreground hidden sm:block">College Predictor: US, UK, AU, SG, HK & India</span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const Icon = link.icon
            const active = pathname === link.href
            return (
              <Link key={link.href} href={link.href} className={cn('flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-xl transition-colors', active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted')}>
                <Icon className="w-4 h-4" /> {link.label}
              </Link>
            )
          })}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center">{initials}</div>
            <span className="text-xs text-muted-foreground max-w-[100px] truncate">{userName}</span>
          </div>
          <button onClick={handleSignOut} className="hidden md:flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
          <button onClick={() => setMobileOpen((v) => !v)} className="md:hidden p-2 rounded-xl border border-border text-muted-foreground" aria-label="Toggle menu">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="px-4 py-3 space-y-1">
            {NAV_LINKS.map((link) => {
              const Icon = link.icon
              const active = pathname === link.href
              return (
                <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className={cn('flex items-center gap-2 text-sm font-medium px-3 py-2.5 rounded-xl transition-colors', active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted')}>
                  <Icon className="w-4 h-4" /> {link.label}
                </Link>
              )
            })}
            <button onClick={handleSignOut} className="w-full flex items-center gap-2 text-sm font-medium px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
