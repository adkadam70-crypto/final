import { Suspense } from 'react'
import { getSession } from '@/lib/get-session'
import { redirect } from 'next/navigation'
import { ResetPasswordForm } from '@/components/reset-password-form'

export const dynamic = 'force-dynamic'

export default async function ResetPasswordPage() {
  const session = await getSession()
  if (session?.user) redirect('/dashboard')
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
