import { Info } from 'lucide-react'

// Content here is deliberately written as general educational context, not
// as claimed fact about any specific university's policy — real admissions
// offices use holistic review and vary a lot in how (or whether) they
// convert international grades. Sourced from WES, UCAS, and UAC/ACTAC's
// published approaches (see chat for citations); re-verify before treating
// any of this as authoritative if it ships beyond a prototype.
export function HowWeAnalyze() {
  return (
    <details className="group bg-card border border-border rounded-3xl overflow-hidden">
      <summary className="cursor-pointer list-none p-6 flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-bold">
          <Info className="w-4 h-4 text-primary" /> How we analyze your profile
        </span>
        <span className="text-[11px] text-primary font-medium shrink-0 group-open:hidden">Show</span>
        <span className="text-[11px] text-primary font-medium shrink-0 hidden group-open:inline">Hide</span>
      </summary>

      <div className="px-6 pb-6 space-y-5 text-xs text-muted-foreground leading-relaxed">
        <section>
          <h3 className="text-[11px] font-semibold text-foreground uppercase tracking-wider mb-2">How we score your grades internally</h3>
          <ul className="space-y-1.5 list-disc list-inside">
            <li><strong className="text-foreground">CBSE / ISC:</strong> your best 5 subjects, summed out of 500, as a percentage.</li>
            <li><strong className="text-foreground">A-Levels:</strong> each grade converts to UCAS Tariff points (A*=56, A=48, B=40, C=32, D=24, E=16), summed across your subjects.</li>
            <li><strong className="text-foreground">IB Diploma:</strong> your 6 subject grades (1–7 each) plus Extended Essay + Theory of Knowledge core points, out of 45 total.</li>
            <li><strong className="text-foreground">US GPA:</strong> used as-is, unweighted 0.0–4.0.</li>
          </ul>
          <p className="mt-2">To compare across curricula for our own Safety/Good Chance/Reach/Ultra Reach tiering, we put all of these on a common 0–100 scale internally — that scale is our own shorthand, not an official conversion any university actually uses.</p>
        </section>

        <section>
          <h3 className="text-[11px] font-semibold text-foreground uppercase tracking-wider mb-2">How different countries actually view your curriculum</h3>
          <p className="mb-2 italic">General estimates to help you understand your profile — not official policy. Always check a specific university&apos;s own stated requirements.</p>
          <ul className="space-y-1.5 list-disc list-inside">
            <li><strong className="text-foreground">United States:</strong> no single official conversion — admissions offices review transcripts holistically. Credential evaluators like WES use contextual (not purely linear) scales; as a rough sense, an IB score of 38+/45 or a CBSE percentage in the high 80s/90s is often read as competitive at strong schools, but this varies a lot by school.</li>
            <li><strong className="text-foreground">United Kingdom:</strong> most universities that accept IB or A-Levels convert to UCAS Tariff points — but the most selective (Oxford, Cambridge, LSE, Imperial) usually set direct grade conditions instead. CBSE has no official UCAS tariff; UK universities typically assess it directly by percentage band.</li>
            <li><strong className="text-foreground">Australia:</strong> admissions bodies (UAC and similar) convert IB, A-Level, and other international results into an ATAR-equivalent &quot;Selection Rank&quot; so they&apos;re comparable to Australian-educated applicants — done by the admissions body itself, not a fixed formula you can compute.</li>
            <li><strong className="text-foreground">Singapore & Hong Kong:</strong> top universities generally assess IB and A-Level results directly against their own published minimum requirements, rather than converting to a separate composite score.</li>
            <li><strong className="text-foreground">India:</strong> CBSE results are generally used directly as board percentage, though top engineering/medical programs weight entrance exams (JEE, NEET) more heavily than board marks.</li>
          </ul>
        </section>

        <section>
          <h3 className="text-[11px] font-semibold text-foreground uppercase tracking-wider mb-2">Standardized tests</h3>
          <ul className="space-y-1.5 list-disc list-inside">
            <li><strong className="text-foreground">United States:</strong> SAT or ACT is still commonly submitted, though many schools are test-optional. Enter either or both if you&apos;re targeting the US.</li>
            <li><strong className="text-foreground">India:</strong> JEE (engineering) and NEET (medicine) matter a lot for specific programs — JEE Main requires at least 75% board marks (or top-20th-percentile) to be eligible for NITs/IIITs.</li>
            <li><strong className="text-foreground">UK, Australia, Singapore, Hong Kong:</strong> there isn&apos;t one universal standardized test the way there is in the US — your curriculum grades are usually assessed directly. Some specific courses (medicine, law) require their own subject tests (e.g. the UCAT or LNAT in the UK), but those are course-specific, not something every applicant takes, so we don&apos;t have a generic field for them yet.</li>
          </ul>
        </section>
      </div>
    </details>
  )
}
