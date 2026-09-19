// India — EduRank.org citation-based subject rankings for Medicine and Law,
// matched by exact normalized name against the existing catalog only.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-in-edurank-med-law.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const NOTE = 'EduRank.org citation-based subject ranking (research output/citation counts), not an admissions-selectivity metric — programSelectivity is our own derived scale for comparability, not itself a published figure.'

const SRC = {
  med: ['Medicine & Health Sciences', 'EduRank.org Citation-Based Subject Ranking 2026 — Medicine', 'https://edurank.org/medicine/in/', 488],
  law: ['Law', 'EduRank.org Citation-Based Subject Ranking 2026 — Law', 'https://edurank.org/liberal-arts/law/in/', 415],
}

const DATA = {
  med: [
    ['All India Institute of Medical Sciences, Delhi', 1], ['Banaras Hindu University', 3], ['Manipal Academy of Higher Education', 4],
    ['University of Delhi', 6], ["King George's Medical University", 7], ['Jawaharlal Institute of Postgraduate Medical Education and Research', 8],
    ['National Institute of Mental Health and Neuro Sciences', 9], ['Indian Institute of Science', 10], ['Saveetha University', 11],
    ['Aligarh Muslim University', 12], ['Indian Institute of Technology Kharagpur', 14], ['Indian Institute of Technology Kanpur', 15],
    ['Panjab University', 16], ['Annamalai University', 18], ['Indian Institute of Technology Delhi', 20], ['Indian Institute of Technology Bombay', 21],
    ['Jadavpur University', 22], ['Indian Veterinary Research Institute', 24], ['University of Madras', 26],
    ['Sri Ramachandra Institute of Higher Education and Research', 27], ['Indian Institute of Technology Madras', 28], ['Jawaharlal Nehru University', 29],
    ['SRM Institute of Science and Technology', 31], ['Indian Institute of Technology Roorkee', 32], ['University of Hyderabad', 35],
    ['Savitribai Phule Pune University', 36], ['Indian Institute of Technology Guwahati', 38], ['Guru Nanak Dev University', 40], ['Anna University', 42],
    ["Nizam's Institute of Medical Sciences", 43], ['Christ University', 44], ['JSS Academy of Higher Education and Research', 45],
    ['Indian Agricultural Research Institute', 46], ['Bharathiar University', 48], ['Amity University', 50], ['Lovely Professional University', 51],
    ['Punjab Agricultural University', 56], ['Punjabi University Patiala', 57], ['Indian Statistical Institute', 58], ['Bharathidasan University', 59],
    ['Osmania University', 60], ['Maharaja Sayajirao University of Baroda', 62], ['Sri Venkateswara University', 65], ['Pondicherry University', 66],
    ['University of Kashmir', 68], ['National Dairy Research Institute', 72], ['Indian Institute of Technology Indore', 73], ['Andhra University', 76],
    ['University of Kalyani', 77], ['Chandigarh University', 78], ['Tamil Nadu Agricultural University', 79],
    ['National Institute of Technology Rourkela', 80], ['Karnatak University', 81], ['University of Lucknow', 82],
    ['International Institute for Population Sciences', 84], ['Symbiosis International University', 87], ['Madurai Kamaraj University', 91],
    ['Thapar Institute of Engineering and Technology', 92], ['Delhi Technological University', 96], ['Visva-Bharati University', 97],
    ['Sathyabama Institute of Science and Technology', 98], ['Sharda University', 99], ['Mangalore University', 100],
  ],
  law: [
    ['University of Delhi', 1], ['Indian Institute of Technology Delhi', 2], ['Indian Institute of Technology Kharagpur', 3],
    ['Indian Institute of Science', 5], ['Jawaharlal Nehru University', 6], ['All India Institute of Medical Sciences, Delhi', 7],
    ['Indian Institute of Technology Bombay', 8], ['Indian Institute of Technology Roorkee', 9], ['Manipal Academy of Higher Education', 10],
    ['Anna University', 11], ['Indian Institute of Technology Kanpur', 12], ['Indian Statistical Institute', 13],
    ['Symbiosis International University', 14], ['Indian Institute of Technology Madras', 15], ['Christ University', 16], ['Jadavpur University', 17],
    ['Banaras Hindu University', 18], ['Aligarh Muslim University', 22], ['University of Hyderabad', 23], ['SRM Institute of Science and Technology', 24],
    ['Lovely Professional University', 25], ['Amity University', 26], ['Thapar Institute of Engineering and Technology', 27],
    ['Savitribai Phule Pune University', 28], ['Panjab University', 30], ['National Institute of Mental Health and Neuro Sciences', 32],
    ['Indian Institute of Technology Guwahati', 33], ['Saveetha University', 34], ['Chandigarh University', 35], ['Delhi Technological University', 36],
    ['National Institute of Technology Rourkela', 37], ['Pondicherry University', 39], ['National Institute of Technology Kurukshetra', 40],
    ['Graphic Era University', 42], ['University of Petroleum and Energy Studies', 43], ['Guru Nanak Dev University', 44],
    ['National Institute of Technology Tiruchirappalli', 45], ['Malaviya National Institute of Technology Jaipur', 49],
    ['Indian Institute of Technology Hyderabad', 50], ['Sathyabama Institute of Science and Technology', 51],
    ['Guru Gobind Singh Indraprastha University', 52], ['Jawaharlal Institute of Postgraduate Medical Education and Research', 54],
    ['Nirma University', 55], ['Indian Institute of Technology Indore', 56], ['University of Kalyani', 58], ['Punjabi University Patiala', 59],
    ['Tata Institute of Social Sciences', 60], ['Jaypee Institute of Information Technology', 61], ['Galgotias University', 62],
    ['University of Kashmir', 64], ['Annamalai University', 65], ['Motilal Nehru National Institute of Technology Allahabad', 66],
    ['Mangalore University', 70], ['Jain University', 72], ['Bharathidasan University', 74], ['Vidyasagar University', 76],
    ['Cochin University of Science and Technology', 78], ["King George's Medical University", 79], ['Bharathiar University', 81],
    ['Sharda University', 86], ['International Institute for Population Sciences', 94], ['Andhra University', 96], ['University of Burdwan', 97],
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
      VALUES (${universityId}, ${field}, ${rank}, ${source}, ${url}, ${selectivityFromRank(rank, poolSize)}, ${NOTE})
    `
    inserted++
  }
}

console.log(`Inserted ${inserted} program-ranking rows.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
