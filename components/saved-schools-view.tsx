'use client'

import { useState, useTransition } from 'react'
import { Bookmark, Trash2, GraduationCap, ExternalLink } from 'lucide-react'
import { updateApplicationStatus, unsaveSchool } from '@/app/actions/saved-schools'
import type { ApplicationStatus } from '@/lib/db/schema'
import { tierBadgeClass } from '@/lib/match-tier'

type SavedSchool = {
  id: number
  universityId: number
  universityName: string
  universityLocation: string
  matchTier: string
  acceptanceProbability: number
  applicationStatus: ApplicationStatus
  createdAt: Date
}

const STATUSES: ApplicationStatus[] = ['Researching', 'Applying', 'Submitted']

export function SavedSchoolsView({ initialSchools }: { initialSchools: SavedSchool[] }) {
  const [pending, startTransition] = useTransition()
  const [schools, setSchools] = useState<SavedSchool[]>(initialSchools)

  function handleStatusChange(id: number, status: ApplicationStatus) {
    startTransition(async () => {
      await updateApplicationStatus(id, status)
      setSchools((prev) => prev.map((s) => s.id === id ? { ...s, applicationStatus: status } : s))
    })
  }

  function handleRemove(id: number, universityId: number) {
    startTransition(async () => {
      await unsaveSchool(universityId)
      setSchools((prev) => prev.filter((s) => s.id !== id))
    })
  }

  const counts = {
    Researching: schools.filter((s) => s.applicationStatus === 'Researching').length,
    Applying: schools.filter((s) => s.applicationStatus === 'Applying').length,
    Submitted: schools.filter((s) => s.applicationStatus === 'Submitted').length,
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">Saved Schools</h1>
        <p className="text-sm text-muted-foreground">Track your application progress for universities you&apos;ve bookmarked.</p>
      </div>

      {schools.length === 0 ? (
        <div className="bg-card border border-border border-dashed rounded-3xl p-12 text-center">
          <div className="inline-flex bg-secondary p-3 rounded-2xl mb-4"><Bookmark className="w-6 h-6 text-primary" /></div>
          <h3 className="text-base font-bold mb-1">No saved schools yet</h3>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto text-pretty mb-4">Run a match and bookmark the universities you&apos;re interested in to track them here.</p>
          <a href="/matches" className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold text-sm px-5 py-2.5 rounded-2xl hover:brightness-110 transition-all">Find Matches</a>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {STATUSES.map((status) => (
              <div key={status} className="bg-card border border-border rounded-2xl p-4 text-center">
                <div className="text-2xl font-bold mb-0.5">{counts[status]}</div>
                <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">{status}</div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            {schools.map((school) => (
              <div key={school.id} className="bg-card border border-border rounded-3xl p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded-xl shrink-0"><GraduationCap className="w-5 h-5 text-primary" /></div>
                    <div>
                      <h3 className="text-sm font-bold text-balance">{school.universityName}</h3>
                      <p className="text-xs text-muted-foreground">{school.universityLocation}</p>
                    </div>
                  </div>
                  <button onClick={() => handleRemove(school.id, school.universityId)} disabled={pending} className="p-2 rounded-xl border border-border text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors" aria-label="Remove school">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${tierBadgeClass(school.matchTier)}`}>{school.matchTier}</span>
                  <span className="text-sm font-mono font-bold text-primary">{school.acceptanceProbability}% match</span>
                </div>

                <div>
                  <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mb-2">Application status</div>
                  <div className="flex gap-2">
                    {STATUSES.map((status) => (
                      <button key={status} onClick={() => handleStatusChange(school.id, status)} disabled={pending} className={`flex-1 text-xs font-medium px-3 py-2.5 rounded-xl border transition-all ${school.applicationStatus === status ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-muted-foreground border-border hover:border-foreground/20'}`}>
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  )
}
