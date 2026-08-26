'use client'

import React, { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(ScrollTrigger, SplitText)

export interface TagItem {
  id?: string
  text: string
  background: string
  color?: string
}

export interface HeroScrollRevealProps {
  topText?: React.ReactNode
  headingText?: React.ReactNode
  tags?: TagItem[]
  subText?: string
  /** Real names rendered as a dense text field inside the pinned reveal circle. */
  centerpieceNames?: string[]
  bottomText?: React.ReactNode
  /** Rendered after the bottom text — e.g. sign in / sign up CTAs. */
  children?: React.ReactNode
  className?: string
}

// Deterministic (non-random) size/opacity cycle so server and client render
// identically — Math.random() here would cause a hydration mismatch.
const NAME_VARIANTS = [
  { size: 'text-2xl sm:text-3xl md:text-4xl', opacity: 'opacity-90', weight: 'font-bold', accent: true },
  { size: 'text-sm sm:text-base md:text-lg', opacity: 'opacity-40', weight: 'font-medium', accent: false },
  { size: 'text-base sm:text-lg md:text-xl', opacity: 'opacity-60', weight: 'font-semibold', accent: false },
  { size: 'text-xs sm:text-sm md:text-base', opacity: 'opacity-30', weight: 'font-normal', accent: false },
]

export const HeroScrollVideoReveal: React.FC<HeroScrollRevealProps> = ({
  topText,
  headingText,
  tags = [],
  subText,
  centerpieceNames = [],
  bottomText,
  children,
  className = '',
}) => {
  const benefitRef = useRef<HTMLDivElement>(null)
  const pinWrapperRef = useRef<HTMLDivElement>(null)
  const revealBoxRef = useRef<HTMLDivElement>(null)
  const paraRef = useRef<HTMLParagraphElement>(null)
  const tagRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let lenis: any = null
    let lenisTicker: ((time: number) => void) | null = null

    import('lenis')
      .then(({ default: Lenis }) => {
        lenis = new Lenis({ smoothWheel: true })
        lenis.on('scroll', ScrollTrigger.update)
        lenisTicker = (time: number) => lenis!.raf(time * 1000)
        gsap.ticker.add(lenisTicker)
        gsap.ticker.lagSmoothing(0)
      })
      .catch(() => {})

    let split: SplitText | null = null
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

    const revealTl = gsap.timeline({
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
        revealTl.to(
          tagEl,
          { duration: 1, opacity: 1, clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', ease: 'circ.out' },
          '>-0.4',
        )
      }
    })

    const mm = gsap.matchMedia()

    const pinReveal = (startCircle: string, endSpacer: number, scrub: number) => {
      gsap.set(revealBoxRef.current, { clipPath: startCircle })
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: pinWrapperRef.current,
          start: 'top top',
          end: `+=${endSpacer}`,
          scrub,
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
        },
      })
      tl.fromTo(revealBoxRef.current, { clipPath: startCircle }, { clipPath: 'circle(150% at 50% 50%)', ease: 'none' })
    }

    mm.add('(max-width: 639.9px)', () => pinReveal('circle(18% at 50% 50%)', 1500, 1.2))
    mm.add('(min-width: 640px) and (max-width: 1023.9px)', () => pinReveal('circle(12% at 50% 50%)', 2000, 1.3))
    mm.add('(min-width: 1024px)', () => pinReveal('circle(8% at 50% 50%)', 2500, 1.5))

    return () => {
      split?.revert()
      revealTl.kill()
      mm.revert()
      ScrollTrigger.getAll().forEach((t) => t.kill())
      if (lenis && lenisTicker) {
        gsap.ticker.remove(lenisTicker)
        lenis.destroy()
      }
    }
  }, [])

  return (
    <div className={`w-full bg-background text-foreground ${className}`}>
      {topText && (
        <section className="w-full min-h-screen flex justify-center items-center text-center px-4 sm:px-8 py-8 text-[clamp(1.8rem,4.5vw,4.5rem)] font-bold tracking-tight text-balance leading-tight">
          {topText}
        </section>
      )}

      <section ref={benefitRef} className="relative w-full min-h-[140vh] md:min-h-[160vh] pb-16 md:pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 md:py-24 flex flex-col items-center text-center relative z-10">
          {headingText && (
            <div className="w-full mb-8 sm:mb-12 md:mb-14">
              <p ref={paraRef} className="text-[clamp(2rem,5vw,5rem)] font-extrabold tracking-tight text-balance leading-tight overflow-visible">
                {headingText}
              </p>
            </div>
          )}

          {tags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2.5 sm:gap-4 max-w-4xl mx-auto my-4 sm:my-6 mb-8 sm:mb-14">
              {tags.map((tag, idx) => (
                <div
                  key={tag.id ?? `tag-${idx}`}
                  ref={(el) => {
                    tagRefs.current[idx] = el
                  }}
                  className="px-5 sm:px-8 py-2.5 sm:py-4 rounded-full text-[clamp(0.8rem,1.6vw,1.35rem)] font-semibold tracking-tight opacity-0 shadow-2xl will-change-[clip-path,opacity]"
                  style={{ background: tag.background, color: tag.color ?? '#ffffff', clipPath: 'polygon(0% 0% ,0% 0%, 0% 100%, 0% 100%)' }}
                >
                  {tag.text}
                </div>
              ))}
            </div>
          )}

          {subText && <p className="text-[clamp(0.95rem,1.5vw,1.35rem)] text-muted-foreground font-normal max-w-xl mt-2 sm:mt-4 px-4 text-pretty">{subText}</p>}
        </div>

        <div ref={pinWrapperRef} className="w-full h-screen flex justify-center items-center relative overflow-hidden">
          <div ref={revealBoxRef} className="relative w-full h-full overflow-hidden flex justify-center items-center bg-background will-change-[clip-path]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--primary)/12%,transparent_65%)]" />
            <div className="relative w-full h-full flex flex-wrap content-center justify-center gap-x-5 gap-y-3 px-8 sm:px-16 md:px-28 py-16 overflow-hidden">
              {centerpieceNames.map((name, idx) => {
                const v = NAME_VARIANTS[idx % NAME_VARIANTS.length]
                return (
                  <span
                    key={name}
                    className={`${v.size} ${v.weight} ${v.accent ? 'text-primary' : 'text-foreground'} ${v.opacity} whitespace-nowrap select-none`}
                  >
                    {name}
                  </span>
                )
              })}
            </div>
          </div>
        </div>
      </section>

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
