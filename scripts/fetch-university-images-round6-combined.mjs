// Combines the two prior passes into one, per university, instead of two
// separate full sweeps: try Wikipedia/Commons (real campus photo) first,
// and if that finds nothing, immediately fall back to the university's own
// website favicon/logo (via its "link" column) before moving to the next
// row — instead of running a whole second pass later just for the leftovers.
//
// Same DB-traffic discipline as round5: local logo file writes are
// filesystem only (no Neon cost), and DB writes are batched in one
// multi-row UPDATE every BATCH_SIZE finds, not per-row.
//
// Usage: node --env-file=.env.local scripts/fetch-university-images-round6-combined.mjs

import { neon } from '@neondatabase/serverless'
import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const sql = neon(process.env.DATABASE_URL)

const WIKI_UA = 'ShortlistedApp/1.0 (educational college-admissions project; contact via GitHub adkadam70-crypto/final)'
const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
const WIKI_API = 'https://en.wikipedia.org/w/api.php'
const COMMONS_API = 'https://commons.wikimedia.org/w/api.php'
const OUT_DIR = path.join(process.cwd(), 'public', 'university-logos')
const BATCH_SIZE = 25

const EXCLUDE = /seal|logo|crest|coat.?of.?arms|shield|flag|wordmark|emblem|wiki(pedia|quote|source|commons|data)|icon|symbol|ambox|ooui|official.?portrait|ammox|map\b|location/i
const CAMPUS_HINTS = /campus|aerial|hall|building|block|center|centre|auditorium|library|tower|quad(rangle)?|gate|arch|chapel|stadium|memorial|plaza|yard|square|dome|corridor|entrance|court|green\b|union\b|museum|observatory|laboratory|institute\b/i

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

// ---------- Wikipedia/Commons (source 1) ----------

async function wikiApiFetch(base, params, attempt = 1) {
  const url = `${base}?${new URLSearchParams({ ...params, format: 'json' })}`
  const res = await fetch(url, { headers: { 'User-Agent': WIKI_UA } })
  if (res.status === 429 && attempt <= 4) {
    const retryAfter = Number(res.headers.get('retry-after'))
    const wait = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : attempt * 2000
    console.log(`    429, retrying in ${wait}ms (attempt ${attempt})`)
    await sleep(wait)
    return wikiApiFetch(base, params, attempt + 1)
  }
  if (!res.ok) throw new Error(`${base} ${res.status}`)
  return res.json()
}

function pickBestFilename(images) {
  const names = images.map((i) => i.title.replace(/^File:/, ''))
  const candidates = names.filter((n) => !/\.svg$/i.test(n) && !EXCLUDE.test(n))
  const withHint = candidates.filter((n) => CAMPUS_HINTS.test(n))
  return withHint[0] ?? candidates[0] ?? null
}

async function findWikipediaPhoto(universityName) {
  const search = await wikiApiFetch(WIKI_API, { action: 'query', list: 'search', srsearch: universityName, srlimit: '1' })
  const resolvedTitle = search.query?.search?.[0]?.title ?? null
  await sleep(700)

  if (resolvedTitle) {
    const data = await wikiApiFetch(WIKI_API, { action: 'query', titles: resolvedTitle, prop: 'images', imlimit: '500', redirects: '1' })
    const page = Object.values(data.query?.pages ?? {})[0]
    const images = page && page.missing === undefined ? (page.images ?? []) : []
    const filename = pickBestFilename(images)
    if (filename) {
      await sleep(700)
      const info = await wikiApiFetch(WIKI_API, { action: 'query', titles: `File:${filename}`, prop: 'imageinfo', iiprop: 'url', iiurlwidth: '640' })
      const infoPage = Object.values(info.query?.pages ?? {})[0]
      const thumb = infoPage?.imageinfo?.[0]?.thumburl
      if (thumb) return { kind: 'photo', url: thumb }
      await sleep(700)
    }
  }

  const commons = await wikiApiFetch(COMMONS_API, { action: 'query', list: 'search', srsearch: `${universityName} campus`, srnamespace: '6', srlimit: '20' })
  const titles = (commons.query?.search ?? []).map((r) => r.title.replace(/^File:/, ''))
  const candidates = titles.filter((n) => !/\.svg$/i.test(n) && !EXCLUDE.test(n))
  const commonsFile = candidates.filter((n) => CAMPUS_HINTS.test(n))[0] ?? candidates[0] ?? null
  if (commonsFile) {
    await sleep(700)
    const info = await wikiApiFetch(COMMONS_API, { action: 'query', titles: `File:${commonsFile}`, prop: 'imageinfo', iiprop: 'url', iiurlwidth: '640' })
    const infoPage = Object.values(info.query?.pages ?? {})[0]
    const thumb = infoPage?.imageinfo?.[0]?.thumburl
    if (thumb) return { kind: 'photo', url: thumb }
  }
  return null
}

// ---------- university's own website favicon (source 2, fallback) ----------

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': BROWSER_UA }, redirect: 'follow', signal: AbortSignal.timeout(12000) })
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
  const res = await fetch(url, { headers: { 'User-Agent': BROWSER_UA }, redirect: 'follow', signal: AbortSignal.timeout(12000) })
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

