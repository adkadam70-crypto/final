'use client'

import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DottedMap from 'dotted-map'

export interface WorldMapPoint {
  code: string
  lat: number
  lng: number
}

interface WorldMapProps {
  points?: WorldMapPoint[]
  markerColor?: string
}

// Fixed to the site's actual dark/teal palette (no next-themes toggle here —
// this app has no light mode). Values match the real --background/--primary
// CSS vars from app/globals.css (already converted once for the Velaris
// shader background — kept in sync with that conversion rather than
// re-derived).
const MAP_BG = '#0b0d11'
const MAP_DOT_COLOR = '#00ccab40'
const DEFAULT_MARKER_COLOR = '#00ccab'

// dotted-map's own getSVG output is natively a 0 0 198 100 viewBox — NOT the
// 800x400 an earlier version's math assumed. That mismatch (background dots
// in one coordinate space, marker overlay computed in a different,
// unrelated one) is exactly why markers landed off their real country. Both
// layers share this one native space, computed the same way dotted-map
// itself projects lat/lng, so a marker always lands exactly on its dot
// cluster.
const NATIVE_W = 198
const NATIVE_H = 100

// Fixed zoom/center — deliberately NOT recalculated from whichever countries
// are currently selected. An earlier version auto-fit/panned to whatever was
// selected, which meant adding one more country visibly shifted every
// marker already on screen. Fixed instead: one static view, chosen so all 8
// countries this app supports (US through AU, its widest real spread) are
// always on-screen regardless of what's selected — markers never relocate.
// Center is nudged up from true world-center (50) since the populated
// landmass (all 8 countries sit between roughly 20-65 in native Y) reads as
// better-centered a little above the equator than dead center, which leaves
// a visibly empty band of ocean/Antarctica at the bottom.
const FIXED_SCALE = 1.15
const FIXED_CENTER_X = NATIVE_W / 2
const FIXED_CENTER_Y = 45

function projectPoint(lat: number, lng: number) {
  const x = (lng + 180) * (NATIVE_W / 360)
  const y = (90 - lat) * (NATIVE_H / 180)
  return { x, y }
}

const GROUP_TRANSFORM = `translate(${FIXED_CENTER_X} ${FIXED_CENTER_Y}) scale(${FIXED_SCALE}) translate(${-FIXED_CENTER_X} ${-FIXED_CENTER_Y})`

export function WorldMap({ points = [], markerColor = DEFAULT_MARKER_COLOR }: WorldMapProps) {
  const map = useMemo(() => new DottedMap({ height: 100, grid: 'diagonal' }), [])

  // Strip dotted-map's own <svg viewBox="0 0 198 100" ...>...</svg> wrapper
  // down to just its <circle> markup, so it can be injected as a <g> inside
  // our own single <svg> — the only way to guarantee it shares the exact
  // same viewBox/transform as the marker overlay instead of being scaled
  // independently (which is what broke alignment before).
  const dotsMarkup = useMemo(() => {
    const svg = map.getSVG({ radius: 0.22, color: MAP_DOT_COLOR, shape: 'circle', backgroundColor: MAP_BG })
    return svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')
  }, [map])

  const projected = useMemo(() => points.map((p) => ({ ...p, ...projectPoint(p.lat, p.lng) })), [points])

  return (
    <div className="w-full aspect-[2.6/1] relative overflow-hidden rounded-2xl [mask-image:linear-gradient(to_bottom,transparent,white_14%,white_90%,transparent)]">
      <svg
        viewBox={`0 0 ${NATIVE_W} ${NATIVE_H}`}
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full absolute inset-0 pointer-events-none select-none"
      >
        <rect x={0} y={0} width={NATIVE_W} height={NATIVE_H} fill={MAP_BG} />

        {/* Background dots and selection markers share this exact
            transform, so they always stay in lockstep — a marker is a
            plain SVG circle here (not HTML/foreignObject), which scales
            correctly under this transform with no special-casing needed. */}
        <g style={{ transform: GROUP_TRANSFORM }}>
          <g dangerouslySetInnerHTML={{ __html: dotsMarkup }} />
        </g>

        <g style={{ transform: GROUP_TRANSFORM }}>
          <AnimatePresence>
            {projected.map((point) => (
              <g key={point.code}>
                {/* One-shot burst on selection — a bigger, brighter flash
                    distinct from the slow continuous pulse below, so the
                    moment of selection reads as a deliberate pop. */}
                <motion.circle
                  cx={point.x}
                  cy={point.y}
                  fill={markerColor}
                  initial={{ r: 1, opacity: 0.9 }}
                  animate={{ r: 5, opacity: 0 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
                <motion.circle
                  cx={point.x}
                  cy={point.y}
                  fill={markerColor}
                  initial={{ r: 0, opacity: 0 }}
                  animate={{ r: 1.4, opacity: 1 }}
                  exit={{ r: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                />
                <circle cx={point.x} cy={point.y} r="1.4" fill={markerColor} opacity="0.5">
                  <animate attributeName="r" from="1.4" to="4" dur="2s" begin="0.6s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.6" to="0" dur="2s" begin="0.6s" repeatCount="indefinite" />
                </circle>
              </g>
            ))}
          </AnimatePresence>
        </g>
      </svg>
    </div>
  )
}
