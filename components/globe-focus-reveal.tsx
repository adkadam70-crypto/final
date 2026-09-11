'use client'

import { useEffect, useRef } from 'react'
import RotatingEarth from '@/components/ui/wireframe-dotted-globe'
import { marigold } from '@/lib/fonts'

interface CountryCard {
  id: string
  label: string
  stat: string
  blurb: string
  image: string
  // Which half of the globe this card's leader line leaves from. Cards are
  // stacked top-to-bottom within their side in the order listed below, and
  // both sides use the same 3-slot vertical spacing so left mirrors right.
  side: 'left' | 'right'
  // Beat this card belongs to — beats reveal in order as the user keeps
  // scrolling, and once revealed a card stays (no fade-out), so the
  // sequence builds up rather than replacing itself.
  beat: number
}

// Real per-country catalog counts (Sept 2026 snapshot), rounded down to a
// clean "+" threshold — same convention as "970+ real universities"
// elsewhere on this page. Never an invented number. Singapore + Hong Kong
// are combined into one card (their real counts summed, then rounded
// down) — everything else stands alone.
const CARDS: CountryCard[] = [
  {
    id: 'us',
    label: 'United States',
    stat: '270+ universities',
    blurb: "The world's largest higher-ed market — Ivy League research giants down to specialized colleges.",
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Aerial_of_the_Harvard_Business_School_campus.jpeg/960px-Aerial_of_the_Harvard_Business_School_campus.jpeg',
    side: 'right',
    beat: 0,
  },
  {
    id: 'uk',
    label: 'United Kingdom',
    stat: '120+ universities',
    blurb: 'From Oxbridge to a deep bench of research-intensive Russell Group universities.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/1_christ_church_hall_2012.jpg/960px-1_christ_church_hall_2012.jpg',
    side: 'right',
    beat: 1,
  },
  {
    id: 'germany',
    label: 'Germany',
    stat: '140+ universities',
    blurb: 'Anchored by its Technische Universitäten and tuition-free public research universities.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/MI-Geb%C3%A4ude_der_TU_M%C3%BCnchen_Magistrale2.JPG/960px-MI-Geb%C3%A4ude_der_TU_M%C3%BCnchen_Magistrale2.JPG',
    side: 'right',
    beat: 2,
  },
  {
    id: 'india',
    label: 'India',
    stat: '190+ universities',
    blurb: 'Home to the IITs and IIMs, plus a fast-growing set of private research universities.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Ariel_view_of_campus.jpg/960px-Ariel_view_of_campus.jpg',
    side: 'left',
    beat: 3,
  },
  {
    id: 'france',
    label: 'France',
    blurb: 'Grandes écoles and public universities together, from Sciences Po to the Sorbonne.',
    stat: '160+ universities',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Entree_scpo.jpg/960px-Entree_scpo.jpg',
    side: 'left',
    beat: 4,
  },
  {
    id: 'singapore-hk',
    label: 'Singapore & Hong Kong',
    stat: '25+ universities',
    blurb: 'Two small, research-intensive systems — Singapore top-ranked, Hong Kong UK-rooted.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/a/a1/NUSHighSchool-entrance-20081201.jpg',
    side: 'left',
    beat: 5,
  },
]

const BEAT_COUNT = 6
// Travel takes the first slice of scroll; the rest is split evenly across
// beats so each one gets its own dedicated scroll range to fade in and
// settle before the next starts.
const TRAVEL_END = 0.22

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v))
}

const GLOBE_SIZE = 540
const LOCKED_SCALE = 0.92
// wireframe-dotted-globe's own resize() draws the sphere at
// `radius = side/2.08` — mirrored here so the leader lines' hub point lands
// exactly on the globe's real rendered edge instead of a guessed offset.
const GLOBE_RADIUS_PX = (GLOBE_SIZE / 2.08) * LOCKED_SCALE
const CARD_WIDTH_PX = 176 // matches the card's own w-40/sm:w-44 below

const leftCards = CARDS.filter((c) => c.side === 'left')
const rightCards = CARDS.filter((c) => c.side === 'right')
// Fixed 3-slot vertical spacing, identical formula on both sides — top,
// middle, bottom — so left mirrors right exactly, per the reference sketch.
const SLOT_TOP = [22, 50, 78]
function slotFor(card: CountryCard) {
  const group = card.side === 'left' ? leftCards : rightCards
  return SLOT_TOP[group.indexOf(card)]
}

