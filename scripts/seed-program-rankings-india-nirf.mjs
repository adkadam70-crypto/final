// First real program-ranking pass for India, using NIRF (National
// Institutional Ranking Framework) — India's own official government
// ranking system, published annually by the Ministry of Education,
// category-specific (Engineering/Management/Medical/Law/Pharmacy/etc).
// This is the single most credible source available for Indian program
// rankings — official, government-run, category-native (unlike QS/THE
// subject rankings, which only cover a handful of elite Indian schools).
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-india-nirf.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank) {
  return Math.max(15, Math.min(99, Math.round(100 - (rank - 1) * 1.1)))
}

const SRC = {
  eng: ['NIRF (National Institutional Ranking Framework) India — 2025 Engineering Rankings, Ministry of Education', 'https://www.nirfindia.org/Rankings/2025/EngineeringRanking.html'],
  mgmt: ['NIRF (National Institutional Ranking Framework) India — 2025 Management Rankings, Ministry of Education', 'https://www.nirfindia.org/Rankings/2025/ManagementRanking.html'],
  med: ['NIRF (National Institutional Ranking Framework) India — 2025 Medical Rankings, Ministry of Education', 'https://www.nirfindia.org/Rankings/2025/MedicalRanking.html'],
}

const NOTE = 'Official Government of India ranking (Ministry of Education), not a private aggregator — programSelectivity here is our own derived scale for comparability with other rankings, not itself a published figure.'

// [name in our catalog, field, rank, sourceKey]
const DATA = [
["Indian Institute of Technology Madras","Engineering",1,"eng"],
["Indian Institute of Technology Delhi","Engineering",2,"eng"],
["Indian Institute of Technology Bombay","Engineering",3,"eng"],
["Indian Institute of Technology Kanpur","Engineering",4,"eng"],
["Indian Institute of Technology Kharagpur","Engineering",5,"eng"],
["Indian Institute of Technology Roorkee","Engineering",6,"eng"],
["Indian Institute of Technology Hyderabad","Engineering",7,"eng"],
["Indian Institute of Technology Guwahati","Engineering",8,"eng"],
["National Institute of Technology Tiruchirappalli","Engineering",9,"eng"],
["Indian Institute of Technology Indore","Engineering",12,"eng"],
["National Institute of Technology Rourkela","Engineering",13,"eng"],
["SRM Institute of Science and Technology","Engineering",14,"eng"],
["Vellore Institute of Technology","Engineering",16,"eng"],
["National Institute of Technology Karnataka, Surathkal","Engineering",17,"eng"],
["Jadavpur University","Engineering",18,"eng"],
["Indian Institute of Technology, Patna","Engineering",19,"eng"],
["Anna University","Engineering",20,"eng"],
["National Institute of Technology Calicut","Engineering",21,"eng"],
["Siksha O Anusandhan","Engineering",22,"eng"],
["Amrita Vishwa Vidyapeetham","Engineering",23,"eng"],
["Jamia Millia Islamia","Engineering",24,"eng"],
["Indian Institute of Technology Gandhinagar","Engineering",25,"eng"],
["Indian Institute of Technology Jodhpur","Engineering",27,"eng"],
["National Institute of Technology Warangal","Engineering",28,"eng"],
["Thapar Institute of Engineering and Technology","Engineering",29,"eng"],
["Delhi Technological University","Engineering",30,"eng"],
["Chandigarh University","Engineering",31,"eng"],
["Indian Institute of Technology Ropar","Engineering",32,"eng"],
["Kalasalingam Academy of Research and Education","Engineering",33,"eng"],
["Aligarh Muslim University","Engineering",34,"eng"],
["Kalinga Institute of Industrial Technology","Engineering",36,"eng"],
["Amity University","Engineering",37,"eng"],
["International Institute of Information Technology, Hyderabad","Engineering",38,"eng"],
["Visvesvaraya National Institute of Technology Nagpur","Engineering",44,"eng"],
["Saveetha Institute of Medical and Technical Sciences","Engineering",45,"eng"],
["Lovely Professional University","Engineering",48,"eng"],
["National Institute of Technology Durgapur","Engineering",49,"eng"],
["National Institute of Technology Silchar","Engineering",50,"eng"],
["Indian Institute of Management Ahmedabad","Business",1,"mgmt"],
["Indian Institute of Management Bangalore","Business",2,"mgmt"],
["Indian Institute of Technology Delhi","Business",4,"mgmt"],
["Indian Institute of Management Calcutta","Business",7,"mgmt"],
["Indian Institute of Management Indore","Business",8,"mgmt"],
["Indian Institute of Technology Kharagpur","Business",12,"mgmt"],
["Indian Institute of Technology Madras","Business",13,"mgmt"],
["Indian Institute of Technology Bombay","Business",14,"mgmt"],
["Indian Institute of Management, Tiruchirappalli","Business",16,"mgmt"],
["Indian Institute of Technology Roorkee","Business",22,"mgmt"],
["Indian Institute of Technology Kanpur","Business",27,"mgmt"],
["National Institute of Technology Tiruchirappalli","Business",57,"mgmt"],
["Malaviya National Institute of Technology Jaipur","Business",62,"mgmt"],
["Atal Bihari Vajpayee Indian Institute of Information Technology and Management, Gwalior","Business",93,"mgmt"],
["Birla Institute of Technology, Ranchi","Business",97,"mgmt"],
["Indian Institute of Technology Jodhpur","Business",98,"mgmt"],
["University of Lucknow","Business",100,"mgmt"],
["All India Institute of Medical Sciences, Delhi","Medicine & Health Sciences",1,"med"],
["Banaras Hindu University","Medicine & Health Sciences",6,"med"],
["King George's Medical University","Medicine & Health Sciences",8,"med"],
["Amrita Vishwa Vidyapeetham","Medicine & Health Sciences",9,"med"],
["Saveetha Institute of Medical and Technical Sciences","Medicine & Health Sciences",11,"med"],
["Siksha O Anusandhan","Medicine & Health Sciences",15,"med"],
["Sree Chitra Tirunal Institute for Medical Sciences and Technology","Medicine & Health Sciences",17,"med"],
["SRM Institute of Science and Technology","Medicine & Health Sciences",18,"med"],
["Datta Meghe Institute of Higher Education and Research","Medicine & Health Sciences",20,"med"],
["Sri Ramachandra Institute of Higher Education and Research","Medicine & Health Sciences",21,"med"],
["Kalinga Institute of Industrial Technology","Medicine & Health Sciences",24,"med"],
["Aligarh Muslim University","Medicine & Health Sciences",29,"med"],
["Jamia Hamdard","Medicine & Health Sciences",40,"med"],
["Chettinad Academy of Research and Education","Medicine & Health Sciences",49,"med"]
]

let inserted = 0
const skipped = []

for (const [name, field, rank, sourceKey] of DATA) {
  const [source, url] = SRC[sourceKey]
  const rows = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'IN'`
  if (rows.length === 0) {
    skipped.push(`${name} (${field})`)
    continue
  }
  const universityId = rows[0].id
  const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${universityId} AND field = ${field} AND "rankSource" = ${source}`
  if (existing.length > 0) continue

  await sql`
    INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (${universityId}, ${field}, ${rank}, ${source}, ${url}, ${selectivityFromRank(rank)}, ${NOTE})
  `
  inserted++
}

console.log(`Inserted ${inserted} program-ranking rows.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
