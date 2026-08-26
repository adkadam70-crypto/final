'use client'

import { useState, useTransition } from 'react'
import { GraduationCap, Globe, Flame, Compass, Loader2, Save, CheckCircle2 } from 'lucide-react'
import { saveProfile, type SaveProfileInput } from '@/app/actions/profile'
import { gradeBadge } from '@/lib/grade'
import { AcademicDetailInput } from '@/components/academic-detail-input'
import { defaultAcademicDetail, ACADEMIC_FIELDS, type AcademicDetail } from '@/lib/academic-detail'

type Curriculum = 'CBSE' | 'IB_DIPLOMA' | 'A_LEVELS' | 'US_GPA_PCT'

type ProfileRow = {
  id: number
  targetCountry: string
  curriculum: string
  gradeValue: number
  preferredClimate: string
  preferredSector: string
  extracurriculars: string[]
  createdAt: Date
}

export function ProfileForm({ initialProfiles }: { initialProfiles: ProfileRow[] }) {
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [targetCountry, setTargetCountry] = useState('US')
  const [curriculum, setCurriculum] = useState<Curriculum>('CBSE')
  const [academicDetail, setAcademicDetail] = useState<AcademicDetail>(defaultAcademicDetail('CBSE'))
  const [preferredClimate, setPreferredClimate] = useState('Warm')
  const [preferredSector, setPreferredSector] = useState('Tech Hub')
  const [preferredRank, setPreferredRank] = useState('No preference')
  const [intendedField, setIntendedField] = useState('No preference')
  const [ec1, setEc1] = useState('')
  const [ec2, setEc2] = useState('')

  const badge = gradeBadge(academicDetail)

  function handleCurriculumChange(next: Curriculum) {
    setCurriculum(next)
    setAcademicDetail(defaultAcademicDetail(next))
  }

  async function handleSave() {
    setError(null)
    setSaved(false)
    const input: SaveProfileInput = {
      targetCountry,
      curriculum,
      academicDetail,
      preferredClimate,
      preferredSector,
      preferredRank,
      intendedField,
      extracurriculars: [ec1, ec2].map((s) => s.trim()).filter(Boolean),
    }
    startTransition(async () => {
      try {
        await saveProfile(input)
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Something went wrong saving your profile.'
        console.error('Profile save failed:', message)
        setError(message)
        setTimeout(() => setError(null), 5000)
      }
    })
  }

  const COUNTRIES = [
    { code: 'US', label: 'USA' },
    { code: 'UK', label: 'UK' },
    { code: 'AU', label: 'Australia' },
    { code: 'SG', label: 'Singapore' },
    { code: 'HK', label: 'Hong Kong' },
    { code: 'IN', label: 'India' },
  ]

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">Your Profile</h1>
        <p className="text-sm text-muted-foreground">Tell us about your academics and preferences. This powers your match results and university recommendations.</p>
      </div>

      <div className="space-y-5">
        <section className="bg-card border border-border rounded-3xl p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2"><Globe className="w-4 h-4 text-primary" /> Target country</h2>
          <div className="grid grid-cols-3 gap-2">
            {COUNTRIES.map((c) => (
              <button key={c.code} onClick={() => setTargetCountry(c.code)} className={`p-3 rounded-2xl text-xs font-medium transition-all border ${targetCountry === c.code ? 'bg-accent border-primary text-accent-foreground' : 'bg-secondary border-border text-muted-foreground hover:border-foreground/20'}`}>{c.label}</button>
            ))}
          </div>
        </section>

        <section className="bg-card border border-border rounded-3xl p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2"><GraduationCap className="w-4 h-4 text-primary" /> Academics</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="curriculum" className="text-xs text-muted-foreground block mb-2">Curriculum / board</label>
              <select id="curriculum" value={curriculum} onChange={(e) => handleCurriculumChange(e.target.value as Curriculum)} className="w-full bg-secondary border border-border rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-primary">
                <option value="CBSE">CBSE / ISC (India)</option>
                <option value="IB_DIPLOMA">IB Diploma</option>
                <option value="A_LEVELS">A-Levels</option>
                <option value="US_GPA_PCT">US (GPA)</option>
              </select>
            </div>

            <AcademicDetailInput detail={academicDetail} onChange={setAcademicDetail} />

            <div className="p-3 bg-accent/60 border border-primary/25 rounded-2xl flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
              <div>
                <div className="text-[10px] text-primary/90 uppercase tracking-wider font-semibold">Grade summary</div>
                <div className="text-xs font-mono text-accent-foreground font-semibold">{badge}</div>
              </div>
            </div>
          </div>
        </section>

        {targetCountry !== 'AU' && (
          <section className="bg-card border border-border rounded-3xl p-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2"><Flame className="w-4 h-4 text-chart-2" /> Extracurricular flexes</h2>
            <div className="space-y-3">
              {[{ v: ec1, set: setEc1, ph: 'e.g. Founded an AI non-profit, scaled to 5k users' }, { v: ec2, set: setEc2, ph: 'e.g. National debate finalist / published research' }].map((f, i) => (
                <div key={i}>
                  <input type="text" maxLength={200} placeholder={f.ph} value={f.v} onChange={(e) => f.set(e.target.value)} className="w-full bg-secondary border border-border rounded-xl p-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-chart-2" />
                  <div className="text-[10px] text-muted-foreground/70 text-right mt-1">{f.v.length}/200</div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="bg-card border border-border rounded-3xl p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2"><Compass className="w-4 h-4 text-chart-4" /> Climate, sector & ranking</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="climate" className="text-[11px] text-muted-foreground block mb-1">Preferred climate</label>
              <select id="climate" value={preferredClimate} onChange={(e) => setPreferredClimate(e.target.value)} className="w-full bg-secondary border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary">
                <option>Warm</option><option>Balanced</option><option>Cold</option>
              </select>
            </div>
            <div>
              <label htmlFor="sector" className="text-[11px] text-muted-foreground block mb-1">Industry hub</label>
              <select id="sector" value={preferredSector} onChange={(e) => setPreferredSector(e.target.value)} className="w-full bg-secondary border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary">
                <option>Tech Hub</option><option>Finance Capital</option><option>Creative Hub</option><option>Research</option>
              </select>
            </div>
            <div>
              <label htmlFor="field" className="text-[11px] text-muted-foreground block mb-1">Intended field of study</label>
              <select id="field" value={intendedField} onChange={(e) => setIntendedField(e.target.value)} className="w-full bg-secondary border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary">
                <option>No preference</option>
                {ACADEMIC_FIELDS.map((f) => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="rank" className="text-[11px] text-muted-foreground block mb-1">Preferred university ranking</label>
              <select id="rank" value={preferredRank} onChange={(e) => setPreferredRank(e.target.value)} className="w-full bg-secondary border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary">
                <option>No preference</option><option>Top 50</option><option>Top 100</option><option>Top 200</option>
              </select>
            </div>
          </div>
        </section>

        <button onClick={handleSave} disabled={pending} className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold text-sm py-4 rounded-2xl hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
          {pending ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving profile…</> : saved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save profile</>}
        </button>

        {error && <p className="text-xs text-destructive text-center" role="alert">{error}</p>}
      </div>

      {initialProfiles.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-bold mb-4">Recent profiles</h2>
          <div className="space-y-2">
            {initialProfiles.map((p) => (
              <div key={p.id} className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between text-xs">
                <span className="font-medium">{p.targetCountry} · {p.curriculum} · grade score {p.gradeValue}</span>
                <span className="text-muted-foreground">{new Date(p.createdAt).toLocaleDateString('en-US')}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
