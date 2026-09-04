// Acceptance-rate pass for Singapore — method in
// migrate-add-estimated-acceptance-rate.mjs and lib/db/schema.ts.
//
// No Singapore university publishes an official acceptance rate. NUS, NTU
// and SMU publish "Indicative Grade Profiles" (the grade range of admitted
// students) rather than an admit rate. The figures below are Tier-4
// estimates from where admissions-data aggregators cluster, cross-checked;
// the note makes the estimate status explicit.
//
//   - NUS ~15%, NTU ~35%, SMU ~30% (the autonomous research universities)
//   - SUTD ~30% (small, design-and-tech)
//   - SIT ~50%, SUSS ~55% (applied / working-adult models — a different
//     admissions profile)
//   - private/foreign-partner campuses (JCU Singapore, PSB, SIM, UAS) ~65-85%
//
// Realigns baselineSelectivity to (100 - estimate). Never touches a row with
// a real actualAcceptanceRate.
//
// Usage: node --env-file=.env.local scripts/seed-acceptance-estimates-sg.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const D = 'A research estimate (aggregated from admissions-data sources), not a figure certified by the university; Singapore universities publish Indicative Grade Profiles rather than an acceptance rate.'

const EST = {
  'National University of Singapore': [15, 'admits on A-Level / IB / polytechnic-diploma results against published Indicative Grade Profiles; the most competitive programmes (Medicine, Law, Computer Science) are well below this.'],
  'Nanyang Technological University': [35, 'admits against published Indicative Grade Profiles; more accessible than NUS overall, tighter for its strongest engineering and business programmes.'],
  'Singapore Management University': [30, 'admits on results plus, for some schools, a written test and interview.'],
  'Singapore University of Technology and Design': [30, 'small, project-based design-and-technology university with a holistic application.'],
  'Singapore Institute of Technology': [50, 'an applied-degree university with integrated work placements; a different admissions profile from the research universities.'],
  'Singapore University of Social Sciences': [55, 'primary track is for working adults (2+ years of experience), alongside a smaller polytechnic/JC direct-entry pathway.'],
  'James Cook University Singapore': [70, 'the Singapore campus of an Australian university; broad-access admission.'],
  'PSB Academy': [80, 'a private institution delivering foreign-partner degrees; broad-access admission.'],
  'Singapore Institute of Management': [78, 'a private institution delivering foreign-partner degrees; broad-access admission.'],
  'University of the Arts Singapore': [45, 'an arts university (NAFA + LASALLE); admission is largely portfolio- or audition-based.'],
}

const rows = await sql`SELECT id, name, "actualAcceptanceRate" FROM universities WHERE country = 'SG'`
let n = 0
for (const r of rows) {
  if (r.actualAcceptanceRate != null) continue
  const [rate, why] = EST[r.name] ?? [60, 'broad-access admission.']
  const note = `Estimated ~${rate}% — ${why} ${D}`
  await sql`UPDATE universities SET "estimatedAcceptanceRate" = ${rate}, "acceptanceRateNote" = ${note}, "baselineSelectivity" = ${100 - rate} WHERE id = ${r.id}`
  n++
}
console.log(`Singapore: set estimated acceptance rate for ${n} universities.`)
