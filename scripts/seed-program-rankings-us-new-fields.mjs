// Seeds programRankings for the 6 new granular ACADEMIC_FIELDS added
// this round (Finance, Accounting, Marketing, Journalism, Political
// Science, Biology & Life Sciences) — matched against the FULL US catalog
// (not just the zero-coverage gap list used in rounds 3-11), since these
// fields are brand new and start with zero rows everywhere. Same College
// Factual Top-Ranked lists already pulled for rounds 8-9, re-matched by
// exact normalized name.
//
// Usage: node --env-file=.env.local scripts/seed-program-rankings-us-new-fields.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

function selectivityFromRank(rank) {
  return Math.max(15, Math.min(99, Math.round(100 - (rank - 1) * 1.1)))
}

const SRC = {
  "Finance": [
    "College Factual — 2026 Best Finance Schools (Top 50)",
    "https://www.collegefactual.com/majors/business-management-marketing-sales/finance-financial-management/finance/rankings/top-ranked/"
  ],
  "Accounting": [
    "College Factual — 2026 Best Accounting Schools (Top 50)",
    "https://www.collegefactual.com/majors/business-management-marketing-sales/accounting/rankings/top-ranked/"
  ],
  "Marketing": [
    "College Factual — 2026 Best Marketing Schools (Top 50)",
    "https://www.collegefactual.com/majors/business-management-marketing-sales/marketing/rankings/top-ranked/"
  ],
  "Journalism": [
    "College Factual — 2026 Best Journalism Schools (Top 50)",
    "https://www.collegefactual.com/majors/communication-journalism-media/journalism/rankings/top-ranked/"
  ],
  "Political Science": [
    "College Factual — 2026 Best Political Science & Government Schools (Top 25)",
    "https://www.collegefactual.com/majors/social-sciences/political-science-and-government/rankings/top-ranked/"
  ],
  "Biology & Life Sciences": [
    "College Factual — 2026 Best General Biology Schools (Top 50)",
    "https://www.collegefactual.com/majors/biological-biomedical-sciences/general-biology/rankings/top-ranked/"
  ]
}

const NOTE = "Peer-assessment or composite ranking, not an admissions-selectivity metric directly — programSelectivity here is our own derived scale for comparability with other rankings, not itself a published figure."

