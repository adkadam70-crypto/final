import { redirect } from 'next/navigation'
import { DreamCountryWorkspace } from '@/components/dream-country-workspace'
import { getLatestProfile } from '@/app/actions/profile'
import { getDreamProfile, getDreamCountryProfile, getDreamUniversityTracks, getSuggestedActivities } from '@/app/actions/dream'
import { APPLICATION_INFO } from '@/lib/application-info'

export const dynamic = 'force-dynamic'

export default async function DreamCountryPage({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params
  if (!APPLICATION_INFO[country]) redirect('/dream')

  const [profile, dream, countryProfile, universityTracks, suggestedActivities] = await Promise.all([
    getLatestProfile(),
    getDreamProfile(),
    getDreamCountryProfile(country),
    getDreamUniversityTracks(country),
    getSuggestedActivities(),
  ])
  if (!dream?.confirmedField || !countryProfile) redirect('/dream')

  return (
    <DreamCountryWorkspace
      country={country}
      confirmedField={dream.confirmedField}
      initialCountryProfile={countryProfile}
      initialUniversityTracks={universityTracks}
      initialSuggestedActivities={suggestedActivities}
      profile={profile}
    />
  )
}
