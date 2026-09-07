'use client'

import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DottedMap from 'dotted-map'
import { MapPin } from 'lucide-react'

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
// 800x400 the original template's projectPoint math assumed. That mismatch
// (background dots in one coordinate space, marker overlay computed in a
// different, unrelated one) is exactly why markers landed off their real
// country. Both layers now share this one native space, computed the same
// way dotted-map itself projects lat/lng, so a pin always lands exactly on
// its dot cluster.
const NATIVE_W = 198
const NATIVE_H = 100

// Must match the container's aspect-[2.6/1] className below — used to
// pre-compute exactly what slice of the native map "preserveAspectRatio…
// slice" leaves visible, so pin positions (computed in plain HTML, not SVG)
// land in the right spot.
const CONTAINER_ASPECT = 2.6
const VISIBLE_W = NATIVE_W
const VISIBLE_H = NATIVE_W / CONTAINER_ASPECT
const VISIBLE_Y_START = (NATIVE_H - VISIBLE_H) / 2

// Fixed zoom/center — deliberately NOT recalculated from whichever countries
// are currently selected. An earlier version auto-fit/panned to whatever was
// selected, which meant adding one more country visibly shifted every pin
// already on screen. Fixed instead: one static view, chosen so all 8
// countries this app supports (US through AU, its widest real spread) are
// always on-screen regardless of what's selected — pins never relocate,
// nothing (including USA) is ever cropped out.
const FIXED_SCALE = 1.15
const FIXED_CENTER_X = NATIVE_W / 2
const FIXED_CENTER_Y = NATIVE_H / 2

function projectPoint(lat: number, lng: number) {
  const x = (lng + 180) * (NATIVE_W / 360)
  const y = (90 - lat) * (NATIVE_H / 180)
  return { x, y }
}

// p' = scale * (p - center) + center — scales around the fixed center point.
function transformPoint(x: number, y: number) {
  return {
    x: FIXED_SCALE * (x - FIXED_CENTER_X) + FIXED_CENTER_X,
    y: FIXED_SCALE * (y - FIXED_CENTER_Y) + FIXED_CENTER_Y,
  }
}

const GROUP_TRANSFORM = `translate(${FIXED_CENTER_X} ${FIXED_CENTER_Y}) scale(${FIXED_SCALE}) translate(${-FIXED_CENTER_X} ${-FIXED_CENTER_Y})`

export function WorldMap({ points = [], markerColor = DEFAULT_MARKER_COLOR }: WorldMapProps) {
  const map = useMemo(() => new DottedMap({ height: 100, grid: 'diagonal' }), [])

  // Strip dotted-map's own <svg viewBox="0 0 198 100" ...>...</svg> wrapper
  // down to just its <circle> markup, so it can be injected as a <g> inside
  // our own single <svg> — the only way to guarantee it shares the exact
  // same viewBox/transform as the pin overlay instead of being scaled
  // independently (which is what broke alignment before).
  const dotsMarkup = useMemo(() => {
    const svg = map.getSVG({ radius: 0.22, color: MAP_DOT_COLOR, shape: 'circle', backgroundColor: MAP_BG })
    return svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')
  }, [map])

  const projected = useMemo(() => points.map((p) => ({ ...p, ...projectPoint(p.lat, p.lng) })), [points])

  return (
    // Extra top padding reserves room for a pin anchored near the top edge
    // of the map (its bottom tip sits on the country, but the pin shape
    // itself extends upward from there) — without this, a pin on a
    // northerly country like the UK or Germany got clipped by the map's own
    // rounded-corner boundary.
    <div className="w-full pt-6 relative [mask-image:linear-gradient(to_bottom,transparent,white_14%,white_90%,transparent)]">
      <div className="w-full aspect-[2.6/1] relative overflow-hidden rounded-2xl">
        <svg
          viewBox={`0 0 ${NATIVE_W} ${NATIVE_H}`}
          preserveAspectRatio="xMidYMid slice"
          className="w-full h-full absolute inset-0 pointer-events-none select-none"
        >
          <rect x={0} y={0} width={NATIVE_W} height={NATIVE_H} fill={MAP_BG} />
          <g style={{ transform: GROUP_TRANSFORM }}>
            <g dangerouslySetInnerHTML={{ __html: dotsMarkup }} />
          </g>
        </svg>
      </div>

      {/* Pins rendered as plain positioned HTML, not SVG — SVG foreignObject
          content doesn't scale predictably under a nested transform across
          browsers, which is what made an earlier version render oversized,
          misplaced text. Position is computed from the same fixed-view math
          above, converted into a percentage of the visible (post-"slice")
          crop window, so a pin lands exactly on its true lat/lng.
          Deliberately NOT clipped (no overflow-hidden) — the map background
          above is, but a pin near the top edge is allowed to extend past it
          into the reserved pt-6 padding instead of being cut off. */}
      <div className="absolute inset-x-0 bottom-0 pointer-events-none" style={{ top: '1.5rem' }}>
        <AnimatePresence>
          {projected.map((point) => {
            const t = transformPoint(point.x, point.y)
            const leftPct = (t.x / VISIBLE_W) * 100
            const topPct = ((t.y - VISIBLE_Y_START) / VISIBLE_H) * 100
            return (
              <motion.div
                key={point.code}
                // Google Maps-style pin drop: falls in from above and
                // overshoots into a small bounce on landing (low spring
                // damping), rather than growing from its own point.
                initial={{ opacity: 0, y: -28, scale: 0.5 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.5, transition: { duration: 0.15 } }}
                transition={{ type: 'spring', stiffness: 700, damping: 12 }}
                style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                className="absolute -translate-x-1/2 -translate-y-full"
              >
                <MapPin className="w-3.5 h-3.5" fill={markerColor} stroke={markerColor} strokeWidth={1} />
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
