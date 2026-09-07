// Acceptance-rate pass for India — method in
// migrate-add-estimated-acceptance-rate.mjs and lib/db/schema.ts.
//
// India's admissions run almost entirely on national/state entrance exams,
// so the credible estimate is a STRUCTURAL one: seats ÷ the pool competing
// for them (Tier 3). Anchors from published 2024-25 data:
//   - IITs: ~191,000 register for JEE Advanced for ~17,400 seats across 23
//     IITs -> ~9% collective; ~1% at any single top IIT.
//   - NITs: ~24,000 seats via JEE Main (~1.4M candidates); the well-known
//     NITs sit around 2-4% for a given aspirant.
//   - IIMs: IIM Ahmedabad admitted 468 of 264,473 applicants (~0.17%) for
//     its flagship MBA; the 5-year integrated (IPM) route is ~1-2%.
//   - BITS Pilani: 3,303 of ~136,000 (~2.4%, BITSAT).
//   - AIIMS Delhi: ~125 MBBS seats against ~2M NEET candidates — India's
//     single most competitive admission.
//   - NID ~1%, NIFT ~15% (design aptitude tests).
//   - DU flagship colleges (SRCC, St Stephen's, Hindu, Miranda, LSR,
//     Hansraj, KMC): CUET 99th-percentile cut-offs for the top courses.
//   - Selective private liberal-arts (Ashoka ~10%, and peers).
//   - Large private universities (VIT ~79%, SRM ~45%, and the mass-intake
//     universities well above that).
//
// A few genuinely admit non-selectively / on payment-plus-eligibility and
// publish nothing usable -> Tier 5 note, no number.
//
// Every estimate: sets estimatedAcceptanceRate + acceptanceRateNote and
// realigns baselineSelectivity to (100 - estimate) — for India the entrance-
// exam seat ratio IS a selectivity signal, unlike a UK offer rate. Never
// touches a row with a real actualAcceptanceRate.
//
// Usage: node --env-file=.env.local scripts/seed-acceptance-estimates-in.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const D = 'A research estimate from published seat/applicant data, not a figure certified by the institution.'

