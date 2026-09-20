// UK — Complete University Guide 2027 Economics and Politics league
// tables, matched against the existing catalog only.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-uk-econ-politics.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank, poolSize) {
  const scaled = (rank / poolSize) * 150
  return Math.max(15, Math.min(99, Math.round(100 - (scaled - 1) * 1.1)))
}

const NOTE = 'Complete University Guide subject league table, based on entry standards, student satisfaction, research quality, and graduate prospects.'

const SRC = {
  econ: ['Economics', 'Complete University Guide 2027 — Economics', 'https://www.thecompleteuniversityguide.co.uk/league-tables/rankings/economics', 76],
  pol: ['Political Science', 'Complete University Guide 2027 — Politics', 'https://www.thecompleteuniversityguide.co.uk/league-tables/rankings/politics', 77],
}

const DATA = {
  econ: [
    ["University of Cambridge", 1],
    ["University of Warwick", 2],
    ["University of Oxford", 3],
    ["Durham University", 5],
    ["University of St Andrews", 6],
    ["University College London", 7],
    ["University of Bath", 8],
    ["University of Exeter", 9],
    ["King's College London", 10],
    ["University of Nottingham", 11],
    ["University of Birmingham", 12],
    ["University of Bristol", 13],
    ["University of Edinburgh", 14],
    ["University of Leeds", 15],
    ["Lancaster University", 16],
    ["Loughborough University", 17],
    ["University of Sheffield", 18],
    ["University of Glasgow", 19],
    ["University of Strathclyde", 20],
    ["University of Manchester", 21],
    ["Cardiff University", 22],
    ["University of York", 23],
    ["University of Southampton", 24],
    ["Queen's University Belfast", 25],
    ["University of Liverpool", 27],
    ["University of Surrey", 28],
    ["Queen Mary University of London", 29],
    ["University of East Anglia", 30],
    ["Newcastle University", 31],
    ["Heriot-Watt University", 32],
    ["University of Stirling", 33],
    ["University of Dundee", 34],
    ["University of Leicester", 35],
    ["Swansea University", 36],
    ["Royal Holloway, University of London", 37],
    ["University of Plymouth", 38],
    ["University of Reading", 39],
    ["Ulster University", 40],
    ["University of Huddersfield", 41],
    ["University of Aberdeen", 42],
    ["University of Sussex", 43],
    ["University of Brighton", 44],
    ["University of Kent", 45],
    ["City, University of London", 46],
    ["Nottingham Trent University", 47],
    ["Bournemouth University", 48],
    ["SOAS University of London", 49],
    ["University of Essex", 50],
    ["Oxford Brookes University", 51],
    ["University of Derby", 52],
    ["Cardiff Metropolitan University", 53],
    ["Keele University", 54],
    ["University of Bradford", 55],
    ["Manchester Metropolitan University", 56],
    ["Sheffield Hallam University", 57],
    ["University of Portsmouth", 58],
    ["University of Lincoln", 59],
    ["Kingston University", 60],
    ["Aberystwyth University", 61],
    ["University of Hertfordshire", 64],
    ["University of Greenwich", 65],
    ["Coventry University", 66],
    ["De Montfort University", 68],
    ["Leeds Beckett University", 69],
    ["Birmingham City University", 70],
    ["London Metropolitan University", 71],
    ["Middlesex University", 73],
    ["University of Roehampton", 74],
    ["Goldsmiths, University of London", 75],
    ["London South Bank University", 76],
  ],
  pol: [
    ["University of Oxford", 1],
    ["University of Cambridge", 3],
    ["University of St Andrews", 4],
    ["University College London", 5],
    ["Durham University", 6],
    ["University of Warwick", 7],
    ["King's College London", 8],
    ["University of Bath", 9],
    ["University of Bristol", 10],
    ["University of Sheffield", 11],
    ["University of York", 12],
    ["University of Exeter", 13],
    ["University of Edinburgh", 14],
    ["University of Manchester", 15],
    ["University of Strathclyde", 16],
    ["University of Glasgow", 17],
    ["Newcastle University", 18],
    ["University of Birmingham", 19],
    ["Lancaster University", 20],
    ["University of Nottingham", 21],
    ["University of Leeds", 22],
    ["Loughborough University", 23],
    ["Queen's University Belfast", 24],
    ["Queen Mary University of London", 25],
    ["University of Stirling", 26],
    ["University of Reading", 27],
    ["Royal Holloway, University of London", 28],
    ["University of Southampton", 29],
    ["SOAS University of London", 30],
    ["Cardiff University", 31],
    ["University of Surrey", 32],
    ["University of Sussex", 33],
    ["University of Liverpool", 34],
    ["Aberystwyth University", 35],
    ["University of East Anglia", 36],
    ["University of Aberdeen", 38],
    ["University of Leicester", 39],
    ["University of Dundee", 40],
    ["University of Lincoln", 41],
    ["University of Essex", 42],
    ["Edge Hill University", 44],
    ["Swansea University", 45],
    ["University of Plymouth", 46],
    ["Bournemouth University", 47],
    ["Keele University", 48],
    ["University of Hull", 49],
    ["Nottingham Trent University", 50],
    ["University of Portsmouth", 51],
    ["Canterbury Christ Church University", 52],
    ["City, University of London", 53],
    ["University of Kent", 54],
    ["University of Salford", 55],
    ["Oxford Brookes University", 56],
    ["Coventry University", 58],
    ["Manchester Metropolitan University", 60],
    ["Leeds Beckett University", 61],
    ["Sheffield Hallam University", 62],
    ["University of Winchester", 63],
    ["University of Brighton", 65],
    ["Liverpool John Moores University", 66],
    ["De Montfort University", 67],
    ["University of Greenwich", 68],
    ["Liverpool Hope University", 69],
    ["Ulster University", 70],
    ["Goldsmiths, University of London", 71],
    ["Northeastern University – London", 72],
    ["University of Chester", 73],
    ["Bath Spa University", 74],
    ["York St John University", 75],
    ["London Metropolitan University", 76],
    ["London South Bank University", 77],
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
