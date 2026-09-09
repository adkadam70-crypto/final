import { getSession } from '@/lib/get-session'
import { db } from '@/lib/db'
import { profiles } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { ProfileForm } from '@/components/profile-form'
import { getSuggestedActivities } from '@/app/actions/dream'
import { ADMIN_EMAIL } from '@/lib/admin'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const session = await getSession()
  const userId = session!.user.id

  const recentProfiles = await db.select().from(profiles).where(eq(profiles.userId, userId)).orderBy(desc(profiles.createdAt)).limit(5)
  // Build Your Dream is admin-only while it's being tested (see
  // app/dream/layout.tsx) — getSuggestedActivities enforces the same gate
  // server-side, so this only fetches for the admin account.
  const suggestedActivities = session?.user.email === ADMIN_EMAIL ? await getSuggestedActivities() : null

  return <ProfileForm initialProfiles={recentProfiles} latestProfile={recentProfiles[0] ?? null} suggestedActivities={suggestedActivities} />
}