// [name in our catalog, field, rank]
const DATA = [
 [
  "Northwestern University",
  "Finance",
  1
 ],
 [
  "University of Chicago",
  "Finance",
  2
 ],
 [
  "University of Southern California",
  "Finance",
  3
 ],
 [
  "Washington University in St. Louis",
  "Finance",
  5
 ],
 [
  "Pennsylvania State University",
  "Finance",
  6
 ],
 [
  "Boston College",
  "Finance",
  7
 ],
 [
  "Wake Forest University",
  "Finance",
  8
 ],
 [
  "University of Notre Dame",
  "Finance",
  9
 ],
 [
  "University of Wisconsin-Madison",
  "Finance",
  10
 ],
 [
  "New York University",
  "Finance",
  11
 ],
 [
  "Santa Clara University",
  "Finance",
  12
 ],
 [
  "Binghamton University",
  "Finance",
  13
 ],
 [
  "Boston University",
  "Finance",
  14
 ],
 [
  "Southern Methodist University",
  "Finance",
  15
 ],
 [
  "Georgetown University",
  "Finance",
  16
 ],
 [
  "Texas Christian University",
  "Finance",
  17
 ],
 [
  "University of Florida",
  "Finance",
  18
 ],
 [
  "Brigham Young University",
  "Finance",
  19
 ],
 [
  "University of Texas at Austin",
  "Finance",
  20
 ],
 [
  "University of Minnesota Twin Cities",
  "Finance",
  21
 ],
 [
  "Texas A&M University",
  "Finance",
  22
 ],
 [
  "University of Maryland, College Park",
  "Finance",
  23
 ],
 [
  "James Madison University",
  "Finance",
  24
 ],
 [
  "University of Washington",
  "Finance",
  25
 ],
 [
  "Ohio State University",
  "Finance",
  26
 ],
 [
  "University of Utah",
  "Finance",
  27
 ],
 [
  "Miami University",
  "Finance",
  28
 ],
 [
  "University of Georgia",
  "Finance",
  29
 ],
 [
  "Elon University",
  "Finance",
  30
 ],
 [
  "Harvard University",
  "Finance",
  31
 ],
 [
  "University of Connecticut",
  "Finance",
  32
 ],
 [
  "Tulane University",
  "Finance",
  33
 ],
 [
  "Florida State University",
  "Finance",
  34
 ],
 [
  "Baylor University",
  "Finance",
  35
 ],
 [
  "George Washington University",
  "Finance",
  36
 ],
 [
  "Colorado State University",
  "Finance",
  37
 ],
 [
  "Rutgers University-New Brunswick",
  "Finance",
  38
 ],
 [
  "Clemson University",
  "Finance",
  40
 ],
 [
  "University of Delaware",
  "Finance",
  42
 ],
 [
  "Purdue University",
  "Finance",
  43
 ],
 [
  "University of Miami",
  "Finance",
  44
 ],
 [
  "Michigan State University",
  "Finance",
  46
 ],
 [
  "Arizona State University",
  "Finance",
  47
 ],
 [
  "Columbia University",
  "Finance",
  48
 ],
 [
  "University of Arizona",
  "Finance",
  49
 ],
 [
  "University of Virginia",
  "Accounting",
  1
 ],
 [
  "New York University",
  "Accounting",
  2
 ],
 [
  "University of Notre Dame",
  "Accounting",
  3
 ],
 [
  "Boston College",
  "Accounting",
  5
 ],
 [
  "Wake Forest University",
  "Accounting",
  6
 ],
 [
  "Pennsylvania State University",
  "Accounting",
  7
 ],
 [
  "University of Texas at Austin",
  "Accounting",
  8
 ],
 [
  "Santa Clara University",
  "Accounting",
  9
 ],
 [
  "Georgetown University",
  "Accounting",
  10
 ],
 [
  "University of Wisconsin-Madison",
  "Accounting",
  11
 ],
 [
  "Washington University in St. Louis",
  "Accounting",
  12
 ],
 [
  "University of Maryland, College Park",
  "Accounting",
  13
 ],
 [
  "Indiana University Bloomington",
  "Accounting",
  14
 ],
 [
  "Vanderbilt University",
  "Accounting",
  15
 ],
 [
  "University of Connecticut",
  "Accounting",
  16
 ],
 [
  "Texas A&M University",
  "Accounting",
  17
 ],
 [
  "Baylor University",
  "Accounting",
  19
 ],
 [
  "University of Minnesota Twin Cities",
  "Accounting",
  21
 ],
 [
  "Binghamton University",
  "Accounting",
  22
 ],
 [
  "Rutgers University-New Brunswick",
  "Accounting",
  23
 ],
 [
  "Texas Christian University",
  "Accounting",
  24
 ],
 [
  "University of Richmond",
  "Accounting",
  25
 ],
 [
  "Michigan State University",
  "Accounting",
  26
 ],
 [
  "The College of New Jersey",
  "Accounting",
  27
 ],
 [
  "Lehigh University",
  "Accounting",
  28
 ],
 [
  "Florida State University",
  "Accounting",
  29
 ],
 [
  "Loyola Marymount University",
  "Accounting",
  30
 ],
 [
  "Southern Methodist University",
  "Accounting",
  32
 ],
 [
  "Ohio State University",
  "Accounting",
  33
 ],
 [
  "University of Florida",
  "Accounting",
  34
 ],
 [
  "Northeastern University",
  "Accounting",
  35
 ],
 [
  "University of Pennsylvania",
  "Accounting",
  36
 ],
 [
  "Chapman University",
  "Accounting",
  37
 ],
 [
  "North Carolina State University",
  "Accounting",
  38
 ],
 [
  "University of Washington",
  "Accounting",
  39
 ],
 [
  "Purdue University",
  "Accounting",
  40
 ],
 [
  "James Madison University",
  "Accounting",
  41
 ],
 [
  "California State University, Long Beach",
  "Accounting",
  42
 ],
 [
  "Elon University",
  "Accounting",
  43
 ],
 [
  "University of Delaware",
  "Accounting",
  44
 ],
 [
  "Fordham University",
  "Accounting",
  45
 ],
 [
  "Arizona State University",
  "Accounting",
  46
 ],
 [
  "Washington and Lee University",
  "Accounting",
  47
 ],
 [
  "University of Iowa",
  "Accounting",
  48
 ],
 [
  "George Mason University",
  "Accounting",
  49
 ],
 [
  "University of Colorado Boulder",
  "Accounting",
  50
 ],
 [
  "University of Chicago",
  "Marketing",
  1
 ],
 [
  "University of Southern California",
  "Marketing",
  2
 ],
 [
  "Washington University in St. Louis",
  "Marketing",
  3
 ],
 [
  "University of Wisconsin-Madison",
  "Marketing",
  4
 ],
 [
  "University of Pennsylvania",
  "Marketing",
  5
 ],
 [
  "Texas Christian University",
  "Marketing",
  6
 ],
 [
  "Harvard University",
  "Marketing",
  7
 ],
 [
  "Pennsylvania State University",
  "Marketing",
  8
 ],
 [
  "University of Maryland, College Park",
  "Marketing",
  9
 ],
 [
  "University of Notre Dame",
  "Marketing",
  10
 ],
 [
  "Georgetown University",
  "Marketing",
  11
 ],
 [
  "Southern Methodist University",
  "Marketing",
  12
 ],
 [
  "Purdue University",
  "Marketing",
  14
 ],
 [
  "University of Florida",
  "Marketing",
  15
 ],
 [
  "James Madison University",
  "Marketing",
  16
 ],
 [
  "University of Minnesota Twin Cities",
  "Marketing",
  17
 ],
 [
  "Ohio State University",
  "Marketing",
  18
 ],
 [
  "Boston College",
  "Marketing",
  19
 ],
 [
  "University of Texas at Austin",
  "Marketing",
  20
 ],
 [
  "University of Georgia",
  "Marketing",
  22
 ],
 [
  "Miami University",
  "Marketing",
  23
 ],
 [
  "Boston University",
  "Marketing",
  24
 ],
 [
  "Santa Clara University",
  "Marketing",
  25
 ],
 [
  "Florida State University",
  "Marketing",
  26
 ],
 [
  "Texas A&M University",
  "Marketing",
  27
 ],
 [
  "University of Washington",
  "Marketing",
  28
 ],
 [
  "Michigan State University",
  "Marketing",
  29
 ],
 [
  "University of Delaware",
  "Marketing",
  30
 ],
 [
  "Colorado State University",
  "Marketing",
  31
 ],
 [
  "Elon University",
  "Marketing",
  32
 ],
 [
  "Lehigh University",
  "Marketing",
  33
 ],
 [
  "Rutgers University-New Brunswick",
  "Marketing",
  34
 ],
 [
  "University of Connecticut",
  "Marketing",
  35
 ],
 [
  "Tulane University",
  "Marketing",
  36
 ],
 [
  "University of Miami",
  "Marketing",
  37
 ],
 [
  "Binghamton University",
  "Marketing",
  38
 ],
 [
  "Bentley University",
  "Marketing",
  39
 ],
 [
  "Arizona State University",
  "Marketing",
  40
 ],
 [
  "Brigham Young University",
  "Marketing",
  41
 ],
 [
  "Baylor University",
  "Marketing",
  43
 ],
 [
  "Drake University",
  "Marketing",
  44
 ],
 [
  "Washington State University",
  "Marketing",
  45
 ],
 [
  "University of San Diego",
  "Marketing",
  46
 ],
 [
  "University of South Carolina",
  "Marketing",
  47
 ],
 [
  "University of Oklahoma",
  "Marketing",
  48
 ],
 [
  "University of Arizona",
  "Marketing",
  50
 ],
 [
  "Pennsylvania State University",
  "Journalism",
  1
 ],
 [
  "University of Southern California",
  "Journalism",
  2
 ],
 [
  "University of Minnesota Twin Cities",
  "Journalism",
  3
 ],
 [
  "Indiana University Bloomington",
  "Journalism",
  4
 ],
 [
  "University of Wisconsin-Madison",
  "Journalism",
  5
 ],
 [
  "California Polytechnic State University, San Luis Obispo",
  "Journalism",
  6
 ],
 [
  "University of Washington",
  "Journalism",
  7
 ],
 [
  "University of Florida",
  "Journalism",
  8
 ],
 [
  "University of Colorado Boulder",
  "Journalism",
  9
 ],
 [
  "Southern Methodist University",
  "Journalism",
  10
 ],
 [
  "Boston University",
  "Journalism",
  12
 ],
 [
  "Washington and Lee University",
  "Journalism",
  13
 ],
 [
  "University of Georgia",
  "Journalism",
  14
 ],
 [
  "Georgetown University",
  "Journalism",
  15
 ],
 [
  "New York University",
  "Journalism",
  16
 ],
 [
  "Loyola Marymount University",
  "Journalism",
  17
 ],
 [
  "University of Maryland, College Park",
  "Journalism",
  18
 ],
 [
  "Harvard University",
  "Journalism",
  19
 ],
 [
  "George Washington University",
  "Journalism",
  20
 ],
 [
  "University of Texas at Austin",
  "Journalism",
  21
 ],
 [
  "Chapman University",
  "Journalism",
  22
 ],
 [
  "Arizona State University",
  "Journalism",
  23
 ],
 [
  "University of Kansas",
  "Journalism",
  24
 ],
 [
  "San Jose State University",
  "Journalism",
  25
 ],
 [
  "Ohio State University",
  "Journalism",
  27
 ],
 [
  "University of Central Florida",
  "Journalism",
  28
 ],
 [
  "Columbia University",
  "Journalism",
  29
 ],
 [
  "University of Miami",
  "Journalism",
  30
 ],
 [
  "Texas Christian University",
  "Journalism",
  31
 ],
 [
  "Baylor University",
  "Journalism",
  33
 ],
 [
  "San Francisco State University",
  "Journalism",
  34
 ],
 [
  "Elon University",
  "Journalism",
  35
 ],
 [
  "University of Arkansas",
  "Journalism",
  36
 ],
 [
  "University of Wisconsin-Oshkosh",
  "Journalism",
  37
 ],
 [
  "Washington State University",
  "Journalism",
  38
 ],
 [
  "Quinnipiac University",
  "Journalism",
  39
 ],
 [
  "University of Arizona",
  "Journalism",
  40
 ],
 [
  "Northeastern University",
  "Journalism",
  41
 ],
 [
  "High Point University",
  "Journalism",
  42
 ],
 [
  "Michigan State University",
  "Journalism",
  45
 ],
 [
  "Emerson College",
  "Journalism",
  46
 ],
 [
  "University of Connecticut",
  "Journalism",
  47
 ],
 [
  "The College of New Jersey",
  "Journalism",
  48
 ],
 [
  "California State University, Long Beach",
  "Journalism",
  50
 ],
 [
  "Georgetown University",
  "Political Science",
  1
 ],
 [
  "Johns Hopkins University",
  "Political Science",
  2
 ],
 [
  "Duke University",
  "Political Science",
  3
 ],
 [
  "University of Chicago",
  "Political Science",
  4
 ],
 [
  "Harvard University",
  "Political Science",
  5
 ],
 [
  "Dartmouth College",
  "Political Science",
  6
 ],
 [
  "Northwestern University",
  "Political Science",
  7
 ],
 [
  "Vanderbilt University",
  "Political Science",
  8
 ],
 [
  "University of Pennsylvania",
  "Political Science",
  9
 ],
 [
  "Pennsylvania State University",
  "Political Science",
  10
 ],
 [
  "Stanford University",
  "Political Science",
  11
 ],
 [
  "Boston College",
  "Political Science",
  12
 ],
 [
  "Colgate University",
  "Political Science",
  13
 ],
 [
  "Tufts University",
  "Political Science",
  14
 ],
 [
  "Yale University",
  "Political Science",
  15
 ],
 [
  "Bowdoin College",
  "Political Science",
  16
 ],
 [
  "Washington University in St. Louis",
  "Political Science",
  17
 ],
 [
  "University of California, Santa Barbara",
  "Political Science",
  18
 ],
 [
  "Wesleyan University",
  "Political Science",
  19
 ],
 [
  "Barnard College",
  "Political Science",
  20
 ],
 [
  "Lafayette College",
  "Political Science",
  21
 ],
 [
  "University of North Carolina at Chapel Hill",
  "Political Science",
  22
 ],
 [
  "Brown University",
  "Political Science",
  23
 ],
 [
  "University of California, Berkeley",
  "Political Science",
  24
 ],
 [
  "Princeton University",
  "Political Science",
  25
 ],
 [
  "Johns Hopkins University",
  "Biology & Life Sciences",
  1
 ],
 [
  "Rice University",
  "Biology & Life Sciences",
  2
 ],
 [
  "Pennsylvania State University",
  "Biology & Life Sciences",
  3
 ],
 [
  "Colby College",
  "Biology & Life Sciences",
  6
 ],
 [
  "Purdue University",
  "Biology & Life Sciences",
  8
 ],
 [
  "San Francisco State University",
  "Biology & Life Sciences",
  9
 ],
 [
  "Bowdoin College",
  "Biology & Life Sciences",
  10
 ],
 [
  "Tufts University",
  "Biology & Life Sciences",
  11
 ],
 [
  "University of Wisconsin-Madison",
  "Biology & Life Sciences",
  12
 ],
 [
  "Northwestern University",
  "Biology & Life Sciences",
  13
 ],
 [
  "Loma Linda University",
  "Biology & Life Sciences",
  14
 ],
 [
  "University of California, Berkeley",
  "Biology & Life Sciences",
  16
 ],
 [
  "San Jose State University",
  "Biology & Life Sciences",
  17
 ],
 [
  "Boston College",
  "Biology & Life Sciences",
  18
 ],
 [
  "University of California, Santa Barbara",
  "Biology & Life Sciences",
  19
 ],
 [
  "University of Chicago",
  "Biology & Life Sciences",
  20
 ],
 [
  "Davidson College",
  "Biology & Life Sciences",
  21
 ],
 [
  "Lafayette College",
  "Biology & Life Sciences",
  22
 ],
 [
  "Massachusetts College of Pharmacy and Health Sciences",
  "Biology & Life Sciences",
  23
 ],
 [
  "New York University",
  "Biology & Life Sciences",
  24
 ],
 [
  "Skidmore College",
  "Biology & Life Sciences",
  25
 ],
 [
  "Hamilton College",
  "Biology & Life Sciences",
  26
 ],
 [
  "Stanford University",
  "Biology & Life Sciences",
  27
 ],
 [
  "Duke University",
  "Biology & Life Sciences",
  28
 ],
 [
  "Butler University",
  "Biology & Life Sciences",
  30
 ],
 [
  "University of California, Davis",
  "Biology & Life Sciences",
  31
 ],
 [
  "Vanderbilt University",
  "Biology & Life Sciences",
  32
 ],
 [
  "Wesleyan University",
  "Biology & Life Sciences",
  34
 ],
 [
  "Wellesley College",
  "Biology & Life Sciences",
  36
 ],
 [
  "University of Tulsa",
  "Biology & Life Sciences",
  38
 ],
 [
  "Harvard University",
  "Biology & Life Sciences",
  39
 ],
 [
  "Georgetown University",
  "Biology & Life Sciences",
  40
 ],
 [
  "University of Minnesota Twin Cities",
  "Biology & Life Sciences",
  41
 ],
 [
  "Indiana University Bloomington",
  "Biology & Life Sciences",
  42
 ],
 [
  "University of California, San Diego",
  "Biology & Life Sciences",
  43
 ],
 [
  "University of California, Santa Cruz",
  "Biology & Life Sciences",
  44
 ],
 [
  "University of Pennsylvania",
  "Biology & Life Sciences",
  45
 ],
 [
  "University of Washington",
  "Biology & Life Sciences",
  46
 ],
 [
  "San Diego State University",
  "Biology & Life Sciences",
  47
 ],
 [
  "Santa Clara University",
  "Biology & Life Sciences",
  49
 ],
 [
  "Columbia University",
  "Biology & Life Sciences",
  50
 ]
]

let inserted = 0
const skipped = []

for (const [name, field, rank] of DATA) {
  const [source, url] = SRC[field]
  const rows = await sql`SELECT id FROM universities WHERE name = ${name} AND country = 'US'`
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
