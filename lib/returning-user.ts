'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'shortlisted_has_signed_in'

// A session cookie alone can't tell a brand-new visitor apart from someone
// who has an account and just signed out — once they sign out there's no
// session left to check. This persists (client-only) whether this browser
// has ever seen an authenticated session, so "returning, signed out" stays
// distinguishable from "never signed up" even after the session is gone.
//
// Call this only from somewhere that's already proof of a real session —
// Navbar (rendered by every authenticated layout, each of which calls
// getSession() server-side and redirects to /sign-in if there isn't one)
// rather than re-deriving auth state client-side. An earlier version used
// the client useSession() hook here instead: that hook resolves via an
// async fetch after hydration, so it could lose the race against a
// same-tick sign-out redirect and never get a chance to write the flag at
// all — which is exactly the bug this replaced (a real account, signed out,
// still not recognized as "has signed in before").
export function useMarkReturningUser() {
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, '1')
  }, [])
}

export function useIsReturningUser() {
  const [isReturning, setIsReturning] = useState(false)
  useEffect(() => {
    setIsReturning(window.localStorage.getItem(STORAGE_KEY) === '1')
  }, [])
  return isReturning
}
