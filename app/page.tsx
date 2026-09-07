import { getSession } from '@/lib/get-session'
import { redirect } from 'next/navigation'
import { Landing } from '@/components/landing'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const session = await getSession()
  if (session?.user) redirect('/dashboard')
  return <Landing />
}
