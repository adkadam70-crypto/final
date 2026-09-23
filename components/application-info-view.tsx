'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ArrowLeft, ExternalLink, ListChecks, Trophy, FileText, PenLine, Target, Link as LinkIcon, CalendarDays, CircleCheck, Landmark, GraduationCap, Globe, CalendarPlus } from 'lucide-react'
import { APPLICATION_INFO, APPLICATION_INFO_COUNTRIES } from '@/lib/application-info'
import { ADMISSIONS_DEADLINES } from '@/lib/admissions-deadlines'

type Tab = 'overview' | 'deadlines'

// Short "formula" badge per country for the hero banner — same honest
// phrasing already used in components/matches-view.tsx's CONTEXT record
// (kept consistent across the app rather than reworded here), derived from
// each country's real `prioritizes`/`extracurriculars` text. Singapore is
// deliberately NOT given a percentage split: the real data
// (lib/application-info.ts) says NUS/NTU discontinued their old fixed ~5%
// CCA weighting in 2007 with nothing numeric replacing it, so a badge like
// "70% Academic / 30% Rigor" would be a fabricated precise-looking number,
// not a real fact — same reasoning already applied elsewhere in this file.
const FORMULA_BADGE: Record<string, string> = {
  US: '~50% Academic / ~50% Holistic',
  UK: '~85% Subject Mastery',
  AU: '~100% Academic Cutoff',
  HK: 'Academic Index + Direct Gate',
  IN: 'Merit & Rank Gated',
  DE: 'Abitur GPA-Driven',
  FR: 'Track-Dependent (Licence vs. Grandes Écoles)',
  SG: 'Academic-First',
}

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

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']

// These date strings are real research data, not a clean structured field —
// they range from "November 1, 2026" (fully parseable) to "Not yet
// announced", "Varies by term and program", or "July 15" with no year at
// all (ambiguous — could mean this year or next). A generic countdown badge
// on all of them would either crash on the unparseable ones or, worse,
// silently show a wrong/fabricated day count. This only returns a Date for
// strings it can parse with real confidence (an explicit month + day + a
// 4-digit year); a range like "January 1–15, 2027" resolves to the LATER
// date (the actual cutoff), everything else returns null and the caller
// skips the countdown/calendar UI entirely rather than guessing.
function parseDeadlineDate(dateStr: string): Date | null {
  const yearMatch = dateStr.match(/\b(20\d{2})\b/)
  if (!yearMatch) return null
  const year = Number(yearMatch[1])

  // Grab every "Month D" occurrence in the string and keep the last one —
  // for a range ("January 1–15, 2027" or "June 2 – July 11, 2026") that's
  // the closing date, which is what a countdown/calendar event should
  // target.
  const monthDayRe = /([A-Za-z]+)\s+(\d{1,2})/g
  let lastMatch: RegExpExecArray | null = null
  let m: RegExpExecArray | null
  while ((m = monthDayRe.exec(dateStr)) !== null) {
    const monthIdx = MONTHS.indexOf(m[1].toLowerCase())
    if (monthIdx !== -1) lastMatch = m
  }
  if (!lastMatch) return null

  const monthIdx = MONTHS.indexOf(lastMatch[1].toLowerCase())
  const day = Number(lastMatch[2])
  const date = new Date(year, monthIdx, day, 23, 59, 59)
  return Number.isNaN(date.getTime()) ? null : date
}

// Splits off the first sentence of a note so it can be shown bold as the
// "bottom line," with the rest as supporting detail below — generalized
// across all 8 countries rather than hardcoding one country's specific
// claim (e.g. the US genuinely has no GPA conversion table, but Australia,
// Germany, and the UK all DO run real conversion processes — a single
// shared headline claiming "no conversion" would be false for those).
// Bolds real keywords already present in a checklist item (transcript,
// essay/personal statement, recommendation letters, test scores, etc.)
// instead of a wall of uniform-weight text — the words themselves are
// exactly what's in the underlying data, this just changes which ones
// render bold, so it can't introduce a fact that isn't already there.
// \b around the short acronyms (SAT/ACT/CV/AIU) — without it, the
// case-insensitive "ACT" matched inside ordinary words like "actually" and
// bolded a stray "act" mid-word.
const KEY_TERM_PATTERN = /(transcript|personal statement|essay|recommendation letters?|counselor recommendation|\bSAT\b|\bACT\b|IELTS|TOEFL|APS certificate|\bAIU\b|motivation letter|\bCV\b|predicted grades?|board exam results?|bulletins)/gi

