// Seeds programRankings for the newest ACADEMIC_FIELDS addition, "Data
// Science & Analytics" — matched against the full US catalog (brand new
// field, zero existing rows). Same College Factual Top-Ranked pattern as
// scripts/seed-program-rankings-us-new-fields.mjs.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-us-datasci.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank) {
  return Math.max(15, Math.min(99, Math.round(100 - (rank - 1) * 1.1)))
}

const SOURCE = 'College Factual — 2026 Best Data Science Schools (Top 50)'
const URL = 'https://www.collegefactual.com/majors/multi-interdisciplinary-studies/data-science/rankings/top-ranked/'
const FIELD = 'Data Science & Analytics'
const NOTE = 'Peer-assessment or composite ranking, not an admissions-selectivity metric directly — programSelectivity here is our own derived scale for comparability with other rankings, not itself a published figure.'

const DATA = [
["Northwestern University",1],["Georgia Institute of Technology",2],["Virginia Polytechnic Institute and State University",3],["University of Texas at Austin",4],["Duke University",5],["University of Virginia",6],["Dartmouth College",7],["San Jose State University",8],["University of California, San Diego",9],["Pennsylvania State University",10],["University of Wisconsin-Madison",11],["Rice University",12],["Columbia University",13],["Carnegie Mellon University",14],["New Jersey Institute of Technology",15],["Worcester Polytechnic Institute",16],["Texas A&M University",17],["Colorado School of Mines",18],["University of Massachusetts at Amherst",19],["University of California, Santa Barbara",20],["University of Delaware",21],["Denison University",22],["Lehigh University",23],["University of the Pacific",24],["Lewis University",25],["American University",26],["Michigan Technological University",27],["Fordham University",28],["Tufts University",29],["Bradley University",30],["University of Michigan",31],["University of Texas at Dallas",32],["Saint Joseph's University",33],["New York University",34],["Brown University",35],["William & Mary",36],["University of Minnesota Twin Cities",37],["Mount Holyoke College",38],["Florida State University",39],["John Carroll University",40],["Smith College",41],["Maryville University of Saint Louis",42],["Grand Valley State University",43],["University of Vermont",44],["Clarkson University",45],["Florida Polytechnic University",46],["South Dakota State University",47],["Arizona State University",48],["Southern Methodist University",49],["University of Illinois at Urbana-Champaign",50],
]

let inserted = 0
const skipped = []

for (const [name, rank] of DATA) {
  const rows = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'US'`
  if (rows.length === 0) {
    skipped.push(name)
    continue
  }
  const universityId = rows[0].id
  const existing = await sql`SELECT id FROM "programRankings" WHERE "universityId" = ${universityId} AND field = ${FIELD} AND "rankSource" = ${SOURCE}`
  if (existing.length > 0) continue

  await sql`
    INSERT INTO "programRankings" ("universityId", field, "rankValue", "rankSource", "rankSourceUrl", "programSelectivity", notes)
    VALUES (${universityId}, ${FIELD}, ${rank}, ${SOURCE}, ${URL}, ${selectivityFromRank(rank)}, ${NOTE})
  `
  inserted++
}

console.log(`Inserted ${inserted} program-ranking rows.`)
if (skipped.length) console.log(`Could not match: ${skipped.join(', ')}`)