async function findWebsiteLogo(id, link) {
  if (!link) return null
  const html = await fetchText(link)
  const candidates = extractIconCandidates(html, link)
  for (const c of candidates) {
    if (!c.isSvg && c.size < 48) continue
    const buf = await downloadBinary(c.href)
    if (!buf) continue
    const ext = extFromUrl(c.href)
    const filename = `${id}.${ext}`
    await writeFile(path.join(OUT_DIR, filename), buf)
    return { kind: 'logo', url: '/university-logos/' + filename }
  }
  return null
}

// ---------- source 3: Google's favicon service (domain-based, no scraping) ----------
// Covers sites that block non-browser HTML fetches or have no <link
// rel=icon> at all but Google has still indexed a favicon for. Doesn't
// touch Wikipedia at all, so it never contends with that rate limit.
// (Clearbit's old logo.clearbit.com API — tried first — was fully shut
// down in Dec 2025, confirmed dead via a live fetch before using it here.)
function domainFromLink(link) {
  if (!link) return null
  try {
    return new URL(link).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

async function findGoogleFavicon(id, link) {
  const domain = domainFromLink(link)
  if (!domain) return null
  const url = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
  const buf = await downloadBinary(url)
  // Google returns a generic 16x16 globe placeholder (a few hundred bytes)
  // for domains it has no real favicon for — too small/blurry to be worth
  // keeping over the plain placeholder icon.
  if (!buf || buf.length < 600) return null
  const filename = `${id}.png`
  await writeFile(path.join(OUT_DIR, filename), buf)
  return { kind: 'logo', url: '/university-logos/' + filename }
}

// ---------- source 4: DuckDuckGo icon service (domain-based) ----------
// Same idea as Google's favicon service — a different index, so it
// sometimes has a favicon Google doesn't (or vice versa). Also entirely
// independent of Wikipedia's rate limit. Verified alive with a live fetch
// (200, image/png) before wiring in — logo.dev requires an API key (401)
// and was skipped; Wikidata shares Wikimedia's infrastructure/rate limit
// with Wikipedia itself, so it wouldn't actually reduce contention.
async function findDuckDuckGoFavicon(id, link) {
  const domain = domainFromLink(link)
  if (!domain) return null
  const url = `https://icons.duckduckgo.com/ip3/${domain}.ico`
  const buf = await downloadBinary(url)
  if (!buf || buf.length < 600) return null
  const filename = `${id}.png`
  await writeFile(path.join(OUT_DIR, filename), buf)
  return { kind: 'logo', url: '/university-logos/' + filename }
}

// ---------- batched DB write ----------

async function flushBatch(pending) {
  if (pending.length === 0) return
  const ids = pending.map((p) => p.id)
  const urls = pending.map((p) => p.url)
  await sql`
    UPDATE universities AS u
    SET "imageUrl" = data.url
    FROM (SELECT unnest(${ids}::int[]) AS id, unnest(${urls}::text[]) AS url) AS data
    WHERE u.id = data.id AND u."imageUrl" IS NULL
  `
  console.log(`  >>> flushed batch of ${pending.length} to DB`)
  pending.length = 0
}

const CONCURRENCY = 2

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  const rows = await sql`SELECT id, name, link FROM universities WHERE "imageUrl" IS NULL ORDER BY id`
  console.log(`${rows.length} universities need an image, concurrency=${CONCURRENCY}`)

  let photoCount = 0
  let logoCount = 0
  let notFound = 0
  let processed = 0
  const pending = []
  // Serializes flush calls so two concurrent workers can't race each other
  // into overlapping UPDATEs — each flush waits for the previous one.
  let flushChain = Promise.resolve()
  function queueFlushIfFull() {
    if (pending.length >= BATCH_SIZE) {
      const batch = pending.splice(0, pending.length)
      flushChain = flushChain.then(() => flushBatch(batch))
    }
  }

  let nextIndex = 0
  async function worker() {
    while (true) {
      const i = nextIndex++
      if (i >= rows.length) return
      const row = rows[i]
      try {
        // Race four independent sources at once per university — only the
        // Wikipedia one has a real rate limit, so the other three usually
        // resolve fast even while a Wikipedia call is waiting out a 429.
        const [photoResult, logoResult, googleResult, ddgResult] = await Promise.allSettled([
          findWikipediaPhoto(row.name),
          findWebsiteLogo(row.id, row.link),
          findGoogleFavicon(row.id, row.link),
          findDuckDuckGoFavicon(row.id, row.link),
        ])
        const photo = photoResult.status === 'fulfilled' ? photoResult.value : null
        const logo = (logoResult.status === 'fulfilled' ? logoResult.value : null)
          ?? (googleResult.status === 'fulfilled' ? googleResult.value : null)
          ?? (ddgResult.status === 'fulfilled' ? ddgResult.value : null)

        if (photo) {
          pending.push({ id: row.id, url: photo.url })
          photoCount++
          console.log(`  photo: ${row.name}`)
        } else if (logo) {
          pending.push({ id: row.id, url: logo.url })
          logoCount++
          console.log(`  logo: ${row.name}`)
        } else {
          notFound++
          console.log(`  no match: ${row.name}`)
        }
      } catch (err) {
        notFound++
        console.log(`  error for ${row.name}: ${err.message}`)
      }

      queueFlushIfFull()
      processed++
      if (processed % 25 === 0) console.log(`...${processed}/${rows.length} (photos ${photoCount}, logos ${logoCount}, no match ${notFound})`)
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()))
  await flushChain
  await flushBatch(pending)
  console.log(`Done. Photos: ${photoCount}, logos: ${logoCount}, no match: ${notFound}.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
