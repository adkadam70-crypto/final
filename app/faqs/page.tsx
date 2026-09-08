import Link from 'next/link'
import { AppLogo } from '@/components/app-logo'
import { ADMIN_EMAIL } from '@/lib/admin'

export const metadata = {
  title: 'FAQs — Shortlisted',
}

const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: 'What is Shortlisted?',
    a: 'A college-admissions tool for 11th and 12th graders. You enter your academic profile — curriculum, grades/scores, extracurriculars, and target countries — and we generate university match tiers and acceptance-odds estimates across 970+ real universities in eight countries.',
  },
  {
    q: 'How are the acceptance-odds estimates calculated?',
    a: 'An AI model assesses your profile against each university, grounded in named, citable sources — U.S. News & World Report, the U.S. Department of Education’s College Scorecard, NIRF, The Complete University Guide (UK), Times Higher Education, and QS World University Rankings. Where a real published number doesn’t exist yet for a school, we say so instead of inventing one.',
  },
  {
    q: 'Is this a guarantee I’ll get in?',
    a: 'No. These are informational estimates, not a promise of any admissions outcome. Use them to build a realistic shortlist of reaches, matches, and safeties — not as a final answer — and still talk to your school counselor.',
  },
  {
    q: 'Which curricula do you support?',
    a: 'CBSE, A-Levels (including a standalone AS-Level mode), the IB Diploma, and US unweighted GPA — each handled with its own real grading logic, not a rough one-size-fits-all conversion.',
  },
  {
    q: 'Which countries can I apply to on Shortlisted?',
    a: 'The US, UK, Australia, Singapore, Hong Kong, India, Germany, and France — regardless of which country your own curriculum is from.',
  },
  {
    q: 'Is my data private?',
    a: (
      <>
        We don’t sell your data or share it with advertisers. Before your profile is sent to the AI for
        matching, your name and any signal of ethnicity, nationality, or gender are stripped out — the AI only
        ever sees academic and preference data. Full details are in our{' '}
        <Link href="/terms" className="text-primary hover:underline">
          Terms &amp; Privacy Policy
        </Link>
        .
      </>
    ),
  },
  {
    q: 'Is Shortlisted free?',
    a: 'Yes. To keep it sustainable, AI-powered features (Run Match, Target University Analysis, Profile Strength) have fair-use rate limits — generous enough that normal use never comes close to them.',
  },
  {
    q: 'Can I delete my account and data?',
    a: (
      <>
        There isn’t a self-service delete button yet — email{' '}
        <a href={`mailto:${ADMIN_EMAIL}`} className="text-primary hover:underline">
          {ADMIN_EMAIL}
        </a>{' '}
        and we’ll remove your account and data promptly.
      </>
    ),
  },
]

export default function FaqsPage() {
  return (
    <main className="min-h-svh bg-background text-foreground px-4 sm:px-8 py-12">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="flex items-center gap-2 mb-8 w-fit">
          <AppLogo className="h-7 w-auto" />
          <span className="text-base font-bold tracking-tight">Shortlisted</span>
        </Link>

        <h1 className="text-2xl font-bold tracking-tight mb-1">Frequently asked questions</h1>
        <p className="text-sm text-muted-foreground mb-10">
          Can&apos;t find what you&apos;re looking for? Email{' '}
          <a href={`mailto:${ADMIN_EMAIL}`} className="text-primary hover:underline">
            {ADMIN_EMAIL}
          </a>
          .
        </p>

        <div className="space-y-3">
          {FAQS.map((item) => (
            <details key={item.q} className="group border border-border rounded-xl px-4 py-3 open:bg-secondary/40">
              <summary className="cursor-pointer text-sm font-medium text-foreground list-none flex items-center justify-between gap-4">
                {item.q}
                <span className="text-muted-foreground shrink-0 transition-transform group-open:rotate-45 text-lg leading-none">+</span>
              </summary>
              <p className="text-sm text-muted-foreground leading-relaxed mt-3 text-pretty">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </main>
  )
}
