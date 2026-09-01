import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { AccountSettingsForm } from '@/components/account-settings-form'

export const dynamic = 'force-dynamic'

export default async function AccountPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  const user = session!.user

  return <AccountSettingsForm userName={user.name} userEmail={user.email} />
}
