// Deliberately no 'unsafe-eval'. The only external host anywhere in this
// policy is Cloudflare Turnstile's own domain, added per Cloudflare's
// documented CSP requirements (https://developers.cloudflare.com/turnstile/reference/content-security-policy/)
// for the sign-up/sign-in bot-protection widget — script-src and frame-src
// need it to load the widget and render its challenge iframe, connect-src
// for the widget's own verification requests. 'unsafe-inline' on script-src
// is the one loosening beyond that: Next.js's App Router hydration
// bootstrap needs it without a nonce-based setup (a bigger, separate change
// involving per-request middleware). style-src needs 'unsafe-inline' for
// Tailwind's injected critical CSS.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://upload.wikimedia.org",
  "font-src 'self' data:",
  "connect-src 'self' https://challenges.cloudflare.com",
  "frame-src https://challenges.cloudflare.com",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join('; ')

const SECURITY_HEADERS = [
  { key: 'Content-Security-Policy', value: CSP },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: SECURITY_HEADERS,
      },
    ]
  },
}

export default nextConfig
