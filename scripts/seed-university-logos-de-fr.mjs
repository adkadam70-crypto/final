// Logos for the Germany/France rows that never resolved to a usable campus
// photo (scripts/seed-university-images-de-fr.mjs) — fetched from each
// institution's OWN website (its largest apple-touch-icon / favicon.svg /
// favicon.png), not a third-party non-free copy, so this is the institution
// publishing its own mark. Only logos that render at >=48px (or are SVG,
// which scales cleanly regardless) were kept; anything that only offered a
// blurry 16-32px favicon was left as NULL, which renders the existing
// branded placeholder card instead of a pixelated icon blown up to size.
// Files live in /public/university-logos, served same-origin ('self'),
// so no CSP change was needed. components/university-card.tsx renders
// anything under that path object-contain on a white background rather
// than the object-cover crop used for campus photos.
//
// Usage: node --env-file=.env.local scripts/seed-university-logos-de-fr.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

// [id, filename]
const LOGOS = [
  [647, '647.jpg'],  // Arts et Métiers
  [665, '665.svg'],  // Bordeaux INP
  [742, '742.ico'],  // CESI École d'Ingénieurs
  [658, '658.svg'],  // Centrale Méditerranée
  [627, '627.ico'],  // Claude Bernard University Lyon 1
  [745, '745.png'],  // ECAM LaSalle
  [738, '738.jpg'],  // ECE Paris
  [670, '670.png'],  // EFREI Paris
  [689, '689.png'],  // EM Strasbourg Business School
  [763, '763.ico'],  // ENSCI – Les Ateliers
  [747, '747.png'],  // ENSICAEN
  [671, '671.svg'],  // ESILV
  [739, '739.png'],  // ESME
  [643, '643.webp'],  // ESPCI Paris – PSL
  [743, '743.svg'],  // ESTACA
  [693, '693.png'],  // Excelia Business School
  [663, '663.png'],  // Grenoble INP
  [684, '684.svg'],  // Grenoble École de Management
  [605, '605.svg'],  // HTWK Leipzig
  [606, '606.png'],  // Hannover University of Applied Sciences and Arts
  [645, '645.svg'],  // IMT Atlantique
  [753, '753.svg'],  // IPAG Business School
  [744, '744.png'],  // ISAE-ENSMA
  [642, '642.png'],  // ISAE-SUPAERO
  [737, '737.png'],  // ISEP – Institut Supérieur d'Électronique de Paris
  [752, '752.png'],  // ISG International Business School
  [675, '675.svg'],  // Institut Agro
  [754, '754.png'],  // Institut Paul Bocuse / Lyon Hospitality Institute
  [617, '617.png'],  // Institut Polytechnique de Paris
  [741, '741.png'],  // JUNIA
  [549, '549.png'],  // Kiel University
  [660, '660.png'],  // Mines Nancy
  [688, '688.webp'],  // Montpellier Business School
  [561, '561.png'],  // Paderborn University
  [751, '751.ico'],  // Paris School of Business
  [672, '672.png'],  // Polytech Network
  [687, '687.ico'],  // Rennes School of Business
  [567, '567.ico'],  // TU Bergakademie Freiberg
  [519, '519.ico'],  // University of Bonn
  [526, '526.png'],  // University of Cologne
  [578, '578.svg'],  // University of Hildesheim
  [625, '625.png'],  // University of Montpellier
  [716, '716.svg'],  // University of Savoie Mont Blanc
  [727, '727.ico'],  // University of South Brittany
  [733, '733.jpg'],  // Université Côte d'Opale
  [668, '668.png'],  // Université de Technologie de Belfort-Montbéliard
]

let updated = 0
for (const [id, filename] of LOGOS) {
  const rows = await sql`SELECT "imageUrl" FROM universities WHERE id = ${id}`
  if (rows.length === 0 || rows[0].imageUrl) continue  // don't overwrite an existing image
  await sql`UPDATE universities SET "imageUrl" = ${'/university-logos/' + filename} WHERE id = ${id}`
  updated++
}
console.log(`Set logo imageUrl for ${updated} German/French universities.`)
