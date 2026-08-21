import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/navbar'

export const dynamic = 'force-dynamic'

/**
 * Shared dashboard layout that wraps all sub-pages.
 * Navbar is here to remain persistent across navigation.
 */
export default async function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Fixed navbar - stays at top across all navigation */}
      <Navbar userName={session.user.name} />
      {/* Main content - accounts for navbar height */}
      <div className="pt-16">
        {children}
      </div>
    </div>
  )
}
