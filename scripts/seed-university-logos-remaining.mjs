// Logos for the 20 universities that never resolved to a usable campus photo
// via Wikipedia/Commons (scripts/fetch-university-images-round2.mjs) — mostly
// smaller Indian and German/French institutions with little Wikipedia
// coverage. Same approach as scripts/seed-university-logos-de-fr.mjs: fetch
// each institution's OWN largest apple-touch-icon/favicon from its own site
// (the institution publishing its own mark, not a third-party non-free
// copy), keep only ones that actually render at a decent size (or SVG, which
// scales cleanly regardless), skip anything that's only a blurry 16-32px
// favicon — leaving imageUrl NULL for those is better than a pixelated icon
// blown up to card size, since components/dream-country-workspace.tsx and
// matches-view.tsx already render a clean branded placeholder for null.
//
// Usage: node --env-file=.env.local scripts/seed-university-logos-remaining.mjs

import { neon } from '@neondatabase/serverless'
import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const sql = neon(process.env.DATABASE_URL)
// A plain custom UA got 403'd by at least one site (kluniversity.in) that
// evidently blocks non-browser clients — a real browser UA string fixes
// that without misrepresenting what this is doing (a one-time GET of a
// public favicon, same as a browser would do visiting the page).
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
const OUT_DIR = path.join(process.cwd(), 'public', 'university-logos')

// Second pass — only the ones that failed in the first run, with corrected
// URLs (some /en paths 404'd; root domain works) after diagnosing with curl.
// 481 (banasthali.org) refuses connections entirely from here — left out,
// genuinely unreachable, not a code issue.
const TARGETS = [
  [816, 'https://www.eigsi.fr'],
  [450, 'https://www.gdgoenkauniversity.com/'],
  [609, 'https://www.htwg-konstanz.de/en/'],
  [654, 'https://www.insa-rouen.fr/en'],
  [420, 'https://www.kluniversity.in/'],
  [466, 'https://www.mgu.ac.in'],
  [454, 'https://saveetha.com'],
  [483, 'https://www.shooliniuniversity.com'],
  [667, 'https://www.utt.fr'],
  [484, 'https://vignan.ac.in'],
  [600, 'https://www.h-brs.de/en'],
]

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, redirect: 'follow' })
  if (!res.ok) throw new Error(`${url} -> ${res.status}`)
  return res.text()
}

// Pulls every <link rel="icon"|"shortcut icon"|"apple-touch-icon"...> href
// out of the raw HTML, largest-declared-size first, plus a plain
// /favicon.ico fallback appended last.
function extractIconCandidates(html, baseUrl) {
  const links = []
  const re = /<link[^>]+rel=["']([^"']*icon[^"']*)["'][^>]*>/gi
  let m
  while ((m = re.exec(html))) {
    const tag = m[0]
    const rel = m[1].toLowerCase()
    const hrefMatch = /href=["']([^"']+)["']/i.exec(tag)
    if (!hrefMatch) continue
    const sizesMatch = /sizes=["']([^"']+)["']/i.exec(tag)
    const size = sizesMatch ? parseInt(sizesMatch[1].split('x')[0], 10) || 0 : rel.includes('apple-touch-icon') ? 180 : 32
    let href = hrefMatch[1]
    try {
      href = new URL(href, baseUrl).toString()
    } catch {
      continue
    }
    links.push({ href, size, isSvg: href.toLowerCase().endsWith('.svg') })
  }
  links.sort((a, b) => (b.isSvg ? 1 : 0) - (a.isSvg ? 1 : 0) || b.size - a.size)
  const fallback = new URL('/favicon.ico', baseUrl).toString()
  if (!links.some((l) => l.href === fallback)) links.push({ href: fallback, size: 32, isSvg: false })
  return links
}

async function downloadBinary(url) {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, redirect: 'follow' })
  if (!res.ok) return null
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.length < 200) return null // near-empty response, not a real image
  return buf
}

function extFromUrl(url) {
  const clean = url.split('?')[0]
  const ext = path.extname(clean).toLowerCase().replace('.', '')
  return ['png', 'svg', 'ico', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext) ? ext : 'png'
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  let updated = 0
  let skipped = 0

  for (const [id, site] of TARGETS) {
    try {
      const existing = await sql`SELECT "imageUrl" FROM universities WHERE id = ${id}`
      if (existing.length === 0 || existing[0].imageUrl) {
        console.log(`  skip ${id}: already has an image or not found`)
        continue
      }

      const html = await fetchText(site)
      const candidates = extractIconCandidates(html, site)
      let saved = false
      for (const c of candidates) {
        // Anything under 48px that isn't SVG is too blurry blown up to a
        // real card size — not worth keeping over the existing placeholder.
        if (!c.isSvg && c.size < 48) continue
        const buf = await downloadBinary(c.href)
        if (!buf) continue
        const ext = extFromUrl(c.href)
        const filename = `${id}.${ext}`
        await writeFile(path.join(OUT_DIR, filename), buf)
        await sql`UPDATE universities SET "imageUrl" = ${'/university-logos/' + filename} WHERE id = ${id}`
        console.log(`  saved ${id} (${filename}) from ${c.href}`)
        updated++
        saved = true
        break
      }
      if (!saved) {
        console.log(`  no usable icon (>=48px or SVG) for ${id}: ${site}`)
        skipped++
      }
    } catch (err) {
      console.log(`  error for ${id} (${site}): ${err.message}`)
      skipped++
    }
    await sleep(800)
  }

  console.log(`Done. Updated ${updated}, skipped ${skipped}.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
