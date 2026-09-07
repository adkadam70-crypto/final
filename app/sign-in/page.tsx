import { getSession } from '@/lib/get-session'
import { redirect } from 'next/navigation'
import { AuthForm } from '@/components/auth-form'

export const dynamic = 'force-dynamic'

export default async function SignInPage() {
  const session = await getSession()
  if (session?.user) redirect('/dashboard')
  return <AuthForm mode="sign-in" />
}