// Bespoke per-institution estimates.
const EXACT = {
  // IITs — seats ÷ JEE Advanced registrations (~191k); ~1% at a top IIT
  'Indian Institute of Technology Bombay': [1, `Estimated ~1% — of the ~191,000 candidates who register for JEE Advanced, roughly this share is admitted here via all-India rank through JoSAA. The collective rate across all 23 IITs is ~9%. ${D}`],
  'Indian Institute of Technology Delhi': [1, `Estimated ~1% — admission is via JEE Advanced all-India rank (JoSAA); ~191,000 register for ~17,400 total IIT seats. ${D}`],
  'Indian Institute of Technology Madras': [1, `Estimated ~1% — admission is via JEE Advanced all-India rank (JoSAA); ~191,000 register for ~17,400 total IIT seats. ${D}`],
  'Indian Institute of Technology Kanpur': [1, `Estimated ~1% — JEE Advanced all-India rank via JoSAA. ${D}`],
  'Indian Institute of Technology Kharagpur': [2, `Estimated ~2% — JEE Advanced all-India rank via JoSAA (Kharagpur has one of the larger IIT intakes). ${D}`],
  'Indian Institute of Technology Roorkee': [2, `Estimated ~2% — JEE Advanced all-India rank via JoSAA. ${D}`],
  'Indian Institute of Technology (BHU) Varanasi': [2, `Estimated ~2% — JEE Advanced all-India rank via JoSAA. ${D}`],
  'Indian Institute of Technology Guwahati': [2, `Estimated ~2% — JEE Advanced all-India rank via JoSAA. ${D}`],
  'Indian Institute of Technology Hyderabad': [2, `Estimated ~2% — JEE Advanced all-India rank via JoSAA. ${D}`],
  'Indian Institute of Technology Indore': [3, `Estimated ~3% — JEE Advanced all-India rank via JoSAA (smaller, newer IIT). ${D}`],
  // IISc
  'Indian Institute of Science': [1, `Estimated ~1% — its small Bachelor of Science programme (~120 seats) admits via JEE Advanced / KVPY-successor / NEET rank; entry is comparable to a top IIT. ${D}`],
  // IIMs
  'Indian Institute of Management Ahmedabad': [1, `Estimated ~1% — IIM Ahmedabad admitted 468 of 264,473 applicants (~0.17%) to its flagship MBA; the 5-year Integrated Programme in Management (post-Class-12, via IPMAT) admits ~1-2%. ${D}`],
  'Indian Institute of Management Bangalore': [1, `Estimated ~1% — CAT for the MBA, IPMAT for the 5-year integrated programme; admit shares comparable to IIM Ahmedabad. ${D}`],
  'Indian Institute of Management Calcutta': [1, `Estimated ~1% — CAT-based MBA admission; admit share comparable to IIM Ahmedabad/Bangalore. ${D}`],
  // IIITs
  'International Institute of Information Technology, Hyderabad': [2, `Estimated ~2% — admits via its own JEE-Main-plus-round process and other channels; among the most competitive CS-focused institutes in India. ${D}`],
  'Indraprastha Institute of Information Technology Delhi': [4, `Estimated ~4% — JEE Main rank via JoSAA/JAC Delhi counselling. ${D}`],
  'International Institute of Information Technology, Bangalore': [4, `Estimated ~4% — admits via its own entrance/interview process and PGEE; small, CS-focused. ${D}`],
  // BITS
  'Birla Institute of Technology and Science, Pilani': [3, `Estimated ~3% — BITS Pilani admitted 3,303 of ~136,000 aspirants (~2.4%) across its three Indian campuses for 2024-25, via the BITSAT exam. ${D}`],
  // Medical
  'All India Institute of Medical Sciences, Delhi': [1, `Estimated ~1% — ~125 MBBS seats against roughly 2 million NEET candidates nationally; India's single most competitive admission. Stored as ~1% as a floor. ${D}`],
  'Christian Medical College, Vellore': [1, `Estimated ~1% — a small, highly sought MBBS intake filled on NEET rank; among the most competitive medical admissions in India. ${D}`],
  "King George's Medical University": [2, `Estimated ~2% — MBBS admission on NEET rank through state and all-India counselling; a top-tier government medical university. ${D}`],
  // Design
  'National Institute of Design, Ahmedabad': [1, `Estimated ~1% — ~125 seats across campuses against ~13,000-15,000 applicants, via the Design Aptitude Test (DAT) with a demanding studio round. ${D}`],
  // Selective private liberal-arts / new private
  'Ashoka University': [10, `Estimated ~10% — Ashoka does not publish a rate; counsellor and admissions-data estimates cluster around 8-12%, on a holistic (essays + interview) review. ${D}`],
  'Krea University': [20, `Estimated ~20% — small, selective liberal-arts university with holistic admission; no published rate, estimate from admissions-data aggregators. ${D}`],
  'Plaksha University': [30, `Estimated ~30% — a new tech-focused private university (holistic multi-round evaluation); ~65% is reported by some aggregators, but for the selective main intake ~30% is the more defensible figure. ${D}`],
  'Shiv Nadar University': [25, `Estimated ~25% — selective private university admitting on Class-12 marks / SAT / its own test plus review; estimate from admissions-data aggregators. ${D}`],
  'O.P. Jindal Global University': [25, `Estimated ~25% — selective private university (LSAT-India / CLAT / SAT / own test by school); estimate from admissions-data aggregators. ${D}`],
  'Xavier Labour Relations Institute (XLRI)': [3, `Estimated ~3% — its flagship HR/business-management programme admits on the XAT exam; among the most competitive management admissions in India. ${D}`],
  'Tata Institute of Social Sciences': [5, `Estimated ~5% — admits on the TISSNET / CUET-PG exam; small, sought-after social-sciences intake. ${D}`],
  // Large private engineering universities
  'Vellore Institute of Technology': [79, `Estimated ~79% — a very large private university admitting on its own VITEEE exam; most applicants who sit it and meet the bar are offered a place. ${D}`],
  'Vellore Institute of Technology, Chennai': [79, `Estimated ~79% — same VITEEE-based, large-intake admission as the Vellore campus. ${D}`],
  'SRM Institute of Science and Technology': [45, `Estimated ~45% — large private university admitting on the SRMJEEE exam. ${D}`],
  'Manipal Academy of Higher Education': [30, `Estimated ~30% — admits on the MET exam; more selective than the mass-intake private universities. ${D}`],
  'Manipal Institute of Technology': [30, `Estimated ~30% — the engineering school of Manipal, admitting on the MET exam. ${D}`],
  'Thapar Institute of Engineering and Technology': [25, `Estimated ~25% — admits mainly on JEE Main rank; among the more selective private engineering institutes. ${D}`],
  'Kalinga Institute of Industrial Technology': [40, `Estimated ~40% — large private university admitting on the KIITEE exam. ${D}`],
  'Lovely Professional University': [70, `Estimated ~70% — a very large private university with a broad-access admission model (LPUNEST / Class-12 marks). ${D}`],
  'Amity University': [65, `Estimated ~65% — a very large private university group with a broad-access admission model. ${D}`],
  'Chandigarh University': [70, `Estimated ~70% — a large private university with a broad-access admission model (CUCET / Class-12 marks). ${D}`],
  'Christ University': [40, `Estimated ~40% — selective private university admitting on its own entrance test plus interview and micro-presentation. ${D}`],
  'Symbiosis International University': [35, `Estimated ~35% — admits on Symbiosis's own entrance tests (SET / SLAT / SNAP by programme). ${D}`],
  // State / government engineering
  'Delhi Technological University': [6, `Estimated ~6% — admits mainly on JEE Main rank through JAC Delhi counselling; a top state engineering university with a small Delhi-region quota. ${D}`],
  'Netaji Subhas University of Technology': [7, `Estimated ~7% — JEE Main rank via JAC Delhi counselling; a top Delhi state engineering university. ${D}`],
  'College of Engineering, Pune': [10, `Estimated ~10% — admits on MHT-CET / JEE Main rank through Maharashtra state counselling; a top state engineering college. ${D}`],
  'Veermata Jijabai Technological Institute': [10, `Estimated ~10% — MHT-CET / JEE Main rank via Maharashtra state counselling; a top Mumbai engineering institute. ${D}`],
  'Mumbai University (Institute of Chemical Technology)': [8, `Estimated ~8% — ICT admits on MHT-CET / JEE Main rank; a small, highly regarded chemical-technology institute. ${D}`],
  'Anna University': [15, `Estimated ~15% — admits on Tamil Nadu Class-12 marks (TNEA single-window counselling); the flagship campuses are competitive. ${D}`],
  'Jadavpur University': [10, `Estimated ~10% — admits on WBJEE / JEE Main rank (engineering) and merit (arts/science); among the most sought-after state universities. ${D}`],
  // DU flagship colleges
  'Shri Ram College of Commerce': [4, `Estimated ~4% — its flagship B.Com (Hons)/Economics courses need a CUET score around the 99.7th percentile; college-wide admission across all courses is a little broader. ${D}`],
  "St. Stephen's College, Delhi": [5, `Estimated ~5% — admits on a CUET score (~99th percentile for popular courses) plus its own interview; one of India's most sought-after undergraduate colleges. ${D}`],
  'Hindu College, Delhi': [5, `Estimated ~5% — CUET cut-offs among the very highest in Delhi University for Commerce, Economics and the sciences. ${D}`],
  'Miranda House, Delhi': [6, `Estimated ~6% — Delhi University's top-ranked college; CUET cut-offs near the 99th percentile for its strongest subjects. ${D}`],
  'Lady Shri Ram College for Women': [6, `Estimated ~6% — very high CUET cut-offs for its Economics, Psychology and Journalism courses. ${D}`],
  'Hansraj College': [8, `Estimated ~8% — high CUET cut-offs across Commerce and the sciences at one of Delhi University's largest colleges. ${D}`],
  'Kirori Mal College': [10, `Estimated ~10% — a well-regarded Delhi University college with competitive CUET cut-offs. ${D}`],
  'University of Delhi': [12, `Estimated ~12% — Delhi University admits centrally on CUET score; the flagship colleges need near-99th-percentile scores, mid-tier colleges around the 95th. This is a university-wide average. ${D}`],

  // --- Round 5 additions ---
  // National Law Universities — CLAT (or AILET for NLU Delhi); ~60,000
  // candidates for ~3,200 NLU seats nationally (~5% collective), the top NLUs
  // fill from the highest ranks.
  'National Law School of India University': [1, `Estimated ~1% — ~180 seats filled from the very top of the CLAT merit list (~60,000 candidates for ~3,200 NLU seats nationally); NLSIU takes the highest ranks. ${D}`],
  'National Law University Delhi': [1, `Estimated ~1% — admits ~120 through its own AILET exam (25,000+ candidates); among the most competitive law admissions in India. ${D}`],
  'NALSAR University of Law': [2, `Estimated ~2% — ~120 seats filled from the top of the CLAT merit list. ${D}`],
  'The West Bengal National University of Juridical Sciences': [3, `Estimated ~3% — CLAT rank; eastern India's leading national law university. ${D}`],
  'Gujarat National Law University': [3, `Estimated ~3% — CLAT rank; a consistent top-five national law university. ${D}`],
  'National Law University Odisha': [5, `Estimated ~5% — CLAT rank; a mid-tier NLU where a rank of a few thousand can still secure a seat. ${D}`],
  // IISERs — IISER Aptitude Test (IAT); ~45,000 sit it for ~2,000 seats
  // across all IISERs.
  'Indian Institute of Science Education and Research Pune': [3, `Estimated ~3% — its 5-year BS-MS admits via the IISER Aptitude Test (IAT); ~45,000 sit the IAT for ~2,000 seats across all IISERs, and Pune fills from the top. ${D}`],
  'Indian Institute of Science Education and Research Kolkata': [4, `Estimated ~4% — IAT-based admission to the research-focused 5-year BS-MS. ${D}`],
  'Indian Institute of Science Education and Research Mohali': [4, `Estimated ~4% — IAT-based admission to the research-focused 5-year BS-MS. ${D}`],
  // Medicine — NEET-UG; very small MBBS intakes at institutes of national
  // importance.
  'Jawaharlal Institute of Postgraduate Medical Education and Research': [1, `Estimated ~1% — a very small MBBS intake filled entirely on NEET-UG all-India rank; among the two or three most competitive medical admissions in India. ${D}`],
  'Postgraduate Institute of Medical Education and Research, Chandigarh': [2, `Estimated ~2% — limited MBBS seats on NEET-UG rank at one of India's top medical-research institutes. ${D}`],
  'National Institute of Mental Health and Neurosciences': [3, `Estimated ~3% — small, highly sought cohorts across medicine, psychology and nursing, admitted on NEET-UG rank or the institute's own entrance test. ${D}`],
  'Armed Forces Medical College, Pune': [2, `Estimated ~2% — ~150 MBBS seats via NEET-UG rank plus a Toppers' interview and a medical test, against a very large qualified pool; comes with a service commitment. ${D}`],
  // Design — NIFT entrance / own aptitude test + studio round.
  'National Institute of Fashion Technology, New Delhi': [15, `Estimated ~15% — admission via the NIFT entrance (a creative-ability and general-ability test) plus a situation test; the Delhi campus is the most competitive. ${D}`],
  'Srishti Manipal Institute of Art, Design and Technology': [45, `Estimated ~45% — a large private design institute admitting on its own aptitude test and portfolio review; broad intake. ${D}`],
  'MIT Institute of Design': [50, `Estimated ~50% — a private design school admitting on its own aptitude test and portfolio review. ${D}`],
  // Architecture — JEE Main Paper 2 / NATA + own assessment.
  'School of Planning and Architecture, Delhi': [3, `Estimated ~3% — B.Arch admission on JEE Main Paper 2 rank at India's only dedicated planning-and-architecture institute of national importance; a very small intake. ${D}`],
  'CEPT University': [25, `Estimated ~25% — admits on JEE Main Paper 2 / NATA plus its own assessment; selective but with a larger intake than SPA. ${D}`],
  // Arts / humanities colleges — Class-12 merit with course-specific cut-offs.
  "St. Xavier's College, Kolkata": [12, `Estimated ~12% — admission on Class-12 aggregate with course cut-offs among the highest in eastern India (often 90%+ for the strongest honours courses). ${D}`],
  'Madras Christian College': [20, `Estimated ~20% — admission on Class-12 merit with course-specific cut-offs; community and management quotas apply. ${D}`],
  'Stella Maris College': [18, `Estimated ~18% — a sought-after women's college admitting on Class-12 merit with high course cut-offs. ${D}`],
  // Media / film / performing arts — competitive creative concours.
  'Film and Television Institute of India': [1, `Estimated ~1% — a national written test plus an orientation round and interview, for cohorts of a handful per specialisation against thousands of applicants. ${D}`],
  'Indian Institute of Mass Communication': [5, `Estimated ~5% — admission via the CUET (PG) journalism paper; small cohorts at a sought-after government institute. ${D}`],
  'MICA': [15, `Estimated ~15% — its own multi-stage process (an aptitude test plus a psychometric test, group exercise and interview). ${D}`],
  'National School of Drama': [1, `Estimated ~1% — a nationwide audition-and-workshop selection admitting roughly two dozen students a year. ${D}`],
  'Kalakshetra Foundation': [30, `Estimated ~30% — admission by audition and interview; prior training in the art form is expected. ${D}`],
  // Management — 5-year Integrated Programme in Management via IPMAT.
  'Indian Institute of Management Indore': [2, `Estimated ~2% — its 5-year Integrated Programme in Management admits via the IPMAT exam; the shortlist-to-seat ratio is comparable to the ~1-2% at IIM Ahmedabad/Bangalore for the integrated route. ${D}`],
}

