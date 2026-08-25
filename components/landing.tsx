'use client'

import Link from 'next/link'
import { Sparkles, GraduationCap, Globe, BarChart3, ArrowRight } from 'lucide-react'

export function Landing() {
  return (
    <main className="min-h-svh bg-background text-foreground flex flex-col">
      <section className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/25 rounded-full px-4 py-1.5 mb-8">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">AI-Powered Admissions Intelligence</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-balance mb-6">
            Find your perfect <span className="text-primary">university match</span> with AI
          </h1>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed text-pretty mb-10 max-w-xl mx-auto">
            Shortlist analyzes your grades, extracurriculars, and preferences to estimate your real acceptance probability across universities worldwide.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/sign-up" className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold text-sm px-6 py-3.5 rounded-2xl hover:brightness-110 transition-all">
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/sign-in" className="inline-flex items-center justify-center gap-2 border border-border text-foreground font-semibold text-sm px-6 py-3.5 rounded-2xl hover:bg-muted transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </section>
      <section className="px-4 pb-16">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FeatureCard icon={<GraduationCap className="w-5 h-5 text-primary" />} title="Profile Setup" description="Enter your GPA, test scores, major, and extracurriculars." />
          <FeatureCard icon={<Globe className="w-5 h-5 text-primary" />} title="AI Matching" description="Get tiered match results with acceptance probabilities." />
          <FeatureCard icon={<BarChart3 className="w-5 h-5 text-primary" />} title="Track Progress" description="Save schools and track your application status." />
        </div>
      </section>
    </main>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-card border border-border rounded-3xl p-6 text-center">
      <div className="inline-flex bg-primary/10 p-3 rounded-2xl mb-4">{icon}</div>
      <h3 className="text-sm font-semibold mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed text-pretty">{description}</p>
    </div>
  )
}
