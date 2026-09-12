'use client'

import React, { useEffect, useRef } from 'react'

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v))
}

// How much extra scroll distance the heading/tags section consumes before
// releasing into the globe — the "how much scrolling this takes" knob.
const SECTION_HEIGHT_VH = 280
// Heading fades in as ONE group across this progress range.
const HEADING_START = 0
const HEADING_END = 0.35
// Tags fade in as their OWN group, well after the heading finishes — a
// real gap in between where nothing happens, not overlapping with it.
// Earlier versions staggered each word and each tag in individually,
// which read as "structured"/incremental (scroll a little, one more tag
// pops in, scroll a little more, another one) rather than the two clean
// group reveals actually wanted here.
const TAGS_START = 0.55
const TAGS_END = 0.85

export interface TagItem {
  id?: string
  text: string
  background: string
  color?: string
  border?: string
}

export interface HeroScrollRevealProps {
  /** Small brand mark shown above topText. */
  topBrand?: React.ReactNode
  /** Rendered top-right of the first screen only — e.g. Sign In / Sign Up. Scrolls away with it, unlike a page-level fixed element. */
  topRight?: React.ReactNode
  topText?: React.ReactNode
  /** Rendered directly below topText, inside the same first screen — e.g. a "Get Started" button, so a visitor never has to scroll to find one. */
  topCta?: React.ReactNode
  headingText?: React.ReactNode
  /** Rendered directly above the tags row (e.g. the countries/universities pills). */
  aboveTags?: React.ReactNode
  tags?: TagItem[]
  subText?: string
  /** Rendered as its own full page between the heading/tags section and bottomText — e.g. the globe reveal. */
  afterBenefit?: React.ReactNode
  bottomText?: React.ReactNode
  /** Rendered after the bottom text — e.g. sign in / sign up CTAs. */
  children?: React.ReactNode
  className?: string
}

export const HeroScrollVideoReveal: React.FC<HeroScrollRevealProps> = ({
  topBrand,
  topRight,
  topText,
  topCta,
  headingText,
  aboveTags,
  tags = [],
  subText,
  afterBenefit,
  bottomText,
  children,
  className = '',
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const headingGroupRef = useRef<HTMLDivElement>(null)
  const tagsGroupRef = useRef<HTMLDivElement>(null)

  // No Lenis, no GSAP ScrollTrigger/pin, and no SplitText either now — all
  // three were real risk with no payoff left to justify it. Same pattern
  // GlobeFocusReveal already uses successfully: a tall wrapper with a
  // `sticky` inner section, progress computed straight from
  // getBoundingClientRect() on every real scroll event, written directly
  // to element styles.
  //
  // Per-word and per-tag staggering (an earlier version of this) read as
  // "structured"/incremental scrolling — a little more scroll reveals one
  // more word or one more tag, over and over — instead of two clean group
  // reveals. It also depended on SplitText successfully splitting the
  // heading into word spans; if that ever silently failed to populate on
  // some real device (nothing in this file could have caught that), the
  // words would sit permanently at the opacity:0 they were set to and
  // never be revealed — matching exactly the "second section never
  // loads, then scrolling lands straight on the globe" report. There are
  // now only two elements this ever touches — the whole heading, the
  // whole tags row — both already guaranteed to exist because they're
  // rendered directly by this component, not created by a plugin that
  // could fail.
  //
  // Each group's CSS also declares its own `transition` (see the JSX)
  // ~150ms — apply() below still only WRITES a target value on scroll,
  // but the browser eases toward it over that short transition instead of
  // snapping, which is what actually reads as "flowy" rather than
  // "structured": short enough to still feel tied to your scroll, long
  // enough to smooth over any single rough scroll-event step.
  useEffect(() => {
    let raf = 0

    const apply = () => {
      const el = wrapperRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const total = rect.height - window.innerHeight
      const scrolled = -rect.top
      const progress = total > 0 ? clamp01(scrolled / total) : 0

      const headingP = clamp01((progress - HEADING_START) / (HEADING_END - HEADING_START))
      if (headingGroupRef.current) {
        headingGroupRef.current.style.opacity = String(headingP)
        headingGroupRef.current.style.transform = `translateY(${16 * (1 - headingP)}px)`
      }

      const tagsP = clamp01((progress - TAGS_START) / (TAGS_END - TAGS_START))
      if (tagsGroupRef.current) {
        tagsGroupRef.current.style.opacity = String(tagsP)
        tagsGroupRef.current.style.transform = `translateY(${16 * (1 - tagsP)}px)`
      }
    }

    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(apply)
    }
    apply()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div className={`w-full text-foreground ${className}`}>
      {topText && (
        <section className="relative w-full min-h-screen flex flex-col justify-start items-center text-center px-4 sm:px-8 pt-14 sm:pt-16 pb-8">
          {topBrand && <div className="absolute top-6 sm:top-10 left-4 sm:left-8">{topBrand}</div>}
          {topRight && <div className="absolute top-6 sm:top-10 right-4 sm:right-8">{topRight}</div>}
          <div className="text-[clamp(1.2rem,2.7vw,2.75rem)] font-bold tracking-tight text-balance leading-tight">{topText}</div>
          {topCta && <div className="mt-8">{topCta}</div>}
        </section>
      )}

      <div ref={wrapperRef} className="relative" style={{ height: `${SECTION_HEIGHT_VH}vh` }}>
        <section className="sticky top-0 w-full h-screen flex items-center justify-center overflow-hidden">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 md:py-8 flex flex-col items-center text-center relative z-10">
            {headingText && (
              <div
                ref={headingGroupRef}
                className="w-full mb-10 sm:mb-14 md:mb-16 transition-[opacity,transform] duration-150 ease-out will-change-[opacity,transform]"
                style={{ opacity: 0 }}
              >
                <p className="text-[clamp(2rem,4vw,3.75rem)] font-extrabold tracking-wide text-balance leading-snug overflow-visible">
                  {headingText}
                </p>
              </div>
            )}

            {aboveTags}

            {tags.length > 0 && (
              <div
                ref={tagsGroupRef}
                className="flex flex-wrap justify-center gap-2 sm:gap-3 max-w-4xl mx-auto my-3 sm:my-4 mb-3 sm:mb-5 transition-[opacity,transform] duration-150 ease-out will-change-[opacity,transform]"
                style={{ opacity: 0 }}
              >
                {tags.map((tag, idx) => (
                  <div
                    key={tag.id ?? `tag-${idx}`}
                    className="px-4 sm:px-6 py-2 sm:py-3 rounded-full text-[clamp(0.7rem,1.3vw,1.1rem)] font-semibold tracking-tight shadow-2xl"
                    style={{ background: tag.background, color: tag.color ?? '#ffffff', border: tag.border ? `1px solid ${tag.border}` : undefined }}
                  >
                    {tag.text}
                  </div>
                ))}
              </div>
            )}

            {subText && <p className="text-[clamp(0.95rem,1.5vw,1.35rem)] text-muted-foreground font-normal max-w-xl mt-2 sm:mt-4 px-4 text-pretty">{subText}</p>}
          </div>
        </section>
      </div>

      {afterBenefit}

      {bottomText && (
        <section className="w-full min-h-[70vh] flex justify-center items-center text-center px-4 sm:px-8 py-8 text-[clamp(1.8rem,4.5vw,4.5rem)] font-bold tracking-tight text-balance leading-tight relative z-10">
          {bottomText}
        </section>
      )}

      {children}
    </div>
  )
}

export default HeroScrollVideoReveal
