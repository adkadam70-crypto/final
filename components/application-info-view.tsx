'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, ListChecks, Trophy, FileText, PenLine, Target, Link as LinkIcon, CalendarDays, CircleCheck } from 'lucide-react'
import { APPLICATION_INFO, APPLICATION_INFO_COUNTRIES } from '@/lib/application-info'
import { ADMISSIONS_DEADLINES } from '@/lib/admissions-deadlines'

type Tab = 'overview' | 'deadlines'

export function ApplicationInfoView({ defaultCountries }: { defaultCountries: string[] }) {
  const searchParams = useSearchParams()
  const initial = defaultCountries.length > 0 ? defaultCountries[0] : 'US'
  const [active, setActive] = useState(initial)
  const [tab, setTab] = useState<Tab>(searchParams.get('tab') === 'deadlines' ? 'deadlines' : 'overview')
  const info = APPLICATION_INFO[active]
  const deadlines = ADMISSIONS_DEADLINES[active]

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/profile" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4 w-fit">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to profile
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">Application Info</h1>
        <p className="text-sm text-muted-foreground text-pretty">
          How to apply, what each country actually looks at, and what to prepare — researched per country, not official policy from any specific university. Always check your target school&apos;s own admissions page too.
        </p>
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

      <div className="flex flex-wrap gap-2 mb-6">
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

      {tab === 'overview' ? (
        <div className="space-y-4">
          <section className="bg-card border border-border rounded-3xl p-6">
            <h2 className="text-lg font-bold mb-1">{info.name}</h2>
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

          <section className="bg-card border border-border rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <ListChecks className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold">What you&apos;ll need</h3>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
              {info.requirements.map((r) => <li key={r}>{r}</li>)}
            </ul>
          </section>

          <section className="bg-card border border-border rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4 text-chart-2" />
              <h3 className="text-sm font-bold">Extracurriculars</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed text-pretty">{info.extracurriculars}</p>
          </section>

          <section className="bg-card border border-border rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-chart-5" />
              <h3 className="text-sm font-bold">Required tests</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed text-pretty">{info.tests}</p>
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

          <div className="space-y-3">
            {deadlines.rounds.map((round) => (
              <section key={round.label} className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-sm font-bold text-pretty">{round.label}</h3>
                  {round.binding && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/20 whitespace-nowrap shrink-0">BINDING</span>
                  )}
                </div>
                <p className="text-base font-mono font-bold text-primary mt-1">{round.date}</p>
                {round.note && <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed text-pretty">{round.note}</p>}
              </section>
            ))}
          </div>

          <section className="bg-card border border-border rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <ListChecks className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold">What must be submitted by then</h3>
            </div>
            <ul className="space-y-1.5">
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
