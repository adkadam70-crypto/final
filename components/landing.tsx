'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { Sparkles, GraduationCap, Globe, BarChart3, ArrowRight } from 'lucide-react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { RevealGroup } from '@/components/reveal-group'

export function Landing() {
  const heroRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (!heroRef.current) return
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      gsap.set('.hero-badge, .hero-subhead', { opacity: 0, y: 16 })
      gsap.set('.hero-headline', { opacity: 0, y: 16 })
      gsap.set('.hero-cta', { opacity: 0, y: 12 })
      gsap
        .timeline({ defaults: { ease: 'power2.out' } })
        .to('.hero-badge', { opacity: 1, y: 0, duration: 0.4 })
        .to('.hero-headline', { opacity: 1, y: 0, duration: 0.5 }, '-=0.25')
        .to('.hero-subhead', { opacity: 1, y: 0, duration: 0.5 }, '-=0.3')
        .to('.hero-cta', { opacity: 1, y: 0, duration: 0.4, stagger: 0.08 }, '-=0.3')
    },
    { scope: heroRef },
  )

  return (
    <main className="min-h-svh bg-background text-foreground flex flex-col">
      <section className="flex-1 flex items-center justify-center px-4 py-16">
        <div ref={heroRef} className="max-w-3xl mx-auto text-center">
          <div className="hero-badge inline-flex items-center gap-2 bg-primary/10 border border-primary/25 rounded-full px-4 py-1.5 mb-8">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">Data-Driven Admissions Intelligence</span>
          </div>
          <h1 className="hero-headline text-4xl md:text-5xl font-bold tracking-tight text-balance mb-6">
            Find your perfect <span className="text-primary">university match</span>
          </h1>
          <p className="hero-subhead text-base md:text-lg text-muted-foreground leading-relaxed text-pretty mb-10 max-w-xl mx-auto">
            Shortlisted analyzes your grades, extracurriculars, and preferences to estimate your real acceptance probability across universities worldwide.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/sign-up" className="hero-cta inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold text-sm px-6 py-3.5 rounded-2xl hover:brightness-110 hover:-translate-y-0.5 transition-all">
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/sign-in" className="hero-cta inline-flex items-center justify-center gap-2 border border-border text-foreground font-semibold text-sm px-6 py-3.5 rounded-2xl hover:bg-muted hover:-translate-y-0.5 transition-all">
              Sign In
            </Link>
          </div>
        </div>
      </section>
      <section className="px-4 pb-16">
        <RevealGroup className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4" stagger={0.1} y={20}>
          <FeatureCard icon={<GraduationCap className="w-5 h-5 text-primary" />} title="Profile Setup" description="Enter your GPA, test scores, major, and extracurriculars." />
          <FeatureCard icon={<Globe className="w-5 h-5 text-primary" />} title="Smart Matching" description="Get tiered match results with acceptance probabilities." />
          <FeatureCard icon={<BarChart3 className="w-5 h-5 text-primary" />} title="Track Progress" description="Save schools and track your application status." />
        </RevealGroup>
      </section>
    </main>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-card border border-border rounded-3xl p-6 text-center transition-transform hover:-translate-y-1">
      <div className="inline-flex bg-primary/10 p-3 rounded-2xl mb-4">{icon}</div>
      <h3 className="text-sm font-semibold mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed text-pretty">{description}</p>
    </div>
  )
}
