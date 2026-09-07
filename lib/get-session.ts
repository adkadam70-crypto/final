import { cache } from 'react'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'

// Every protected layout.tsx checks auth, and several page.tsx files under
// those layouts check it again for the user id they need for their own
// queries — that was two real network round-trips to the DB per page load
// (Neon's serverless driver pays connection/HTTP overhead per call, so this
// wasn't free). React's cache() memoizes per request: the first call in a
// request actually hits auth.api.getSession, every later call in the same
// request reuses that same in-flight/resolved promise.
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() })
})
