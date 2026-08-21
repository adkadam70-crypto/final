import { getSavedSchools } from '@/app/actions/saved-schools'
import { SavedSchoolsView } from '@/components/saved-schools-view'

export default async function SavedPage() {
  const schools = await getSavedSchools()
  return <SavedSchoolsView initialSchools={schools} />
}
