import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { profiles } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { ProfileForm } from '@/components/profile-form'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() })
  const userId = session!.user.id

  const recentProfiles = await db.select().from(profiles).where(eq(profiles.userId, userId)).orderBy(desc(profiles.createdAt)).limit(5)

  return <ProfileForm initialProfiles={recentProfiles} />
}
