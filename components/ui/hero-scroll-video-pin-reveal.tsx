'use client'

import React, { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(SplitText)

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v))
}

// How much extra scroll distance the heading/tags section consumes before
// releasing into the globe — the actual "how much scrolling this takes"
// knob. Bumped up from 220: at 220, real scroll gestures covered the whole
// reveal in what read as "too quick" — a bigger number means the same
// physical scroll input moves through less of the section's progress,
// which is what actually slows the pacing down (the per-element windows
// below control how gradual each individual fade is, not the overall
// speed — that's this number).
const SECTION_HEIGHT_VH = 320
// Words (the heading) finish revealing by this fraction of progress.
const HEADING_REVEAL_END = 0.35
// Tags don't start until well after the heading is fully done — a real,
// deliberate gap (from HEADING_REVEAL_END to here) where nothing happens,
// instead of the previous version where tags started while words were
// still finishing (WORDS_END doubled as both the heading's end AND the
// tags' start, so they overlapped).
const TAGS_REVEAL_START = 0.55
// How much of the section's progress each individual word/tag takes to
// fade in — wider than before so each one eases in gradually rather than
// popping in over a couple of scroll ticks.
const WORD_FADE_WINDOW = 0.18
const TAG_FADE_WINDOW = 0.22

export interface TagItem {
  id?: string
  text: string
  background: string
  color?: string
}

export interface HeroScrollRevealProps {
  /** Small brand mark shown above topText. */
  topBrand?: React.ReactNode
  /** Rendered top-right of the first screen only — e.g. Sign In / Sign Up. Scrolls away with it, unlike a page-level fixed element. */
  topRight?: React.ReactNode
  topText?: React.ReactNode
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
  const paraRef = useRef<HTMLParagraphElement>(null)
  const tagRefs = useRef<(HTMLDivElement | null)[]>([])
  const wordElsRef = useRef<HTMLElement[]>([])

