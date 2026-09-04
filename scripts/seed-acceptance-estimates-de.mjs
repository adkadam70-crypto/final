// Acceptance-rate pass for Germany (all tranches) — method in
// migrate-add-estimated-acceptance-rate.mjs and lib/db/schema.ts.
//
// RESULT: every German row here is TIER 5 — no institution-wide acceptance
// rate exists to report or credibly estimate.
//
//   - Public universities: admit each subject separately against its own
//     Numerus Clausus grade cutoff (which moves every semester) and admit
//     all qualified applicants to subjects with no cutoff. No university-level
//     applicant-vs-admit figure exists. The "~8-10% TUM / ~23% RWTH" numbers
//     on study-abroad sites are uncited third-party estimates that disagree
//     with each other and with the universities' own position — they fail
//     the >=2-independent-sources-within-tolerance bar.
//   - Universities of applied sciences (FH/HAW/TH): admit per programme via a
//     grade cutoff or an internal selection procedure (Auswahlverfahren);
//     likewise no institution-wide rate.
//   - Private institutions (WHU, Frankfurt School, ESMT, Bucerius,
//     Witten/Herdecke, Constructor, UdK): selective, but each was checked and
//     none publishes an undergraduate admit rate; circulating figures are
//     graduate/MBA numbers or uncited. Also Tier 5.
//   - Charité: human medicine is allocated nationally via Hochschulstart.
//   - FernUniversität Hagen: open-enrolment distance university.
//
// Sets acceptanceRateNote only. estimatedAcceptanceRate / actualAcceptanceRate
// stay NULL. baselineSelectivity (from the seed-universities-de*.mjs passes)
// is untouched — it stays a curated estimate.
//
// Data-driven: updates every country='DE' row that has no real
// actualAcceptanceRate, classifying by name. Safe to re-run.
//
// Usage: node --env-file=.env.local scripts/seed-acceptance-estimates-de.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const NOTE_PUBLIC =
  'No official acceptance rate — German public universities admit each subject separately against its own Numerus Clausus grade cutoff (which shifts every semester), and admit all qualified applicants to subjects with no cutoff, so no single institution-wide rate is published or meaningfully estimable.'

const NOTE_FH =
  'No official acceptance rate — German universities of applied sciences admit each programme separately (a grade cutoff or an internal selection procedure that changes each intake), so no single institution-wide rate is published or meaningfully estimable.'

const NOTE_PRIVATE =
  'No official acceptance rate published — this is a selective private institution (admission via aptitude test, interview and/or portfolio), but it releases no undergraduate admit-rate figure and no credible external estimate exists.'

const NOTE_CHARITE =
  'No official acceptance rate — human medicine places are allocated nationally through Hochschulstart against a very high Abitur cutoff plus the TMS aptitude test, not an institution-wide admit rate.'

const NOTE_FERNUNI =
  'No official acceptance rate — FernUniversität in Hagen is an open-enrolment state distance university: anyone holding the entrance qualification (or, for some programmes, relevant professional experience) can enrol.'

const NOTE_ARTS =
  'No official acceptance rate published — admission turns on a portfolio and/or audition assessed by the faculty, not a grade cutoff or a published admit rate.'

const FH_NAMES = new Set([
  'TH Köln', 'Munich University of Applied Sciences', 'Hamburg University of Applied Sciences',
  'Frankfurt University of Applied Sciences', 'HTW Berlin', 'Berliner Hochschule für Technik',
  'Berlin School of Economics and Law', 'Darmstadt University of Applied Sciences',
  'Nuremberg Institute of Technology', 'OTH Regensburg', 'Karlsruhe University of Applied Sciences',
  'Reutlingen University', 'Pforzheim University', 'FH Aachen',
  'Bonn-Rhein-Sieg University of Applied Sciences', 'City University of Applied Sciences Bremen',
  'Esslingen University of Applied Sciences', 'Aalen University of Applied Sciences',
  'Technische Hochschule Mittelhessen', 'HTWK Leipzig', 'Hannover University of Applied Sciences and Arts',
  'Osnabrück University of Applied Sciences', 'Deggendorf Institute of Technology', 'HTWG Konstanz',
])

const PRIVATE_NAMES = new Set([
  'Constructor University', 'WHU – Otto Beisheim School of Management',
  'Frankfurt School of Finance & Management', 'ESMT Berlin', 'Bucerius Law School',
  'Witten/Herdecke University',
])

const ARTS_NAMES = new Set(['Berlin University of the Arts', 'Bauhaus-University Weimar'])

const OVERRIDES = {
  'Charité – Universitätsmedizin Berlin': NOTE_CHARITE,
  'FernUniversität in Hagen': NOTE_FERNUNI,
  'German Sport University Cologne': 'No official acceptance rate — admission requires passing the sport-aptitude test (Sporteignungsprüfung); the university publishes no overall admit-rate figure.',
}

function noteFor(name) {
  if (OVERRIDES[name]) return OVERRIDES[name]
  if (ARTS_NAMES.has(name)) return NOTE_ARTS
  if (PRIVATE_NAMES.has(name)) return NOTE_PRIVATE
  if (FH_NAMES.has(name)) return NOTE_FH
  return NOTE_PUBLIC
}

const rows = await sql`SELECT id, name, "actualAcceptanceRate" FROM universities WHERE country = 'DE'`
let updated = 0
for (const r of rows) {
  if (r.actualAcceptanceRate != null) continue // never touch a row with a real rate
  await sql`UPDATE universities SET "acceptanceRateNote" = ${noteFor(r.name)} WHERE id = ${r.id}`
  updated++
}

console.log(`Set acceptanceRateNote for ${updated} German universities (all Tier 5 — no rate).`)
