// India — EduRank.org citation-based Liberal Arts & Social Sciences
// subject ranking, filed under Social Sciences, matched by exact/corrected
// name against the existing catalog only.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-in-social.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const FIELD = 'Social Sciences'
const SOURCE = 'EduRank.org Citation-Based Subject Ranking 2026 — Liberal Arts & Social Sciences (India)'
const URL = 'https://edurank.org/liberal-arts/in/'
const NOTE = 'EduRank.org citation-based subject ranking (research output/citation counts), not an admissions-selectivity metric — programSelectivity is our own derived scale for comparability, not itself a published figure.'
const POOL = 100

const DATA = [
    ["University of Delhi", 1],
    ["Indian Institute of Science", 2],
    ["Indian Institute of Technology Kharagpur", 3],
    ["All India Institute of Medical Sciences, Delhi", 4],
    ["Indian Institute of Technology Delhi", 5],
    ["Vellore Institute of Technology", 6],
    ["Indian Institute of Technology Bombay", 7],
    ["Indian Institute of Technology Kanpur", 8],
    ["Banaras Hindu University", 9],
    ["Jawaharlal Nehru University", 10],
    ["Indian Institute of Technology Madras", 11],
    ["Indian Statistical Institute", 12],
    ["Indian Institute of Technology Roorkee", 13],
    ["Jadavpur University", 14],
    ["Manipal Academy of Higher Education", 16],
    ["Anna University", 17],
    ["Christ University", 18],
    ["Aligarh Muslim University", 19],
    ["SRM Institute of Science and Technology", 23],
    ["University of Hyderabad", 24],
    ["Savitribai Phule Pune University", 25],
    ["Thapar Institute of Engineering and Technology", 26],
    ["Indian Institute of Technology Guwahati", 27],
    ["Symbiosis International University", 28],
    ["Panjab University", 29],
    ["Lovely Professional University", 30],
    ["Saveetha University", 31],
    ["Amity University", 33],
    ["Indian Agricultural Research Institute", 34],
    ["National Institute of Technology Rourkela", 37],
    ["Indian Institute of Technology Indore", 38],
    ["Delhi Technological University", 39],
    ["National Institute of Mental Health and Neuro Sciences", 40],
    ["Pondicherry University", 41],
    ["Indian Institute of Technology Hyderabad", 42],
    ["Sardar Vallabhbhai National Institute of Technology", 43],
    ["Annamalai University", 45],
    ["National Institute of Technology Tiruchirappalli", 46],
    ["Punjab Agricultural University", 47],
    ["Chandigarh University", 48],
    ["Guru Nanak Dev University", 50],
    ["Jawaharlal Institute of Postgraduate Medical Education and Research", 51],
    ["National Institute of Technology Karnataka, Surathkal", 52],
    ["Vidyasagar University", 54],
    ["Chitkara University", 55],
    ["National Institute of Technology Kurukshetra", 56],
    ["Graphic Era University", 58],
    ["University of Kalyani", 59],
    ["Sathyabama Institute of Science and Technology", 60],
    ["University of Kashmir", 61],
    ["King George's Medical University", 62],
    ["Tamil Nadu Agricultural University", 63],
    ["Guru Gobind Singh Indraprastha University", 64],
    ["Punjabi University Patiala", 65],
    ["Bharathiar University", 66],
    ["University of Petroleum and Energy Studies", 68],
    ["Andhra University", 69],
    ["National Institute of Technology Durgapur", 70],
    ["Indian Institute of Information Technology Allahabad", 73],
    ["International Institute of Information Technology, Hyderabad", 75],
    ["University of Burdwan", 76],
    ["Cochin University of Science and Technology", 77],
    ["National Institute of Technology Calicut", 78],
    ["Visva-Bharati University", 81],
    ["University of Madras", 83],
    ["Jaypee Institute of Information Technology", 84],
    ["Bharathidasan University", 85],
    ["Tata Institute of Social Sciences", 86],
    ["National Institute of Technology Warangal", 87],
    ["International Institute for Population Sciences", 89],
    ["Motilal Nehru National Institute of Technology Allahabad", 92],
    ["Nirma University", 94],
    ["Galgotias University", 97],
    ["National Institute of Technology Silchar", 99],
    ["Indian Institute of Technology, Patna", 100],
]

let inserted = 0
for (const [name, rank] of DATA) {
  const r = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'IN'`
  if (r.length === 0) { console.log('not found:', name); continue }
  const id = r[0].id
  const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${id} AND field = ${FIELD} AND "rankSource" = ${SOURCE}`
  if (existing.length > 0) continue
  await sql`
    INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (${id}, ${FIELD}, ${rank}, ${SOURCE}, ${URL}, ${selectivityFromRank(rank, POOL)}, ${NOTE})
  `
  inserted++
}
console.log(`Inserted ${inserted} rows.`)
