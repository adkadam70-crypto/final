const BLOB_CLIP_PATH =
  'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)'

/**
 * Two blurred gradient blobs, fixed behind page content — same technique as
 * a typical marketing-site hero glow, recolored to the app's green/teal
 * palette instead of purple. Purely decorative: no effect on layout or content.
 */
export function AmbientBackground() {
  return (
    <div aria-hidden="true" className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div
        style={{
          clipPath: BLOB_CLIP_PATH,
          background: 'linear-gradient(to top right, var(--primary), var(--chart-5))',
        }}
        className="absolute left-[calc(50%-11rem)] top-[-10rem] aspect-[1155/678] w-[36.125rem] max-w-none -translate-x-1/2 rotate-[30deg] opacity-20 blur-3xl sm:left-[calc(50%-30rem)] sm:top-[-20rem] sm:w-[72.1875rem]"
      />
      <div
        style={{
          clipPath: BLOB_CLIP_PATH,
          background: 'linear-gradient(to top right, var(--primary), var(--chart-5))',
        }}
        className="absolute left-[calc(50%+3rem)] bottom-[-10rem] aspect-[1155/678] w-[36.125rem] max-w-none -translate-x-1/2 opacity-20 blur-3xl sm:bottom-[-20rem] sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
      />
    </div>
  )
}
