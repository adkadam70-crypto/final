import { db } from '@/lib/db'
import { profiles, matches, savedSchools } from '@/lib/db/schema'
import { eq, desc, count } from 'drizzle-orm'
import Link from 'next/link'
import { Search, Bookmark, Compass, ArrowRight, GraduationCap } from 'lucide-react'
import { tierBadgeClass } from '@/lib/match-tier'
import { StatCard } from '@/components/stat-card'
import { ProfileStrengthCard } from '@/components/profile-strength-card'
import { RevealGroup } from '@/components/reveal-group'
import { GlowCard } from '@/components/ui/spotlight-card'

// Split out from the dashboard page and wrapped in <Suspense> there so the
// static shell (greeting) streams to the browser immediately instead of the
// whole page blocking on this section's four DB queries — only this card
// grid shows a skeleton while they resolve.
export async function DashboardStats({ userId }: { userId: string }) {
  const [profileCountRes, matchCountRes, savedCountRes, recentMatches] = await Promise.all([
    db.select({ count: count() }).from(profiles).where(eq(profiles.userId, userId)),
    db.select({ count: count() }).from(matches).where(eq(matches.userId, userId)),
    db.select({ count: count() }).from(savedSchools).where(eq(savedSchools.userId, userId)),
    db.select().from(matches).where(eq(matches.userId, userId)).orderBy(desc(matches.createdAt)).limit(1),
  ])

  const profileCount = profileCountRes[0]?.count ?? 0
  const matchCount = matchCountRes[0]?.count ?? 0
  const savedCount = savedCountRes[0]?.count ?? 0
  const featured = (recentMatches[0]?.results ?? []).slice(0, 3)

  return (
    <>
      {/* Unified command grid — each card pairs its live metric with the
          one action that metric actually calls for, instead of a separate
          action card stacked directly on top of a separate metric card. */}
      <RevealGroup className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        <GlowCard className="rounded-2xl block">
          <ProfileStrengthCard hasProfile={profileCount > 0} />
        </GlowCard>
        <GlowCard className="rounded-2xl block">
          <StatCard
            icon={<Search className="w-4 h-4" />}
            label="MATCHES FOUND"
            value={matchCount}
            valueClassName="text-emerald-400"
            description="Run a match to discover your best-fit universities."
            hint={matchCount === 0 ? 'Run your first match' : 'Keep exploring'}
            actionHref="/matches"
            actionLabel="Find Matches"
          />
        </GlowCard>
        <GlowCard className="rounded-2xl block">
          <StatCard
            icon={<Bookmark className="w-4 h-4" />}
            label="SAVED SCHOOLS"
            value={savedCount}
            valueClassName="text-foreground"
            description="Track your application status for bookmarked schools."
            hint={savedCount === 0 ? 'Bookmark schools you like' : 'Track your apps'}
            actionHref="/saved"
            actionLabel="Saved Schools"
          />
        </GlowCard>
      </RevealGroup>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-y-2 mb-4">
          <h2 className="text-lg font-bold text-foreground tracking-tight flex flex-wrap items-center gap-2">
            Featured Recommendations
            {/* These odds come from this catalog's general baseline
                numbers, not a filled-in student profile — this tag is the
                honesty check so a 92-93% shown before any profile data
                reads as "here's a starting benchmark," not a confident,
                ungrounded guess. Only shown alongside actual data — an
                empty state has nothing to label as a baseline. */}
            {featured.length > 0 && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-secondary text-muted-foreground border border-border whitespace-nowrap">BASELINE SEED</span>
            )}
          </h2>
          {featured.length > 0 && (
            <Link href="/matches" className="text-xs text-muted-foreground hover:text-emerald-400 transition-colors">
              View all →
            </Link>
          )}
        </div>
        {featured.length === 0 ? (
          <div className="bg-zinc-900/40 border border-white/5 border-dashed rounded-xl p-12 text-center">
            <Compass className="w-8 h-8 text-muted-foreground/60 mx-auto" />
            <h3 className="text-sm font-semibold text-foreground/90 mt-2">No matches generated yet</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">Run your first evaluation to calculate reach, target, and safety tiers.</p>
            <Link
              href="/matches"
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold px-4 py-2 rounded-lg mt-4 transition-colors"
            >
              Find Matches <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <RevealGroup className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-4">
            {featured.map((uni: any) => (
              <GlowCard key={uni.universityId} className="rounded-xl block">
                <div className="h-full bg-card border border-border hover:border-emerald-500/20 rounded-xl overflow-hidden flex flex-col justify-between transition-all">
                  {/* Same real-photo pattern as the full match results card
                      (components/university-card.tsx) — campus photo where
                      one resolved, the school's own logo on a plain white
                      strip where only that exists, or a quiet branded
                      gradient rather than a random unrelated image. Turns
                      this row of cards into an actual visual gallery
                      instead of three identical dark boxes. */}
                  {uni.imageUrl ? (
                    uni.imageUrl.startsWith('/university-logos/') ? (
                      <div className="w-full h-20 bg-white flex items-center justify-center p-3">
                        <img src={uni.imageUrl} alt={`${uni.name} logo`} loading="lazy" className="max-w-full max-h-full object-contain" />
                      </div>
                    ) : (
                      <img src={uni.imageUrl} alt={`${uni.name} campus`} loading="lazy" className="w-full h-20 object-cover" />
                    )
                  ) : (
                    <div className="w-full h-20 bg-gradient-to-br from-accent to-secondary flex items-center justify-center" aria-hidden="true">
                      <GraduationCap className="w-6 h-6 text-primary/50" />
                    </div>
                  )}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground text-balance">{uni.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{uni.location}</p>
                    </div>
                    <div className="flex items-end justify-between mt-3">
                      <span className={`text-[11px] px-2.5 py-0.5 rounded-md font-medium border ${tierBadgeClass(uni.matchTier)}`}>{uni.matchTier}</span>
                      <div className="flex flex-col items-end">
                        <span className="font-mono text-base text-emerald-400 font-bold">{uni.acceptanceProbability}%</span>
                        <span className="text-[9px] text-muted-foreground font-mono">General Band</span>
                      </div>
                    </div>
                  </div>
                </div>
              </GlowCard>
            ))}
          </RevealGroup>
        )}
      </section>

      {/* Static/illustrative — there's no deadline-tracking data model yet,
          so this is a fixed placeholder strip rather than a real per-user
          countdown. Purely to balance the empty space below the
          recommendations grid on tall viewports; not a data-bound feature. */}
      <div className="mt-8 p-4 rounded-xl bg-zinc-900/40 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-mono text-muted-foreground/70 tracking-wider">ADMISSIONS CYCLE 2026–2027</p>
          <p className="text-xs text-foreground/85 font-medium mt-1">Early Decision &amp; Early Action deadlines approaching in 40 days.</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/70">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
            </span>
            Cycle Active
          </span>
          <Link href="/application-info?tab=deadlines" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium transition-colors">
            View Admissions Calendar →
          </Link>
        </div>
      </div>
    </>
  )
}

export function DashboardStatsSkeleton() {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-zinc-900/60 border border-white/10 rounded-2xl p-5 h-[188px] animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-zinc-900/40 border border-white/5 rounded-xl p-4 h-[104px] animate-pulse" />
        ))}
      </div>
    </>
  )
}
