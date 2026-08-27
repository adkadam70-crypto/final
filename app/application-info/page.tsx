import { getLatestProfile } from '@/app/actions/profile'
import { ApplicationInfoView } from '@/components/application-info-view'

export const dynamic = 'force-dynamic'

export default async function ApplicationInfoPage() {
  const profile = await getLatestProfile()
  return <ApplicationInfoView defaultCountries={profile?.targetCountries ?? []} />
}
