// Acceptance-rate pass for France (all tranches) — method in
// migrate-add-estimated-acceptance-rate.mjs and lib/db/schema.ts.
//
// Unlike Germany, France supports credible estimates for a large share of
// rows, from two kinds of source:
//   - Parcoursup open data (data.enseignementsup-recherche.gouv.fr): the
//     "taux d'accès" per formation, Ministry-published. Non-selective licence
//     programmes sit high (~80-95%); selective post-bac schools publish a
//     real, lower figure. Institution-level numbers here aggregate across a
//     school's programmes — hence an ESTIMATE, not an official rate.
//   - Concours result statistics for the grandes écoles recruited after
//     classes préparatoires (SIGEM / BCE / Ecricome for business; the various
//     engineering concours). For prépa-entry schools the concours "success
//     rate" is measured on an already heavily pre-selected pool and is not
//     comparable to a normal applicant-to-admit rate — those stay Tier 5
//     with an explanatory note rather than a number. A few high-profile ones
//     (HEC, ESSEC, ESCP, EDHEC, emlyon) do publish a concours admit share
//     that is widely cited, so they get an estimate WITH the "via concours"
//     caveat spelled out in the note.
//
// Every estimate: sets estimatedAcceptanceRate + acceptanceRateNote and
// realigns baselineSelectivity to (100 - estimate). Tier 5: acceptanceRateNote
// only. Never touches a row that already has a real actualAcceptanceRate.
//
// Usage: node --env-file=.env.local scripts/seed-acceptance-estimates-fr.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const D = 'A research estimate, not a figure certified by the school.'

