// India — NIRF 2024 Overall and Agriculture & Allied Sectors category
// rankings, matched by exact normalized name against the existing catalog
// only.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-in-nirf-overall-agri.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const SRC = {
  overall: ['Science & Technology / Research', 'NIRF 2024 — Overall Ranking', 'https://www.nirfindia.org/Rankings/2024/OverallRanking.html', 100],
  agri: ['Science & Technology / Research', 'NIRF 2024 — Agriculture & Allied Sectors Category Ranking', 'https://www.nirfindia.org/Rankings/2024/AgricultureRanking.html', 40],
}

const NOTE_OVERALL = 'NIRF institution-wide Overall ranking (all disciplines combined), not subject-specific.'
const NOTE_AGRI = 'NIRF category-specific ranking, not the institution-wide NIRF rank.'

const DATA = {
  overall: [
    ["Indian Institute of Technology Madras", 1],
    ["Indian Institute of Technology Bombay", 3],
    ["Indian Institute of Technology Delhi", 4],
    ["Indian Institute of Technology Kanpur", 5],
    ["Indian Institute of Technology Kharagpur", 6],
    ["All India Institute of Medical Sciences, Delhi", 7],
    ["Indian Institute of Technology Roorkee", 8],
    ["Indian Institute of Technology Guwahati", 9],
    ["Jawaharlal Nehru University", 10],
    ["Banaras Hindu University", 11],
    ["Indian Institute of Technology Hyderabad", 12],
    ["Jamia Millia Islamia", 13],
    ["University of Delhi", 15],
    ["Aligarh Muslim University", 16],
    ["Jadavpur University", 17],
    ["Amrita Vishwa Vidyapeetham", 18],
    ["Vellore Institute of Technology", 19],
    ["Anna University", 20],
    ["Saveetha Institute of Medical and Technical Sciences", 22],
    ["Birla Institute of Technology and Science, Pilani", 23],
    ["Siksha O Anusandhan", 24],
    ["University of Hyderabad", 25],
    ["Calcutta University", 26],
    ["Kalinga Institute of Industrial Technology", 28],
    ["Indian Institute of Technology Gandhinagar", 29],
    ["National Institute of Technology Tiruchirappalli", 31],
    ["Chandigarh University", 32],
    ["Indian Institute of Technology Indore", 33],
    ["National Institute of Technology Rourkela", 34],
    ["JSS Academy of Higher Education and Research", 36],
    ["Savitribai Phule Pune University", 37],
    ["Kerala University", 38],
    ["Andhra University", 41],
    ["Indian Institute of Science Education and Research Pune", 42],
    ["Thapar Institute of Engineering and Technology", 43],
    ["Bharathiar University", 44],
    ["Lovely Professional University", 45],
    ["National Institute of Technology Karnataka, Surathkal", 46],
    ["Indian Institute of Technology Ropar", 48],
    ["Amity University", 49],
    ["Kalasalingam Academy of Research and Education", 50],
    ["Cochin University of Science and Technology", 51],
    ["National Institute of Technology Warangal", 53],
    ["National Institute of Technology Calicut", 54],
    ["Bharathidasan University", 55],
    ["Gauhati University", 57],
    ["Babasaheb Bhimrao Ambedkar University", 58],
    ["Panjab University", 60],
    ["Indian Institute of Science Education and Research Kolkata", 61],
    ["Jamia Hamdard", 62],
    ["Indian Institute of Science Education and Research Mohali", 64],
    ["University of Madras", 65],
    ["Delhi Technological University", 66],
    ["Indian Institute of Technology Jodhpur", 68],
    ["University of Kashmir", 69],
    ["Osmania University", 70],
    ["Datta Meghe Institute of Higher Education and Research", 71],
    ["Indian Institute of Technology, Patna", 73],
    ["Alagappa University", 76],
    ["Visvesvaraya National Institute of Technology Nagpur", 77],
    ["Graphic Era University", 79],
    ["Punjab Agricultural University", 80],
    ["SVKM's Narsee Monjee Institute of Management Studies", 84],
    ["Sathyabama Institute of Science and Technology", 85],
    ["Mysore University", 86],
    ["University of Jammu", 87],
    ["King George's Medical University", 88],
    ["Shoolini University of Biotechnology and Management Sciences", 89],
    ["Christ University", 90],
    ["Bharath Institute of Higher Education and Research", 91],
    ["National Institute of Technology Silchar", 92],
    ["National Institute of Technology Durgapur", 93],
    ["Gujarat University", 94],
    ["Shiv Nadar University", 95],
    ["Sri Ramachandra Institute of Higher Education and Research", 96],
    ["Acharya Nagarjuna University", 97],
    ["Tata Institute of Social Sciences", 98],
    ["Periyar University", 100],
  ],
  agri: [
    ["Indian Agricultural Research Institute", 1],
    ["National Dairy Research Institute", 2],
    ["Punjab Agricultural University", 3],
    ["Banaras Hindu University", 4],
    ["Indian Veterinary Research Institute", 5],
    ["Tamil Nadu Agricultural University", 6],
    ["CCS Haryana Agricultural University", 7],
    ["G. B. Pant University of Agriculture and Technology", 8],
    ["Central Institute of Fisheries Education", 9],
    ["University of Agricultural Sciences, Bangalore", 11],
    ["Bidhan Chandra Agricultural University", 13],
    ["Assam Agricultural University", 14],
    ["Orissa University of Agriculture and Technology", 15],
    ["Tamil Nadu Veterinary and Animal Sciences University", 17],
    ["Dr. YS Parmar University of Horticulture and Forestry", 18],
    ["Himachal Pradesh Agricultural University", 19],
    ["Lovely Professional University", 22],
    ["University of Agricultural Sciences, Dharwad", 24],
    ["Acharya N. G. Ranga Agricultural University", 26],
    ["Annamalai University", 27],
    ["West Bengal University of Animal and Fishery Sciences", 28],
    ["Central Agricultural University", 31],
    ["Professor Jayashankar Telangana State Agricultural University", 37],
    ["Kalasalingam Academy of Research and Education", 38],
  ],
}

let inserted = 0
const skipped = []

for (const [key, rows] of Object.entries(DATA)) {
  const [field, source, url, poolSize] = SRC[key]
  const note = key === 'overall' ? NOTE_OVERALL : NOTE_AGRI
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
      VALUES (${universityId}, ${field}, ${rank}, ${source}, ${url}, ${selectivityFromRank(rank, poolSize)}, ${note})
    `
    inserted++
  }
}

console.log(`Inserted ${inserted} program-ranking rows.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
