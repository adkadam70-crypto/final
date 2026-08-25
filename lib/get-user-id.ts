import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

// Better Auth's session lookup queries the DB through the same Drizzle/Neon
// adapter that throws a non-serializable error class elsewhere in this app —
// that fails to cross the Server Action boundary in production (surfaces as
// an opaque "Minified React error #441"). Normalize to a plain Error here.
export async function getUserId(): Promise<string> {
  let session
  try {
    session = await auth.api.getSession({ headers: await headers() })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Session lookup failed'
    throw new Error(`Session lookup failed: ${message}`)
  }
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}
