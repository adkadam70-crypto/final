import Link from 'next/link'
import { AppLogo } from '@/components/app-logo'

export const metadata = {
  title: 'Data sources & methodology',
}

export default function DataSourcesPage() {
  return (
    <main className="min-h-svh bg-background text-foreground px-4 sm:px-8 py-12">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="flex items-center gap-2 mb-8 w-fit">
          <AppLogo className="h-7 w-auto" />
          <span className="text-base font-bold tracking-tight">Shortlisted</span>
        </Link>

        <h1 className="text-2xl font-bold tracking-tight mb-1">Data sources & methodology</h1>
        <p className="text-sm text-muted-foreground mb-10">Where every ranking, rate, and requirement on Shortlisted actually comes from.</p>

        <div className="space-y-8 text-sm text-muted-foreground leading-relaxed [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mb-2 [&_strong]:text-foreground">
          <section>
            <h2>The rule we hold ourselves to</h2>
            <p>
              Every number on Shortlisted — a rank, an acceptance rate, a program-specific figure — is either pulled
              from a named, citable publication, or clearly labeled as an estimate with the reasoning behind it.
              We never invent a plausible-looking number to fill a gap. If a real published figure doesn&apos;t
              exist yet for a school, we say so directly rather than guessing and presenting it as fact.
            </p>
          </section>

          <section>
            <h2>Overall university rankings, by country</h2>
            <ul className="list-disc list-outside pl-5 space-y-1.5 marker:text-muted-foreground/50">
              <li><strong>US</strong> — U.S. News &amp; World Report Best Colleges (National Universities), cross-checked against the U.S. Department of Education&apos;s College Scorecard for acceptance rates.</li>
              <li><strong>UK</strong> — The Complete University Guide.</li>
              <li><strong>Australia, Germany &amp; France</strong> — Times Higher Education (THE) World University Rankings.</li>
              <li><strong>Singapore &amp; Hong Kong</strong> — QS World University Rankings.</li>
              <li><strong>India</strong> — NIRF (National Institutional Ranking Framework), India&apos;s official government ranking published by the Ministry of Education.</li>
            </ul>
          </section>

          <section>
            <h2>Program-specific rankings</h2>
            <p>
              Where it exists, we go a level deeper than the overall institutional rank and cite the
              subject-specific ranking for a student&apos;s intended field — e.g. U.S. News&apos; own Best
              Undergraduate Business, Economics, Computer Science, and Engineering Programs rankings, or its Best
              Law Schools / Best Medical Schools rankings used as the closest available signal where no undergraduate
              subject ranking exists for a field. NIRF publishes separate category tables (Engineering, Management,
              Medical, Law, Architecture, Pharmacy, and more) that we use the same way for Indian universities. A
              school with no citable subject-specific ranking simply isn&apos;t shown one — it falls back to the
              institution&apos;s overall rank instead of a fabricated subject figure.
            </p>
          </section>

          <section>
            <h2>Acceptance rates</h2>
            <p>
              We prioritize a real, officially published overall admit rate wherever one exists (the U.S.
              Department of Education&apos;s College Scorecard is the primary source for US schools). Where no
              official rate is published, we may show a research-based estimate — built from at least two
              independent sources, direct applicant/admit counts, or structural signals like published cutoffs —
              and it&apos;s always labeled as an estimate, never presented as an official figure. Some countries
              also have real, separate Early Decision / Early Action / Regular Decision rates where a school
              publishes them, shown alongside the overall rate rather than blended into it.
            </p>
          </section>

          <section>
            <h2>Test scores & admissions requirements</h2>
            <p>
              SAT/ACT ranges (US) and other standardized test data are sourced from each institution&apos;s U.S.
              News profile or equivalent official source, and marked as unavailable rather than guessed when a
              school doesn&apos;t publish one — including schools that are genuinely test-blind, where no range
              exists to publish in the first place.
            </p>
          </section>

          <section>
            <h2>When we don&apos;t have real data</h2>
            <p>
              If a specific rank, rate, or requirement isn&apos;t available from a credible published source for a
              given school, we leave it out or label it clearly as an estimate — we don&apos;t fill the gap with an
              invented number just to make every field look complete. Accuracy matters more to us than a tidy
              spreadsheet.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
