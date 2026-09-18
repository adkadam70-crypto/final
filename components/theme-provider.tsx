'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'

// attribute="class" + the .dark block in globals.css is what the whole
// site's theming already keys off (@custom-variant dark (&:is(.dark *))).
// defaultTheme is "dark" (not "system") since the product has been
// dark-only up to now — a first-time visitor shouldn't suddenly see a
// light site because their OS happens to be in light mode; light is
// strictly an opt-in via the toggle from here on.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      {children}
    </NextThemesProvider>
  )
}