  // No Lenis, and no GSAP ScrollTrigger/pin either — both were replaced
  // with the same pattern GlobeFocusReveal already uses successfully: a
  // tall wrapper with a `sticky` inner section, progress computed straight
  // from `getBoundingClientRect()` on every real scroll event and written
  // directly to element styles (no React re-render, no animation-library
  // timeline in between).
  //
  // Two concrete problems with the GSAP approach this replaces:
  // 1. `scrub: 1.5` deliberately eases the reveal ~1.5s behind the user's
  //    actual scroll position — reported as feeling like "structured"
  //    scrolling rather than free scrolling, and `pin: true` compounds it
  //    by making position:fixed switch via JS instead of the browser's own
  //    compositor-handled `position: sticky`.
  // 2. ScrollTrigger.create() measures its start/end pin offsets ONCE, one
  //    frame after mount (deferred to avoid blocking first paint). If the
  //    user scrolls during that exact frame, real scroll position has
  //    already moved by the time GSAP takes its one-time measurement,
  //    which is what produced the reported "second section doesn't load,
  //    then the whole thing jumps once it catches up" — a stale
  //    measurement, not a timing coincidence. `apply()` below has no such
  //    one-time measurement to go stale: it re-reads live DOM state on
  //    every single scroll event, so it's correct no matter when the user
  //    starts scrolling relative to setup.
  useEffect(() => {
    let split: SplitText | null = null
    let cancelled = false
    let raf = 0
    let removeScrollListener: (() => void) | null = null

    const apply = () => {
      const el = wrapperRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const total = rect.height - window.innerHeight
      const scrolled = -rect.top
      const progress = total > 0 ? clamp01(scrolled / total) : 0

      // Word starts spread across [0, HEADING_REVEAL_END - WORD_FADE_WINDOW]
      // so the LAST word's fade finishes exactly at HEADING_REVEAL_END,
      // never spilling past the boundary into where the tag gap begins.
      const words = wordElsRef.current
      const n = words.length
      const wordSpread = Math.max(0, HEADING_REVEAL_END - WORD_FADE_WINDOW)
      words.forEach((w, i) => {
        const start = n > 1 ? (i / (n - 1)) * wordSpread : 0
        const p = clamp01((progress - start) / WORD_FADE_WINDOW)
        w.style.opacity = String(p)
        w.style.transform = `translateY(${30 * (1 - p)}%) rotate(${8 * (1 - p)}deg)`
      })

      // Same idea for tags, spread across [TAGS_REVEAL_START, 1 - TAG_FADE_WINDOW]
      // — nothing happens between HEADING_REVEAL_END and TAGS_REVEAL_START,
      // which is the deliberate pause/gap requested.
      const tagEls = tagRefs.current
      const m = tagEls.length
      const tagSpread = Math.max(0, 1 - TAG_FADE_WINDOW - TAGS_REVEAL_START)
      tagEls.forEach((tagEl, i) => {
        if (!tagEl) return
        const start = TAGS_REVEAL_START + (m > 1 ? (i / (m - 1)) * tagSpread : 0)
        const p = clamp01((progress - start) / TAG_FADE_WINDOW)
        tagEl.style.opacity = String(p)
        tagEl.style.clipPath = `polygon(0% 0%, ${p * 100}% 0%, ${p * 100}% 100%, 0% 100%)`
      })
    }

    // Deferred one frame purely so SplitText's DOM splitting (real
    // synchronous work) doesn't land inline on the mount effect, right on
    // top of the page's first paint — apply() itself doesn't need this
    // deferral (see the comment above for why it's safe regardless of
    // when it first runs).
    const setupId = requestAnimationFrame(() => {
      if (cancelled) return

      let words: HTMLElement[] = []
      if (paraRef.current) {
        try {
          split = new SplitText(paraRef.current, {
            type: 'words',
            wordsClass: 'reveal-word inline-block origin-left mr-[0.25em] will-change-transform',
          })
          words = split.words as HTMLElement[]
        } catch {
          words = Array.from(paraRef.current.querySelectorAll('.reveal-word'))
        }
      }
      wordElsRef.current = words
      words.forEach((w) => {
        w.style.opacity = '0'
        w.style.transform = 'translateY(30%) rotate(8deg)'
      })

      const onScroll = () => {
        cancelAnimationFrame(raf)
        raf = requestAnimationFrame(apply)
      }
      apply()
      window.addEventListener('scroll', onScroll, { passive: true })
      removeScrollListener = () => window.removeEventListener('scroll', onScroll)
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(setupId)
      cancelAnimationFrame(raf)
      removeScrollListener?.()
      split?.revert()
    }
  }, [])

  return (
    <div className={`w-full text-foreground ${className}`}>
      {topText && (
        <section className="relative w-full min-h-screen flex flex-col justify-center items-center text-center px-4 sm:px-8 py-8">
          {topBrand && <div className="absolute top-6 sm:top-10 left-4 sm:left-8">{topBrand}</div>}
          {topRight && <div className="absolute top-6 sm:top-10 right-4 sm:right-8">{topRight}</div>}
          <div className="text-[clamp(1.8rem,4.5vw,4.5rem)] font-bold tracking-tight text-balance leading-tight">{topText}</div>
        </section>
      )}

      <div ref={wrapperRef} className="relative" style={{ height: `${SECTION_HEIGHT_VH}vh` }}>
        <section className="sticky top-0 w-full h-screen flex items-center justify-center overflow-hidden">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 md:py-8 flex flex-col items-center text-center relative z-10">
            {headingText && (
              <div className="w-full mb-10 sm:mb-14 md:mb-16">
                <p ref={paraRef} className="text-[clamp(2rem,4.8vw,4.6rem)] font-extrabold tracking-wide text-balance leading-snug overflow-visible">
                  {headingText}
                </p>
              </div>
            )}

            {aboveTags}

            {tags.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3 max-w-4xl mx-auto my-3 sm:my-4 mb-3 sm:mb-5">
                {tags.map((tag, idx) => (
                  <div
                    key={tag.id ?? `tag-${idx}`}
                    ref={(el) => {
                      tagRefs.current[idx] = el
                    }}
                    className="px-4 sm:px-6 py-2 sm:py-3 rounded-full text-[clamp(0.7rem,1.3vw,1.1rem)] font-semibold tracking-tight opacity-0 shadow-2xl will-change-[clip-path,opacity]"
                    style={{ background: tag.background, color: tag.color ?? '#ffffff', clipPath: 'polygon(0% 0% ,0% 0%, 0% 100%, 0% 100%)' }}
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
