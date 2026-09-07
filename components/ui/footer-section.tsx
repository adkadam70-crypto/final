'use client'
import React from 'react'
import type { ComponentProps, ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { AppLogo } from '@/components/app-logo'

// lucide-react dropped all brand/social icons (trademark reasons) — inline
// SVG is the standard replacement for a brand mark like this.
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  )
}

interface FooterLink {
  title: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
}

interface FooterSection {
  label: string
  links: FooterLink[]
}

const footerLinks: FooterSection[] = [
  {
    label: 'Product',
    links: [
      { title: 'Dashboard', href: '/dashboard' },
      { title: 'Find Matches', href: '/matches' },
      { title: 'Saved Schools', href: '/saved' },
      { title: 'Application Info', href: '/application-info' },
    ],
  },
  {
    label: 'Company',
    links: [
      { title: 'Why we built Shortlisted', href: '#why-shortlisted' },
      { title: 'Terms of Service & Privacy', href: '/terms' },
      { title: 'FAQs', href: '#faqs' },
      { title: 'Contact', href: 'mailto:adkadam70@gmail.com' },
    ],
  },
  {
    label: 'Coverage',
    links: [
      { title: 'US, UK & Australia', href: '#' },
      { title: 'Singapore & Hong Kong', href: '#' },
      { title: 'India', href: '#' },
      { title: 'Germany & France', href: '#' },
    ],
  },
  {
    label: 'Social',
    links: [{ title: 'Instagram', href: 'https://www.instagram.com/shortlisted.__?stkn=MXNnMnJyYzR1eGExbw%3D%3D&utm_source=qr', icon: InstagramIcon }],
  },
]

export function Footer() {
  return (
    <footer className="md:rounded-t-6xl relative w-full max-w-6xl mx-auto flex flex-col items-center justify-center rounded-t-4xl border-t border-border bg-[radial-gradient(35%_128px_at_50%_0%,theme(backgroundColor.white/8%),transparent)] px-6 py-12 lg:py-16 mt-24 sm:mt-32">
      <div className="bg-foreground/20 absolute top-0 right-1/2 left-1/2 h-px w-1/3 -translate-x-1/2 -translate-y-1/2 rounded-full blur" />

      <div className="grid w-full gap-8 xl:grid-cols-3 xl:gap-8">
        <AnimatedContainer className="space-y-4">
          <AppLogo className="h-8 w-auto" />
          <p className="text-muted-foreground text-sm max-w-xs text-pretty">
            Most college tools only cover the US and a single GPA scale. We built Shortlisted to analyze real
            admissions data across eight countries and give 11th &amp; 12th graders honest, accurate odds — not
            guesses — wherever they&apos;re applying.
          </p>
          <p className="text-muted-foreground mt-8 text-sm md:mt-4">© {new Date().getFullYear()} Shortlisted. All rights reserved.</p>
        </AnimatedContainer>

        <div className="mt-10 grid grid-cols-2 gap-8 md:grid-cols-4 xl:col-span-2 xl:mt-0">
          {footerLinks.map((section, index) => (
            <AnimatedContainer key={section.label} delay={0.1 + index * 0.1}>
              <div className="mb-10 md:mb-0">
                <h3 className="text-xs">{section.label}</h3>
                <ul className="text-muted-foreground mt-4 space-y-2 text-sm">
                  {section.links.map((link) => (
                    <li key={link.title}>
                      <a
                        href={link.href}
                        target={link.href.startsWith('http') ? '_blank' : undefined}
                        rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                        className="hover:text-foreground inline-flex items-center transition-all duration-300"
                      >
                        {link.icon && <link.icon className="me-1 size-4" />}
                        {link.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </AnimatedContainer>
          ))}
        </div>
      </div>
    </footer>
  )
}

type ViewAnimationProps = {
  delay?: number
  className?: ComponentProps<typeof motion.div>['className']
  children: ReactNode
}

function AnimatedContainer({ className, delay = 0.1, children }: ViewAnimationProps) {
  const shouldReduceMotion = useReducedMotion()

  if (shouldReduceMotion) {
    return children
  }

  return (
    <motion.div
      initial={{ filter: 'blur(4px)', translateY: -8, opacity: 0 }}
      whileInView={{ filter: 'blur(0px)', translateY: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.8 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
