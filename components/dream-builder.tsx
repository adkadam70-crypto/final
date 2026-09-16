'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, ArrowRight, ArrowLeft, CheckCircle2, Wand2, Plus, Info, X, RotateCcw } from 'lucide-react'
import {
  saveDreamOnboarding,
  recommendDreamField,
  confirmDreamField,
  addDreamCountry,
  type DreamProfileRow,
  type DreamCountryProfileRow,
} from '@/app/actions/dream'
import { ACADEMIC_FIELDS } from '@/lib/academic-detail'
import { APPLICATION_INFO } from '@/lib/application-info'
import { LoadingDots } from '@/components/loading-dots'

const SUBJECT_OPTIONS = [
  'Math', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Economics', 'Business',
  'History', 'Literature / English', 'Languages', 'Art & Design', 'Psychology',
  'Political Science', 'Engineering basics', 'Environmental Science',
]

const INTEREST_OPTIONS = [
  'Technology & Innovation', 'Healthcare & Medicine', 'Climate & Sustainability',
  'Business & Finance', 'Social Justice & Policy', 'Arts & Media', 'Education',
  'Science & Research', 'Law & Government', 'Design & Architecture',
]

// Q5/Q6 — added in the 4->6 question expansion. These ask about *fit*
// (how they like to work, what success means to them) rather than more
// topic overlap, since two students who both pick "Biology" can still
// belong in very different fields depending on these answers.
const WORKING_STYLE_OPTIONS = [
  'Hands-on building/making', 'Deep independent research', 'Working directly with people',
  'Leading & organizing teams', 'Analyzing data & numbers', 'Creative & open-ended problems',
]

const FUTURE_VISION_OPTIONS = [
  'Start my own company', 'Do cutting-edge research', 'Work directly helping people',
  'Build large-scale products/systems', 'Shape policy or public discourse', 'Create art/media that reaches people',
]

const GRADE_OPTIONS = ['9th', '10th', '11th', '12th']
const CURRENT_YEAR = new Date().getFullYear()
const APPLICATION_YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR + i)

