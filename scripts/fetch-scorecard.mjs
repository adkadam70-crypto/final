// Fetches ALL US bachelor's-degree-granting institutions from the U.S. Dept
// of Education College Scorecard API and saves them to
// /tmp/scorecard/combined.json, in the shape scripts/seed-actual-acceptance-rates.mjs
// expects (an array of { "school.name", "latest.admissions.admission_rate.overall" }).
//
// Needs a real api.data.gov key passed as SCORECARD_API_KEY — the public
// DEMO_KEY rate-limits after ~900 of ~1,947 institutions. Register a free
// key instantly at https://api.data.gov/signup/.
//
// Usage: SCORECARD_API_KEY=your_key_here node scripts/fetch-scorecard.mjs

import fs from 'fs'

const API_KEY = process.env.SCORECARD_API_KEY
if (!API_KEY) {
  console.error('Set SCORECARD_API_KEY (get one free at https://api.data.gov/signup/)')
  process.exit(1)
}

const BASE = 'https://api.data.gov/ed/collegescorecard/v1/schools'
const FIELDS = 'school.name,latest.admissions.admission_rate.overall'
const PER_PAGE = 100

async function fetchPage(page) {
  const url = `${BASE}?api_key=${API_KEY}&fields=${FIELDS}&per_page=${PER_PAGE}&page=${page}&school.degrees_awarded.predominant=3&school.operating=1`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Scorecard API returned ${res.status}: ${await res.text()}`)
  }
  return res.json()
}

const all = []
let page = 0
let total = null

while (total === null || page * PER_PAGE < total) {
  const data = await fetchPage(page)
  total = data.metadata.total
  all.push(...data.results)
  console.log(`Fetched page ${page} (${all.length} of ${total} so far)`)
  page++
  // Be polite to the API — small delay between pages.
  await new Promise((r) => setTimeout(r, 150))
}

fs.mkdirSync('/tmp/scorecard', { recursive: true })
fs.writeFileSync('/tmp/scorecard/combined.json', JSON.stringify(all, null, 2))
console.log(`\nSaved ${all.length} institutions to /tmp/scorecard/combined.json`)
