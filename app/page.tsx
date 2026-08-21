import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { Landing } from '@/components/landing'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) redirect('/dashboard')
  return <Landing />
}