function boldKeyTerms(text: string): React.ReactNode {
  // String.split with a capturing group always alternates
  // [unmatched, captured, unmatched, captured, ...] regardless of the
  // regex's own lastIndex state, so odd indices are reliably the matched
  // keyword — no need to re-test the (stateful, global) regex here.
  const parts = text.split(KEY_TERM_PATTERN)
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold text-foreground">{part}</strong> : part
  )
}

// Splits a multi-sentence paragraph into an array of standalone sentences
// for bullet rendering — same real text, just broken apart instead of run
// together as one dense paragraph. Splits on ". " (a period + space), which
// correctly avoids breaking on abbreviations like "U.S." (no space after
// that period) or decimals. A single-sentence input just returns one item.
function sentenceBullets(text: string): string[] {
  // No lookbehind (this project's tsconfig targets ES6, lookbehind needs
  // ES2018+) — capture the terminator with the sentence, then split on the
  // whitespace that follows a captured [.!?].
  return text
    .split(/([.!?]\s+)/)
    .reduce<string[]>((acc, part, i, arr) => {
      if (i % 2 === 0) {
        const terminator = arr[i + 1] ?? ''
        const sentence = (part + terminator).trim()
        if (sentence) acc.push(sentence)
      }
      return acc
    }, [])
}

// Renders a block of prose as bullet points (one per real sentence) instead
// of a dense paragraph — used everywhere a country's text runs 2+ sentences
// together. A genuinely single-sentence input just renders as one bullet,
// which is harmless (not worse than the plain paragraph it replaces).
function BulletText({ text, className }: { text: string; className: string }) {
  return (
    <ul className="space-y-1.5">
      {sentenceBullets(text).map((s, i) => (
        <li key={i} className={`flex items-start gap-2 ${className}`}>
          <span className="text-primary mt-1.5 text-[6px] shrink-0">●</span>
          <span>{s}</span>
        </li>
      ))}
    </ul>
  )
}

function splitLeadSentence(text: string): { lead: string; rest: string } {
  const match = text.match(/^([\s\S]+?[.!?])(\s+([\s\S]*))?$/)
  if (!match) return { lead: text, rest: '' }
  return { lead: match[1], rest: match[3] ?? '' }
}

function daysUntil(date: Date): number {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.ceil((date.getTime() - startOfToday.getTime()) / 86_400_000)
}

