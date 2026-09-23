'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ArrowLeft, ExternalLink, ListChecks, Trophy, FileText, PenLine, Target, Link as LinkIcon, CalendarDays, CircleCheck, Landmark, GraduationCap, Globe } from 'lucide-react'
import { APPLICATION_INFO, APPLICATION_INFO_COUNTRIES } from '@/lib/application-info'
import { ADMISSIONS_DEADLINES } from '@/lib/admissions-deadlines'

type Tab = 'overview' | 'deadlines'

// Every country's requirements[] mixes real checklist items with one (or,
// for Germany, two) sentences explaining how international curricula
// (CBSE/ISC/State Board, IB, A-Levels, etc.) get evaluated — that note
// belongs in its own "how curricula are read" card, not buried as a bullet
// in the document checklist. Not every country has one in this exact shape
// (France's data doesn't isolate it as a separate sentence) — this splits
// out whichever items are genuinely about curriculum equivalence rather
// than assuming a fixed position, so it degrades to "no separate card"
// instead of misfiling a real requirement for countries that don't fit the
// pattern.
// Narrower than it looks: dropped a bare "equivalen(t)" match after it
// wrongly pulled in Australia's "Year 11-12, or IB/A-Level equivalent"
// requirement (a real dossier item, not a curriculum-parity note) just for
// containing that substring. CBSE/curriculum are specific enough that every
// country's real curriculum-parity sentence contains one of them, verified
// against all 8 countries' actual data before landing on this pattern.
const CURRICULUM_NOTE_PATTERN = /curriculum|CBSE/i

function splitRequirements(requirements: string[]) {
  const curriculumNotes = requirements.filter((r) => CURRICULUM_NOTE_PATTERN.test(r))
  const checklist = requirements.filter((r) => !CURRICULUM_NOTE_PATTERN.test(r))
  return { curriculumNotes, checklist }
}

