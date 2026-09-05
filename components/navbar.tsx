'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { LayoutDashboard, User, Search, Bookmark, LogOut, Menu, X, BookOpenCheck, Settings } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { cn } from '@/lib/utils'
import { ProfileMenu } from '@/components/profile-menu'
import { AppLogo } from '@/components/app-logo'

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/matches', label: 'Find Matches', icon: Search },
  { href: '/saved', label: 'Saved Schools', icon: Bookmark },
  { href: '/application-info', label: 'Application Info', icon: BookOpenCheck },
]

export function Navbar({ userName, userEmail }: { userName: string; userEmail: string }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleSignOut() {
    await authClient.signOut()
    window.location.href = '/sign-in'
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-md">
      {/* Mask lives on the nav bar itself, not the whole header — the header
          also wraps the expandable mobile menu when open, and a mask sized
          for the thin persistent bar was fading out whatever landed in its
          last ~25% once the menu made the header much taller (Account
          settings / Sign out, at the bottom of the list). */}
      <nav
        className="max-w-6xl mx-auto flex items-center justify-between px-4 h-16"
        style={{
          maskImage: 'linear-gradient(to bottom, black 75%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 75%, transparent 100%)',
        }}
      >
        <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
          <AppLogo className="h-9 w-auto" />
          <div className="flex flex-col leading-tight">
            <span className="text-lg font-bold tracking-tight">Shortlisted</span>
            <span className="text-[11px] text-muted-foreground hidden sm:block">College Predictor: US, UK, AU, SG, HK, India, Germany & France</span>
          </div>
        </Link>

        <div className="hidden lg:flex items-center gap-2">
          {NAV_LINKS.map((link) => {
            const Icon = link.icon
            const active = pathname === link.href
            return (
              <Link key={link.href} href={link.href} className={cn('flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-xl transition-colors whitespace-nowrap shrink-0', active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted')}>
                <Icon className="w-4 h-4 shrink-0" /> {link.label}
              </Link>
            )
          })}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <ProfileMenu userName={userName} userEmail={userEmail} />
          </div>
          <button onClick={() => setMobileOpen((v) => !v)} className="lg:hidden p-2 rounded-xl border border-border text-muted-foreground" aria-label="Toggle menu">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="lg:hidden border-t border-border bg-background">
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
            <Link href="/account" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 text-sm font-medium px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <Settings className="w-4 h-4" /> Account settings
            </Link>
            <button onClick={handleSignOut} className="w-full flex items-center gap-2 text-sm font-medium px-3 py-2.5 rounded-xl text-destructive hover:bg-destructive/10 transition-colors">
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
