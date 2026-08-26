/**
 * Inverse-vignette background: solid dark center fading out to a vivid teal
 * glow at the edges and corners. Fixed behind page content, purely
 * decorative — no effect on layout or content.
 */
export function AmbientBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-background"
      style={{
        backgroundImage:
          'radial-gradient(ellipse 75% 75% at 50% 50%, transparent 15%, color-mix(in oklab, var(--primary) 85%, var(--background)) 100%)',
      }}
    />
  )
}
