// Generalizes scripts/seed-university-logos-remaining.mjs (which used a
// manually curated list of 11 sites) into an automated pass over every
// university still missing an image, using the "link" column (the
// university's own website, already in the DB for every row) instead of a
// hand-picked TARGETS list. Fetches the site's own largest declared
// apple-touch-icon/favicon — the institution's own published mark, not a
// third-party copy — skips anything under 48px (non-SVG) as too blurry to
// blow up to card size, and leaves imageUrl NULL rather than save a
// pixelated icon (components/university-card.tsx already renders a clean
// placeholder for null).
//
// Meant to run as a second pass alongside/after
// fetch-university-images-round4-remaining.mjs (the Wikipedia/Commons
// campus-photo pass) — real campus photos are still preferred when
// available, this just covers schools with no Wikipedia coverage at all.
// Safe to re-run: only ever touches rows where "imageUrl" IS NULL, and
// re-checks right before writing.
//
// Usage: node --env-file=.env.local scripts/seed-university-logos-round2-from-link.mjs

import { neon } from '@neondatabase/serverless'
import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const sql = neon(process.env.DATABASE_URL)
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
const OUT_DIR = path.join(process.cwd(), 'public', 'university-logos')

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, redirect: 'follow', signal: AbortSignal.timeout(15000) })
  if (!res.ok) throw new Error(`${url} -> ${res.status}`)
  return res.text()
}

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
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, redirect: 'follow', signal: AbortSignal.timeout(15000) })
  if (!res.ok) return null
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.length < 200) return null
  return buf
}

function extFromUrl(url) {
  const clean = url.split('?')[0]
  const ext = path.extname(clean).toLowerCase().replace('.', '')
  return ['png', 'svg', 'ico', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext) ? ext : 'png'
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  const rows = await sql`SELECT id, name, link FROM universities WHERE "imageUrl" IS NULL ORDER BY id`
  console.log(`${rows.length} universities still missing an image`)

  let updated = 0
  let skipped = 0

  for (let i = 0; i < rows.length; i++) {
    const { id, name, link } = rows[i]
    try {
      if (!link) {
        console.log(`  skip ${name}: no link on file`)
        skipped++
        continue
      }
      const stillMissing = await sql`SELECT "imageUrl" FROM universities WHERE id = ${id}`
      if (stillMissing[0]?.imageUrl) {
        console.log(`  skip ${name}: already got an image from the other pass`)
        continue
      }

      const html = await fetchText(link)
      const candidates = extractIconCandidates(html, link)
      let saved = false
      for (const c of candidates) {
        if (!c.isSvg && c.size < 48) continue
        const buf = await downloadBinary(c.href)
        if (!buf) continue
        const ext = extFromUrl(c.href)
        const filename = `${id}.${ext}`
        await writeFile(path.join(OUT_DIR, filename), buf)
        await sql`UPDATE universities SET "imageUrl" = ${'/university-logos/' + filename} WHERE id = ${id} AND "imageUrl" IS NULL`
        console.log(`  saved: ${name} (${filename}) from ${c.href}`)
        updated++
        saved = true
        break
      }
      if (!saved) {
        console.log(`  no usable icon for ${name}: ${link}`)
        skipped++
      }
    } catch (err) {
      console.log(`  error for ${name} (${link}): ${err.message}`)
      skipped++
    }
    if ((i + 1) % 50 === 0) console.log(`...${i + 1}/${rows.length} (updated ${updated}, skipped ${skipped})`)
    await sleep(500)
  }

  console.log(`Done. Updated ${updated}, skipped ${skipped}.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
