import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/navbar'

export const dynamic = 'force-dynamic'

export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  return (
    <>
      <Navbar userName={session.user.name} />
      <main className="min-h-screen bg-background text-foreground pt-16">
        {children}
      </main>
    </>
  )
}
