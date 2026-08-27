import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { ForgotPasswordForm } from '@/components/forgot-password-form'

export const dynamic = 'force-dynamic'

export default async function ForgotPasswordPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) redirect('/dashboard')
  return <ForgotPasswordForm />
}
