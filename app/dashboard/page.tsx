import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { profiles, matches, savedSchools } from '@/lib/db/schema'
import { eq, desc, count } from 'drizzle-orm'
import Link from 'next/link'
import { TrendingUp, Search, Bookmark, User, ArrowRight, GraduationCap, Target, Sparkles } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  // 🛡️ Route protection guard: If not logged in, redirect safely
  if (!session?.user) {
    redirect('/sign-in')
  }

  const userId = session.user.id
  const firstName = session.user.name ? session.user.name.split(' ')[0] : 'Student'

  const [profileCountRes, matchCountRes, savedCountRes, recentMatches] = await Promise.all([
    db.select({ count: count() }).from(profiles).where(eq(profiles.userId, userId)),
    db.select({ count: count() }).from(matches).where(eq(matches.userId, userId)),
    db.select({ count: count() }).from(savedSchools).where(eq(savedSchools.userId, userId)),
    db.select().from(matches).where(eq(matches.userId, userId)).orderBy(desc(matches.createdAt)).limit(1),
  ])

  const profileCount = profileCountRes[0]?.count ?? 0
  const matchCount = matchCountRes[0]?.count ?? 0
  const savedCount = savedCountRes[0]?.count ?? 0

  const profileStrength = Math.min(100, profileCount > 0 ? 40 + Math.min(profileCount * 15, 60) : 0)
  const featured = (recentMatches[0]?.results ?? []).slice(0, 3)

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">Welcome back, {firstName}</h1>
        <p className="text-sm text-muted-foreground">Here&apos;s your admissions overview at a glance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard icon={<TrendingUp className="w-5 h-5 text-primary" />} label="Profile Strength" value={`${profileStrength}%`} hint={profileCount === 0 ? 'Set up your profile to get started' : 'Looking good — keep adding details'} />
        <StatCard icon={<Search className="w-5 h-5 text-primary" />} label="Matches Found" value={String(matchCount)} hint={matchCount === 0 ? 'Run your first AI match' : 'Keep exploring'} />
        <StatCard icon={<Bookmark className="w-5 h-5 text-primary" />} label="Saved Schools" value={String(savedCount)} hint={savedCount === 0 ? 'Bookmark schools you like' : 'Track your apps'} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <QuickActionCard href="/profile" icon={<User className="w-5 h-5 text-primary" />} title="Set Up Profile" description="Enter your GPA, test scores, and extracurriculars." />
        <QuickActionCard href="/matches" icon={<Target className="w-5 h-5 text-primary" />} title="Find Matches" description="Run AI matching to discover your best-fit universities." />
        <QuickActionCard href="/saved" icon={<Bookmark className="w-5 h-5 text-primary" />} title="Saved Schools" description="Track your application status for bookmarked schools." />
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /> Featured Recommendations</h2>
          {featured.length > 0 && <Link href="/matches" className="text-xs text-primary font-medium flex items-center gap-1 hover:brightness-125">View all <ArrowRight className="w-3 h-3" /></Link>}
        </div>
        {featured.length === 0 ? (
          <div className="bg-card border border-border border-dashed rounded-3xl p-12 text-center">
            <div className="inline-flex bg-secondary p-3 rounded-2xl mb-4"><GraduationCap className="w-6 h-6 text-primary" /></div>
            <h3 className="text-base font-bold mb-1">No matches yet</h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto text-pretty mb-4">Run your first AI match to see personalized university recommendations here.</p>
            <Link href="/matches" className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold text-sm px-5 py-2.5 rounded-2xl hover:brightness-110 transition-all">Find Matches <ArrowRight className="w-4 h-4" /></Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featured.map((uni: any) => (
              <div key={uni.universityId} className="bg-card border border-border rounded-3xl p-5">
                <h3 className="text-sm font-bold mb-1 text-balance">{uni.name}</h3>
                <p className="text-xs text-muted-foreground mb-3">{uni.location}</p>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${uni.matchTier === 'Safety' ? 'bg-primary/15 text-primary border-primary/25' : uni.matchTier === 'Target' ? 'bg-chart-2/15 text-chart-2 border-chart-2/25' : uni.matchTier === 'Reach' ? 'bg-chart-3/15 text-chart-3 border-chart-3/25' : 'bg-chart-4/15 text-chart-4 border-chart-4/25'}`}>{uni.matchTier}</span>
                  <span className="text-sm font-mono font-bold text-primary">{uni.acceptanceProbability}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

function StatCard({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint: string }) {
  return (
    <div className="bg-card border border-border rounded-3xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-primary/10 p-2.5 rounded-xl">{icon}</div>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}

function QuickActionCard({ href, icon, title, description }: { href: string; icon: React.ReactNode; title: string; description: string }) {
  return (
    <Link href={href} className="group bg-card border border-border rounded-3xl p-6 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="bg-primary/10 p-2.5 rounded-xl">{icon}</div>
        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      <h3 className="text-sm font-bold mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed text-pretty">{description}</p>
    </Link>
  )
}