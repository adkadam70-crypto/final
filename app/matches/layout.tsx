import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { AmbientBackground } from '@/components/ambient-background'

export const dynamic = 'force-dynamic'

export default async function MatchesLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  return (
    <>
      <AmbientBackground />
      <Navbar userName={session.user.name} />
      <main className="min-h-screen text-foreground pt-16">
        {children}
      </main>
    </>
  )
}
