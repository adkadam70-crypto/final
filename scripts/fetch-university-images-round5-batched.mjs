// Same Wikipedia/Commons campus-photo pipeline as
// fetch-university-images-round4-remaining.mjs, rewritten to be gentle on
// Neon's free-tier network-transfer allowance: the old version issued 2
// individual HTTP requests to the DB per row (implicit + update). This
// version buffers found URLs in memory and flushes them in ONE batched
// multi-row UPDATE every BATCH_SIZE rows, cutting DB round-trips by ~25x.
// It also does exactly ONE read query (at the very start, to get the list)
// and no DB reads at all during the run — every external API call below
// this point is to Wikipedia/Commons, not Neon.
//
// Usage: node --env-file=.env.local scripts/fetch-university-images-round5-batched.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const USER_AGENT = 'ShortlistedApp/1.0 (educational college-admissions project; contact via GitHub adkadam70-crypto/final)'
const WIKI_API = 'https://en.wikipedia.org/w/api.php'
const COMMONS_API = 'https://commons.wikimedia.org/w/api.php'
const BATCH_SIZE = 25

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
  const data = await apiFetch(WIKI_API, { action: 'query', list: 'search', srsearch: universityName, srlimit: '1' })
  return data.query?.search?.[0]?.title ?? null
}

async function imagesForTitle(title) {
  const data = await apiFetch(WIKI_API, { action: 'query', titles: title, prop: 'images', imlimit: '500', redirects: '1' })
  const page = Object.values(data.query?.pages ?? {})[0]
  if (!page || page.missing !== undefined || !page.images) return []
  return page.images
}

async function thumbUrlForFile(filename, base) {
  const data = await apiFetch(base, { action: 'query', titles: `File:${filename}`, prop: 'imageinfo', iiprop: 'url', iiurlwidth: '640' })
  const page = Object.values(data.query?.pages ?? {})[0]
  return page?.imageinfo?.[0]?.thumburl ?? null
}

async function searchCommonsDirect(universityName) {
  const data = await apiFetch(COMMONS_API, { action: 'query', list: 'search', srsearch: `${universityName} campus`, srnamespace: '6', srlimit: '20' })
  const titles = (data.query?.search ?? []).map((r) => r.title.replace(/^File:/, ''))
  const candidates = titles.filter((n) => !/\.svg$/i.test(n) && !EXCLUDE.test(n))
  const withHint = candidates.filter((n) => CAMPUS_HINTS.test(n))
  return withHint[0] ?? candidates[0] ?? null
}

async function findImageUrl(universityName) {
  const resolvedTitle = await resolveWikipediaTitle(universityName)
  await sleep(1200)
  if (resolvedTitle) {
    const images = await imagesForTitle(resolvedTitle)
    const filename = pickBestFilename(images)
    if (filename) {
      await sleep(1200)
      const url = await thumbUrlForFile(filename, WIKI_API)
      if (url) return url
      await sleep(1200)
    }
  }
  const commonsFile = await searchCommonsDirect(universityName)
  if (commonsFile) {
    await sleep(1200)
    return thumbUrlForFile(commonsFile, COMMONS_API)
  }
  return null
}

// One multi-row UPDATE for the whole pending batch instead of one query per
// row — this is the entire point of the rewrite.
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

async function main() {
  // The only DB read in the whole script.
  const rows = await sql`SELECT id, name FROM universities WHERE "imageUrl" IS NULL ORDER BY id`
  console.log(`${rows.length} universities need an image`)

  let updated = 0
  let notFound = 0
  const pending = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    try {
      const url = await findImageUrl(row.name)
      if (url) {
        pending.push({ id: row.id, url })
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

    if (pending.length >= BATCH_SIZE) {
      await flushBatch(pending)
    }
    if ((i + 1) % 25 === 0) console.log(`...${i + 1}/${rows.length} (updated ${updated}, no match ${notFound})`)
    await sleep(1200)
  }

  await flushBatch(pending)
  console.log(`Done. Updated ${updated}, still no match for ${notFound}.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