// Keyword-based estimate by institution type — only where the exam→seat
// structure gives a defensible number.
function typedEstimate(name) {
  const n = name.toLowerCase()
  if (/^indian institute of technology/.test(n)) return [3, `Estimated ~3% — admission via JEE Advanced all-India rank (JoSAA); ~191,000 register for ~17,400 total IIT seats. ${D}`]
  if (/^national institute of technology/.test(n)) return [4, `Estimated ~4% — admission via JEE Main all-India rank (JoSAA), with a home-state quota; well-regarded NITs sit around this level for a given aspirant. ${D}`]
  if (/institute of information technology/.test(n)) return [8, `Estimated ~8% — a CS-focused institute admitting on JEE Main rank; more competitive than the JEE Main average. ${D}`]
  if (/national institute of technology|iiit|nit /.test(n)) return [5, `Estimated ~5% — a centrally-funded technical institute admitting on JEE Main all-India rank. ${D}`]
  return null
}

// Type-specific "no institution-wide rate" notes for everything not anchored.
function tier5Note(name) {
  const n = name.toLowerCase()
  if (/medical|medicine|aiims|dental/.test(n))
    return 'No institution-wide acceptance rate — MBBS/health-science seats are filled on NEET rank through central and state counselling (MCC/state quotas), not an applicant-to-admit rate published by the institution.'
  if (/college$/.test(n))
    return 'No institution-wide acceptance rate — this Delhi University / affiliated college admits centrally on CUET score, with a separate cut-off per programme (the strongest courses need a near-99th-percentile score); no single college-wide figure is published.'
  if (/agricultural|agriculture/.test(n))
    return 'No institution-wide acceptance rate — admits on ICAR AIEEA / state agricultural-university counselling by programme, not a published overall rate.'
  if (/university/.test(n))
    return 'No institution-wide acceptance rate — admits centrally on CUET (for central/state universities) or its own entrance test, with a separate cut-off per programme; no single institution-wide rate is published.'
  return 'No institution-wide acceptance rate — admits on an entrance exam / merit list by programme, not a published applicant-to-admit rate.'
}

const rows = await sql`SELECT id, name, "actualAcceptanceRate" FROM universities WHERE country = 'IN'`
let est = 0, t5 = 0
for (const r of rows) {
  if (r.actualAcceptanceRate != null) continue
  const hit = EXACT[r.name] ?? typedEstimate(r.name)
  if (hit) {
    const [rate, note] = hit
    await sql`UPDATE universities SET "estimatedAcceptanceRate" = ${rate}, "acceptanceRateNote" = ${note}, "baselineSelectivity" = ${100 - rate} WHERE id = ${r.id}`
    est++
  } else {
    await sql`UPDATE universities SET "acceptanceRateNote" = ${tier5Note(r.name)} WHERE id = ${r.id}`
    t5++
  }
}
console.log(`India: ${est} estimated acceptance rates, ${t5} "no institution-wide rate" notes.`)
