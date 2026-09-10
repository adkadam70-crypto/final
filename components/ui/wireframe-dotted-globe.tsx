'use client'

import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'

interface CountryMarker {
  name: string
  lat: number
  lng: number
}

// Fallback city per country — only used until the real country-boundary
// data (public/ne-50m-our-countries.json) loads and each dot gets moved to
// that country's actual geometric centroid instead. A representative city
// is rarely at the true center of a country's landmass (this is what made
// dots look "off-center" before), so this is intentionally a placeholder,
// not the final position.
const SUPPORTED_COUNTRIES: CountryMarker[] = [
  { name: 'United States', lat: 40.7128, lng: -74.006 },
  { name: 'United Kingdom', lat: 51.5072, lng: -0.1276 },
  { name: 'Australia', lat: -33.8688, lng: 151.2093 },
  { name: 'Singapore', lat: 1.3521, lng: 103.8198 },
  { name: 'Hong Kong', lat: 22.3193, lng: 114.1694 },
  { name: 'India', lat: 28.6139, lng: 77.209 },
  { name: 'Germany', lat: 52.52, lng: 13.405 },
  { name: 'France', lat: 48.8566, lng: 2.3522 },
]

// public/ne-50m-our-countries.json carries Natural Earth's raw admin names
// for a couple of entries — map those to what we display.
const GEO_NAME_TO_DISPLAY_NAME: Record<string, string> = {
  'United States of America': 'United States',
}

interface RotatingEarthProps {
  width?: number
  height?: number
  className?: string
}

// Toggle to bring the country-to-country dotted lines back — off for now
// while trying the see-through halftone look on its own.
const SHOW_CONNECTOR_LINES = false

