import { getSession } from '@/lib/get-session'
import { redirect } from 'next/navigation'

// Split out of app/page.tsx and wrapped in a Suspense boundary there —
// the session lookup is a real DB round-trip (see the comment on
// getSession itself), and forcing the WHOLE landing page to wait on it
// before sending any HTML (the old `export const dynamic = 'force-dynamic'`
// + `await getSession()` directly in the page) meant every anonymous
// visitor — the overwhelming majority of landing-page traffic, since
// logged-in users mostly land on /dashboard, not / — paid that DB latency
// before seeing anything at all. Isolating it here lets the static <Landing
// /> shell render/stream immediately while this resolves in the background;
// a logged-in user still gets redirected to /dashboard, just a moment
// later instead of blocking everyone else's first paint.
export async function RedirectIfAuthenticated() {
  const session = await getSession()
  if (session?.user) redirect('/dashboard')
  return null
}
