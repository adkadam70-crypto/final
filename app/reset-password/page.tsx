import { Suspense } from 'react'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { ResetPasswordForm } from '@/components/reset-password-form'

export const dynamic = 'force-dynamic'

export default async function ResetPasswordPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) redirect('/dashboard')
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
