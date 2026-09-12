'use client'

import React, { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger, SplitText)

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
  /**
   * Gates when Lenis (smooth scroll) is allowed to exist. Defaults to true
   * (start immediately). The landing page passes its own "background has
   * rendered + settle buffer" readiness signal instead — see the comment
   * on the Lenis effect below for exactly why this has to gate Lenis's
   * *construction*, not just its input.
   */
  readyToScroll?: boolean
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
  readyToScroll = true,
}) => {
  const benefitRef = useRef<HTMLDivElement>(null)
  const paraRef = useRef<HTMLParagraphElement>(null)
  const tagRefs = useRef<(HTMLDivElement | null)[]>([])

  // Lenis attaches its own wheel/touch listener in the CAPTURE phase on
  // window — capture runs top-down (window first, target element last), so
  // it fires before any listener on a page-level overlay <div> ever gets a
  // chance to preventDefault/stopPropagation. A caller trying to "lock"
  // scroll by blocking input on an overlay after Lenis already exists is
  // racing a listener that always wins that race — confirmed live: a quick
  // scroll during the lock still leaked through to Lenis, which had
  // already read the delta and updated its own scroll target before the
  // overlay's handler could run. overflow:hidden alone doesn't save this
  // either, since Lenis drives scroll programmatically (scrollTo-style),
  // which ignores that CSS property entirely.
  //
  // The only robust fix is to not let there be a Lenis listener to race in
  // the first place: Lenis is not constructed at all until readyToScroll
  // is true. Nothing else on this page intercepts scroll, so up until
  // then, scroll is genuine native browser scroll — which the caller's
  // overflow:hidden + wheel/touchmove overlay blocks correctly, because
  // there's no competing capture-phase listener to lose the race to.
  useEffect(() => {
    if (!readyToScroll) return
    const lenis = new Lenis({ smoothWheel: true })
    lenis.on('scroll', ScrollTrigger.update)
    const lenisTicker = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(lenisTicker)
    // Deliberately NOT calling gsap.ticker.lagSmoothing(0) — that call
    // disables GSAP's protection against a ticker that falls behind (e.g.
    // while the page is still hydrating): lag smoothing normally spreads a
    // catch-up out smoothly instead of applying all the missed time in one
    // jump. Left at GSAP's default (enabled) as a second line of defense.
    return () => {
      gsap.ticker.remove(lenisTicker)
      lenis.destroy()
    }
  }, [readyToScroll])

  useEffect(() => {
    // Everything below is deferred one frame: SplitText's DOM splitting plus
    // ScrollTrigger.create() with pin:true on a min-h-[160vh] section forces
    // GSAP to synchronously measure the whole document's layout to compute
    // pin start/end offsets. Running that inline in the mount effect was
    // real main-thread blocking work landing right on top of the page's
    // first paint — during that window the WebGL background visibly froze
    // and scroll input went nowhere until it finished, then everything
    // "caught up" at once. Letting the browser paint first (rAF) and doing
    // this setup a frame later removes that block from the critical path;
    // the extra frame of delay before the reveal-on-scroll effect is armed
    // is imperceptible.
    let split: SplitText | null = null
    let revealTl: gsap.core.Timeline | null = null
    let cancelled = false

    const setupId = requestAnimationFrame(() => {
      if (cancelled) return

      let words: Element[] = []
      if (paraRef.current) {
        try {
          split = new SplitText(paraRef.current, {
            type: 'words',
            wordsClass: 'reveal-word inline-block origin-left mr-[0.25em] will-change-transform',
          })
          words = split.words
        } catch {
          words = Array.from(paraRef.current.querySelectorAll('.reveal-word'))
        }
      }

      if (words.length > 0) {
        gsap.set(words, { opacity: 0, rotate: 8, yPercent: 30 })
      }

      revealTl = gsap.timeline({
        scrollTrigger: {
          trigger: benefitRef.current,
          start: 'top 70%',
          end: 'top -10%',
          scrub: 1.5,
        },
      })

      if (words.length > 0) {
        revealTl.to(words, {
          stagger: 0.2,
          opacity: 1,
          rotate: 0,
          yPercent: 0,
          ease: 'power1.inOut',
        })
      }

      tagRefs.current.forEach((tagEl) => {
        if (tagEl) {
          revealTl!.to(
            tagEl,
            { duration: 1, opacity: 1, clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', ease: 'circ.out' },
            '>-0.4',
          )
        }
      })

    })

    return () => {
      cancelled = true
      cancelAnimationFrame(setupId)
      split?.revert()
      revealTl?.kill()
      ScrollTrigger.getAll().forEach((t) => t.kill())
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

      <section ref={benefitRef} className="relative w-full min-h-[140vh] md:min-h-[160vh] pb-16 md:pb-20">
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
