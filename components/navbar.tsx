'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { LayoutDashboard, User, Search, Bookmark, LogOut, Menu, X, BookOpenCheck, Settings, Sparkles } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { useMarkReturningUser } from '@/lib/returning-user'
import { cn } from '@/lib/utils'
import { ProfileMenu } from '@/components/profile-menu'
import { AppLogo } from '@/components/app-logo'
import { NavBar } from '@/components/ui/tubelight-navbar'
import { EmeraldBadgeSmall } from '@/components/emerald-badge'
import { ThemeToggle } from '@/components/theme-toggle'

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/dream', label: 'Build Your Dream', icon: Sparkles },
  { href: '/matches', label: 'Find Matches', icon: Search },
  { href: '/saved', label: 'Saved Schools', icon: Bookmark },
  { href: '/application-info', label: 'Application Info', icon: BookOpenCheck },
]

export function Navbar({ userName, userEmail }: { userName: string; userEmail: string }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  // Rendering here at all already proves a real, server-confirmed session
  // (see the getSession()/redirect in every layout that mounts Navbar) —
  // marks this browser as "has signed in before" for the landing page's
  // returning-user Sign In/Sign Up pill.
  useMarkReturningUser()

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
        // No max-width cap at all now — even the earlier 1800px cap left
        // visible dead space on both sides on a genuinely wide external
        // monitor, reading as "bunched toward the middle." Full width +
        // px scaling by breakpoint anchors the logo/account to the true
        // screen edges on any size, while staying identical on a
        // laptop-width viewport (padding, not a cap, is what scales).
        //
        // 3-column grid, not flex justify-between — justify-between only
        // spaces adjacent siblings evenly, it doesn't center the middle
        // one in the bar as a whole. The logo ("Shortlisted") and the
        // right-side cluster (badge/theme/account) are different widths,
        // so the nav links visually drifted toward whichever side was
        // narrower. A 1fr/auto/1fr grid gives the two side columns equal
        // width no matter their content, which keeps the center column
        // genuinely centered.
        className="w-full items-center px-6 lg:px-10 2xl:px-20 h-16 grid grid-cols-[1fr_auto_1fr]"
        style={{
          maskImage: 'linear-gradient(to bottom, black 75%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 75%, transparent 100%)',
        }}
      >
        <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0 justify-self-start">
          <AppLogo className="h-9 w-auto 2xl:h-10" />
          <span className="text-lg 2xl:text-xl font-bold tracking-tight">Shortlisted</span>
        </Link>

        <div className="hidden lg:block min-w-0">
          <NavBar items={NAV_LINKS.map((l) => ({ name: l.label, url: l.href, icon: l.icon }))} compact />
        </div>

        <div className="flex items-center gap-2 2xl:gap-3 justify-self-end">
          <EmeraldBadgeSmall />
          <ThemeToggle />
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
            <div className="flex items-center gap-2 px-3 py-2.5">
              <span className="text-sm font-medium text-muted-foreground">Theme</span>
              <ThemeToggle />
            </div>
            <button onClick={handleSignOut} className="w-full flex items-center gap-2 text-sm font-medium px-3 py-2.5 rounded-xl text-destructive hover:bg-destructive/10 transition-colors">
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
