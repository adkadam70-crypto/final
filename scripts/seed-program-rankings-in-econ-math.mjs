// India — EduRank.org citation-based Economics and Mathematics subject
// rankings, matched by exact/corrected name against the existing catalog
// only.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-in-econ-math.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const NOTE = 'EduRank.org citation-based subject ranking (research output/citation counts), not an admissions-selectivity metric — programSelectivity is our own derived scale for comparability, not itself a published figure.'

const SRC = {
  econ: ['Economics', 'EduRank.org Citation-Based Subject Ranking 2026 — Economics (India)', 'https://edurank.org/economics/in/', 100],
  math: ['Mathematics & Statistics', 'EduRank.org Citation-Based Subject Ranking 2026 — Mathematics (India)', 'https://edurank.org/math/in/', 100],
}

const DATA = {
  econ: [
    ["University of Delhi", 1],
    ["Indian Institute of Technology Kanpur", 2],
    ["Indian Statistical Institute", 3],
    ["Indian Institute of Technology Kharagpur", 4],
    ["Indian Institute of Technology Delhi", 5],
    ["All India Institute of Medical Sciences, Delhi", 6],
    ["Indian Institute of Science", 7],
    ["Jawaharlal Nehru University", 8],
    ["Indian Institute of Technology Bombay", 9],
    ["Indian Institute of Technology Roorkee", 10],
    ["Vellore Institute of Technology", 11],
    ["Jadavpur University", 12],
    ["Indian Institute of Technology Madras", 13],
    ["Aligarh Muslim University", 14],
    ["Banaras Hindu University", 15],
    ["Symbiosis International University", 16],
    ["Manipal Academy of Higher Education", 18],
    ["Christ University", 19],
    ["Anna University", 21],
    ["Savitribai Phule Pune University", 24],
    ["National Institute of Technology Rourkela", 27],
    ["Amity University", 28],
    ["University of Hyderabad", 29],
    ["Thapar Institute of Engineering and Technology", 30],
    ["SRM Institute of Science and Technology", 31],
    ["Panjab University", 33],
    ["Pondicherry University", 34],
    ["Indian Institute of Technology Guwahati", 35],
    ["Lovely Professional University", 36],
    ["Delhi Technological University", 38],
    ["National Institute of Technology Tiruchirappalli", 39],
    ["International Institute for Population Sciences", 40],
    ["Tata Institute of Social Sciences", 41],
    ["Graphic Era University", 42],
    ["Guru Nanak Dev University", 44],
    ["National Institute of Mental Health and Neuro Sciences", 45],
    ["Vidyasagar University", 46],
    ["Indian Institute of Technology Indore", 48],
    ["Chandigarh University", 49],
    ["University of Petroleum and Energy Studies", 50],
    ["Nirma University", 51],
    ["Saveetha University", 53],
    ["University of Burdwan", 55],
    ["Indian Agricultural Research Institute", 56],
    ["Punjabi University Patiala", 57],
    ["Mangalore University", 58],
    ["Guru Gobind Singh Indraprastha University", 59],
    ["Chitkara University", 60],
    ["University of Kalyani", 62],
    ["Annamalai University", 64],
    ["Motilal Nehru National Institute of Technology Allahabad", 65],
    ["Cochin University of Science and Technology", 66],
    ["SVKM's Narsee Monjee Institute of Management Studies", 67],
    ["National Institute of Technology Karnataka, Surathkal", 68],
    ["National Institute of Technology Durgapur", 69],
    ["Punjab Agricultural University", 70],
    ["National Institute of Technology Kurukshetra", 71],
    ["University of Kashmir", 72],
    ["Bharathiar University", 74],
    ["King George's Medical University", 75],
    ["Jawaharlal Institute of Postgraduate Medical Education and Research", 76],
    ["Sardar Vallabhbhai National Institute of Technology", 77],
    ["Galgotias University", 78],
    ["Tamil Nadu Agricultural University", 81],
    ["Indian Institute of Technology Hyderabad", 85],
    ["National Institute of Technology Silchar", 88],
    ["National Institute of Technology Calicut", 89],
    ["Andhra University", 90],
    ["Jaypee Institute of Information Technology", 91],
    ["Indian Institute of Foreign Trade", 92],
    ["Visva-Bharati University", 93],
    ["National Institute of Technology Hamirpur", 95],
    ["Presidency University, Kolkata", 96],
    ["Babasaheb Bhimrao Ambedkar University", 97],
    ["Bharathidasan University", 98],
    ["Sathyabama Institute of Science and Technology", 99],
    ["University of Madras", 100],
  ],
  math: [
    ["Indian Institute of Science", 1],
    ["Indian Institute of Technology Kharagpur", 2],
    ["Indian Institute of Technology Kanpur", 3],
    ["Indian Institute of Technology Delhi", 4],
    ["Indian Statistical Institute", 5],
    ["Indian Institute of Technology Bombay", 6],
    ["Indian Institute of Technology Madras", 7],
    ["Vellore Institute of Technology", 8],
    ["Indian Institute of Technology Roorkee", 9],
    ["Jadavpur University", 10],
    ["All India Institute of Medical Sciences, Delhi", 11],
    ["University of Delhi", 12],
    ["Anna University", 13],
    ["Banaras Hindu University", 14],
    ["National Institute of Technology Rourkela", 16],
    ["Indian Institute of Technology Guwahati", 17],
    ["Indian Institute of Technology Indore", 19],
    ["Thapar Institute of Engineering and Technology", 20],
    ["Manipal Academy of Higher Education", 21],
    ["SRM Institute of Science and Technology", 22],
    ["Aligarh Muslim University", 23],
    ["Savitribai Phule Pune University", 27],
    ["National Institute of Technology Tiruchirappalli", 28],
    ["Saveetha University", 30],
    ["Panjab University", 31],
    ["National Institute of Technology Kurukshetra", 32],
    ["Delhi Technological University", 33],
    ["Jawaharlal Nehru University", 34],
    ["National Institute of Technology Karnataka, Surathkal", 37],
    ["Amity University", 38],
    ["Sardar Vallabhbhai National Institute of Technology", 39],
    ["Pondicherry University", 40],
    ["Motilal Nehru National Institute of Technology Allahabad", 42],
    ["Symbiosis International University", 43],
    ["Bharathiar University", 45],
    ["Lovely Professional University", 46],
    ["University of Hyderabad", 47],
    ["National Institute of Technology Durgapur", 50],
    ["Indian Institute of Technology Hyderabad", 51],
    ["University of Kalyani", 52],
    ["Guru Nanak Dev University", 53],
    ["Sathyabama Institute of Science and Technology", 54],
    ["National Institute of Technology Warangal", 55],
    ["Annamalai University", 56],
    ["National Institute of Technology Raipur", 57],
    ["Christ University", 58],
    ["Indian Institute of Technology, Patna", 59],
    ["National Institute of Technology Calicut", 60],
    ["Cochin University of Science and Technology", 63],
    ["Chandigarh University", 65],
    ["National Institute of Mental Health and Neuro Sciences", 67],
    ["Chitkara University", 68],
    ["Graphic Era University", 69],
    ["Jaypee Institute of Information Technology", 72],
    ["National Institute of Technology Silchar", 73],
    ["Guru Gobind Singh Indraprastha University", 74],
    ["Punjabi University Patiala", 75],
    ["Indian Institute of Information Technology Allahabad", 76],
    ["Andhra University", 77],
    ["Jawaharlal Nehru Technological University", 78],
    ["National Institute of Technology Hamirpur", 82],
    ["Dr. B. R. Ambedkar National Institute of Technology Jalandhar", 83],
    ["International Institute of Information Technology, Hyderabad", 85],
    ["Jawaharlal Institute of Postgraduate Medical Education and Research", 86],
    ["Sri Venkateswara University", 88],
    ["Vidyasagar University", 90],
    ["Bharathidasan University", 91],
    ["National Institute of Technology Patna", 92],
    ["Nirma University", 93],
    ["King George's Medical University", 94],
    ["University of Madras", 96],
    ["University of Kashmir", 98],
    ["University of Petroleum and Energy Studies", 99],
    ["Galgotias University", 100],
  ],
}

let inserted = 0
for (const [key, rows] of Object.entries(DATA)) {
  const [field, source, url, pool] = SRC[key]
  for (const [name, rank] of rows) {
    const r = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'IN'`
    if (r.length === 0) { console.log('not found:', name); continue }
    const id = r[0].id
    const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${id} AND field = ${field} AND "rankSource" = ${source}`
    if (existing.length > 0) continue
    await sql`
      INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
      VALUES (${id}, ${field}, ${rank}, ${source}, ${url}, ${selectivityFromRank(rank, pool)}, ${NOTE})
    `
    inserted++
  }
}
console.log(`Inserted ${inserted} rows.`)
