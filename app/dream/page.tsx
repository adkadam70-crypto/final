import { DreamBuilder } from '@/components/dream-builder'
import { getLatestProfile } from '@/app/actions/profile'
import { getDreamProfile, getDreamCountryProfiles } from '@/app/actions/dream'

export const dynamic = 'force-dynamic'

export default async function DreamPage() {
  const [profile, dream, countries] = await Promise.all([getLatestProfile(), getDreamProfile(), getDreamCountryProfiles()])
  return <DreamBuilder hasProfile={!!profile?.academicDetail} initialDream={dream} initialCountries={countries} />
}
