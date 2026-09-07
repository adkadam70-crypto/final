import { getSession } from '@/lib/get-session'
import { redirect } from 'next/navigation'
import { ForgotPasswordForm } from '@/components/forgot-password-form'

export const dynamic = 'force-dynamic'

export default async function ForgotPasswordPage() {
  const session = await getSession()
  if (session?.user) redirect('/dashboard')
  return <ForgotPasswordForm />
}
