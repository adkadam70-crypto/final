// India — NIRF 2024 Research, Architecture, and Law category rankings,
// matched by exact normalized name against the existing catalog only.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-in-nirf-research-arch-law.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const SRC = {
  research: ['Science & Technology / Research', 'NIRF 2024 — Research Institutions Category Ranking', 'https://www.nirfindia.org/Rankings/2024/ResearchRanking.html', 100],
  arch: ['Architecture & Design', 'NIRF 2024 — Architecture Category Ranking', 'https://www.nirfindia.org/Rankings/2024/ArchitectureRanking.html', 40],
  law: ['Law', 'NIRF 2024 — Law Category Ranking', 'https://www.nirfindia.org/Rankings/2024/LawRanking.html', 40],
}

const DATA = {
  research: [
    ['Indian Institute of Technology Madras', 2], ['Indian Institute of Technology Delhi', 3], ['Indian Institute of Technology Bombay', 4],
    ['Indian Institute of Technology Kharagpur', 5], ['Indian Institute of Technology Kanpur', 7], ['All India Institute of Medical Sciences, Delhi', 8],
    ['Indian Institute of Technology Roorkee', 9], ['Indian Institute of Technology Guwahati', 10], ['Vellore Institute of Technology', 13],
    ['University of Delhi', 14], ['Indian Institute of Technology Hyderabad', 15], ['Banaras Hindu University', 16], ['Anna University', 17],
    ['Jawaharlal Nehru University', 18], ['Jamia Millia Islamia', 19], ['Saveetha Institute of Medical and Technical Sciences', 20],
    ['Jadavpur University', 21], ['Aligarh Muslim University', 25], ['Birla Institute of Technology and Science, Pilani', 26],
    ['Indian Institute of Technology Indore', 27], ['University of Hyderabad', 28], ['Indian Institute of Science Education and Research Pune', 29],
    ['National Institute of Technology Rourkela', 30], ['National Institute of Technology Tiruchirappalli', 31],
    ['Indian Institute of Technology Gandhinagar', 32], ['Amrita Vishwa Vidyapeetham', 33], ['Panjab University', 35], ['Calcutta University', 36],
    ['Indian Agricultural Research Institute', 37], ['Indian Institute of Science Education and Research Kolkata', 38], ['Bharathiar University', 41],
    ['National Institute of Technology Karnataka, Surathkal', 42], ['Lovely Professional University', 44], ['Indian Institute of Technology Ropar', 45],
    ['Kalinga Institute of Industrial Technology', 46], ['Amity University', 47], ['Bharathidasan University', 48],
    ['Indian Institute of Science Education and Research Mohali', 49], ['Siksha O Anusandhan', 50],
  ],
  arch: [
    ['Indian Institute of Technology Roorkee', 1], ['Indian Institute of Technology Kharagpur', 2], ['National Institute of Technology Calicut', 3],
    ['Jamia Millia Islamia', 7], ['National Institute of Technology Tiruchirappalli', 8], ['National Institute of Technology Rourkela', 9],
    ['Visvesvaraya National Institute of Technology Nagpur', 10], ['Chandigarh University', 13], ['Aligarh Muslim University', 14],
    ['Nirma University', 19], ['Lovely Professional University', 24], ['Amity University', 25], ['National Institute of Technology Patna', 27],
    ['Guru Gobind Singh Indraprastha University', 29], ['National Institute of Technology Hamirpur', 32], ['Anna University', 34],
    ['Chitkara University', 35], ['National Institute of Technology Raipur', 36],
  ],
  law: [
    ['National Law School of India University', 1], ['NALSAR University of Law', 3], ['The West Bengal National University of Juridical Sciences', 4],
    ['Jamia Millia Islamia', 6], ['Indian Institute of Technology Kharagpur', 7], ['Gujarat National Law University', 8], ['Siksha O Anusandhan', 9],
    ['Babasaheb Bhimrao Ambedkar University', 10], ['Kalinga Institute of Industrial Technology', 11], ['Aligarh Muslim University', 12],
    ['Saveetha Institute of Medical and Technical Sciences', 13], ['Christ University', 15], ['Guru Gobind Singh Indraprastha University', 17],
    ['Alliance University', 18], ['Lovely Professional University', 19], ['University of Lucknow', 23], ['Banaras Hindu University', 25],
    ['Amity University', 39],
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
