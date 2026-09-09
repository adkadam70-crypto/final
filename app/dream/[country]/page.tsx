import { redirect } from 'next/navigation'
import { DreamCountryWorkspace } from '@/components/dream-country-workspace'
import { getLatestProfile } from '@/app/actions/profile'
import { getDreamProfile, getDreamCountryProfile } from '@/app/actions/dream'
import { APPLICATION_INFO } from '@/lib/application-info'

export const dynamic = 'force-dynamic'

export default async function DreamCountryPage({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params
  if (!APPLICATION_INFO[country]) redirect('/dream')

  const [profile, dream, countryProfile] = await Promise.all([getLatestProfile(), getDreamProfile(), getDreamCountryProfile(country)])
  if (!dream?.confirmedField || !countryProfile) redirect('/dream')

  return <DreamCountryWorkspace country={country} confirmedField={dream.confirmedField} initialCountryProfile={countryProfile} profile={profile} />
}
