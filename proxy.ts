import { NextResponse } from 'next/server'

// Temporary site closure. Flip to false (and push) to reopen. Answers every
// request — pages, auth API, server actions — with a static 503 before any
// route renders or touches the DB. 503 + Retry-After tells search engines
// the closure is temporary so rankings aren't dropped.
const SITE_CLOSED = true

const CLOSED_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Shortlisted — temporarily closed</title>
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0b0b0f;color:#f4f4f5;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;text-align:center;padding:24px}
  main{max-width:28rem}
  h1{font-size:1.5rem;margin:0 0 .75rem}
  p{margin:0;color:#a1a1aa;line-height:1.6;font-size:.95rem}
</style>
</head>
<body>
<main>
  <h1>Shortlisted is temporarily closed</h1>
  <p>We're doing some maintenance and will be back soon. Thanks for your patience.</p>
</main>
</body>
</html>`

export function proxy() {
  if (!SITE_CLOSED) return NextResponse.next()
  return new NextResponse(CLOSED_HTML, {
    status: 503,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Retry-After': '3600',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex',
    },
  })
}

export const config = {
  matcher: '/((?!_next/static|_next/image).*)',
}
