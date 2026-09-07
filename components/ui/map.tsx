'use client'

import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DottedMap from 'dotted-map'
import proj4 from 'proj4'

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
// unrelated one) is exactly why markers landed off their real country.
//
// It gets worse: dotted-map doesn't even use simple linear lat/lng-to-pixel
// scaling (equirectangular) — its default is a true Mercator projection
// (`+proj=merc`) over a cropped region (lat -56..71, lng -168..168), per its
// own source (node_modules/dotted-map/dist/index.mjs, getMap/PROJECTIONS).
// A naive linear formula was therefore *systematically* wrong — worse the
// further a country sits from the equator (exactly why India and Australia
// were off — confirmed by comparing both formulas' output directly). Fixed
// by running the identical proj4 projection + normalization dotted-map uses
// internally, so a marker always lands exactly on its real dot cluster.
const MERCATOR_PROJ4 = '+proj=merc +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m'
const REGION = { lat: { min: -56, max: 71 }, lng: { min: -168, max: 168 } }
const NATIVE_H = 100

// Reproduces getMap()'s own bounding-box sampling (dist/index.mjs) — walks
// the region's edges through the projection to find the true projected
// min/max, since Mercator's Y axis isn't symmetric around the equator (the
// region above isn't centered on lat 0, so this can't be shortcut to just
// the four corners without risking drift if the region ever changes).
function computeProjectedBounds() {
  const SAMPLES = 100
  let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity
  for (let i = 0; i <= SAMPLES; i++) {
    const frac = i / SAMPLES
    const sampleLat = REGION.lat.min + frac * (REGION.lat.max - REGION.lat.min)
    const sampleLng = REGION.lng.min + frac * (REGION.lng.max - REGION.lng.min)
    const candidates: [number, number][] = [
      [sampleLng, REGION.lat.min],
      [sampleLng, REGION.lat.max],
      [REGION.lng.min, sampleLat],
      [REGION.lng.max, sampleLat],
      [sampleLng, sampleLat],
    ]
    for (const point of candidates) {
      const [px, py] = proj4(MERCATOR_PROJ4, point)
      if (Number.isFinite(px) && Number.isFinite(py)) {
        xMin = Math.min(xMin, px)
        xMax = Math.max(xMax, px)
        yMin = Math.min(yMin, py)
        yMax = Math.max(yMax, py)
      }
    }
  }
  return { xMin, xMax, yMin, yMax }
}

const BOUNDS = computeProjectedBounds()
const X_RANGE = BOUNDS.xMax - BOUNDS.xMin
const Y_RANGE = BOUNDS.yMax - BOUNDS.yMin
// Matches dotted-map's own width auto-derivation (getMap: width = height *
// X_RANGE / Y_RANGE) — this must come out to 198 to match its real output;
// verified directly against DottedMap({height:100}).getSVG()'s own viewBox.
const NATIVE_W = Math.round(NATIVE_H * X_RANGE / Y_RANGE)

function projectPoint(lat: number, lng: number) {
  const [px, py] = proj4(MERCATOR_PROJ4, [lng, lat])
  const x = ((px - BOUNDS.xMin) / X_RANGE) * NATIVE_W
  const y = ((BOUNDS.yMax - py) / Y_RANGE) * NATIVE_H
  return { x, y }
}

// Fixed zoom/center — deliberately NOT recalculated from whichever countries
// are currently selected. An earlier version auto-fit/panned to whatever was
// selected, which meant adding one more country visibly shifted every
// marker already on screen. Fixed instead: one static view, chosen so all 8
// countries this app supports (US through AU, its widest real spread) are
// always on-screen regardless of what's selected — markers never relocate.
const FIXED_SCALE = 1.08
const FIXED_CENTER_X = NATIVE_W / 2
const FIXED_CENTER_Y = NATIVE_H / 2
// Additive horizontal pan (applied after the scale, in native units) — the
// real Mercator-projected spread of these 8 countries runs from the US
// (~x=41) to Australia (~x=178), whose midpoint (~109) sits right of true
// world-center (99). Zooming around world-center alone left Australia
// crammed against the right edge and a wide empty gap of ocean on the left;
// shifting the pivot itself barely moved anything (its effect scales with
// (FIXED_SCALE - 1), which is small) — this shifts the rendered content
// directly instead.
const PAN_X = -8

const GROUP_TRANSFORM = `translate(${FIXED_CENTER_X + PAN_X} ${FIXED_CENTER_Y}) scale(${FIXED_SCALE}) translate(${-FIXED_CENTER_X} ${-FIXED_CENTER_Y})`

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
    <div className="w-full aspect-[2.6/1] relative overflow-hidden rounded-2xl [mask-image:linear-gradient(to_bottom,transparent,white_6%,white_95%,transparent)]">
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
        <g transform={GROUP_TRANSFORM}>
          <g dangerouslySetInnerHTML={{ __html: dotsMarkup }} />
        </g>

        <g transform={GROUP_TRANSFORM}>
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
