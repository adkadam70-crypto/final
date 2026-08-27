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
const CAMPUS_HINTS = /campus|aerial|hall|building|block|center|centre|auditorium|library|tower|quad(rangle)?|gate|arch|chapel|stadium|memorial|plaza|yard|square|dome|corridor|entrance|court|green\b|union\b|museum|observatory|laboratory|institute\b/i

// A handful of catalog names are ambiguous (resolve to a Wikipedia
// disambiguation page) or don't match their article's exact title —
// confirmed individually via the Wikipedia search API. Maps the catalog
// `name` to the real article title to query instead.
const TITLE_OVERRIDES = {
  'University of New England': 'University of New England (Australia)',
  'University of Newcastle': 'University of Newcastle (Australia)',
  'Victoria University': 'Victoria University (Australia)',
  'Amity University': 'Amity University, Noida',
  'Trinity College': 'Trinity College (Connecticut)',
  'Fergusson College, Pune': 'Fergusson College',
  'Mumbai University (Institute of Chemical Technology)': 'Institute of Chemical Technology',
  'RV College of Engineering': 'R.V. College of Engineering',
  'SASTRA Deemed University': 'Shanmugha Arts, Science, Technology & Research Academy',
  'Vellore Institute of Technology, Chennai': 'Vellore Institute of Technology',
  'Xavier Labour Relations Institute (XLRI)': 'XLRI – Xavier School of Management',
}

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

async function findImageUrl(universityName) {
  const queryTitle = TITLE_OVERRIDES[universityName] ?? universityName
  const data = await wikiFetch({
    action: 'query',
    titles: queryTitle,
    prop: 'images',
    imlimit: '500',
    redirects: '1',
  })
  const pages = Object.values(data.query?.pages ?? {})
  const page = pages[0]
  if (!page || page.missing !== undefined || !page.images) return null
  const filename = pickBestFilename(page.images)
  if (!filename) return null

  await sleep(5000)
  const infoData = await wikiFetch({
    action: 'query',
    titles: `File:${filename}`,
    prop: 'imageinfo',
    iiprop: 'url',
    iiurlwidth: '640',
  })
  const infoPages = Object.values(infoData.query?.pages ?? {})
  return infoPages[0]?.imageinfo?.[0]?.thumburl ?? null
}

// Re-runnable: skips rows that already have an imageUrl, so an interrupted
// run just picks up where it left off instead of redoing completed work.
async function main() {
  const rows = await sql`SELECT id, name FROM universities WHERE "imageUrl" IS NULL ORDER BY id`
  console.log(`${rows.length} universities still need an image`)

  let updated = 0
  let notFound = 0

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    try {
      const url = await findImageUrl(row.name)
      if (url) {
        await sql`UPDATE universities SET "imageUrl" = ${url} WHERE id = ${row.id}`
        updated++
      } else {
        notFound++
        console.log(`  no candidate image: ${row.name}`)
      }
    } catch (err) {
      notFound++
      console.log(`  error fetching ${row.name}: ${err.message}`)
    }
    if ((i + 1) % 10 === 0) console.log(`...${i + 1}/${rows.length} (updated ${updated}, no match ${notFound})`)
    await sleep(5000)
  }

  console.log(`Done. Updated ${updated}, no match for ${notFound}.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
