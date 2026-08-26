import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { matches } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { MatchesView } from '@/components/matches-view'
import { getLatestProfile } from '@/app/actions/profile'

export const dynamic = 'force-dynamic'
// The AI match call can take a while for large catalogs. 300 is a no-op cap
// on Hobby plans (Vercel enforces its own 60s ceiling regardless) but gives
// real headroom on Pro/Enterprise, rather than the ~15s Server Action default.
export const maxDuration = 300

export default async function MatchesPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  const userId = session!.user.id

  const [savedRuns, profile] = await Promise.all([
    db.select().from(matches).where(eq(matches.userId, userId)).orderBy(desc(matches.createdAt)).limit(10),
    getLatestProfile(),
  ])

  return <MatchesView initialSaved={savedRuns} profile={profile} />
}
