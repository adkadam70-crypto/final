import { Suspense } from 'react'
import { getSession } from '@/lib/get-session'
import { redirect } from 'next/navigation'
import { DashboardStats, DashboardStatsSkeleton } from '@/components/dashboard-stats'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await getSession()

  // 🛡️ Route protection guard: If not logged in, redirect safely
  if (!session?.user) {
    redirect('/sign-in')
  }

  const userId = session.user.id
  const firstName = session.user.name ? session.user.name.split(' ')[0] : 'Student'

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Welcome back, {firstName}</h1>
        <p className="text-sm text-muted-foreground mt-1">Here&apos;s your admissions overview at a glance.</p>
      </div>

      {/* Each unified card now pairs its action with its live metric, so the
          whole grid waits on the DB together instead of streaming in two
          separate passes — the trade-off for not showing a repetitive
          action-card-over-metric-card stack. */}
      <Suspense fallback={<DashboardStatsSkeleton />}>
        <DashboardStats userId={userId} />
      </Suspense>
    </main>
  )
}
