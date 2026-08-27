'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, ListChecks, Trophy, FileText, PenLine, Target, Link as LinkIcon } from 'lucide-react'
import { APPLICATION_INFO, APPLICATION_INFO_COUNTRIES } from '@/lib/application-info'

export function ApplicationInfoView({ defaultCountries }: { defaultCountries: string[] }) {
  const initial = defaultCountries.length > 0 ? defaultCountries[0] : 'US'
  const [active, setActive] = useState(initial)
  const info = APPLICATION_INFO[active]

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
    </main>
  )
}