export function ApplicationInfoView({ defaultCountries }: { defaultCountries: string[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initial = defaultCountries.length > 0 ? defaultCountries[0] : 'US'
  const [active, setActive] = useState(initial)
  const [tab, setTab] = useState<Tab>(searchParams.get('tab') === 'deadlines' ? 'deadlines' : 'overview')
  const info = APPLICATION_INFO[active]
  const deadlines = ADMISSIONS_DEADLINES[active]
  const { curriculumNotes, checklist } = splitRequirements(info.requirements)

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      {/* router.back() instead of a fixed /profile href — this page is
          reachable from both the profile page and the dashboard timeline,
          and a hardcoded "Back to profile" was wrong when arriving from
          the dashboard. Plain browser history back is correct either way. */}
      <button onClick={() => router.back()} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4 w-fit">
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>

      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">Application Info</h1>
        <p className="text-sm text-muted-foreground text-pretty mb-2">How to apply, what each country actually looks at, and what to prepare.</p>
        <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground/80">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Verified country dataset · Cross-reference your target university&apos;s own admissions page
        </div>
      </div>

      {/* Country pills docked above the tabs, as a sibling of the tab
          content (not inside it) — switching Overview/Deadlines never
          remounts or repositions this row. */}
      <div className="flex flex-wrap gap-2 mb-4">
        {APPLICATION_INFO_COUNTRIES.map((code) => {
          const isDefault = defaultCountries.includes(code)
          const isActive = active === code
          return (
            <button
              key={code}
              onClick={() => setActive(code)}
              aria-pressed={isActive}
              className={`px-4 py-2 rounded-2xl text-xs font-medium border transition-all flex items-center gap-1.5 ${isActive ? 'bg-accent border-primary text-accent-foreground' : 'bg-secondary border-border text-muted-foreground hover:border-foreground/20'}`}
            >
              {APPLICATION_INFO[code].name}
              {isDefault && <span className="w-1.5 h-1.5 rounded-full bg-primary" aria-label="one of your target countries" />}
            </button>
          )
        })}
      </div>

      <div id="admissions-calendar" className="flex gap-1 mb-6 border-b border-border scroll-mt-6">
        <button
          onClick={() => setTab('overview')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 -mb-px transition-colors ${tab === 'overview' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          Overview
        </button>
        <button
          onClick={() => setTab('deadlines')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 -mb-px flex items-center gap-1.5 transition-colors ${tab === 'deadlines' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          <CalendarDays className="w-3.5 h-3.5" /> Deadlines &amp; Timelines
        </button>
      </div>

      {tab === 'overview' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left: Platform & Governance */}
            <div className="lg:col-span-5 space-y-4">
              <section className="bg-card border border-border rounded-3xl p-6">
                <h2 className="text-lg font-bold mb-1 flex items-center gap-2"><Globe className="w-4 h-4 text-primary" /> {info.name}</h2>
                <p className="text-xs text-muted-foreground leading-relaxed text-pretty mb-4">{info.howToApply}</p>
                <div className="flex items-center gap-2 mb-2">
                  <LinkIcon className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Application platform</span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{info.platform}</p>
                <div className="flex flex-wrap gap-2">
                  {info.platformLinks.map((l) => (
                    <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] bg-secondary border border-border text-primary px-2.5 py-1.5 rounded-lg hover:border-primary/40 transition-colors">
                      {l.label} <ExternalLink className="w-3 h-3" />
                    </a>
                  ))}
                </div>
              </section>

              {curriculumNotes.length > 0 && (
                <section className="bg-card border border-border rounded-3xl p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Landmark className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold">Curriculum parity</h3>
                  </div>
                  {curriculumNotes.map((note, i) => (
                    <p key={i} className="text-xs text-muted-foreground leading-relaxed text-pretty mt-2 first:mt-0">{note}</p>
                  ))}
                </section>
              )}

              <section className="bg-card border border-border rounded-3xl p-6">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-chart-5" />
                  <h3 className="text-sm font-bold">Required tests</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed text-pretty">{info.tests}</p>
              </section>
            </div>

            {/* Right: Submission Dossier & Extracurricular Lens */}
            <div className="lg:col-span-7 space-y-4">
              <section className="bg-card border border-border rounded-3xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <ListChecks className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold">What you&apos;ll need</h3>
                </div>
                <ul className="space-y-2">
                  {checklist.map((r) => (
                    <li key={r} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <CircleCheck className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
                      <span className="text-pretty">{r}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="bg-card border border-border rounded-3xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="w-4 h-4 text-chart-2" />
                  <h3 className="text-sm font-bold">Extracurriculars</h3>
                </div>
                {/* US has a genuinely structured, quantifiable version of
                    this (Common App's 10-slot/150-char cap, well known and
                    real, plus the researched "<30% admit rate schools call
                    activities important/very important" stat already cited
                    in lib/application-info.ts) — shown as a real spec
                    matrix instead of a paragraph. Every other country's
                    extracurriculars note doesn't have that same structured,
                    countable shape in the underlying data (no activity-slot
                    cap, no analogous stat), so it stays as prose rather
                    than forcing a fake structure onto real but
                    differently-shaped information. */}
                {active === 'US' ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <div className="bg-secondary/50 border border-border rounded-xl p-3.5">
                        <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Capacity limits</div>
                        <div className="text-xs text-foreground font-semibold">10 activity slots · 150 characters each</div>
                      </div>
                      <div className="bg-secondary/50 border border-border rounded-xl p-3.5">
                        <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Strategic lens</div>
                        <div className="text-xs text-foreground font-semibold">Depth in 1-2 "spikes" beats a long shallow list</div>
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed text-pretty">Most colleges admitting under 30% of applicants rate extracurriculars &quot;important&quot; or &quot;very important.&quot; National-level achievement or founding something real tends to outrank generic membership — an informal lens consultants use, not an official framework.</p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground leading-relaxed text-pretty">{info.extracurriculars}</p>
                )}
              </section>

              <section className="bg-card border border-border rounded-3xl p-6">
                <div className="flex items-center gap-2 mb-2">
                  <PenLine className="w-4 h-4 text-chart-4" />
                  <h3 className="text-sm font-bold">Essays</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed text-pretty mb-3">{info.essays}</p>
                {info.essayResources.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {info.essayResources.map((l) => (
                      <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] bg-secondary border border-border text-primary px-2.5 py-1.5 rounded-lg hover:border-primary/40 transition-colors">
                        {l.label} <ExternalLink className="w-3 h-3" />
                      </a>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>

          <section className="bg-accent/50 border border-primary/25 rounded-3xl p-6 flex gap-3">
            <Target className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold mb-1">What {info.name} actually prioritizes</h3>
              <p className="text-xs text-accent-foreground leading-relaxed text-pretty">{info.prioritizes}</p>
            </div>
          </section>
        </div>
      ) : (
        <div className="space-y-4">
          <section className="bg-card border border-border rounded-3xl p-6">
            <h2 className="text-lg font-bold mb-1">{deadlines.name} — admissions calendar</h2>
            <p className="text-xs text-muted-foreground leading-relaxed text-pretty">{deadlines.system}</p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {deadlines.rounds.map((round, i) => (
              <section key={round.label} className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-mono text-muted-foreground">ROUND {String(i + 1).padStart(2, '0')}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border whitespace-nowrap ${round.binding ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-secondary text-muted-foreground border-border'}`}>
                    {round.binding ? 'BINDING' : 'NON-BINDING'}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-pretty mb-1">{round.label}</h3>
                <p className="text-base font-mono font-bold text-primary">{round.date}</p>
                {round.note && <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed text-pretty">{round.note}</p>}
              </section>
            ))}
          </div>

          <section className="bg-card border border-border rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold">What must be submitted by then</h3>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
              {deadlines.checklist.map((item) => (
                <li key={item} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <CircleCheck className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
                  <span className="text-pretty">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-secondary/50 border border-border rounded-2xl p-5">
            <p className="text-[11px] text-muted-foreground leading-relaxed text-pretty mb-2">{deadlines.sourceNote}</p>
            <div className="flex flex-wrap gap-2">
              {deadlines.sources.map((l) => (
                <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] bg-card border border-border text-primary px-2.5 py-1.5 rounded-lg hover:border-primary/40 transition-colors">
                  {l.label} <ExternalLink className="w-3 h-3" />
                </a>
              ))}
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
