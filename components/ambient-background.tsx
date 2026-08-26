/**
 * Inverse-vignette background: solid dark center fading out to a vivid teal
 * glow at the edges and corners. Fixed behind page content, purely
 * decorative — no effect on layout or content.
 */
export function AmbientBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-background"
      style={{
        backgroundImage:
          'radial-gradient(circle at 50% 50%, transparent 0%, transparent 8%, color-mix(in oklab, var(--primary) 78%, var(--background)) 80%)',
      }}
    />
  )
}
