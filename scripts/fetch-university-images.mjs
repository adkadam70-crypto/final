// One-time (re-runnable) backfill: populate universities.imageUrl with a
// real campus photo sourced from Wikimedia Commons via each university's
// Wikipedia article.
//
// Why not the simpler `pageimages` API: that returns whatever image leads
// the article's infobox, which for most universities is the institutional
// seal/logo/coat-of-arms, not a campus photo — the opposite of what we
// want. So instead we pull the full list of images used in the article and
// pick the first one that looks like an actual place (filters out seals,
// logos, Wikipedia UI icons, and SVGs entirely — real photography on
// Commons is essentially always raster; SVGs are diagrams/icons/crests).
//
// Wikipedia's `prop=images` shares its `imlimit` across an entire batched
// multi-title request rather than applying it per-title, so titles later
// in a batch silently come back empty — confirmed empirically. Queried one
// title at a time instead (with a small delay, per API etiquette); only
// the final URL-resolution step is batched, since resolving N already-known
// filenames doesn't have the same growth problem.
//
// Usage: node --env-file=.env.local scripts/fetch-university-images.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const USER_AGENT = 'ShortlistedApp/1.0 (educational college-admissions project; contact via GitHub adkadam70-crypto/final)'
const API = 'https://en.wikipedia.org/w/api.php'

const EXCLUDE = /seal|logo|crest|coat.?of.?arms|shield|flag|wordmark|emblem|wiki(pedia|quote|source|commons|data)|icon|symbol|ambox|ooui|official.?portrait|ammox/i
const CAMPUS_HINTS = /campus|aerial|hall|building|center|centre|auditorium|library|tower|quad(rangle)?|gate|arch|chapel|stadium|memorial|plaza|yard|square|dome|corridor|entrance|court|green\b|union\b|museum|observatory|laboratory|institute\b/i

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function wikiFetch(params, attempt = 1) {
  const url = `${API}?${new URLSearchParams({ ...params, format: 'json' })}`
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  if (res.status === 429 && attempt <= 5) {
    const retryAfter = Number(res.headers.get('retry-after'))
    const wait = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : attempt * 2000
    console.log(`  429, retrying in ${wait}ms (attempt ${attempt})`)
    await sleep(wait)
    return wikiFetch(params, attempt + 1)
  }
  if (!res.ok) throw new Error(`Wikipedia API ${res.status} for ${url}`)
  return res.json()
}

function pickBestFilename(images) {
  const names = images.map((i) => i.title.replace(/^File:/, ''))
  const candidates = names.filter((n) => !/\.svg$/i.test(n) && !EXCLUDE.test(n))
  const withHint = candidates.filter((n) => CAMPUS_HINTS.test(n))
  return withHint[0] ?? candidates[0] ?? null
}

async function findImageFilename(universityName) {
  const data = await wikiFetch({
    action: 'query',
    titles: universityName,
    prop: 'images',
    imlimit: '500',
    redirects: '1',
  })
  const pages = Object.values(data.query?.pages ?? {})
  const page = pages[0]
  if (!page || page.missing !== undefined || !page.images) return null
  return pickBestFilename(page.images)
}

async function resolveFilenamesToUrls(filenames) {
  if (filenames.length === 0) return new Map()
  const data = await wikiFetch({
    action: 'query',
    titles: filenames.map((f) => `File:${f}`).join('|'),
    prop: 'imageinfo',
    iiprop: 'url',
    iiurlwidth: '640',
  })
  const pages = Object.values(data.query?.pages ?? {})
  const map = new Map()
  for (const p of pages) {
    const info = p.imageinfo?.[0]
    if (info?.thumburl) map.set(p.title.replace(/^File:/, ''), info.thumburl)
  }
  return map
}

async function main() {
  const rows = await sql`SELECT id, name, "imageUrl" FROM universities ORDER BY id`
  console.log(`${rows.length} universities in catalog`)

  const chosenFilenameById = new Map()
  let notFound = 0

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    try {
      const filename = await findImageFilename(row.name)
      if (filename) {
        chosenFilenameById.set(row.id, filename)
      } else {
        notFound++
        console.log(`  no candidate image: ${row.name}`)
      }
    } catch (err) {
      notFound++
      console.log(`  error fetching ${row.name}: ${err.message}`)
    }
    if ((i + 1) % 25 === 0) console.log(`...${i + 1}/${rows.length}`)
    await sleep(1500)
  }

  console.log(`Resolved candidate filenames for ${chosenFilenameById.size}/${rows.length} (${notFound} with no match)`)

  // Batch-resolve actual CDN URLs, 50 filenames per request.
  const allFilenames = [...new Set(chosenFilenameById.values())]
  const urlMap = new Map()
  for (let i = 0; i < allFilenames.length; i += 50) {
    const batch = allFilenames.slice(i, i + 50)
    const resolved = await resolveFilenamesToUrls(batch)
    for (const [k, v] of resolved) urlMap.set(k, v)
    await sleep(1500)
  }

  let updated = 0
  for (const [id, filename] of chosenFilenameById) {
    const url = urlMap.get(filename)
    if (!url) continue
    await sql`UPDATE universities SET "imageUrl" = ${url} WHERE id = ${id}`
    updated++
  }

  console.log(`Updated imageUrl for ${updated} universities`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