// Per-school estimates with a bespoke note.
const ESTIMATES = {
  'Sciences Po': { rate: 12, note: `Estimated ~12% — 1,865 admitted from 15,586 applicants for the 2024 Bachelor (Collège universitaire) intake; a second source puts recent cycles nearer 8-10%. ${D}` },
  'Université Paris-Dauphine – PSL': { rate: 18, note: `Estimated ~18% — Dauphine selects on the high-school record via Parcoursup (far more competitive than a standard licence); admissions-data aggregators put its core programs around 15-20%. ${D}` },
  // INSA group — post-bac engineering via Parcoursup
  'INSA Lyon': { rate: 13, note: `Estimated ~13% — post-bac engineering admission via Parcoursup on the school record; the INSA group reports roughly 1 admit per 8 applicants for the main 5-year track (later entry points are less competitive). ${D}` },
  'INSA Toulouse': { rate: 15, note: `Estimated ~15% — post-bac engineering via Parcoursup (INSA group common procedure); taux d'accès typically in this range for the 5-year track. ${D}` },
  'INSA Rennes': { rate: 17, note: `Estimated ~17% — post-bac engineering via Parcoursup (INSA group); taux d'accès typically in this range. ${D}` },
  'INSA Strasbourg': { rate: 18, note: `Estimated ~18% — post-bac engineering/architecture via Parcoursup (INSA group); taux d'accès typically in this range. ${D}` },
  'INSA Rouen Normandie': { rate: 20, note: `Estimated ~20% — post-bac engineering via Parcoursup (INSA group); taux d'accès typically in this range. ${D}` },
  // Universités de technologie — post-bac
  'Université de Technologie de Compiègne': { rate: 16, note: `Estimated ~16% — post-bac admission via Parcoursup on the school record; UTC's taux d'accès for the engineering track is typically in this range. ${D}` },
  'Université de Technologie de Troyes': { rate: 22, note: `Estimated ~22% — post-bac admission via Parcoursup; UTT's taux d'accès is typically in this range. ${D}` },
  'Université de Technologie de Belfort-Montbéliard': { rate: 28, note: `Estimated ~28% — post-bac admission via Parcoursup; UTBM's taux d'accès is typically in this range. ${D}` },
  // Private post-bac engineering
  'EPITA': { rate: 45, note: `Estimated ~45% — private post-bac computer-science school; admission on the school record (with a test/interview) via Parcoursup, taux d'accès typically in this range. ${D}` },
  'EFREI Paris': { rate: 50, note: `Estimated ~50% — private post-bac digital-engineering school; Parcoursup taux d'accès typically in this range. ${D}` },
  'ESILV': { rate: 48, note: `Estimated ~48% — private post-bac engineering school (Pôle Léonard de Vinci); Parcoursup taux d'accès typically in this range. ${D}` },
  'Polytech Network': { rate: 35, note: `Estimated ~35% — the Polytech network's post-bac track (PeiP) recruits via Parcoursup; taux d'accès varies by campus but typically sits around this level. ${D}` },
  // Sciences Po regional IEPs — common post-bac concours
  'University of Strasbourg IEP / Sciences Po Strasbourg': { rate: 20, note: `Estimated ~20% — the seven-IEP common post-bac entrance exam (concours commun); the network reports admit rates in this range. ${D}` },
  'Sciences Po Lyon': { rate: 20, note: `Estimated ~20% — the common post-bac IEP entrance exam; admit rates across the network sit around this level. ${D}` },
  'Sciences Po Bordeaux': { rate: 18, note: `Estimated ~18% — the common post-bac IEP entrance exam; Bordeaux is among the more sought-after campuses. ${D}` },
  // Business schools that publish a widely-cited concours admit share
  'HEC Paris': { rate: 9, note: `Estimated ~9% — the Grande École (master in management) is entered via the post-prépa concours (BCE); HEC admits roughly this share of the candidates who sit its concours. Selection also happened at prépa entry two years earlier. ${D}` },
  'ESSEC Business School': { rate: 11, note: `Estimated ~11% — entered via the post-prépa BCE concours; ESSEC's admit share of concours candidates sits around this level. ${D}` },
  'ESCP Business School': { rate: 11, note: `Estimated ~11% — entered via the post-prépa BCE concours; ESCP's admit share of concours candidates sits around this level. ${D}` },
  'EDHEC Business School': { rate: 18, note: `Estimated ~18% — Programme Grande École via the post-prépa BCE concours (plus a separate post-bac BBA); admit share around this level. ${D}` },
  'emlyon business school': { rate: 18, note: `Estimated ~18% — Programme Grande École via the post-prépa BCE concours (plus post-bac tracks); admit share around this level. ${D}` },
  'SKEMA Business School': { rate: 25, note: `Estimated ~25% — Programme Grande École via post-prépa concours plus a large post-bac intake; combined admit share around this level. ${D}` },
  'NEOMA Business School': { rate: 30, note: `Estimated ~30% — post-prépa concours plus a large post-bac bachelor; combined admit share around this level. ${D}` },
  'Audencia': { rate: 28, note: `Estimated ~28% — post-prépa concours plus post-bac tracks; combined admit share around this level. ${D}` },
  'Grenoble École de Management': { rate: 30, note: `Estimated ~30% — post-prépa concours plus post-bac tracks; combined admit share around this level. ${D}` },
  'KEDGE Business School': { rate: 35, note: `Estimated ~35% — post-prépa concours plus a large post-bac bachelor; combined admit share around this level. ${D}` },
  'TBS Education': { rate: 38, note: `Estimated ~38% — post-prépa concours plus post-bac tracks; combined admit share around this level. ${D}` },
  'Rennes School of Business': { rate: 42, note: `Estimated ~42% — post-prépa concours plus post-bac tracks; admit share around this level. ${D}` },
  'Montpellier Business School': { rate: 42, note: `Estimated ~42% — post-prépa concours plus a large work-study intake; admit share around this level. ${D}` },
  'EM Strasbourg Business School': { rate: 40, note: `Estimated ~40% — post-prépa concours plus post-bac tracks; admit share around this level. ${D}` },
  'EM Normandie': { rate: 45, note: `Estimated ~45% — post-prépa concours plus a large post-bac bachelor; admit share around this level. ${D}` },
  'IÉSEG School of Management': { rate: 25, note: `Estimated ~25% — recruits mainly post-bac via the ACCÈS concours (Parcoursup); taux d'accès around this level. ${D}` },
  'ICN Business School': { rate: 48, note: `Estimated ~48% — post-prépa concours plus post-bac tracks; admit share around this level. ${D}` },
  'Excelia Business School': { rate: 50, note: `Estimated ~50% — post-prépa concours plus a large post-bac bachelor; admit share around this level. ${D}` },
  // Tranche 3 — post-bac engineering (private)
  'ISEP – Institut Supérieur d\'Électronique de Paris': { rate: 50, note: `Estimated ~50% — private post-bac digital-engineering school; Parcoursup taux d'accès typically in this range. ${D}` },
  'ECE Paris': { rate: 55, note: `Estimated ~55% — private post-bac generalist digital-engineering school; Parcoursup taux d'accès typically in this range. ${D}` },
  'ESME': { rate: 55, note: `Estimated ~55% — private post-bac generalist engineering school; Parcoursup taux d'accès typically in this range. ${D}` },
  'JUNIA': { rate: 50, note: `Estimated ~50% — a grouping of the HEI/ISEN/ISA schools (Catholic University of Lille); post-bac Parcoursup taux d'accès typically in this range. ${D}` },
  'CESI École d\'Ingénieurs': { rate: 55, note: `Estimated ~55% — a very large, mostly-apprenticeship engineering school; post-bac Parcoursup taux d'accès typically in this range. ${D}` },
  'ESTACA': { rate: 45, note: `Estimated ~45% — private post-bac transport-engineering school; Parcoursup taux d'accès typically in this range. ${D}` },
  'ECAM LaSalle': { rate: 50, note: `Estimated ~50% — generalist engineering school with a post-bac track (also a concours-after-prépa route); post-bac taux d'accès typically in this range. ${D}` },
  'ESIEE Paris': { rate: 35, note: `Estimated ~35% — the engineering school of the Paris Île-de-France chambers of commerce; recruits via concours after prépa and a post-bac route, with a combined admit share around this level. ${D}` },
  'Sup\'Biotech': { rate: 50, note: `Estimated ~50% — private post-bac biotechnology-engineering school; Parcoursup taux d'accès typically in this range. ${D}` },
  // Tranche 3 — post-bac business / management (private)
  'INSEEC Grande École': { rate: 50, note: `Estimated ~50% — a large private business school (OMNES Education); post-prépa and post-bac intake with a combined admit share around this level. ${D}` },
  'Paris School of Business': { rate: 48, note: `Estimated ~48% — private business school with a large post-bac bachelor; admit share around this level. ${D}` },
  'ISG International Business School': { rate: 50, note: `Estimated ~50% — private post-bac business school; admit share around this level. ${D}` },
  'IPAG Business School': { rate: 52, note: `Estimated ~52% — private post-bac business school; admit share around this level. ${D}` },
  'Institut Paul Bocuse / Lyon Hospitality Institute': { rate: 50, note: `Estimated ~50% — selective admission on record + interview (and a practical assessment for culinary tracks); admit share around this level. ${D}` },
  'FERRANDI Paris': { rate: 40, note: `Estimated ~40% — selective admission on record + interview (practical test for culinary programs); admit share around this level. ${D}` },
  // Tranche 3 — architecture / film (selective on portfolio or creative concours)
  'École nationale supérieure d\'architecture de Paris-La Villette': { rate: 18, note: `Estimated ~18% — selective post-bac admission on the school record via Parcoursup; France's national architecture schools admit roughly this share, and Paris schools are the most sought-after. ${D}` },
  'La Fémis': { rate: 5, note: `Estimated ~5% — one of the most selective concours in France; the national film school admits on the order of 1 candidate per 20 who sit the main creative competition. ${D}` },
}

