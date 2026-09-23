import { MatchesView } from '@/components/matches-view'
import { getLatestProfile } from '@/app/actions/profile'
import { db } from '@/lib/db'
import { universities } from '@/lib/db/schema'
import { inArray, count } from 'drizzle-orm'

export const dynamic = 'force-dynamic'
// The AI match call can take a while for large catalogs. 300 is a no-op cap
// on Hobby plans (Vercel enforces its own 60s ceiling regardless) but gives
// real headroom on Pro/Enterprise, rather than the ~15s Server Action default.
export const maxDuration = 300

export default async function MatchesPage() {
  const profile = await getLatestProfile()

  // Real, live count of universities in the student's target countries —
  // shown on the evaluation card so "how many schools will this actually
  // check" is an honest number, not a placeholder like "450+".
  let catalogScope: number | null = null
  if (profile?.targetCountries?.length) {
    const [row] = await db
      .select({ c: count() })
      .from(universities)
      .where(inArray(universities.country, profile.targetCountries))
    catalogScope = row?.c ?? null
  }

  return <MatchesView profile={profile} catalogScope={catalogScope} />
}