const COUNTRY_OPTIONS = [
  { code: 'US', label: 'United States' },
  { code: 'UK', label: 'United Kingdom' },
  { code: 'AU', label: 'Australia' },
  { code: 'SG', label: 'Singapore' },
  { code: 'HK', label: 'Hong Kong' },
  { code: 'IN', label: 'India' },
  { code: 'DE', label: 'Germany' },
  { code: 'FR', label: 'France' },
]

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
        active ? 'bg-accent border-primary text-accent-foreground' : 'bg-secondary border-border text-muted-foreground hover:border-foreground/20'
      }`}
    >
      {label}
    </button>
  )
}

// Lets a user type an answer that isn't one of the preset pills — appends it
// to the same tags array as a selected custom tag, rather than a separate
// field, so it flows through scoring/AI prompts identically to a preset pick.
function CustomTagInput({ list, setList }: { list: string[]; setList: (v: string[]) => void }) {
  const [value, setValue] = useState('')
  function add() {
    const v = value.trim()
    if (!v || list.includes(v)) return
    setList([...list, v])
    setValue('')
  }
  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            add()
          }
        }}
        maxLength={100}
        placeholder="Type your own..."
        className="flex-1 bg-secondary border border-border rounded-xl p-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary"
      />
      <button
        type="button"
        onClick={add}
        disabled={!value.trim()}
        className="px-3 py-2 rounded-xl text-xs font-medium bg-accent text-accent-foreground disabled:opacity-40 transition-opacity"
      >
        Add
      </button>
    </div>
  )
}

function BottomBar({
  label,
  nextLabel,
  onNext,
  onBack,
  disabled,
  pending,
}: {
  label: string
  nextLabel?: string
  onNext?: () => void
  onBack?: () => void
  disabled?: boolean
  pending?: boolean
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-card border-t border-border px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="w-4 h-4 text-primary shrink-0" />
          <p className="text-xs text-muted-foreground truncate">{label}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onBack && (
            <button type="button" onClick={onBack} className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground px-3 py-2 rounded-xl">
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          )}
          {onNext && (
            <button
              type="button"
              onClick={onNext}
              disabled={disabled}
              className="flex items-center gap-1.5 bg-primary text-primary-foreground font-semibold text-xs px-4 py-2.5 rounded-xl hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {pending ? <LoadingDots /> : <>{nextLabel ?? 'Next'} <ArrowRight className="w-3.5 h-3.5" /></>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Header({ title, subtitle, onInfoClick }: { title: string; subtitle: string; onInfoClick?: () => void }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">{title}</h1>
        {onInfoClick && (
          <button
            type="button"
            onClick={onInfoClick}
            aria-label="Learn what Build Your Dream is"
            className="mb-1 inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  )
}

// The explainer modal — what this feature is, that it reads the main
// profile (not just these onboarding answers), and the overall flow, so a
// first-time user isn't guessing what they're about to spend 6 questions
// answering. Reachable from the (i) button next to the "Build Your Dream"
// title at every stage, not just the dashboard.
function InfoModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-3xl p-6 max-w-md w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-3">
          <h2 className="text-lg font-bold tracking-tight">What is Build Your Dream?</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
          <p>
            It's a guided plan built around one field of study you're aiming for — not a generic checklist. It answers three
            questions: what should I study, what do I need to do to get in, and how am I actually tracking against it.
          </p>
          <p>
            <span className="font-semibold text-foreground">It reads your main profile.</span> Your saved academics, test
            scores, and extracurriculars from your regular Shortlisted profile feed directly into the field recommendation
            and every country's roadmap here — that's why it's locked until your main profile is set up.
          </p>
          <p className="font-semibold text-foreground">The flow:</p>
          <ol className="list-decimal list-inside space-y-1.5">
            <li>Answer 6 quick questions about your strengths, interests, and how you like to work.</li>
            <li>Get an AI field recommendation (or pick your own) — this becomes the lens for everything after.</li>
            <li>Add a country. Each one gets its own AI roadmap and a real, researched application checklist for that field.</li>
            <li>Track specific universities against their own per-school checklist as you shortlist them.</li>
          </ol>
          <p>You can come back and re-answer the 6 questions any time your interests change — see the button on your dashboard.</p>
        </div>
      </div>
    </div>
  )
}

export function DreamBuilder({
  hasProfile,
  initialDream,
  initialCountries,
}: {
  hasProfile: boolean
  initialDream: DreamProfileRow
  initialCountries: DreamCountryProfileRow[]
}) {
  const router = useRouter()
  const [dream, setDream] = useState(initialDream)
  const [countries, setCountries] = useState(initialCountries ?? [])
  const [onboardingStep, setOnboardingStep] = useState(1)
  const [strengths, setStrengths] = useState<string[]>(initialDream?.strengths ?? [])
  const [hobbies, setHobbies] = useState(initialDream?.hobbies ?? '')
  const [interests, setInterests] = useState<string[]>(initialDream?.interests ?? [])
  const [interestsOther, setInterestsOther] = useState(initialDream?.interestsOther ?? '')
  const [workingStyle, setWorkingStyle] = useState<string[]>(initialDream?.workingStyle ?? [])
  const [futureVision, setFutureVision] = useState(initialDream?.futureVision ?? '')
  const [currentGrade, setCurrentGrade] = useState(initialDream?.currentGrade ?? '')
  const [applicationYear, setApplicationYear] = useState<number | ''>(initialDream?.applicationYear ?? '')

  const [recommendation, setRecommendation] = useState<{ field: string; rationale: string } | null>(
    initialDream?.recommendedField ? { field: initialDream.recommendedField, rationale: initialDream.recommendedFieldRationale ?? '' } : null,
  )
  const [chooseOwnField, setChooseOwnField] = useState(false)
  const [manualField, setManualField] = useState('')
  const [addingCountry, setAddingCountry] = useState(false)
  const [newCountry, setNewCountry] = useState('')

  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showInfo, setShowInfo] = useState(false)
  // Lets a user with already-confirmed field/countries walk back through
  // the 6 questions (pre-filled with their current answers) without losing
  // their confirmed field or any country/checklist data — only the
  // onboarding-answer columns get overwritten on save.
  const [reanswering, setReanswering] = useState(false)
  // Shown right after finishing a re-answer pass — the natural moment to
  // offer reanalysis is immediately after answers changed, not as a
  // standing button that sits on the dashboard indefinitely regardless of
  // whether anything's actually different.
  const [justReanswered, setJustReanswered] = useState(false)
  const [recheckResult, setRecheckResult] = useState<{ field: string; rationale: string } | null>(null)
  const [rechecking, setRechecking] = useState(false)

  const onboardingDone =
    !!dream &&
    (dream.strengths.length > 0 || !!dream.hobbies || dream.interests.length > 0 || dream.workingStyle?.length > 0 || !!dream.futureVision) &&
    !!dream.currentGrade &&
    !!dream.applicationYear
  const fieldConfirmed = !!dream?.confirmedField

  function toggle(list: string[], setList: (v: string[]) => void, tag: string) {
    setList(list.includes(tag) ? list.filter((t) => t !== tag) : [...list, tag])
  }

  async function saveOnboardingIfLastStep() {
    if (!currentGrade || applicationYear === '') return
    setPending(true)
    setError(null)
    const res = await saveDreamOnboarding({ strengths, hobbies, interests, interestsOther, workingStyle, futureVision, currentGrade, applicationYear })
    setPending(false)
    if (!res.success) {
      setError(res.message)
      return
    }
    setDream((d) => ({ ...(d as NonNullable<DreamProfileRow>), strengths, hobbies, interests, interestsOther, workingStyle, futureVision, currentGrade, applicationYear }))
    if (reanswering) {
      setReanswering(false)
      setJustReanswered(true)
    }
  }

  async function handleGetRecommendation() {
    setPending(true)
    setError(null)
    const res = await recommendDreamField()
    setPending(false)
    if ('error' in res && res.error) return setError(res.message)
    if ('rateLimited' in res && res.rateLimited) return setError(res.message)
    if ('needsOnboarding' in res && res.needsOnboarding) return setError('Please finish the questions above first.')
    if ('needsProfile' in res && res.needsProfile) return setError('Set up your main profile first — we need your academics to make a recommendation.')
    setRecommendation({ field: res.field, rationale: res.rationale })
  }

  async function handleConfirmField(field: string) {
    if (!field) return
    setPending(true)
    setError(null)
    const res = await confirmDreamField(field)
    setPending(false)
    if (!res.success) return setError(res.message)
    setDream((d) => ({ ...(d as NonNullable<DreamProfileRow>), confirmedField: field }))
    setRecheckResult(null)
  }

  async function handleRecheckRecommendation() {
    setRechecking(true)
    setError(null)
    const res = await recommendDreamField()
    setRechecking(false)
    if ('error' in res && res.error) return setError(res.message)
    if ('rateLimited' in res && res.rateLimited) return setError(res.message)
    if ('needsOnboarding' in res && res.needsOnboarding) return setError('Please finish the questions above first.')
    if ('needsProfile' in res && res.needsProfile) return setError('Set up your main profile first — we need your academics to make a recommendation.')
    setRecheckResult({ field: res.field, rationale: res.rationale })
  }

  async function handleAddCountry(code: string) {
    if (!code) return
    setPending(true)
    setError(null)
    const res = await addDreamCountry(code)
    setPending(false)
    if (!res.success) return setError(res.message)
    router.push(`/dream/${code}`)
  }

  const infoModal = showInfo && <InfoModal onClose={() => setShowInfo(false)} />

  // ---------------------------------------------------------------- PROFILE GATE
  // Every recommendation and roadmap here reasons over the main profile
  // together with these onboarding answers — without it there's nothing
  // to actually ground a recommendation in, so this blocks the whole
  // feature (not just the "Get recommendation" button) until it exists.
  if (!hasProfile) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-8 pb-28">
        <Header title="Build Your Dream" subtitle="A guided plan built around one field, grounded in your real profile." onInfoClick={() => setShowInfo(true)} />
        <div className="bg-card border border-border rounded-3xl p-6 text-center">
          <p className="text-sm font-bold mb-2">Set up your main profile first</p>
          <p className="text-xs text-muted-foreground leading-relaxed mb-5 text-pretty">
            Build Your Dream reads your saved academics, test scores, and extracurriculars from your main Shortlisted profile to ground
            every field recommendation and roadmap in your real record — not guesses. There's nothing to build on until that's saved.
          </p>
          <button
            onClick={() => router.push('/profile')}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold text-sm px-5 py-2.5 rounded-2xl hover:brightness-110 transition-all"
          >
            Set up your profile <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        {infoModal}
      </main>
    )
  }

  // ---------------------------------------------------------------- ONBOARDING
  if (!onboardingDone || reanswering) {
    const steps = [
      {
        label: 'Which subjects do you excel in or enjoy the most?',
        valid: strengths.length > 0,
        content: (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {strengths
                .filter((s) => !SUBJECT_OPTIONS.includes(s))
                .map((s) => (
                  <Pill key={s} label={s} active onClick={() => toggle(strengths, setStrengths, s)} />
                ))}
              {SUBJECT_OPTIONS.map((s) => (
                <Pill key={s} label={s} active={strengths.includes(s)} onClick={() => toggle(strengths, setStrengths, s)} />
              ))}
            </div>
            <CustomTagInput list={strengths} setList={setStrengths} />
          </div>
        ),
      },
      {
        label: 'What do you spend your free time building, researching, or doing?',
        valid: hobbies.trim().length > 0,
        content: (
          <textarea
            value={hobbies}
            onChange={(e) => setHobbies(e.target.value)}
            maxLength={300}
            rows={4}
            placeholder="e.g. Building small web apps, reading about space exploration, running a school debate club"
            className="w-full bg-secondary border border-border rounded-xl p-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary resize-none"
          />
        ),
      },
      {
        label: 'What kind of real-world problems or industries excite you?',
        valid: interests.length > 0 || interestsOther.trim().length > 0,
        content: (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map((s) => (
                <Pill key={s} label={s} active={interests.includes(s)} onClick={() => toggle(interests, setInterests, s)} />
              ))}
            </div>
            <input
              type="text"
              value={interestsOther}
              onChange={(e) => setInterestsOther(e.target.value)}
              maxLength={300}
              placeholder="Anything else? (optional)"
              className="w-full bg-secondary border border-border rounded-xl p-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary"
            />
          </div>
        ),
      },
      {
        label: 'How do you prefer to work and learn?',
        valid: workingStyle.length > 0,
        content: (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {workingStyle
                .filter((s) => !WORKING_STYLE_OPTIONS.includes(s))
                .map((s) => (
                  <Pill key={s} label={s} active onClick={() => toggle(workingStyle, setWorkingStyle, s)} />
                ))}
              {WORKING_STYLE_OPTIONS.map((s) => (
                <Pill key={s} label={s} active={workingStyle.includes(s)} onClick={() => toggle(workingStyle, setWorkingStyle, s)} />
              ))}
            </div>
            <CustomTagInput list={workingStyle} setList={setWorkingStyle} />
          </div>
        ),
      },
      {
        label: 'What does success look like to you in about 10 years?',
        valid: futureVision.trim().length > 0,
        content: (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {FUTURE_VISION_OPTIONS.map((s) => (
                <Pill key={s} label={s} active={futureVision === s} onClick={() => setFutureVision(s)} />
              ))}
            </div>
            <input
              type="text"
              value={FUTURE_VISION_OPTIONS.includes(futureVision) ? '' : futureVision}
              onChange={(e) => setFutureVision(e.target.value)}
              maxLength={300}
              placeholder="Or type your own..."
              className="w-full bg-secondary border border-border rounded-xl p-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary"
            />
          </div>
        ),
      },
      {
        label: 'What grade are you in, and when do you plan to start college?',
        valid: !!currentGrade && applicationYear !== '',
        content: (
          <div className="space-y-4">
            <div>
              <p className="text-[11px] text-muted-foreground mb-2">Current grade</p>
              <div className="flex flex-wrap gap-2">
                {GRADE_OPTIONS.map((g) => (
                  <Pill key={g} label={g} active={currentGrade === g} onClick={() => setCurrentGrade(g)} />
                ))}
              </div>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground mb-2">Year you plan to start college</p>
              <div className="flex flex-wrap gap-2">
                {APPLICATION_YEAR_OPTIONS.map((y) => (
                  <Pill key={y} label={`Fall ${y}`} active={applicationYear === y} onClick={() => setApplicationYear(y)} />
                ))}
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground/70">This tells us how much runway you have left, so your roadmap can be paced to your actual timeline instead of generic advice.</p>
          </div>
        ),
      },
    ]
    const current = steps[onboardingStep - 1]

    return (
      <main className="max-w-2xl mx-auto px-4 py-8 pb-28">
        <Header title="Build Your Dream" subtitle="A few quick questions to find the field that fits you best." onInfoClick={() => setShowInfo(true)} />
        {reanswering && (
          <p className="text-[11px] text-primary font-medium mb-3 flex items-center gap-1.5">
            <RotateCcw className="w-3 h-3" /> Updating your answers — your confirmed field and countries stay as-is until you decide otherwise.
          </p>
        )}
        <div className="bg-card border border-border rounded-3xl p-6">
          <div className="flex items-center gap-1.5 mb-4">
            {steps.map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full ${i < onboardingStep ? 'bg-primary' : 'bg-secondary'}`} />
            ))}
          </div>
          <h2 className="text-sm font-bold mb-4 text-balance">{current.label}</h2>
          {current.content}
          {error && <p className="text-[11px] text-destructive mt-3">{error}</p>}
        </div>
        <BottomBar
          label={`Step ${onboardingStep} of ${steps.length}`}
          nextLabel={onboardingStep < steps.length ? 'Next' : 'Finish'}
          onNext={async () => {
            if (onboardingStep < steps.length) {
              setOnboardingStep((s) => s + 1)
              return
            }
            await saveOnboardingIfLastStep()
          }}
          onBack={onboardingStep > 1 ? () => setOnboardingStep((s) => s - 1) : reanswering ? () => setReanswering(false) : undefined}
          disabled={!current.valid || pending}
          pending={pending}
        />
        {infoModal}
      </main>
    )
  }

  // ---------------------------------------------------------------- FIELD CONFIRMATION
  if (!fieldConfirmed) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-8 pb-28">
        <Header title="Confirm your field" subtitle="Based on your answers and your saved profile." onInfoClick={() => setShowInfo(true)} />
        <div className="bg-card border border-border rounded-3xl p-6">
          {!recommendation && !chooseOwnField ? (
            <div className="text-center py-6">
              <p className="text-xs text-muted-foreground mb-4">Ready when you are — this looks at your onboarding answers together with your saved academic profile.</p>
              <button
                onClick={handleGetRecommendation}
                disabled={pending || !hasProfile}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold text-sm px-5 py-2.5 rounded-2xl hover:brightness-110 disabled:opacity-50 transition-all"
              >
                {pending ? <LoadingDots /> : <><Wand2 className="w-4 h-4" /> Get my recommendation</>}
              </button>
              <button onClick={() => setChooseOwnField(true)} className="block mx-auto mt-3 text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2">
                Or just pick your own field
              </button>
            </div>
          ) : recommendation && !chooseOwnField ? (
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Recommended field</p>
              <p className="text-lg font-bold text-primary mb-2">{recommendation.field}</p>
              <p className="text-xs text-muted-foreground leading-relaxed mb-5 text-pretty">{recommendation.rationale}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleConfirmField(recommendation.field)}
                  disabled={pending}
                  className="flex items-center gap-1.5 bg-primary text-primary-foreground font-semibold text-xs px-4 py-2.5 rounded-xl hover:brightness-110 disabled:opacity-50"
                >
                  {pending ? <LoadingDots /> : <><CheckCircle2 className="w-3.5 h-3.5" /> Accept & continue</>}
                </button>
                <button onClick={() => setChooseOwnField(true)} className="text-xs font-medium text-muted-foreground hover:text-foreground px-4 py-2.5 rounded-xl border border-border">
                  Choose my own field
                </button>
              </div>
            </div>
          ) : (
            <div>
              <label className="text-[11px] text-muted-foreground block mb-1.5">Pick your field</label>
              <select value={manualField} onChange={(e) => setManualField(e.target.value)} className="w-full bg-secondary border border-border rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-primary mb-3">
                <option value="">Select a field</option>
                {ACADEMIC_FIELDS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  onClick={() => handleConfirmField(manualField)}
                  disabled={!manualField || pending}
                  className="flex items-center gap-1.5 bg-primary text-primary-foreground font-semibold text-xs px-4 py-2.5 rounded-xl hover:brightness-110 disabled:opacity-50"
                >
                  {pending ? <LoadingDots /> : 'Confirm field'}
                </button>
                <button onClick={() => setChooseOwnField(false)} className="text-xs font-medium text-muted-foreground hover:text-foreground px-4 py-2.5 rounded-xl border border-border">
                  Back
                </button>
              </div>
            </div>
          )}
          {error && <p className="text-[11px] text-destructive mt-3">{error}</p>}
        </div>
        <BottomBar label="Up next: confirm your field of study" />
        {infoModal}
      </main>
    )
  }

  // ---------------------------------------------------------------- JUST RE-ANSWERED
  // The natural moment to offer reanalysis — right after answers actually
  // changed — rather than a button that sits on the dashboard forever.
  if (justReanswered) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-8 pb-28">
        <Header title="Answers updated" subtitle="Want to reanalyze your recommended field against these new answers?" onInfoClick={() => setShowInfo(true)} />
        <div className="bg-card border border-border rounded-3xl p-6 text-center">
          {!recheckResult ? (
            <>
              <p className="text-xs text-muted-foreground mb-4">Your confirmed field stays <span className="font-semibold text-foreground">{dream?.confirmedField}</span> unless you switch it below.</p>
              <button
                onClick={handleRecheckRecommendation}
                disabled={rechecking}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold text-sm px-5 py-2.5 rounded-2xl hover:brightness-110 disabled:opacity-50 transition-all"
              >
                {rechecking ? <LoadingDots /> : <><Wand2 className="w-4 h-4" /> Reanalyze my profile</>}
              </button>
              <button onClick={() => setJustReanswered(false)} className="block mx-auto mt-3 text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2">
                Skip, go to dashboard
              </button>
            </>
          ) : (
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Updated recommendation</p>
              <p className="text-lg font-bold text-primary mb-2">{recheckResult.field}</p>
              <p className="text-xs text-muted-foreground leading-relaxed mb-5 text-pretty">{recheckResult.rationale}</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {recheckResult.field !== dream?.confirmedField && (
                  <button
                    onClick={async () => {
                      await handleConfirmField(recheckResult.field)
                      setJustReanswered(false)
                    }}
                    disabled={pending}
                    className="flex items-center gap-1.5 bg-primary text-primary-foreground font-semibold text-xs px-4 py-2.5 rounded-xl hover:brightness-110 disabled:opacity-50"
                  >
                    {pending ? <LoadingDots /> : <><CheckCircle2 className="w-3.5 h-3.5" /> Switch to {recheckResult.field}</>}
                  </button>
                )}
                <button
                  onClick={() => {
                    setRecheckResult(null)
                    setJustReanswered(false)
                  }}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground px-4 py-2.5 rounded-xl border border-border"
                >
                  Keep {dream?.confirmedField}
                </button>
              </div>
            </div>
          )}
          {error && <p className="text-[11px] text-destructive mt-3">{error}</p>}
        </div>
        {infoModal}
      </main>
    )
  }

  // ---------------------------------------------------------------- DASHBOARD
  const addedCodes = new Set(countries.map((c) => c.country))
  const availableToAdd = COUNTRY_OPTIONS.filter((c) => !addedCodes.has(c.code))

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <Header title="Build Your Dream" subtitle={`Target field: ${dream!.confirmedField}`} onInfoClick={() => setShowInfo(true)} />
      <p className="text-[11px] text-muted-foreground -mt-4 mb-4">
        Grounded in your <button onClick={() => router.push('/profile')} className="text-primary underline underline-offset-2">main profile</button> plus your onboarding answers.
      </p>

      {/* A standing "re-check recommendation" link read as background noise
          sitting there permanently — reanalysis only makes sense once
          answers have actually changed, so this is now a distinct box that
          leads WITH re-answering, and the reanalyze step happens right
          after finishing that (see the justReanswered screen below), not
          as a second separate button floating on this dashboard. */}
      <div className="bg-accent/40 border border-primary/30 rounded-3xl p-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-foreground">Interests changed since you answered?</p>
          <p className="text-xs text-muted-foreground mt-0.5">Re-answer the 6 questions and we'll reanalyze your recommended field against your new answers.</p>
        </div>
        <button
          onClick={() => {
            setReanswering(true)
            setOnboardingStep(1)
            setRecheckResult(null)
          }}
          className="shrink-0 inline-flex items-center justify-center gap-1.5 bg-primary text-primary-foreground font-semibold text-xs px-4 py-2.5 rounded-xl hover:brightness-110 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Re-answer questions
        </button>
      </div>

      {countries.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {countries.map((c) => {
            const info = APPLICATION_INFO[c.country]
            return (
              <button
                key={c.country}
                onClick={() => router.push(`/dream/${c.country}`)}
                className="text-left bg-card border border-border rounded-3xl p-5 hover:border-primary/30 transition-colors"
              >
                <p className="text-sm font-bold mb-1">{info?.name ?? c.country}</p>
                <p className="text-[11px] text-muted-foreground mb-3">
                  {c.analysisStrengths?.length ? 'Analysis ready' : 'Not analyzed yet'}
                </p>
                <span className="text-xs text-primary font-medium flex items-center gap-1">Open workspace <ArrowRight className="w-3 h-3" /></span>
              </button>
            )
          })}
        </div>
      )}

      <div className="bg-card border border-border rounded-3xl p-6">
        {!addingCountry ? (
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => setAddingCountry(true)}
              disabled={availableToAdd.length === 0}
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" /> Add a country
            </button>
          </div>
        ) : (
          <div>
            <label className="text-[11px] text-muted-foreground block mb-1.5">Which country do you want to build next?</label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {availableToAdd.map((c) => (
                <Pill key={c.code} label={c.label} active={newCountry === c.code} onClick={() => setNewCountry(c.code)} />
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleAddCountry(newCountry)}
                disabled={!newCountry || pending}
                className="flex items-center gap-1.5 bg-primary text-primary-foreground font-semibold text-xs px-4 py-2.5 rounded-xl hover:brightness-110 disabled:opacity-50"
              >
                {pending ? <LoadingDots /> : 'Add & open'}
              </button>
              <button onClick={() => setAddingCountry(false)} className="text-xs font-medium text-muted-foreground hover:text-foreground px-4 py-2.5 rounded-xl border border-border">
                Cancel
              </button>
            </div>
          </div>
        )}
        {error && <p className="text-[11px] text-destructive mt-3">{error}</p>}
      </div>

      {infoModal}
    </main>
  )
}
