'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  name: string
  url: string
  icon: LucideIcon
}

interface NavBarProps {
  items: NavItem[]
  className?: string
  // Tighter padding/icon/text sizing — used when the admin-only extra link
  // (Build Your Dream) makes the full-size bar wide enough to crowd the
  // logo on smaller desktop widths (see components/navbar.tsx).
  compact?: boolean
}

// Adapted from the tubelight-navbar pattern: driven by the actual route
// (usePathname) instead of click-only local state, since this sits inline in
// a real multi-page app bar rather than a single-page anchor demo — the lamp
// must already be under the right tab on first paint / back-forward nav, not
// just after a click.
//
// Pure pathname-driven made the lamp visibly lag: several destination pages
// are `force-dynamic` with real DB fetches, so usePathname doesn't flip until
// the new page has actually finished loading — a ~1-2s wait per click. An
// optimistic local override moves the lamp the instant a tab is clicked;
// once the real navigation lands, pathname catches up and the effect clears
// the override so back/forward and direct loads still reflect the true route.
export function NavBar({ items, className, compact }: NavBarProps) {
  const pathname = usePathname()
  const [optimisticUrl, setOptimisticUrl] = useState<string | null>(null)

  useEffect(() => {
    setOptimisticUrl(null)
  }, [pathname])

  const activeUrl = optimisticUrl ?? pathname

  return (
    <div className={cn('flex items-center bg-muted/40 border border-border rounded-full p-1', compact ? 'gap-0.5' : 'gap-1', className)}>
      {items.map((item) => {
        const isActive = activeUrl === item.url
        return (
          <Link
            key={item.name}
            href={item.url}
            onClick={() => setOptimisticUrl(item.url)}
            className={cn(
              'relative flex items-center font-medium rounded-full transition-colors whitespace-nowrap',
              compact ? 'gap-1.5 text-sm px-2.5 py-1.5' : 'gap-1.5 text-sm px-3 py-2',
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            {item.name}
            {isActive && (
              <motion.div
                layoutId="tubelight"
                className="absolute inset-0 rounded-full bg-primary/10 -z-10"
                initial={false}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-b-full">
                  <div className="absolute w-12 h-6 bg-primary/20 rounded-full blur-md -top-2 -left-2" />
                  <div className="absolute w-8 h-6 bg-primary/20 rounded-full blur-md -top-1" />
                  <div className="absolute w-4 h-4 bg-primary/20 rounded-full blur-sm top-0 left-2" />
                </div>
              </motion.div>
            )}
          </Link>
        )
      })}
    </div>
  )
}
