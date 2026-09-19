// India — NIRF 2024 tail bands (Engineering 101-150, Management 101-125),
// matched by exact normalized name against the existing catalog only.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-in-nirf-tail-bands.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const SRC = {
  eng: ['Engineering', 'NIRF 2024 — Engineering Category Ranking (band 101-150)', 'https://www.nirfindia.org/Rankings/2024/EngineeringRanking150.html', 150],
  mgmt: ['Business', 'NIRF 2024 — Management Category Ranking (band 101-125)', 'https://www.nirfindia.org/Rankings/2024/ManagementRanking150.html', 125],
}

const DATA = {
  eng: [
    ['Amity University', 101], ['Galgotias University', 110], ['Jawaharlal Nehru Technological University', 116],
    ['Jaypee Institute of Information Technology', 117], ['Mahindra University', 121], ['National Institute of Technology Arunachal Pradesh', 126],
    ['National Institute of Technology Goa', 127], ['National Institute of Technology Hamirpur', 128], ['National Institute of Technology Manipur', 129],
    ['National Institute of Technology Mizoram', 130], ['National Institute of Technology Uttarakhand', 131],
    ['National Institute of Technology Jamshedpur', 132], ['Nirma University', 133], ['Pandit Deendayal Energy University', 136],
    ['Panjab University', 138], ['PES University', 139], ['Rajalakshmi Engineering College', 142], ['Sharda University', 143],
    ["SVKM's Narsee Monjee Institute of Management Studies", 145], ['Thiagarajar College of Engineering', 147],
  ],
  mgmt: [
    ['Amity University', 101], ['Gujarat University', 111], ['Sharda University', 120],
    ['Shoolini University of Biotechnology and Management Sciences', 121], ['University of Hyderabad', 123], ['University of Jammu', 124],
    ['Visvesvaraya Technological University', 125],
  ],
}

let inserted = 0
const skipped = []

for (const [key, rows] of Object.entries(DATA)) {
  const [field, source, url, poolSize] = SRC[key]
  for (const [name, rank] of rows) {
    const found = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'IN'`
    if (found.length === 0) {
      skipped.push(`${name} (${key})`)
      continue
    }
    const universityId = found[0].id
    const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${universityId} AND field = ${field} AND "rankSource" = ${source}`
    if (existing.length > 0) continue
    await sql`
      INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
      VALUES (${universityId}, ${field}, ${rank}, ${source}, ${url}, ${selectivityFromRank(rank, poolSize)}, 'NIRF category-specific ranking, not the institution-wide NIRF rank.')
    `
    inserted++
  }
}

console.log(`Inserted ${inserted} program-ranking rows.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
