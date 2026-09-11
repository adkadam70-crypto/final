import { Suspense } from 'react'
import { Landing } from '@/components/landing'
import { RedirectIfAuthenticated } from '@/components/redirect-if-authenticated'

// No force-dynamic here anymore — the only per-request work (the session
// check that redirects logged-in users to /dashboard) is isolated inside
// RedirectIfAuthenticated below, wrapped in Suspense with a null fallback,
// so Next.js can serve/stream the <Landing /> shell immediately instead of
// blocking every anonymous visitor on a DB round-trip they don't need.
export default function Page() {
  return (
    <>
      <Suspense fallback={null}>
        <RedirectIfAuthenticated />
      </Suspense>
      <Landing />
    </>
  )
}
