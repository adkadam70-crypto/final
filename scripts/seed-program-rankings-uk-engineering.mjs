// UK — Complete University Guide 2027 Engineering league tables (General,
// Mechanical, Civil), matched by exact/corrected name against the existing
// catalog only.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-uk-engineering.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const NOTE = 'Complete University Guide subject league table, based on entry standards, student satisfaction, research quality, and graduate prospects.'

const SRC = {
  general: ['Engineering', 'Complete University Guide 2027 — General Engineering', 'https://www.thecompleteuniversityguide.co.uk/league-tables/rankings/general-engineering', 32],
  mech: ['Engineering', 'Complete University Guide 2027 — Mechanical Engineering', 'https://www.thecompleteuniversityguide.co.uk/league-tables/rankings/mechanical-engineering', 74],
  civil: ['Engineering', 'Complete University Guide 2027 — Civil Engineering', 'https://www.thecompleteuniversityguide.co.uk/league-tables/rankings/civil-engineering', 59],
}

const DATA = {
  general: [
    ["University of Cambridge", 1],
    ["University of Bristol", 2],
    ["University of Oxford", 3],
    ["University of Sheffield", 4],
    ["University of Warwick", 5],
    ["Durham University", 6],
    ["Queen Mary University of London", 7],
    ["King's College London", 8],
    ["University of Exeter", 9],
    ["Cardiff University", 10],
    ["University of Nottingham", 11],
    ["Loughborough University", 12],
    ["University of Leicester", 13],
    ["Lancaster University", 14],
    ["University of Aberdeen", 15],
    ["University of Liverpool", 16],
    ["Liverpool John Moores University", 17],
    ["Ulster University", 18],
    ["University of Strathclyde", 19],
    ["London South Bank University", 22],
    ["Glasgow Caledonian University", 23],
    ["Bournemouth University", 24],
    ["University of York", 25],
    ["Nottingham Trent University", 27],
    ["Coventry University", 28],
    ["University of Essex", 29],
    ["University of East Anglia", 30],
    ["University of the West of Scotland", 31],
  ],
  mech: [
    ["Imperial College London", 1],
    ["University of Cambridge", 2],
    ["University of Oxford", 3],
    ["University of Sheffield", 4],
    ["University of Bath", 5],
    ["University of Bristol", 6],
    ["University College London", 7],
    ["University of Leeds", 8],
    ["University of Manchester", 9],
    ["Loughborough University", 10],
    ["University of Edinburgh", 11],
    ["University of Birmingham", 12],
    ["Queen's University Belfast", 13],
    ["University of Southampton", 14],
    ["University of Nottingham", 15],
    ["University of Glasgow", 16],
    ["University of Strathclyde", 17],
    ["University of Leicester", 18],
    ["Heriot-Watt University", 19],
    ["University of Surrey", 20],
    ["University of Exeter", 21],
    ["University of Liverpool", 22],
    ["Lancaster University", 23],
    ["Cardiff University", 24],
    ["University of Aberdeen", 25],
    ["Queen Mary University of London", 26],
    ["Newcastle University", 27],
    ["University of Dundee", 28],
    ["Swansea University", 29],
    ["Ulster University", 30],
    ["University of Sussex", 33],
    ["University of Plymouth", 36],
    ["Nottingham Trent University", 37],
    ["University of Brighton", 38],
    ["Robert Gordon University", 39],
    ["University of Hertfordshire", 40],
    ["London South Bank University", 41],
    ["University of Bradford", 42],
    ["University of Lincoln", 43],
    ["Sheffield Hallam University", 44],
    ["Oxford Brookes University", 45],
    ["University of Sunderland", 47],
    ["University of Portsmouth", 48],
    ["Manchester Metropolitan University", 49],
    ["Liverpool John Moores University", 50],
    ["University of Hull", 51],
    ["Bournemouth University", 52],
    ["Glasgow Caledonian University", 53],
    ["University of Huddersfield", 54],
    ["Coventry University", 55],
    ["City, University of London", 56],
    ["University of Chichester", 57],
    ["University of the West of Scotland", 58],
    ["Edinburgh Napier University", 59],
    ["University of East London", 60],
    ["University of Wolverhampton", 61],
    ["University of Derby", 62],
    ["University of Salford", 63],
    ["University of Kent", 64],
    ["Teesside University", 65],
    ["University of Greenwich", 66],
    ["University of Lancashire", 67],
    ["De Montfort University", 68],
    ["Anglia Ruskin University", 69],
    ["Birmingham City University", 70],
    ["Kingston University", 71],
    ["Canterbury Christ Church University", 73],
    ["University of Greater Manchester", 74],
  ],
  civil: [
    ["Imperial College London", 1],
    ["University of Oxford", 2],
    ["University of Cambridge", 3],
    ["University of Bristol", 4],
    ["University of Bath", 5],
    ["University of Sheffield", 6],
    ["University of Southampton", 7],
    ["University of Leeds", 8],
    ["University of Birmingham", 9],
    ["University of Manchester", 10],
    ["Queen's University Belfast", 11],
    ["University College London", 12],
    ["Loughborough University", 13],
    ["University of Liverpool", 14],
    ["University of Nottingham", 15],
    ["University of Glasgow", 16],
    ["University of Edinburgh", 17],
    ["University of Dundee", 18],
    ["University of Strathclyde", 19],
    ["Ulster University", 20],
    ["Newcastle University", 21],
    ["University of Exeter", 22],
    ["Cardiff University", 23],
    ["University of Surrey", 24],
    ["Heriot-Watt University", 25],
    ["Swansea University", 26],
    ["University of Plymouth", 27],
    ["University of Aberdeen", 30],
    ["University of Greenwich", 31],
    ["University of Salford", 32],
    ["Nottingham Trent University", 34],
    ["University of South Wales", 35],
    ["University of Portsmouth", 36],
    ["University of Reading", 37],
    ["Edinburgh Napier University", 38],
    ["Glasgow Caledonian University", 39],
    ["City, University of London", 40],
    ["University of Hertfordshire", 41],
    ["University of Bradford", 42],
    ["University of the West of Scotland", 43],
    ["University of Derby", 44],
    ["University of Brighton", 45],
    ["Coventry University", 46],
    ["Liverpool John Moores University", 47],
    ["Birmingham City University", 49],
    ["Kingston University", 50],
    ["University of West London", 51],
    ["Anglia Ruskin University", 52],
    ["Teesside University", 53],
    ["London South Bank University", 54],
    ["Abertay University", 55],
    ["University of Wolverhampton", 56],
    ["Leeds Beckett University", 57],
    ["University of Lancashire", 58],
    ["University of East London", 59],
  ],
}

let inserted = 0
for (const [key, rows] of Object.entries(DATA)) {
  const [field, source, url, pool] = SRC[key]
  for (const [name, rank] of rows) {
    const r = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'UK'`
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