const NOTE_UNIV_TYPICAL = `Estimated ~85% — French public universities are non-selective at licence (bachelor) level; this reflects typical Parcoursup taux d'accès for non-capped programmes. Capped fields (medicine, and some law, psychology and sports science) are far more competitive. ${D}`
const NOTE_UNIV_PARIS = `Estimated ~60% — a French public university (non-selective at licence level), but one of the most over-subscribed, so many of its popular licences are capacity-capped and admit below the national norm. Aggregated from typical Parcoursup taux d'accès. ${D}`

const UNIV_TYPICAL = new Set([
  'Université Paris-Saclay', 'Université Grenoble Alpes', 'Aix-Marseille University',
  'University of Bordeaux', 'University of Montpellier', 'University of Strasbourg',
  'Claude Bernard University Lyon 1', 'University of Lille', 'Nantes Université',
  'University of Toulouse', 'Université Côte d\'Azur', 'University of Rennes',
  'Université Lumière Lyon 2', 'Université Jean Moulin Lyon 3', 'Toulouse Capitole University',
  'Paris Nanterre University', 'Sorbonne Nouvelle University', 'Université Paris-Est Créteil',
  'CY Cergy Paris University', 'University of Lorraine', 'University of Caen Normandy',
  'University of Rouen Normandie', 'University of Burgundy', 'University of Clermont Auvergne',
  'University of Poitiers', 'University of Tours', 'University of Angers', 'University of Orléans',
  'University of Reims Champagne-Ardenne', 'University of Franche-Comté',
  'University of Savoie Mont Blanc', 'University of Pau and the Adour Region', 'Le Mans University',
  'University of La Rochelle',
  // tranche 3
  'Université Gustave Eiffel', 'Université Paris 8 Vincennes-Saint-Denis',
  'Université Sorbonne Paris Nord', 'University of Toulouse – Jean Jaurès',
  'Toulouse III – Paul Sabatier University', 'University of Rennes 2',
  'University of Western Brittany', 'University of South Brittany',
  'Université Polytechnique Hauts-de-France', 'University of Limoges', 'University of Toulon',
  'Avignon University', 'University of Perpignan', 'Université Côte d\'Opale',
  'University of Artois', 'University of New Caledonia', 'University of La Réunion',
])
const UNIV_PARIS_CAPPED = new Set([
  'Sorbonne University', 'Université Paris Cité', 'Panthéon-Sorbonne University',
  'Paris-Panthéon-Assas University',
])

