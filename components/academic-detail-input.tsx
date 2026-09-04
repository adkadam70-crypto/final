'use client'

import { Plus, X } from 'lucide-react'
import {
  type AcademicDetail,
  type ALevelGrade,
  type IBCoreGrade,
  IB_SUBJECT_GROUPS,
  cbsePercentage,
  ucasPoints,
  ibTotal,
} from '@/lib/academic-detail'
import { CBSE_SUBJECTS, A_LEVEL_SUBJECTS, IB_SUBJECTS_BY_GROUP } from '@/lib/subject-lists'

// Deliberately no width utility baked in here — Tailwind's cascade order
// (not string order) decides which width utility wins when two are present
// on the same element, so a width baked into this base class could silently
// beat a more specific one appended at each call site. Every usage below
// adds its own explicit width class instead.
const inputClass = 'bg-secondary border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary'
const nameInputClass = `${inputClass} flex-1 min-w-0`
const A_LEVEL_GRADES: ALevelGrade[] = ['A*', 'A', 'B', 'C', 'D', 'E']
const IB_CORE_GRADES: IBCoreGrade[] = ['A', 'B', 'C', 'D', 'E']

// Dropdown options read alphabetically regardless of how the source lists in
// lib/subject-lists.ts happen to be ordered (grouped by discipline there,
// which is easier to maintain but not what a student scanning a dropdown
// wants).
function alphabetical(subjects: readonly string[]): string[] {
  return [...subjects].sort((a, b) => a.localeCompare(b))
}

export function AcademicDetailInput({ detail, onChange }: { detail: AcademicDetail; onChange: (d: AcademicDetail) => void }) {
  if (detail.curriculum === 'CBSE') return <CBSEInput detail={detail} onChange={onChange} />
  if (detail.curriculum === 'A_LEVELS') return <ALevelsInput detail={detail} onChange={onChange} />
  if (detail.curriculum === 'US_GPA_PCT') return <USInput detail={detail} onChange={onChange} />
  return <IBInput detail={detail} onChange={onChange} />
}

function CBSEInput({ detail, onChange }: { detail: Extract<AcademicDetail, { curriculum: 'CBSE' }>; onChange: (d: AcademicDetail) => void }) {
  const pct = detail.subjects.length >= 5 ? cbsePercentage(detail.subjects) : null
  return (
    <div className="space-y-2">
      {detail.subjects.map((s, i) => (
        <div key={i} className="flex gap-2 items-center">
          <select className={nameInputClass} value={s.name} onChange={(e) => {
            const subjects = [...detail.subjects]; subjects[i] = { ...s, name: e.target.value }
            onChange({ ...detail, subjects })
          }}>
            <option value="">Select subject</option>
            {alphabetical(CBSE_SUBJECTS).map((subj) => <option key={subj} value={subj}>{subj}</option>)}
          </select>
          <input className={`${inputClass} w-20 shrink-0`} type="number" min={0} max={100} placeholder="Marks" value={s.marks} onChange={(e) => {
            const subjects = [...detail.subjects]; subjects[i] = { ...s, marks: Number(e.target.value) }
            onChange({ ...detail, subjects })
          }} />
          {detail.subjects.length > 5 && (
            <button type="button" onClick={() => onChange({ ...detail, subjects: detail.subjects.filter((_, j) => j !== i) })} className="text-muted-foreground hover:text-destructive p-1 shrink-0" aria-label="Remove subject"><X className="w-3.5 h-3.5" /></button>
          )}
        </div>
      ))}
      {detail.subjects.length < 6 && (
        <button type="button" onClick={() => onChange({ ...detail, subjects: [...detail.subjects, { name: '', marks: 90 }] })} className="text-xs text-primary font-medium flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add subject (up to 6)</button>
      )}
      <p className="text-[11px] text-muted-foreground">Best 5 of {detail.subjects.length} subjects, out of 500{pct !== null && <> — <span className="text-primary font-mono font-semibold">{pct}%</span></>}</p>
    </div>
  )
}

