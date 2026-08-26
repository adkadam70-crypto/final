/**
 * Teal glow contained to the left edge, fading to near-black across most of
 * the viewport — a restrained accent rather than a full-screen wash, so it
 * doesn't compete with card content. Fixed behind page content, purely
 * decorative — no effect on layout or content.
 */
export function AmbientBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-background"
      style={{
        backgroundImage:
          'radial-gradient(ellipse 60% 85% at 6% 45%, color-mix(in oklab, var(--primary) 55%, var(--background)) 0%, var(--background) 68%)',
      }}
    />
  )
}
