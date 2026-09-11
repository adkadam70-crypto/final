'use client'

import { useEffect, useState } from 'react'
import { useSession } from '@/lib/auth-client'

const STORAGE_KEY = 'shortlisted_has_signed_in'

// A session cookie alone can't tell a brand-new visitor apart from someone
// who has an account and just signed out — once they sign out there's no
// session left to check. This persists (client-only) whether this browser
// has ever seen an authenticated session, so "returning, signed out" stays
// distinguishable from "never signed up" even after the session is gone.
export function useMarkReturningUserOnAuth() {
  const { data } = useSession()
  useEffect(() => {
    if (data?.user) window.localStorage.setItem(STORAGE_KEY, '1')
  }, [data?.user])
}

export function useIsReturningUser() {
  const [isReturning, setIsReturning] = useState(false)
  useEffect(() => {
    setIsReturning(window.localStorage.getItem(STORAGE_KEY) === '1')
  }, [])
  return isReturning
}
