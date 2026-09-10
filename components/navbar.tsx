'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { LayoutDashboard, User, Search, Bookmark, LogOut, Menu, X, BookOpenCheck, Settings, ShieldCheck, Sparkles } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { cn } from '@/lib/utils'
import { ProfileMenu } from '@/components/profile-menu'
import { AppLogo } from '@/components/app-logo'
import { NavBar } from '@/components/ui/tubelight-navbar'
import { ADMIN_EMAIL } from '@/lib/admin'

const BASE_NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/matches', label: 'Find Matches', icon: Search },
  { href: '/saved', label: 'Saved Schools', icon: Bookmark },
  { href: '/application-info', label: 'Application Info', icon: BookOpenCheck },
]

// Admin-only while "Build Your Dream" is still being tested (see
// app/dream/layout.tsx) — remove this split once it ships generally and
// just fold it back into BASE_NAV_LINKS.
const DREAM_NAV_LINK = { href: '/dream', label: 'Build Your Dream', icon: Sparkles }

export function Navbar({ userName, userEmail }: { userName: string; userEmail: string }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const isAdmin = userEmail === ADMIN_EMAIL
  const NAV_LINKS = isAdmin ? [BASE_NAV_LINKS[0], BASE_NAV_LINKS[1], DREAM_NAV_LINK, ...BASE_NAV_LINKS.slice(2)] : BASE_NAV_LINKS

  async function handleSignOut() {
    await authClient.signOut()
    window.location.href = '/'
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-md">
      {/* Mask lives on the nav bar itself, not the whole header — the header
          also wraps the expandable mobile menu when open, and a mask sized
          for the thin persistent bar was fading out whatever landed in its
          last ~25% once the menu made the header much taller (Account
          settings / Sign out, at the bottom of the list). */}
      <nav
        className={cn('max-w-7xl mx-auto grid items-center px-6 h-16', isAdmin ? 'grid-cols-[1fr_1fr_auto] gap-x-10' : 'grid-cols-[1fr_auto_1fr]')}
        style={{
          maskImage: 'linear-gradient(to bottom, black 75%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 75%, transparent 100%)',
        }}
      >
        <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0 justify-self-start mr-6">
          <AppLogo className="h-9 w-auto" />
          <span className="text-lg font-bold tracking-tight">Shortlisted</span>
        </Link>

        <div className={cn('hidden lg:block min-w-0', isAdmin ? 'justify-self-end' : 'justify-self-center')}>
          {/* Compact sizing + right-shifted (toward Admin/profile) for admin
              only — the extra "Build Your Dream" link is what makes this bar
              wide enough to crowd the logo on the left at typical desktop
              widths. */}
          <NavBar items={NAV_LINKS.map((l) => ({ name: l.label, url: l.href, icon: l.icon }))} compact={isAdmin} />
        </div>

        <div className="flex items-center gap-3 justify-self-end ml-6">
          {isAdmin && (
            <Link href="/admin" className={cn('hidden lg:flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-xl transition-colors whitespace-nowrap shrink-0', pathname === '/admin' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted')}>
              <ShieldCheck className="w-4 h-4 shrink-0" /> Admin
            </Link>
          )}
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
            {isAdmin && (
              <Link href="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 text-sm font-medium px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <ShieldCheck className="w-4 h-4" /> Admin
              </Link>
            )}
            <button onClick={handleSignOut} className="w-full flex items-center gap-2 text-sm font-medium px-3 py-2.5 rounded-xl text-destructive hover:bg-destructive/10 transition-colors">
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
