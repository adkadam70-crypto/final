import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

const SITE_URL = 'https://auraadmit-smoky.vercel.app'
const SITE_NAME = 'Shortlisted — College Predictor'
const SITE_DESCRIPTION =
  'College admission predictor for the US, UK, Australia, Singapore, Hong Kong, India, Germany, and France. Match your profile against real admissions data and get acceptance-probability estimates.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  generator: 'v0.app',
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: 'Shortlisted',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  icons: {
    // The bare diamond mark, square canvas but transparent background — the
    // icon-dark/light-32x32.png files below have their own rounded dark
    // badge baked in, which is right for the iOS home-screen icon but reads
    // as an unwanted box around the mark in a browser tab.
    // Google's own favicon-in-search-results guidelines want at least
    // 48x48 (32x32 only meets their bare 8x8 minimum) — added alongside
    // the existing 32x32 rather than replacing it, so browsers/OSes that
    // specifically want the smaller tab-icon size still get it.
    icon: [
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48.png', sizes: '48x48', type: 'image/png' },
    ],
    // Explicit rel="shortcut icon" — Safari's habit of silently fetching
    // /favicon.ico from the site root with no <link> tag at all turned out
    // not to be reliable (still showed a letter-avatar fallback for some
    // users even though the file itself was correct). Declaring it
    // directly removes the guesswork. public/favicon.ico is the opaque
    // badge version (see its own history) — Safari's favicon heuristic
    // treats a mostly-transparent icon as invalid, which is why this
    // can't just point at the same transparent diamond as `icon` above.
    shortcut: '/favicon.ico',
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark light',
  themeColor: '#0a0a0b',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`dark bg-background ${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased">
        <ThemeProvider>
          {children}
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </ThemeProvider>
      </body>
    </html>
  )
}
