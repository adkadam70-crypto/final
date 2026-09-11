'use client'

import { useMarkReturningUserOnAuth } from '@/lib/returning-user'

// Mounted once in the root layout so the "has this browser ever signed in"
// flag gets set from any authenticated page, not just the landing page.
export function AuthSessionTracker() {
  useMarkReturningUserOnAuth()
  return null
}
