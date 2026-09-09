import { DreamBuilder } from '@/components/dream-builder'
import { getLatestProfile } from '@/app/actions/profile'
import { getDreamProfile } from '@/app/actions/dream'

export const dynamic = 'force-dynamic'

export default async function DreamPage() {
  const [profile, dream] = await Promise.all([getLatestProfile(), getDreamProfile()])
  return <DreamBuilder hasProfile={!!profile?.academicDetail} initialDream={dream} />
}
