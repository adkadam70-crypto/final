// Second pass for universities the round-1 script (fetch-university-images.mjs)
// couldn't find an image for. Two extra strategies on top of the original
// exact-title lookup:
//   1. Resolve the university name through Wikipedia's search API first
//      (catches cases where the catalog name doesn't exactly match the
//      article title — round 1 only tried an exact/redirect match).
//   2. If the resolved article still has no usable image, search Wikimedia
//      Commons directly for a matching photo (Commons often has campus
//      photos even when the Wikipedia article itself embeds none).
//
// Same filtering rules as round 1 (see fetch-university-images.mjs for the
// EXCLUDE/CAMPUS_HINTS rationale) and same re-runnable, rate-limited shape.
//
// Usage: node --env-file=.env.local scripts/fetch-university-images-round2.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const USER_AGENT = 'ShortlistedApp/1.0 (educational college-admissions project; contact via GitHub adkadam70-crypto/final)'
const WIKI_API = 'https://en.wikipedia.org/w/api.php'
const COMMONS_API = 'https://commons.wikimedia.org/w/api.php'

const EXCLUDE = /seal|logo|crest|coat.?of.?arms|shield|flag|wordmark|emblem|wiki(pedia|quote|source|commons|data)|icon|symbol|ambox|ooui|official.?portrait|ammox|map\b|location/i
const CAMPUS_HINTS = /campus|aerial|hall|building|block|center|centre|auditorium|library|tower|quad(rangle)?|gate|arch|chapel|stadium|memorial|plaza|yard|square|dome|corridor|entrance|court|green\b|union\b|museum|observatory|laboratory|institute\b/i

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function apiFetch(base, params, attempt = 1) {
  const url = `${base}?${new URLSearchParams({ ...params, format: 'json' })}`
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  if (res.status === 429 && attempt <= 5) {
    const retryAfter = Number(res.headers.get('retry-after'))
    const wait = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : attempt * 2000
    console.log(`  429, retrying in ${wait}ms (attempt ${attempt})`)
    await sleep(wait)
    return apiFetch(base, params, attempt + 1)
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

async function resolveWikipediaTitle(universityName) {
  const data = await apiFetch(WIKI_API, {
    action: 'query',
    list: 'search',
    srsearch: universityName,
    srlimit: '1',
  })
  return data.query?.search?.[0]?.title ?? null
}

async function imagesForTitle(title) {
  const data = await apiFetch(WIKI_API, {
    action: 'query',
    titles: title,
    prop: 'images',
    imlimit: '500',
    redirects: '1',
  })
  const page = Object.values(data.query?.pages ?? {})[0]
  if (!page || page.missing !== undefined || !page.images) return []
  return page.images
}

async function thumbUrlForFile(filename, base) {
  const data = await apiFetch(base, {
    action: 'query',
    titles: `File:${filename}`,
    prop: 'imageinfo',
    iiprop: 'url',
    iiurlwidth: '640',
  })
  const page = Object.values(data.query?.pages ?? {})[0]
  return page?.imageinfo?.[0]?.thumburl ?? null
}

async function searchCommonsDirect(universityName) {
  const data = await apiFetch(COMMONS_API, {
    action: 'query',
    list: 'search',
    srsearch: `${universityName} campus`,
    srnamespace: '6', // File namespace
    srlimit: '20',
  })
  const titles = (data.query?.search ?? []).map((r) => r.title.replace(/^File:/, ''))
  const candidates = titles.filter((n) => !/\.svg$/i.test(n) && !EXCLUDE.test(n))
  const withHint = candidates.filter((n) => CAMPUS_HINTS.test(n))
  return withHint[0] ?? candidates[0] ?? null
}

async function findImageUrl(universityName) {
  // Strategy 1: resolve the real article title via search, then look at its images.
  const resolvedTitle = await resolveWikipediaTitle(universityName)
  await sleep(3000)
  if (resolvedTitle) {
    const images = await imagesForTitle(resolvedTitle)
    const filename = pickBestFilename(images)
    if (filename) {
      await sleep(3000)
      const url = await thumbUrlForFile(filename, WIKI_API)
      if (url) return url
      await sleep(3000)
    }
  }

  // Strategy 2: search Wikimedia Commons directly for a campus photo.
  const commonsFile = await searchCommonsDirect(universityName)
  if (commonsFile) {
    await sleep(3000)
    return thumbUrlForFile(commonsFile, COMMONS_API)
  }

  return null
}

async function main() {
  const rows = await sql`SELECT id, name FROM universities WHERE "imageUrl" IS NULL ORDER BY id`
  console.log(`${rows.length} universities still need an image (round 2)`)

  let updated = 0
  let notFound = 0

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    try {
      const url = await findImageUrl(row.name)
      if (url) {
        await sql`UPDATE universities SET "imageUrl" = ${url} WHERE id = ${row.id}`
        updated++
        console.log(`  found: ${row.name}`)
      } else {
        notFound++
        console.log(`  still no candidate: ${row.name}`)
      }
    } catch (err) {
      notFound++
      console.log(`  error fetching ${row.name}: ${err.message}`)
    }
    if ((i + 1) % 10 === 0) console.log(`...${i + 1}/${rows.length} (updated ${updated}, no match ${notFound})`)
    await sleep(3000)
  }

  console.log(`Round 2 done. Updated ${updated}, still no match for ${notFound}.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
