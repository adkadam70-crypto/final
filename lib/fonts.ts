import localFont from 'next/font/local'

// Used only for the big white display lines on the landing page (intro,
// mid-scroll headline, closing line) — not the "Shortlisted" wordmark, which
// stays in the app's default font.
export const marigold = localFont({
  src: '../app/fonts/Marigold-Regular.woff2',
  variable: '--font-marigold',
  display: 'swap',
})