function ALevelsInput({ detail, onChange }: { detail: Extract<AcademicDetail, { curriculum: 'A_LEVELS' }>; onChange: (d: AcademicDetail) => void }) {
  const points = detail.subjects.length >= 3 ? ucasPoints(detail.subjects) : null
  return (
    <div className="space-y-2">
      {detail.subjects.map((s, i) => (
        <div key={i} className="flex gap-2 items-center">
          <select className={nameInputClass} value={s.name} onChange={(e) => {
            const subjects = [...detail.subjects]; subjects[i] = { ...s, name: e.target.value }
            onChange({ ...detail, subjects })
          }}>
            <option value="">Select subject</option>
            {alphabetical(A_LEVEL_SUBJECTS).map((subj) => <option key={subj} value={subj}>{subj}</option>)}
          </select>
          <select className={`${inputClass} w-16 shrink-0`} value={s.grade} onChange={(e) => {
            const subjects = [...detail.subjects]; subjects[i] = { ...s, grade: e.target.value as ALevelGrade }
            onChange({ ...detail, subjects })
          }}>
            {A_LEVEL_GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          {detail.subjects.length > 3 && (
            <button type="button" onClick={() => onChange({ ...detail, subjects: detail.subjects.filter((_, j) => j !== i) })} className="text-muted-foreground hover:text-destructive p-1 shrink-0" aria-label="Remove subject"><X className="w-3.5 h-3.5" /></button>
          )}
        </div>
      ))}
      <button type="button" onClick={() => onChange({ ...detail, subjects: [...detail.subjects, { name: '', grade: 'A' }] })} className="text-xs text-primary font-medium flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add subject</button>
      <p className="text-[11px] text-muted-foreground">{points !== null && <>UCAS points: <span className="text-primary font-mono font-semibold">{points}</span></>}</p>
    </div>
  )
}

function USInput({ detail, onChange }: { detail: Extract<AcademicDetail, { curriculum: 'US_GPA_PCT' }>; onChange: (d: AcademicDetail) => void }) {
  return (
    <div>
      <label className="text-[11px] text-muted-foreground block mb-1">Unweighted GPA (0.0–4.0)</label>
      <input className={`${inputClass} w-full`} type="number" min={0} max={4} step={0.01} value={detail.unweightedGPA} onChange={(e) => onChange({ ...detail, unweightedGPA: Number(e.target.value) })} />
      <p className="text-[11px] text-muted-foreground/70 mt-2">SAT/ACT (if you&apos;re targeting the US) has its own section below, since it applies regardless of curriculum.</p>
    </div>
  )
}

function IBInput({ detail, onChange }: { detail: Extract<AcademicDetail, { curriculum: 'IB_DIPLOMA' }>; onChange: (d: AcademicDetail) => void }) {
  const total = ibTotal(detail)
  return (
    <div className="space-y-3">
      {detail.subjects.map((s, i) => (
        <div key={s.group} className="flex gap-2 items-center">
          <span className="text-[10px] text-muted-foreground w-4 shrink-0">{s.group}</span>
          <select className={nameInputClass} value={s.subjectName} onChange={(e) => {
            const subjects = [...detail.subjects]; subjects[i] = { ...s, subjectName: e.target.value }
            onChange({ ...detail, subjects })
          }}>
            <option value="">{IB_SUBJECT_GROUPS[s.group - 1].name}</option>
            {alphabetical(IB_SUBJECTS_BY_GROUP[s.group]).map((subj) => <option key={subj} value={subj}>{subj}</option>)}
          </select>
          <select className={`${inputClass} w-16 shrink-0`} value={s.level} onChange={(e) => {
            const subjects = [...detail.subjects]; subjects[i] = { ...s, level: e.target.value as 'HL' | 'SL' }
            onChange({ ...detail, subjects })
          }}>
            <option value="HL">HL</option>
            <option value="SL">SL</option>
          </select>
          <select className={`${inputClass} w-14 shrink-0`} value={s.grade} onChange={(e) => {
            const subjects = [...detail.subjects]; subjects[i] = { ...s, grade: Number(e.target.value) }
            onChange({ ...detail, subjects })
          }}>
            {[1, 2, 3, 4, 5, 6, 7].map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      ))}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <div>
          <label className="text-[11px] text-muted-foreground block mb-1">Extended Essay</label>
          <select className={`${inputClass} w-full`} value={detail.eeGrade} onChange={(e) => onChange({ ...detail, eeGrade: e.target.value as IBCoreGrade })}>
            {IB_CORE_GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[11px] text-muted-foreground block mb-1">Theory of Knowledge</label>
          <select className={`${inputClass} w-full`} value={detail.tokGrade} onChange={(e) => onChange({ ...detail, tokGrade: e.target.value as IBCoreGrade })}>
            {IB_CORE_GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>
      <label className="flex items-center gap-2 text-xs text-foreground">
        <input type="checkbox" checked={detail.casComplete} onChange={(e) => onChange({ ...detail, casComplete: e.target.checked })} className="accent-primary" />
        CAS (Creativity, Activity, Service) complete
      </label>
      <p className="text-[11px] text-muted-foreground">
        {total === 'FAIL'
          ? <span className="text-destructive font-semibold">EE/TOK combination is a diploma-failing grade</span>
          : <>Total: <span className="text-primary font-mono font-semibold">{total} / 45</span></>}
      </p>
    </div>
  )
}