const NOTE_CONCOURS =
  'No comparable acceptance rate — entry is via a national concours after two years of classes préparatoires (or a small, separate international track). The concours "success rate" is measured on an already heavily pre-selected pool and is not comparable to a normal applicant-to-admit rate; selection effectively happened at prépa entry two years earlier.'
const NOTE_UMBRELLA =
  'No institution-wide acceptance rate — this is a federated body; admission is to a component school, each with its own concours or selection procedure.'
const NOTE_PORTFOLIO =
  'No comparable acceptance rate — admission turns on a portfolio and an interview or creative tests assessed by a jury, not an academic concours or a published admit rate. These schools are highly selective but release no applicant-to-admit figure.'

const CONCOURS_NAMES = new Set([
  'École Normale Supérieure de Lyon', 'École Polytechnique', 'ENSTA Paris', 'CentraleSupélec',
  'Mines Paris – PSL', 'École des Ponts ParisTech', 'Télécom Paris', 'ISAE-SUPAERO',
  'ESPCI Paris – PSL', 'ENSAE Paris', 'IMT Atlantique', 'Chimie ParisTech – PSL',
  'Arts et Métiers', 'École Normale Supérieure – PSL', 'ENS Paris-Saclay',
  'École Centrale de Lyon', 'Centrale Nantes', 'Centrale Lille', 'Centrale Méditerranée',
  'Mines Saint-Étienne', 'Mines Nancy', 'IMT Mines Albi', 'IMT Nord Europe',
  'Grenoble INP', 'Toulouse INP', 'Bordeaux INP', 'ENAC', 'AgroParisTech', 'Institut Agro',
  // tranche 3 — concours after prépa (engineering, ENS, veterinary)
  'CPE Lyon', 'ISAE-ENSMA', 'ENSICAEN', 'Sigma Clermont', 'ENS Rennes',
  'École nationale vétérinaire d\'Alfort', 'École nationale vétérinaire de Toulouse',
  'Oniris Nantes', 'VetAgro Sup',
])
const PORTFOLIO_NAMES = new Set(['Beaux-Arts de Paris', 'ENSCI – Les Ateliers'])
const UMBRELLA_NAMES = new Set(['PSL University', 'Institut Polytechnique de Paris'])

const rows = await sql`SELECT id, name, "actualAcceptanceRate" FROM universities WHERE country = 'FR'`
let estimated = 0
let noted = 0
const unclassified = []

for (const r of rows) {
  if (r.actualAcceptanceRate != null) continue

  const est = ESTIMATES[r.name]
  if (est) {
    await sql`UPDATE universities SET "estimatedAcceptanceRate" = ${est.rate}, "acceptanceRateNote" = ${est.note}, "baselineSelectivity" = ${100 - est.rate} WHERE id = ${r.id}`
    estimated++
  } else if (UNIV_TYPICAL.has(r.name)) {
    await sql`UPDATE universities SET "estimatedAcceptanceRate" = 85, "acceptanceRateNote" = ${NOTE_UNIV_TYPICAL}, "baselineSelectivity" = 15 WHERE id = ${r.id}`
    estimated++
  } else if (UNIV_PARIS_CAPPED.has(r.name)) {
    await sql`UPDATE universities SET "estimatedAcceptanceRate" = 60, "acceptanceRateNote" = ${NOTE_UNIV_PARIS}, "baselineSelectivity" = 40 WHERE id = ${r.id}`
    estimated++
  } else if (UMBRELLA_NAMES.has(r.name)) {
    await sql`UPDATE universities SET "acceptanceRateNote" = ${NOTE_UMBRELLA} WHERE id = ${r.id}`
    noted++
  } else if (CONCOURS_NAMES.has(r.name)) {
    await sql`UPDATE universities SET "acceptanceRateNote" = ${NOTE_CONCOURS} WHERE id = ${r.id}`
    noted++
  } else if (PORTFOLIO_NAMES.has(r.name)) {
    await sql`UPDATE universities SET "acceptanceRateNote" = ${NOTE_PORTFOLIO} WHERE id = ${r.id}`
    noted++
  } else {
    unclassified.push(r.name)
  }
}

console.log(`France: ${estimated} estimated acceptance rates, ${noted} "no comparable rate" notes.`)
if (unclassified.length) console.log(`Unclassified (left as-is): ${unclassified.join(', ')}`)