export default function RotatingEarth({ width = 800, height = 600, className = '' }: RotatingEarthProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const context2d = canvas.getContext('2d')
    if (!context2d) return
    // Nested closures below don't retain the null-check narrowing above —
    // this typed alias carries the non-null type into every function
    // declared further down in this effect.
    const context: CanvasRenderingContext2D = context2d

    // Theme colors read straight from the CSS variables (app/globals.css) so
    // this always matches the live palette instead of a hardcoded guess —
    // canvas fillStyle/strokeStyle accepts any valid CSS color string,
    // including the oklch() values this app uses.
    const themeColor = (variable: string) => getComputedStyle(document.documentElement).getPropertyValue(variable).trim()
    const colors = {
      ocean: themeColor('--card'),
      // --border is only ~10% white — fine for a subtle grid line, too
      // dull to read as an actual country border. --muted-foreground is
      // the same neutral tone at real visible contrast.
      land: themeColor('--muted-foreground'),
      outline: themeColor('--primary'),
      marker: themeColor('--primary'),
    }

    let containerWidth = 0
    let containerHeight = 0
    let radius = 0

    const projection = d3.geoOrthographic().clipAngle(90)
    const path = d3.geoPath().projection(projection).context(context)

    let landFeatures: d3.ExtendedFeatureCollection | null = null
    let landDots: [number, number][] = []
    let countryFeatures: d3.ExtendedFeatureCollection | null = null
    const rotation: [number, number] = [0, 0]
    let hoveredCountry: string | null = null
    let hoverScreenPos: [number, number] | null = null

    function countryNameAtScreenPoint(mx: number, my: number): string | null {
      if (!countryFeatures) return null
      const lngLat = projection.invert?.([mx, my])
      if (!lngLat) return null
      // Off the visible disk entirely (invert() still returns a coordinate
      // for points outside the circle, just not a meaningful one).
      if (Math.hypot(mx - containerWidth / 2, my - containerHeight / 2) > radius) return null
      for (const feature of countryFeatures.features) {
        if (d3.geoContains(feature, lngLat)) {
          const geoName = feature.properties?.name as string | undefined
          if (!geoName) continue
          return GEO_NAME_TO_DISPLAY_NAME[geoName] ?? geoName
        }
      }
      return null
    }

    // Mutable — starts at the fallback city coordinates, then each entry
    // gets overwritten with that country's real geometric centroid once
    // public/ne-50m-our-countries.json loads (see loadWorldData below).
    // Both the dots and the connecting lines read from this same map, so
    // they always stay joined at the same point.
    const countryPoints = new Map<string, [number, number]>(SUPPORTED_COUNTRIES.map((c) => [c.name, [c.lng, c.lat]]))

    // A great-circle arc (not a straight chord) between two countries, as a
    // GeoJSON LineString with enough intermediate points for the
    // orthographic projection's clipping to hide the part that dips behind
    // the globe instead of drawing straight through it.
    function greatCircleLine(a: [number, number], b: [number, number]) {
      const interpolate = d3.geoInterpolate(a, b)
      const steps = 48
      const coordinates = Array.from({ length: steps + 1 }, (_, i) => interpolate(i / steps))
      return { type: 'LineString' as const, coordinates }
    }

    // One single dotted line, not a hub or a mesh: starting at Australia,
    // always stepping to whichever remaining country is geographically
    // nearest, until all 8 are visited, then closing the loop back to
    // Australia. This ORDER is computed once from the fallback coordinates
    // (real centroids land close enough to the same city that the nearest-
    // neighbor order wouldn't change) — but the actual line ENDPOINTS are
    // rebuilt from countryPoints every time it updates, via
    // rebuildConnectionLines() below, so the lines always terminate
    // exactly on the dot.
    const TOUR_START = 'Australia'
    const remaining = new Set(SUPPORTED_COUNTRIES.map((c) => c.name))
    const tourOrder: string[] = [TOUR_START]
    remaining.delete(TOUR_START)
    let current = TOUR_START
    while (remaining.size > 0) {
      let nearest: string | null = null
      let nearestDist = Infinity
      for (const name of remaining) {
        const a = countryPoints.get(current)!
        const b = countryPoints.get(name)!
        const dist = d3.geoDistance(a, b)
        if (dist < nearestDist) {
          nearestDist = dist
          nearest = name
        }
      }
      current = nearest!
      remaining.delete(current)
      tourOrder.push(current)
    }

    let connectionLines: ReturnType<typeof greatCircleLine>[] = []
    function rebuildConnectionLines() {
      connectionLines = tourOrder.map((name, i) => {
        const next = tourOrder[(i + 1) % tourOrder.length]
        return greatCircleLine(countryPoints.get(name)!, countryPoints.get(next)!)
      })
    }
    rebuildConnectionLines()

    function resize() {
      if (!container || !canvas) return
      // Square, sized mostly off viewport width (not container.clientWidth,
      // which would otherwise still be capped by max-w-5xl's ancestor). The
      // 480px ceiling this used to have looked fine on a narrow test
      // viewport but was way too conservative on an actual wide desktop
      // monitor — bumped so it keeps growing on real screens instead of
      // capping out early.
      const side = Math.min(window.innerWidth * 0.55, 620, width)
      containerWidth = side
      containerHeight = side
      // Zoom is fixed, not user-adjustable — this is "max zoom" (the
      // circle fills almost the entire box), with just enough margin left
      // for the outer glow to render without getting clipped by the
      // canvas's own rectangular edge.
      radius = side / 2.08

      const dpr = window.devicePixelRatio || 1
      canvas.width = containerWidth * dpr
      canvas.height = containerHeight * dpr
      canvas.style.width = `${containerWidth}px`
      canvas.style.height = `${containerHeight}px`
      context.scale(dpr, dpr)

      projection.scale(radius).translate([containerWidth / 2, containerHeight / 2])
      render()
    }

    function render() {
      if (!containerWidth || !containerHeight) return
      context.clearRect(0, 0, containerWidth, containerHeight)

      const currentScale = projection.scale()
      const scaleFactor = currentScale / radius

      // Globe body.
      context.beginPath()
      context.arc(containerWidth / 2, containerHeight / 2, currentScale, 0, 2 * Math.PI)
      context.fillStyle = colors.ocean
      context.fill()

      // Subtle teal glow around the outline — a soft 3D-ish rim light
      // rather than a hard ring, so it reads as ambient glow, not a stroke.
      context.save()
      context.shadowColor = colors.outline
      context.shadowBlur = 9 * scaleFactor
      context.strokeStyle = colors.outline
      context.globalAlpha = 0.55
      context.lineWidth = 1.5 * scaleFactor
      context.stroke()
      context.restore()

      // Longitude/latitude grid lines, restricted to the ocean only — never
      // drawn over land. Built by clipping the canvas to "circle minus
      // every land shape": adding the outer globe circle and then every
      // land polygon to one path and clipping with the even-odd rule
      // leaves only the region covered an odd number of times (the circle
      // XOR the land), i.e. exactly the ocean.
      if (landFeatures) {
        context.save()
        context.beginPath()
        context.arc(containerWidth / 2, containerHeight / 2, currentScale, 0, 2 * Math.PI)
        landFeatures.features.forEach((feature) => path(feature))
        context.clip('evenodd')

        context.beginPath()
        path(d3.geoGraticule()())
        context.strokeStyle = colors.land
        context.globalAlpha = 0.35
        context.lineWidth = 1 * scaleFactor
        context.stroke()
        context.globalAlpha = 1
        context.restore()
      }

      // Genuinely see-through: the far hemisphere's continents show as a
      // faint ghost through the near side's empty ocean, like a
      // translucent glass globe — not just an opaque sphere with texture
      // on the visible face. Achieved by temporarily lifting clipAngle to
      // 180° (draws both hemispheres, unclipped) for a low-alpha base
      // layer, then dropping back to 90° for a crisp, full-opacity layer
      // of just the near side on top.
      if (landFeatures) {
        projection.clipAngle(180)
        context.beginPath()
        landFeatures.features.forEach((feature) => path(feature))
        context.strokeStyle = colors.land
        context.globalAlpha = 0.26
        context.lineWidth = 1 * scaleFactor
        context.stroke()
        context.globalAlpha = 1
        projection.clipAngle(90)

        context.beginPath()
        landFeatures.features.forEach((feature) => path(feature))
        context.strokeStyle = colors.land
        context.globalAlpha = 0.55
        context.lineWidth = 1.1 * scaleFactor
        context.stroke()
        context.globalAlpha = 1
      }

      // Experimental: dot texture back on non-highlighted land only
      // (landDots already excludes any of the 8 highlighted countries —
      // see loadWorldData). Front hemisphere only, kept simple since this
      // is just a "see how it looks" trial.
      if (landDots.length) {
        const dotCenter: [number, number] = [-rotation[0], -rotation[1]]
        context.fillStyle = colors.land
        context.globalAlpha = 0.55
        landDots.forEach(([lng, lat]) => {
          if (d3.geoDistance([lng, lat], dotCenter) >= Math.PI / 2) return
          const projected = projection([lng, lat])
          if (!projected) return
          context.beginPath()
          context.arc(projected[0], projected[1], 1 * scaleFactor, 0, 2 * Math.PI)
          context.fill()
        })
        context.globalAlpha = 1
      }

      // Real country-boundary polygons for our 8 supported markets — a
      // filled, glowing green highlight, not just an outline, so they read
      // as clearly "these are the ones we cover" at a glance. Same
      // see-through treatment as the land above: a faint ghost pass with
      // clipAngle 180° first, so a highlighted country still shows as a
      // dim green glow when it's rotated to the far side, then a crisp
      // full-strength pass on top for whichever highlighted countries are
      // actually facing the viewer.
      if (countryFeatures) {
        projection.clipAngle(180)
        context.save()
        context.fillStyle = colors.marker
        context.globalAlpha = 0.1
        countryFeatures.features.forEach((feature) => {
          context.beginPath()
          path(feature)
          context.fill()
        })
        context.strokeStyle = colors.marker
        context.lineWidth = 1 * scaleFactor
        context.globalAlpha = 0.3
        countryFeatures.features.forEach((feature) => {
          context.beginPath()
          path(feature)
          context.stroke()
        })
        context.restore()
        projection.clipAngle(90)

        context.save()
        context.shadowColor = colors.marker
        context.shadowBlur = 6 * scaleFactor
        context.fillStyle = colors.marker
        context.globalAlpha = 0.28
        countryFeatures.features.forEach((feature) => {
          context.beginPath()
          path(feature)
          context.fill()
        })
        context.strokeStyle = colors.marker
        context.lineWidth = 1.4 * scaleFactor
        context.globalAlpha = 0.95
        countryFeatures.features.forEach((feature) => {
          context.beginPath()
          path(feature)
          context.stroke()
        })
        context.restore()
      }

      // Connector lines temporarily switched off to try the see-through
      // dotted look on its own — computation above is untouched, so this
      // is a one-line flip to bring them back.
      if (SHOW_CONNECTOR_LINES) {
        context.save()
        context.shadowColor = colors.marker
        context.shadowBlur = 8 * scaleFactor
        context.strokeStyle = colors.marker
        context.globalAlpha = 0.85
        context.lineWidth = 1.8 * scaleFactor
        context.setLineDash([2.2 * scaleFactor, 3 * scaleFactor])
        connectionLines.forEach((line) => {
          context.beginPath()
          path(line)
          context.stroke()
        })
        context.setLineDash([])
        context.restore()
      }

      // No center marker dot on the highlighted countries anymore — the
      // filled/glowing polygon shape alone is the highlight now.

      // Hover label — bold and prominent, floating just above the cursor,
      // shown only while actively hovering a highlighted country and gone
      // the instant the cursor leaves it.
      if (hoveredCountry && hoverScreenPos) {
        const [mx, my] = hoverScreenPos
        const fontSize = 14 * Math.min(scaleFactor, 1.3)
        context.font = `700 ${fontSize}px var(--font-sans, sans-serif)`
        const textWidth = context.measureText(hoveredCountry).width
        const paddingX = 9 * scaleFactor
        const paddingY = 6 * scaleFactor
        const boxW = textWidth + paddingX * 2
        const boxH = fontSize + paddingY * 2
        const boxX = mx - boxW / 2
        const boxY = my - boxH - 14 * scaleFactor

        context.save()
        context.shadowColor = colors.marker
        context.shadowBlur = 10 * scaleFactor
        context.fillStyle = colors.ocean
        context.strokeStyle = colors.marker
        context.lineWidth = 1.5 * scaleFactor
        context.beginPath()
        context.roundRect(boxX, boxY, boxW, boxH, 5 * scaleFactor)
        context.fill()
        context.stroke()
        context.restore()

        context.fillStyle = colors.marker
        context.textBaseline = 'middle'
        context.textAlign = 'center'
        context.fillText(hoveredCountry, mx, boxY + boxH / 2)
        context.textAlign = 'left'
      }
    }

    async function loadWorldData() {
      try {
        setIsLoading(true)
        // Bundled locally (public/ne-110m-land.json, from Natural Earth's
        // 110m land dataset) rather than fetched from GitHub at runtime —
        // this app's CSP deliberately allows no external connect-src hosts
        // beyond Cloudflare Turnstile (see next.config.mjs), and a same-origin
        // static asset is also faster and doesn't depend on GitHub's uptime.
        const response = await fetch('/ne-110m-land.json')
        if (!response.ok) throw new Error('Failed to load land data')
        landFeatures = await response.json()

        // Real country-boundary polygons for the 8 markets this app
        // covers — pre-filtered to just those 8 features (see
        // public/ne-50m-our-countries.json) so this stays a ~450KB fetch
        // instead of the full ~4.7MB 50m world dataset.
        const countryResponse = await fetch('/ne-50m-our-countries.json')
        if (countryResponse.ok) {
          const raw: d3.ExtendedFeatureCollection = await countryResponse.json()
          // UK, Hong Kong, and Singapore are all MultiPolygons with small
          // outlying islets included — at globe scale those rendered as
          // stray unconnected green flecks with no visible link to the
          // country they belonged to. Keep only the largest ring (the main
          // landmass) per country.
          countryFeatures = {
            ...raw,
            features: raw.features.map((feature) => {
              if (feature.geometry?.type !== 'MultiPolygon') return feature
              const polygons = feature.geometry.coordinates
              let largest = polygons[0]
              let largestArea = 0
              for (const polygon of polygons) {
                const area = d3.geoArea({ type: 'Polygon', coordinates: polygon })
                if (area > largestArea) {
                  largestArea = area
                  largest = polygon
                }
              }
              return { ...feature, geometry: { type: 'Polygon', coordinates: largest } }
            }),
          }

          // Move every dot from its fallback city to the real geometric
          // centroid of that country's (island-filtered) boundary — the
          // actual center of the highlighted shape, not an approximation.
          countryFeatures.features.forEach((feature) => {
            const geoName = feature.properties?.name as string | undefined
            if (!geoName) return
            const displayName = GEO_NAME_TO_DISPLAY_NAME[geoName] ?? geoName
            if (!countryPoints.has(displayName)) return
            countryPoints.set(displayName, d3.geoCentroid(feature))
          })
          rebuildConnectionLines()

          // Experimental dot texture on non-highlighted land, per request
          // ("just want to see how it looks") — every point inside any
          // landmass EXCEPT inside one of the 8 real (non-inflated) country
          // shapes. Computed once; 3.5° spacing keeps the per-frame
          // re-projection cost low.
          if (landFeatures) {
            const step = 3.5
            const dots: [number, number][] = []
            for (let lng = -180; lng <= 180; lng += step) {
              for (let lat = -85; lat <= 85; lat += step) {
                const point: [number, number] = [lng, lat]
                if (!d3.geoContains(landFeatures, point)) continue
                const inHighlighted = countryFeatures!.features.some((f) => d3.geoContains(f, point))
                if (!inHighlighted) dots.push(point)
              }
            }
            landDots = dots
          }

          // Singapore and Hong Kong's true land area is a couple of pixels
          // at this globe's scale — an accurate fill would be invisible.
          // Exaggerate their polygon outward from its own centroid so the
          // SHAPE still reads as a shaded region like the other 6 real
          // country fills (not a dot/blob standing in for them), just at a
          // deliberately oversized, not-to-scale size.
          const INFLATE: Record<string, number> = { Singapore: 7, 'Hong Kong': 6 }
          countryFeatures.features = countryFeatures.features.map((feature) => {
            const geoName = feature.properties?.name as string | undefined
            const displayName = geoName ? (GEO_NAME_TO_DISPLAY_NAME[geoName] ?? geoName) : undefined
            const factor = displayName ? INFLATE[displayName] : undefined
            if (!factor || feature.geometry?.type !== 'Polygon') return feature
            const [cx, cy] = d3.geoCentroid(feature)
            const coordinates = feature.geometry.coordinates.map((ring) =>
              ring.map((position) => [cx + (position[0] - cx) * factor, cy + (position[1] - cy) * factor]),
            )
            return { ...feature, geometry: { type: 'Polygon' as const, coordinates } }
          })
        }

        setIsLoading(false)
        render()
      } catch {
        setError('Failed to load land map data')
        setIsLoading(false)
      }
    }

    // Auto-rotation only runs while the globe is actually on screen — starts
    // as the user scrolls it into view instead of spinning the whole time.
    let autoRotate = false
    const rotationSpeed = 0.42
    const rotationTimer = d3.timer(() => {
      if (!autoRotate) return
      rotation[0] += rotationSpeed
      projection.rotate(rotation)
      render()
    })

    const observer = new IntersectionObserver(([entry]) => {
      autoRotate = entry.isIntersecting
    }, { threshold: 0.15 })
    observer.observe(container)

    let dragging = false
    function pointerDown(x: number, y: number) {
      dragging = true
      const startX = x
      const startY = y
      const startRotation: [number, number] = [...rotation]
      return { startX, startY, startRotation }
    }

    const handleMouseDown = (event: MouseEvent) => {
      const wasAutoRotating = autoRotate
      autoRotate = false
      const { startX, startY, startRotation } = pointerDown(event.clientX, event.clientY)

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const sensitivity = 0.4
        const dx = moveEvent.clientX - startX
        const dy = moveEvent.clientY - startY
        rotation[0] = startRotation[0] + dx * sensitivity
        rotation[1] = Math.max(-90, Math.min(90, startRotation[1] - dy * sensitivity))
        projection.rotate(rotation)
        render()
      }
      const handleMouseUp = () => {
        dragging = false
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        setTimeout(() => {
          autoRotate = wasAutoRotating
        }, 400)
      }
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    // Touch drag-to-rotate (mouse-only in the original component left
    // mobile/tablet with no way to rotate at all).
    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return
      const wasAutoRotating = autoRotate
      autoRotate = false
      const touch = event.touches[0]
      const { startX, startY, startRotation } = pointerDown(touch.clientX, touch.clientY)

      const handleTouchMove = (moveEvent: TouchEvent) => {
        if (moveEvent.touches.length !== 1) return
        const t = moveEvent.touches[0]
        const sensitivity = 0.4
        const dx = t.clientX - startX
        const dy = t.clientY - startY
        rotation[0] = startRotation[0] + dx * sensitivity
        rotation[1] = Math.max(-90, Math.min(90, startRotation[1] - dy * sensitivity))
        projection.rotate(rotation)
        render()
      }
      const handleTouchEnd = () => {
        dragging = false
        canvas.removeEventListener('touchmove', handleTouchMove)
        canvas.removeEventListener('touchend', handleTouchEnd)
        setTimeout(() => {
          autoRotate = wasAutoRotating
        }, 400)
      }
      canvas.addEventListener('touchmove', handleTouchMove, { passive: true })
      canvas.addEventListener('touchend', handleTouchEnd)
    }

    // Hover: shows the country's name prominently near the cursor while
    // over a highlighted country, clears the instant the cursor leaves it
    // or the canvas. Separate from the drag-rotate mousemove above (that
    // one's added to `document` only while a drag is active); this one
    // lives on the canvas itself and is suppressed during an active drag
    // so rotating doesn't also flash hover labels.
    const handleHoverMove = (event: MouseEvent) => {
      if (dragging) return
      const name = countryNameAtScreenPoint(event.offsetX, event.offsetY)
      const changed = name !== hoveredCountry
      hoveredCountry = name
      hoverScreenPos = name ? [event.offsetX, event.offsetY] : null
      canvas.style.cursor = name ? 'pointer' : 'grab'
      if (changed || name) render()
    }
    const handleHoverLeave = () => {
      canvas.style.cursor = 'grab'
      if (!hoveredCountry) return
      hoveredCountry = null
      hoverScreenPos = null
      render()
    }

    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('mousemove', handleHoverMove)
    canvas.addEventListener('mouseleave', handleHoverLeave)
    canvas.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('resize', resize)
    // Deliberately no ResizeObserver here: this container sits inside the
    // hero's GSAP/ScrollTrigger-pinned section, which toggles the pinned
    // element's layout box during scroll — an observer on an element in that
    // subtree re-fires on every one of those pin transitions, and each
    // re-fire calls resize()/render(), which measured as real scroll jank.
    // A plain window-resize listener (actual viewport changes only) doesn't
    // have that feedback path.

    resize()
    loadWorldData()

    return () => {
      rotationTimer.stop()
      observer.disconnect()
      canvas.removeEventListener('mousedown', handleMouseDown)
      canvas.removeEventListener('mousemove', handleHoverMove)
      canvas.removeEventListener('mouseleave', handleHoverLeave)
      canvas.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('resize', resize)
      void dragging
    }
  }, [width, height])

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-card rounded-2xl p-8 ${className}`}>
        <div className="text-center">
          <p className="text-destructive font-semibold mb-2">Error loading globe</p>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    // No width/max-w classes here on purpose — resize() sizes the canvas
    // straight off the viewport (vw/vh), and this wrapper just hugs
    // whatever pixel size that produces (the parent hero section uses
    // `items-center`, which shrink-wraps children instead of stretching
    // them, so this is free to be exactly as big as its canvas without
    // fighting the max-w-5xl ancestor's width cap). No rounded
    // corners/overflow-hidden either: the globe is already a circle, a
    // rounded-rect crop on top of it only clips the poles.
    <div ref={containerRef} className={`relative mx-auto bg-transparent ${className}`}>
      <canvas ref={canvasRef} className="cursor-grab active:cursor-grabbing bg-transparent" />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">Loading globe…</div>
      )}
      {/* Below the globe, centered — not overlaid on the circle itself.
          No pill background/border: that previously sat flush against the
          circle's own bottom edge and read as a square frame around the
          whole globe. Zoom is fixed (no controls), so this is just the one
          remaining interaction. */}
      <div className="mt-3 text-center text-[11px] text-muted-foreground/60">Drag to rotate</div>
    </div>
  )
}
