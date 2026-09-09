'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, ArrowRight, ArrowLeft, CheckCircle2, Wand2, Plus } from 'lucide-react'
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

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">{title}</h1>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
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

  const onboardingDone = !!dream && (dream.strengths.length > 0 || !!dream.hobbies || dream.interests.length > 0) && !!dream.currentGrade && !!dream.applicationYear
  const fieldConfirmed = !!dream?.confirmedField

  function toggle(list: string[], setList: (v: string[]) => void, tag: string) {
    setList(list.includes(tag) ? list.filter((t) => t !== tag) : [...list, tag])
  }

  async function saveOnboardingIfLastStep() {
    if (!currentGrade || applicationYear === '') return
    setPending(true)
    setError(null)
    const res = await saveDreamOnboarding({ strengths, hobbies, interests, interestsOther, currentGrade, applicationYear })
    setPending(false)
    if (!res.success) {
      setError(res.message)
      return
    }
    setDream((d) => ({ ...(d as NonNullable<DreamProfileRow>), strengths, hobbies, interests, interestsOther, currentGrade, applicationYear }))
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

  // ---------------------------------------------------------------- ONBOARDING
  if (!onboardingDone) {
    const steps = [
      {
        label: 'Which subjects do you excel in or enjoy the most?',
        valid: strengths.length > 0,
        content: (
          <div className="flex flex-wrap gap-2">
            {SUBJECT_OPTIONS.map((s) => (
              <Pill key={s} label={s} active={strengths.includes(s)} onClick={() => toggle(strengths, setStrengths, s)} />
            ))}
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
        <Header title="Build Your Dream" subtitle="A few quick questions to find the field that fits you best." />
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
          onBack={onboardingStep > 1 ? () => setOnboardingStep((s) => s - 1) : undefined}
          disabled={!current.valid || pending}
          pending={pending}
        />
      </main>
    )
  }

  // ---------------------------------------------------------------- FIELD CONFIRMATION
  if (!fieldConfirmed) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-8 pb-28">
        <Header title="Confirm your field" subtitle="Based on your answers and your saved profile." />
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
              {!hasProfile && <p className="text-[11px] text-muted-foreground mt-2">Set up your main profile first.</p>}
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
      </main>
    )
  }

  // ---------------------------------------------------------------- DASHBOARD
  const addedCodes = new Set(countries.map((c) => c.country))
  const availableToAdd = COUNTRY_OPTIONS.filter((c) => !addedCodes.has(c.code))

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 pb-28">
      <Header title="Build Your Dream" subtitle={`Target field: ${dream!.confirmedField}`} />

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
          <button
            onClick={() => setAddingCountry(true)}
            disabled={availableToAdd.length === 0}
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" /> Add a country
          </button>
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

      <BottomBar label={countries.length === 0 ? 'Up next: add your first country' : 'Click a country above to keep building it'} />
    </main>
  )
}
