// India — EduRank.org citation-based subject rankings for Computer Science
// and Business, matched by exact normalized name against the existing
// catalog only (no new university rows). Same accepted pattern already
// used for Chemistry/Engineering/Biology/Physics in this catalog —
// transparently labeled as citation-based, not an admissions-selectivity
// metric.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-in-edurank-cs-business.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const NOTE = 'EduRank.org citation-based subject ranking (research output/citation counts), not an admissions-selectivity metric — programSelectivity is our own derived scale for comparability, not itself a published figure.'

const SRC = {
  cs: ['Computer Science & IT', 'EduRank.org Citation-Based Subject Ranking 2026 — Computer Science', 'https://edurank.org/cs/in/', 490],
  biz: ['Business', 'EduRank.org Citation-Based Subject Ranking 2026 — Business', 'https://edurank.org/business/in/', 431],
}

const DATA = {
  cs: [
    ['Indian Institute of Science', 1], ['Indian Institute of Technology Delhi', 3], ['Indian Institute of Technology Kharagpur', 4],
    ['Indian Institute of Technology Kanpur', 5], ['Indian Institute of Technology Bombay', 6], ['Indian Institute of Technology Madras', 7],
    ['Indian Institute of Technology Roorkee', 8], ['Jadavpur University', 9], ['Anna University', 10], ['Indian Statistical Institute', 12],
    ['All India Institute of Medical Sciences, Delhi', 13], ['University of Delhi', 14], ['Banaras Hindu University', 15],
    ['SRM Institute of Science and Technology', 16], ['Thapar Institute of Engineering and Technology', 17],
    ['Indian Institute of Technology Guwahati', 18], ['National Institute of Technology Rourkela', 19],
    ['Indian Institute of Technology Indore', 20], ['Manipal Academy of Higher Education', 21], ['Savitribai Phule Pune University', 22],
    ['Delhi Technological University', 23], ['Panjab University', 25], ['National Institute of Technology Tiruchirappalli', 27],
    ['Saveetha University', 29], ['Amity University', 32], ['Lovely Professional University', 34],
    ['National Institute of Technology Kurukshetra', 35], ['Aligarh Muslim University', 36], ['Sathyabama Institute of Science and Technology', 39],
    ['Chandigarh University', 41], ['Indian Institute of Technology Hyderabad', 42], ['Jawaharlal Nehru University', 45],
    ['Pondicherry University', 46], ['Symbiosis International University', 47], ['University of Hyderabad', 48],
    ['National Institute of Mental Health and Neuro Sciences', 49], ['Malaviya National Institute of Technology Jaipur', 50],
    ['Graphic Era University', 51], ['Annamalai University', 52], ['National Institute of Technology Durgapur', 53],
    ['Indian Institute of Information Technology Allahabad', 55], ['National Institute of Technology Silchar', 58],
    ['Guru Gobind Singh Indraprastha University', 61], ['Motilal Nehru National Institute of Technology Allahabad', 62],
    ['Jaypee Institute of Information Technology', 64], ['National Institute of Technology Warangal', 65],
    ['National Institute of Technology Raipur', 66], ['Punjabi University Patiala', 67], ['Christ University', 68],
    ['Cochin University of Science and Technology', 69], ['National Institute of Technology Calicut', 71],
    ['International Institute of Information Technology, Hyderabad', 72], ['National Institute of Technology Hamirpur', 74],
    ['Galgotias University', 76], ['Jawaharlal Nehru Technological University', 78], ['University of Kalyani', 80],
    ['Guru Nanak Dev University', 81], ['Bharathiar University', 82], ['Indian Institute of Technology, Patna', 85],
    ['Nirma University', 87], ['Andhra University', 90], ['National Institute of Technology Patna', 91],
    ['University of Petroleum and Energy Studies', 92], ['Dr. B. R. Ambedkar National Institute of Technology Jalandhar', 93],
    ['Jain University', 96], ['PES University', 97], ['Visvesvaraya Technological University', 98],
    ['Hindustan Institute of Technology and Science', 99], ['Veer Surendra Sai University of Technology', 100],
  ],
  biz: [
    ['Indian Institute of Technology Delhi', 1], ['Indian Institute of Technology Kanpur', 2], ['Indian Institute of Technology Kharagpur', 3],
    ['Indian Institute of Technology Bombay', 4], ['Indian Institute of Science', 5], ['Indian Institute of Technology Madras', 6],
    ['Indian Institute of Technology Roorkee', 7], ['University of Delhi', 8], ['Jadavpur University', 10], ['Anna University', 11],
    ['Symbiosis International University', 12], ['Aligarh Muslim University', 14], ['Banaras Hindu University', 15],
    ['National Institute of Technology Rourkela', 17], ['National Institute of Technology Tiruchirappalli', 18], ['Indian Statistical Institute', 19],
    ['Christ University', 22], ['Savitribai Phule Pune University', 23], ['Jawaharlal Nehru University', 24],
    ['Indian Institute of Technology Guwahati', 25], ['Indian Institute of Technology Indore', 26], ['Delhi Technological University', 27],
    ['Manipal Academy of Higher Education', 28], ['Thapar Institute of Engineering and Technology', 29],
    ['SRM Institute of Science and Technology', 30], ['Amity University', 31], ['Pondicherry University', 32],
    ['National Institute of Technology Kurukshetra', 33], ['Malaviya National Institute of Technology Jaipur', 35],
    ['Lovely Professional University', 36], ['Panjab University', 38], ['Motilal Nehru National Institute of Technology Allahabad', 39],
    ['All India Institute of Medical Sciences, Delhi', 41], ['Guru Nanak Dev University', 43], ['National Institute of Technology Silchar', 44],
    ['National Institute of Technology Durgapur', 45], ['Graphic Era University', 46], ['National Institute of Technology Warangal', 47],
    ['University of Hyderabad', 50], ['Chandigarh University', 51], ['Punjabi University Patiala', 52], ['Bharathiar University', 53],
    ['Annamalai University', 57], ['Guru Gobind Singh Indraprastha University', 58], ['National Institute of Technology Calicut', 60],
    ['Indian Institute of Technology Hyderabad', 66], ['University of Petroleum and Energy Studies', 67], ['Nirma University', 68],
    ['Saveetha University', 70], ['Veer Surendra Sai University of Technology', 71], ['Mangalore University', 73],
    ['Cochin University of Science and Technology', 74], ['Andhra University', 75], ['Indian Institute of Technology, Patna', 76],
    ['Galgotias University', 77], ['Vidyasagar University', 78], ['Sathyabama Institute of Science and Technology', 79],
    ['University of Kalyani', 80], ['Bharathidasan University', 81], ['Jaypee Institute of Information Technology', 82],
    ['University of Kashmir', 84], ['University of Burdwan', 86], ['Jawaharlal Nehru Technological University', 88],
    ['National Institute of Technology Hamirpur', 91], ['National Institute of Technology Raipur', 92], ['Jain University', 96],
    ['Dr. B. R. Ambedkar National Institute of Technology Jalandhar', 99], ['University of Jammu', 100],
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
