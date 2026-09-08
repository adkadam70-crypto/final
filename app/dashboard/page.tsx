import { Suspense } from 'react'
import { getSession } from '@/lib/get-session'
import { redirect } from 'next/navigation'
import { User, Target, Bookmark, ArrowRight } from 'lucide-react'
import { DashboardStats, DashboardStatsSkeleton } from '@/components/dashboard-stats'
import { GlowCard } from '@/components/ui/spotlight-card'
import Link from 'next/link'

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
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">Welcome back, {firstName}</h1>
        <p className="text-sm text-muted-foreground">Here&apos;s your admissions overview at a glance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <QuickActionCard href="/profile" icon={<User className="w-5 h-5 text-primary" />} title="Set Up Profile" description="Enter your GPA, test scores, and extracurriculars." />
        <QuickActionCard href="/matches" icon={<Target className="w-5 h-5 text-primary" />} title="Find Matches" description="Run a match to discover your best-fit universities." />
        <QuickActionCard href="/saved" icon={<Bookmark className="w-5 h-5 text-primary" />} title="Saved Schools" description="Track your application status for bookmarked schools." />
      </div>

      {/* Only this section waits on the DB — the greeting and quick-action
          cards above render immediately since they need nothing async. */}
      <Suspense fallback={<DashboardStatsSkeleton />}>
        <DashboardStats userId={userId} />
      </Suspense>
    </main>
  )
}

function QuickActionCard({ href, icon, title, description }: { href: string; icon: React.ReactNode; title: string; description: string }) {
  return (
    <GlowCard className="rounded-3xl block">
      <Link href={href} className="group bg-card border border-border rounded-3xl p-6 hover:border-primary/30 transition-colors block">
        <div className="flex items-start justify-between mb-4">
          <div className="bg-primary/10 p-2.5 rounded-xl">{icon}</div>
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        <h3 className="text-sm font-bold mb-1">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed text-pretty">{description}</p>
      </Link>
    </GlowCard>
  )
}
