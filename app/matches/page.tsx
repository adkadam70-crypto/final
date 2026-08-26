import { MatchesView } from '@/components/matches-view'
import { getLatestProfile } from '@/app/actions/profile'

export const dynamic = 'force-dynamic'
// The AI match call can take a while for large catalogs. 300 is a no-op cap
// on Hobby plans (Vercel enforces its own 60s ceiling regardless) but gives
// real headroom on Pro/Enterprise, rather than the ~15s Server Action default.
export const maxDuration = 300

export default async function MatchesPage() {
  const profile = await getLatestProfile()
  return <MatchesView profile={profile} />
}