// Single continuous section spanning what used to be "page 2's static
// globe" and "page 3's reveal" — there is only ever one <RotatingEarth />
// mounted here. It starts pinned near the top (right where the heading/tags
// leave off) and, as the user keeps scrolling, slides down and settles at
// a locked position, still rotating the whole time. From there, 3 cards
// per side fade in. Every card on a side shares one exit point right at
// the globe's edge — each line breaks into its own diagonal immediately at
// that point, then runs flat the rest of the way to a small dot right
// against its card, matching a hub-and-spoke reference sketch rather than
// individually-angled lines starting from the globe's face.
//
// All scroll-driven visuals (globe transform, "Our Network" opacity, each
// line's opacity, each card's opacity) are written straight to the DOM via
// refs inside the scroll rAF loop instead of going through React state —
// this section used to re-render the whole card/line tree on every scroll
// frame, which was the actual source of the scroll jank reported over this
// page; imperative style writes here cost far less than a full reconcile.
export function GlobeFocusReveal() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const globeBoxRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLDivElement>(null)
  const lineRefs = useRef<Record<string, SVGGElement | null>>({})
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const edgeReachRef = useRef((GLOBE_RADIUS_PX / 1280) * 100)

  useEffect(() => {
    let raf = 0
    const apply = () => {
      const el = wrapperRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const total = rect.height - window.innerHeight
      const scrolled = -rect.top
      const progress = total > 0 ? clamp01(scrolled / total) : 0

      const travelT = clamp01(progress / TRAVEL_END)
      const translateY = lerp(4, 14, travelT)
      const scale = lerp(1, LOCKED_SCALE, travelT)
      if (globeBoxRef.current) globeBoxRef.current.style.transform = `translateY(${translateY}vh) scale(${scale})`
      if (labelRef.current) labelRef.current.style.opacity = String(travelT)

      const beatWidth = (1 - TRAVEL_END) / BEAT_COUNT
      for (const card of CARDS) {
        const start = TRAVEL_END + card.beat * beatWidth
        const beatOpacity = clamp01((progress - start) / (beatWidth * 0.7))
        const lineEl = lineRefs.current[card.id]
        if (lineEl) lineEl.style.opacity = String(beatOpacity * 0.9)
        const cardEl = cardRefs.current[card.id]
        if (cardEl) cardEl.style.opacity = String(beatOpacity)
      }
    }
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(apply)
    }
    const onResize = () => {
      if (window.innerWidth > 0) edgeReachRef.current = (GLOBE_RADIUS_PX / window.innerWidth) * 100
      onScroll()
    }
    onResize()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(raf)
    }
  }, [])

  const originX = 50
  const originY = 40
  // Horizontal distance (viewBox %) from center to the globe's own edge —
  // both lines on a side start from this exact same point. Read from a ref
  // (kept current on resize) rather than state, since it only ever feeds
  // an SVG attribute computed at render time, not something that needs to
  // re-render the component on its own.
  const edgeReach = edgeReachRef.current
  const cardOffset = 3 // % gap from the screen edge to the card's outer edge
  const cardWidthPct = (CARD_WIDTH_PX / 1280) * 100
  // Dot sits right at the card's inner edge (the edge facing the globe) —
  // no extra gap between where the line ends and where the card starts.
  const cardInnerEdge = cardOffset + cardWidthPct

  return (
    <div ref={wrapperRef} className="relative h-[460vh]">
      <div className="sticky top-0 h-screen overflow-hidden flex items-start justify-center">
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 100" preserveAspectRatio="none">
          {(['left', 'right'] as const).map((side) => {
            const dir = side === 'right' ? 1 : -1
            const hubX = originX + dir * edgeReach
            const group = side === 'left' ? leftCards : rightCards
            const endX = side === 'right' ? 100 - cardInnerEdge : cardInnerEdge
            return group.map((card) => {
              const top = slotFor(card)
              // Diagonal happens immediately at the hub (elbow already sits
              // at the card's row), then a flat run the rest of the way —
              // matching the sketch's "angle right at the globe, then
              // straight" shape instead of the reverse.
              const elbowX = hubX + dir * 6
              return (
                <g
                  key={card.id}
                  ref={(el) => {
                    lineRefs.current[card.id] = el
                  }}
                  className="will-change-[opacity]"
                  opacity={0}
                >
                  <polyline points={`${hubX},${originY} ${elbowX},${top} ${endX},${top}`} fill="none" stroke="var(--primary)" strokeWidth={0.22} />
                  <circle cx={endX} cy={top} r={0.55} fill="var(--primary)" />
                </g>
              )
            })
          })}
        </svg>

        <div ref={globeBoxRef} className="relative z-10 flex flex-col items-center will-change-transform" style={{ transform: 'translateY(4vh) scale(1)' }}>
          <RotatingEarth width={GLOBE_SIZE} height={GLOBE_SIZE} interactive={false} />
          <div ref={labelRef} className={`mt-6 sm:mt-8 text-base sm:text-lg font-bold tracking-tight text-foreground will-change-[opacity] ${marigold.className}`} style={{ opacity: 0 }}>
            Our Network
          </div>
        </div>

        <div className="absolute inset-0 pointer-events-none z-20">
          {CARDS.map((card) => {
            const top = slotFor(card)
            return (
              <div
                key={card.id}
                ref={(el) => {
                  cardRefs.current[card.id] = el
                }}
                className={`absolute w-40 sm:w-44 -translate-y-1/2 rounded-lg overflow-hidden border border-white/10 bg-neutral-900 shadow-xl will-change-[opacity] ${card.side === 'right' ? 'right-[3%]' : 'left-[3%]'}`}
                style={{ top: `${top}%`, opacity: 0 }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={card.image} alt={card.label} className="w-full h-14 sm:h-16 object-cover" loading="lazy" />
                <div className="px-2.5 py-2">
                  <div className="text-xs sm:text-sm font-bold text-white">{card.label}</div>
                  <div className="text-[11px] sm:text-xs font-semibold text-primary">{card.stat}</div>
                  <p className="mt-0.5 text-[10px] leading-snug text-white/60 line-clamp-2">{card.blurb}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
