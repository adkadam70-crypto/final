import { headers } from 'next/headers'
import { createHash } from 'node:crypto'

// Vercel sets x-forwarded-for on every request; the first entry is the
// original client IP (later entries are proxies in the chain).
export function ipFromHeaders(h: Headers): string {
  const forwarded = h.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return h.get('x-real-ip') ?? 'unknown'
}

// Device signal built from every browser-identifying header available
// without client-side JS: full user-agent, accept-language, and the
// Client Hints Chromium sends (sec-ch-ua / platform / mobile) when present.
// More headers = more entropy = fewer accidental collisions between two
// people's actual different devices — still spoofable by someone who
// deliberately edits these, but that's a meaningfully higher bar than the
// casual "sign up again with a new email" abuse this exists to slow down.
export function deviceHashFromHeaders(h: Headers): string {
  const raw = [
    h.get('user-agent') ?? '',
    h.get('accept-language') ?? '',
    h.get('sec-ch-ua') ?? '',
    h.get('sec-ch-ua-platform') ?? '',
    h.get('sec-ch-ua-mobile') ?? '',
    h.get('accept-encoding') ?? '',
  ].join('|')
  return createHash('sha256').update(raw).digest('hex')
}

// Convenience wrapper for use inside Server Actions (which don't get a
// Headers object handed to them the way Better Auth's hooks do).
export async function getClientIp(): Promise<string> {
  return ipFromHeaders(await headers())
}
