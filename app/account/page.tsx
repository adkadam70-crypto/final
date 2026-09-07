import { getSession } from '@/lib/get-session'
import { AccountSettingsForm } from '@/components/account-settings-form'

export const dynamic = 'force-dynamic'

export default async function AccountPage() {
  const session = await getSession()
  const user = session!.user

  return <AccountSettingsForm userName={user.name} userEmail={user.email} />
}