function googleCalendarUrl(title: string, date: Date, details: string): string {
  const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${ymd}/${ymd}`,
    details,
  })
  return `https://www.google.com/calendar/render?${params.toString()}`
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
          remounts or repositions this row. Each pill now leads with its own
          monospace country-code badge so the row reads as a set of distinct
          countries at a glance, not identical gray shapes with different
          text lengths. */}
      {/* Grid, not flex-wrap — with 8 real countries and varying name
          lengths, flex-wrap left a short ragged last row (e.g. just 2 of 8
          items) that read as unbalanced next to the full row above it. A
          fixed 4-column grid (2 clean rows of 4) keeps every row the same
          width regardless of how the pills wrap. */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-8">
        {APPLICATION_INFO_COUNTRIES.map((code) => {
          const isDefault = defaultCountries.includes(code)
          const isActive = active === code
          return (
            <button
              key={code}
              onClick={() => setActive(code)}
              aria-pressed={isActive}
              className={`pl-2.5 pr-3 py-2.5 rounded-2xl text-sm font-medium border transition-all flex items-center gap-2 hover:-translate-y-0.5 active:translate-y-0 ${
                isActive
                  ? 'bg-gradient-to-b from-accent to-accent/70 border-primary text-accent-foreground shadow-md shadow-primary/10'
                  : 'bg-gradient-to-b from-secondary to-secondary/60 border-border text-muted-foreground hover:border-foreground/25 hover:text-foreground hover:shadow-sm'
              }`}
            >
              {/* Was a flat bg-card/gray badge even when inactive — gave the
                  code letters no real color of their own. Now a muted
                  emerald tint always, brightening to solid on the active
                  pill, so it reads as a colored tag rather than a gray
                  placeholder. */}
              <span className={`text-xs font-mono font-bold min-w-[26px] text-center px-1.5 py-1 rounded-lg shrink-0 ${isActive ? 'bg-primary text-primary-foreground' : 'bg-primary/15 text-primary'}`}>{code}</span>
              <span className="truncate">{APPLICATION_INFO[code].name}</span>
              {isDefault && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 ml-auto" aria-label="one of your target countries" />}
            </button>
          )
        })}
      </div>

      {/* Distinct from the country row above through weight and fill, not
          a harsh sharp-cornered box — that earlier version (rounded-md,
          border-2) read as a stiff square slab next to the soft rounded
          pills above it. Same soft rounded-full family as the country
          pills, but visually its own thing: a filled track (bg-secondary)
          with a solid emerald capsule for whichever mode is active. mb-8
          (was mb-6/mt-2) gives it real breathing room both above and below
          — it was reading as cramped/congested against the country grid. */}
      <div id="admissions-calendar" className="inline-flex p-1 rounded-full bg-secondary border border-border mb-8 scroll-mt-6 shadow-sm">
        <button
          onClick={() => setTab('overview')}
          className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${tab === 'overview' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
        >
          System &amp; Requirements Dossier
        </button>
        <button
          onClick={() => setTab('deadlines')}
          className={`px-6 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 transition-all ${tab === 'deadlines' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <CalendarDays className="w-4 h-4" /> Deadlines &amp; Timelines
        </button>
      </div>

      {tab === 'overview' ? (
        <div className="space-y-4">
          {/* Executive briefing — was the "What [Country] actually
              prioritizes" card buried at the very bottom, beneath 5 other
              cards. It's the single most decision-useful sentence on the
              page (the actual weighting logic in plain language), so it
              leads now instead of being the thing 80% of users scroll past
              without reading. */}
          <section className="rounded-2xl bg-card border border-border p-6">
            <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
              <h2 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2.5">
                <span className="bg-primary/15 rounded-full p-2 shrink-0"><Globe className="w-5 h-5 text-primary" /></span>
                {info.name} admissions dossier
              </h2>
              {FORMULA_BADGE[active] && (
                <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/20 text-emerald-400 whitespace-nowrap">
                  {FORMULA_BADGE[active]}
                </span>
              )}
            </div>
            <div className="mt-3 p-3.5 rounded-xl bg-accent/50 border border-primary/25 flex items-start gap-3">
              <Target className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="text-[10px] font-mono text-primary uppercase tracking-wider font-semibold mb-0.5">Core evaluation reality</div>
                <BulletText text={info.prioritizes} className="text-sm text-accent-foreground leading-relaxed text-pretty" />
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left: Platform & Governance */}
            <div className="lg:col-span-5 space-y-4">
              <section className="bg-card border border-border rounded-3xl p-6">
                <h3 className="text-base font-bold tracking-tight mb-3 flex items-center gap-2.5"><span className="bg-primary/15 rounded-full p-1.5 shrink-0"><LinkIcon className="w-3.5 h-3.5 text-primary" /></span> How to apply</h3>
                <div className="mb-4"><BulletText text={info.howToApply} className="text-sm text-foreground/85 leading-relaxed text-pretty" /></div>
                <div className="flex items-center gap-2 mb-2">
                  <LinkIcon className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Application platform</span>
                </div>
                <p className="text-sm text-foreground/80 mb-2">{info.platform}</p>
                {/* Germany-specific: the €75/€30 uni-assist fee and the
                    APS-certificate requirement are real (both already in
                    info.howToApply / requirements above), just buried in
                    prose — surfaced here as a real callout, not a new fact. */}
                {active === 'DE' && (
                  <div className="mt-2 mb-2 p-3 rounded-xl bg-secondary/50 border border-border space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Uni-assist fee</span>
                      <span className="font-mono text-foreground font-semibold">€75 + €30/extra application</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">APS certificate</span>
                      <span className="font-mono text-amber-400 font-semibold">Mandatory: India, China, Vietnam</span>
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {info.platformLinks.map((l) => (
                    <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-mono bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 px-3.5 py-2 rounded-lg hover:bg-emerald-900/50 transition-colors">
                      {l.label} <ExternalLink className="w-3 h-3" />
                    </a>
                  ))}
                </div>
              </section>

              {curriculumNotes.length > 0 && (
                <section className="bg-card border border-border rounded-3xl p-6">
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className="bg-chart-2/15 rounded-full p-1.5 shrink-0"><Landmark className="w-4 h-4 text-chart-2" /></span>
                    <h3 className="text-base font-bold tracking-tight">Curriculum parity</h3>
                  </div>
                  {/* Bold lead sentence per note, not a single hardcoded
                      claim — see splitLeadSentence's comment for why: the
                      real policy genuinely differs by country (US reads
                      curricula as-is, AU/DE/UK run actual conversion
                      processes), so the bottom line has to come from each
                      country's own real text, not one shared headline. */}
                  {curriculumNotes.map((note, i) => {
                    const { lead, rest } = splitLeadSentence(note)
                    return (
                      <div key={i} className="mt-3 first:mt-0">
                        <p className="text-sm font-semibold text-foreground leading-snug text-pretty">{lead}</p>
                        {rest && <p className="text-sm text-foreground/80 leading-relaxed text-pretty mt-1">{rest}</p>}
                      </div>
                    )
                  })}
                  {/* India: the AIU equivalency requirement (real, already
                      in requirements) gets its own badge since it's the one
                      hard procedural step (get a certificate before you can
                      even apply), not just descriptive context. */}
                  {active === 'IN' && (
                    <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-lg bg-amber-950/40 border border-amber-500/20 text-amber-400">
                      AIU equivalency certificate required before matriculation
                    </div>
                  )}
                  {/* Hong Kong: the real data explicitly frames 75%+ as ONE
                      university's example threshold, not a system-wide HK
                      rule ("e.g. one Hong Kong university requires...") —
                      keeping that exact framing here rather than generalizing
                      it into a blanket badge, which would overstate it. */}
                  {active === 'HK' && (
                    <div className="mt-3 text-xs font-mono px-2.5 py-1.5 rounded-lg bg-secondary border border-border text-muted-foreground">
                      Example only — one HK university sets ~75%+ CBSE/CISCE Standard XII average; thresholds vary by school
                    </div>
                  )}
                </section>
              )}

              <section className="bg-card border border-border rounded-3xl p-6">
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="bg-chart-5/15 rounded-full p-1.5 shrink-0"><FileText className="w-4 h-4 text-chart-5" /></span>
                  <h3 className="text-base font-bold tracking-tight">Required tests</h3>
                </div>
                {/* Same reasoning as Extracurriculars below — the US has a
                    genuinely structured, quantifiable set of benchmarks
                    already in the real data (info.tests' own "~1200+ SAT
                    ... ~1400+ ... ~1500+" figures, not invented here), so
                    it gets a real benchmark ladder. Other countries' tests
                    fields describe completely different things (UCAT/LNAT
                    scoring, ATAR having no separate test, JEE/NEET negative
                    marking) with no equivalent 3-tier score-band shape to
                    structure the same way, so they stay as prose. */}
                {active === 'US' ? (
                  <>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-mono text-emerald-400 mb-3">
                      <span>SAT (400-1600)</span><span className="text-muted-foreground">·</span>
                      <span>ACT (1-36)</span><span className="text-muted-foreground">·</span>
                      <span>Superscoring accepted</span>
                    </div>
                    <div className="bg-secondary/50 border border-border rounded-xl p-3.5 space-y-2 mb-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">State flagships</span>
                        <span className="font-mono text-foreground font-semibold">~1200+ SAT</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Selective (Top 50)</span>
                        <span className="font-mono text-foreground font-semibold">~1400+ SAT</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Ivy / elite tier</span>
                        <span className="font-mono text-emerald-400 font-bold">~1500+ SAT</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-foreground/70 leading-relaxed text-pretty">Most schools are test-optional, but a strong score still helps at selective ones — a school&apos;s own published range (elsewhere in this app) beats any generic number.</p>
                  </>
                ) : active === 'IN' ? (
                  // Real figures already in info.tests, restructured as a
                  // ledger — NTA registration is per-exam, so these are
                  // genuinely separate rows, not one blended test.
                  <div className="space-y-2">
                    <div className="bg-secondary/50 border border-border rounded-xl p-3.5 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-foreground">JEE Main / Advanced</div>
                        <div className="text-[11px] text-muted-foreground">75% board marks or top-20th-percentile for JoSAA eligibility</div>
                      </div>
                      <span className="font-mono text-xs text-emerald-400 font-bold whitespace-nowrap">top ~2.5L advance</span>
                    </div>
                    <div className="bg-secondary/50 border border-border rounded-xl p-3.5 flex items-center justify-between">
                      <div className="text-xs font-semibold text-foreground">NEET-UG (Medicine)</div>
                      <span className="font-mono text-xs text-foreground whitespace-nowrap">200 Q (180 attempted) · 720 total</span>
                    </div>
                    <div className="bg-secondary/50 border border-border rounded-xl p-3.5 flex items-center justify-between">
                      <div className="text-xs font-semibold text-foreground">CUET-UG</div>
                      <span className="font-mono text-xs text-foreground whitespace-nowrap">up to 6 subject papers</span>
                    </div>
                    <p className="text-[11px] text-foreground/70 leading-relaxed text-pretty">All run by the NTA and often more decisive than board marks — JEE Main runs twice a year and your better score counts.</p>
                  </div>
                ) : active === 'AU' ? (
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-mono text-emerald-400 mb-1">
                      <span>No SAT/ACT needed</span><span className="text-muted-foreground">·</span>
                      <span>IELTS 6.5 overall, no band below 6.0</span>
                    </div>
                    <BulletText text={info.tests} className="text-sm text-foreground/80 leading-relaxed text-pretty" />
                  </div>
                ) : active === 'DE' ? (
                  <div className="space-y-2">
                    <div className="bg-secondary/50 border border-border rounded-xl p-3.5 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-foreground">TMS (medicine)</div>
                        <div className="text-[11px] text-muted-foreground">Cognitive test, not a knowledge test</div>
                      </div>
                      <span className="font-mono text-xs text-emerald-400 font-bold whitespace-nowrap">~6 hours</span>
                    </div>
                    <p className="text-sm text-foreground/80 leading-relaxed text-pretty">No SAT/ACT equivalent otherwise — non-EU applicants often take TestAS instead. Your GPA is the deciding number for everything else.</p>
                  </div>
                ) : active === 'FR' ? (
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-mono text-emerald-400 mb-1">
                      <span>DELF/DALF B2 or TCF (French-taught)</span><span className="text-muted-foreground">·</span>
                      <span>IELTS/TOEFL (English-taught)</span>
                    </div>
                    <p className="text-sm text-foreground/80 leading-relaxed text-pretty">No universal entrance test for public licence programs. Grandes écoles run their own concours (written + oral, usually after 2 years of classes préparatoires/CPGE), or post-bac exams like SESAME/GEIPI.</p>
                  </div>
                ) : active === 'UK' ? (
                  <div className="space-y-2">
                    <div className="bg-secondary/50 border border-border rounded-xl p-3.5 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">UCAT (medicine/dentistry)</span>
                        {/* 2700 is the scale's max, not a stated target
                            score — the real data never says what's
                            "competitive," so this shows the scale fact
                            only, not a fabricated benchmark to hit. */}
                        <span className="font-mono text-foreground font-semibold">4 sections, scored out of 2700</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">LNAT (law)</span>
                        <span className="font-mono text-foreground font-semibold">42 MCQ + timed essay</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-foreground/70 leading-relaxed text-pretty">BMAT has been discontinued — UCAT is now the sole admissions test for UK undergraduate medicine and dentistry.</p>
                  </div>
                ) : (
                  <BulletText text={info.tests} className="text-sm text-foreground/80 leading-relaxed text-pretty" />
                )}
              </section>
            </div>

            {/* Right: Submission Dossier & Extracurricular Lens */}
            <div className="lg:col-span-7 space-y-4">
              <section className="bg-card border border-border rounded-3xl p-6">
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="bg-primary/15 rounded-full p-1.5 shrink-0"><ListChecks className="w-4 h-4 text-primary" /></span>
                  <h3 className="text-base font-bold tracking-tight">What you&apos;ll need</h3>
                </div>
                <ul className="space-y-2">
                  {checklist.map((r) => (
                    <li key={r} className="flex items-start gap-2 text-sm text-foreground/85">
                      <CircleCheck className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
                      <span className="text-pretty">{boldKeyTerms(r)}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="bg-card border border-border rounded-3xl p-6">
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="bg-chart-2/15 rounded-full p-1.5 shrink-0"><Trophy className="w-4 h-4 text-chart-2" /></span>
                  <h3 className="text-base font-bold tracking-tight">Extracurriculars</h3>
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
                    <p className="text-[13px] text-foreground/80 leading-relaxed text-pretty">Most colleges admitting under 30% of applicants rate extracurriculars <strong className="text-foreground font-semibold">&quot;important&quot; or &quot;very important.&quot;</strong> <strong className="text-foreground font-semibold">National-level achievement</strong> or founding something real tends to outrank generic membership — an informal lens consultants use, not an official framework.</p>
                  </>
                ) : active === 'SG' ? (
                  <>
                    {/* NOT presenting the old "~5%" figure as current — the
                        real data is explicit that NUS/NTU discontinued that
                        fixed weighting in 2007 in favor of an unweighted
                        discretionary scheme. Stating "~5%" here would
                        directly contradict this app's own researched fact
                        and mislead a student into thinking CCA has a known,
                        fixed weight it no longer has. */}
                    <div className="bg-secondary/50 border border-border rounded-xl p-3.5 mb-3">
                      <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Discretionary Admission Scheme</div>
                      <div className="text-xs text-foreground font-semibold">No fixed weight — folded CCA into a holistic leadership/fit review in 2007</div>
                    </div>
                    <BulletText text={info.extracurriculars} className="text-[13px] text-foreground/80 leading-relaxed text-pretty" />
                  </>
                ) : active === 'AU' ? (
                  <>
                    <div className="bg-secondary/50 border border-border rounded-xl p-3.5 mb-3">
                      <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Adjustment factor points</div>
                      <div className="text-xs text-foreground font-semibold">Max +10 to +15 total, on top of ATAR — never changes the ATAR itself</div>
                    </div>
                    <BulletText text={info.extracurriculars} className="text-[13px] text-foreground/80 leading-relaxed text-pretty" />
                  </>
                ) : active === 'UK' ? (
                  <>
                    {/* Real fact is "keep generic hobbies under ~20% of
                        your personal statement" — a writing-space
                        guideline, not a formal "80% academic / 20%
                        contextual" admissions weighting. Presenting it as
                        the latter would overstate what the source says. */}
                    <div className="bg-secondary/50 border border-border rounded-xl p-3.5 mb-3">
                      <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Super-curricular focus</div>
                      <div className="text-xs text-foreground font-semibold">Generic hobbies: keep under ~20% of your personal statement</div>
                    </div>
                    <BulletText text={info.extracurriculars} className="text-[13px] text-foreground/80 leading-relaxed text-pretty" />
                  </>
                ) : active === 'DE' ? (
                  <>
                    <div className="bg-secondary/50 border border-border rounded-xl p-3.5 mb-3">
                      <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Public NC admissions</div>
                      <div className="text-xs text-foreground font-semibold">Essentially not considered — Abitur-equivalent GPA decides</div>
                    </div>
                    <BulletText text={info.extracurriculars} className="text-[13px] text-foreground/80 leading-relaxed text-pretty" />
                  </>
                ) : active === 'IN' ? (
                  <>
                    <div className="bg-secondary/50 border border-border rounded-xl p-3.5 mb-3">
                      <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Merit-based admission</div>
                      <div className="text-xs text-foreground font-semibold">Minimal weight — exceptions: Ashoka, Krea run US-style holistic review</div>
                    </div>
                    <BulletText text={info.extracurriculars} className="text-[13px] text-foreground/80 leading-relaxed text-pretty" />
                  </>
                ) : active === 'FR' ? (
                  <>
                    <div className="bg-secondary/50 border border-border rounded-xl p-3.5 mb-3">
                      <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Fiche Avenir</div>
                      <div className="text-xs text-foreground font-semibold">Teacher-assessed autonomy/initiative — feeds selective programs, never replaces grades</div>
                    </div>
                    <BulletText text={info.extracurriculars} className="text-[13px] text-foreground/80 leading-relaxed text-pretty" />
                  </>
                ) : active === 'HK' ? (
                  <>
                    <div className="bg-secondary/50 border border-border rounded-xl p-3.5 mb-3">
                      <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">OEA / OLE mechanism</div>
                      <div className="text-xs text-foreground font-semibold">Traditionally secondary to core subjects — weight varies by university</div>
                    </div>
                    <BulletText text={info.extracurriculars} className="text-[13px] text-foreground/80 leading-relaxed text-pretty" />
                  </>
                ) : (
                  <BulletText text={info.extracurriculars} className="text-sm text-foreground/80 leading-relaxed text-pretty" />
                )}
              </section>

              <section className="bg-card border border-border rounded-3xl p-6">
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="bg-chart-4/15 rounded-full p-1.5 shrink-0"><PenLine className="w-4 h-4 text-chart-4" /></span>
                  <h3 className="text-base font-bold tracking-tight">Essays</h3>
                </div>
                <div className="mb-3"><BulletText text={info.essays} className="text-sm text-foreground/80 leading-relaxed text-pretty" /></div>
                {info.essayResources.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {info.essayResources.map((l) => (
                      <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-mono bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 px-3.5 py-2 rounded-lg hover:bg-emerald-900/50 transition-colors">
                        {l.label} <ExternalLink className="w-3 h-3" />
                      </a>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <section className="bg-card border border-border rounded-3xl p-6">
            <h2 className="text-xl font-bold tracking-tight mb-1">{deadlines.name} — admissions calendar</h2>
            <p className="text-xs text-muted-foreground leading-relaxed text-pretty">{deadlines.system}</p>
          </section>

          <div className={`grid grid-cols-1 md:grid-cols-2 ${deadlines.rounds.length === 2 ? '' : 'lg:grid-cols-3'} gap-4`}>
            {deadlines.rounds.map((round, i) => {
              const parsed = parseDeadlineDate(round.date)
              const days = parsed ? daysUntil(parsed) : null
              return (
                <section key={round.label} className="bg-card border border-border rounded-2xl p-5 flex flex-col">
                  <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                    <span className="text-[10px] font-mono text-muted-foreground">ROUND {String(i + 1).padStart(2, '0')}</span>
                    <div className="flex items-center gap-1.5">
                      {/* Only rendered when parseDeadlineDate actually
                          resolved a real date — several rounds across the
                          8 countries are "Not yet announced" or "Varies by
                          term", which can't honestly produce a day count. */}
                      {days !== null && (
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border whitespace-nowrap ${days < 0 ? 'bg-secondary text-muted-foreground border-border' : 'bg-emerald-950/60 text-emerald-400 border-emerald-500/20'}`}>
                          {days < 0 ? 'PASSED' : days === 0 ? 'TODAY' : `T-${days} DAYS`}
                        </span>
                      )}
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border whitespace-nowrap ${round.binding ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-secondary text-muted-foreground border-border'}`}>
                        {round.binding ? 'BINDING' : 'NON-BINDING'}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-base font-bold tracking-tight text-pretty mb-1">{round.label}</h3>
                  <p className="text-base font-mono font-bold text-primary">{round.date}</p>
                  {round.note && <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed text-pretty">{round.note}</p>}
                  {/* Same gate as the countdown badge — only a real,
                      parseable date can become a real calendar event; a
                      button that appeared to work but silently did nothing
                      for "Not yet announced" rounds would be worse than no
                      button. */}
                  {parsed && (
                    <div className="flex justify-end mt-auto pt-3 border-t border-white/5">
                      <a
                        href={googleCalendarUrl(`${deadlines.name}: ${round.label}`, parsed, round.note ?? '')}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-mono text-zinc-500 hover:text-emerald-400 flex items-center gap-1.5 transition-colors"
                      >
                        <CalendarPlus className="w-3 h-3" /> Add to Cal <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  )}
                </section>
              )
            })}
          </div>

          <section className="bg-card border border-border rounded-3xl p-6">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="bg-primary/15 rounded-full p-1.5 shrink-0"><GraduationCap className="w-4 h-4 text-primary" /></span>
              <h3 className="text-base font-bold tracking-tight">What must be submitted by then</h3>
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
