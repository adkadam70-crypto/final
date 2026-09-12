// Per-country application guide content. General, researched educational
// context — not official policy from any specific university, and not a
// substitute for checking a target school's own admissions page. Every URL
// here was verified via web search this session, none invented. See chat
// history for the underlying sources (UCAS, Common App, JHU, JUPAS, NTA,
// UAC, NUS/NTU admissions pages, plus general-knowledge admissions
// research on extracurricular weighting per country).

export type ApplicationInfoLink = {
  label: string
  url: string
}

export type CountryApplicationInfo = {
  code: string
  name: string
  platform: string
  platformLinks: ApplicationInfoLink[]
  howToApply: string
  requirements: string[]
  extracurriculars: string
  tests: string
  essays: string
  essayResources: ApplicationInfoLink[]
  prioritizes: string
}

export const APPLICATION_INFO: Record<string, CountryApplicationInfo> = {
  US: {
    code: 'US',
    name: 'United States',
    platform: 'Common Application (most schools) — some also accept the Coalition App or their own portal.',
    platformLinks: [{ label: 'Common App', url: 'https://www.commonapp.org/' }],
    howToApply: 'Create one Common App profile, add schools, and submit a shared application plus any school-specific supplements. Your counselor sends transcripts and recommendation letters directly.',
    requirements: [
      'Full 4-year transcript (grades 9-12)',
      'SAT or ACT (many schools are test-optional, but a strong score still helps)',
      '1-2 teacher recommendation letters + a counselor recommendation',
      'Common App personal essay (250-650 words)',
      'School-specific supplemental essays (most selective schools require these)',
      "Any curriculum works — CBSE/ISC/State Board, A-Levels, IB, HKDSE, and others are all read the same way alongside a US GPA. Admissions officers use your school profile (submitted by your counselor) to interpret grades in context, so there's no official conversion table to worry about.",
    ],
    extracurriculars: 'Weighed heavily — depth in 1-2 activities ("spike") with real leadership beats a long shallow list. The Common App gives 10 activity slots (150-char description each), so precise, measurable impact matters more than the title. Consultants often describe an informal "tiering" — national-level achievement or founding something real outranks generic membership — not an official framework, just a useful lens. Most colleges admitting under 30% of applicants rate extracurriculars "important" or "very important."',
    tests: "SAT (400-1600) or ACT (1-36 composite). Most schools are test-optional, but a strong score still helps at selective ones — most of their admits still submit one. Colleges typically \"superscore\": your best section scores across test dates combine into one composite, so retaking can help. Rough benchmarks: ~1200+ SAT is competitive at state schools, ~1400+ at selective colleges, ~1500+ at Ivy-level — a school's own published range (elsewhere in this app) beats any generic number, though.",
    essays: 'Yes — the Common App personal essay is required everywhere, and most selective schools add their own supplemental essays (specific "why us," short-answer questions, etc.). This is one of the most-weighted parts of a US application.',
    essayResources: [
      { label: 'Official Common App essay prompts', url: 'https://www.commonapp.org/blog/announcing-2025-2026-common-app-essay-prompts/' },
      { label: 'Johns Hopkins — real essays that got students in, with admissions feedback', url: 'https://apply.jhu.edu/college-planning-guide/essays-that-worked/' },
    ],
    prioritizes: 'Holistic review: academic rigor and trajectory, extracurricular depth, essays, and recommendations are all weighed together — no single factor dominates the way exams do in most other countries on this list.',
  },
  UK: {
    code: 'UK',
    name: 'United Kingdom',
    platform: 'UCAS — the single centralized application system used by nearly every UK university.',
    platformLinks: [{ label: 'UCAS', url: 'https://www.ucas.com/' }],
    howToApply: 'One UCAS application, up to 5 course choices, submitted with predicted grades from your school. Offers are usually conditional on hitting specific final grades.',
    requirements: [
      'Predicted A-Level (or IB) grades from your school',
      'GCSE results (still reviewed, especially at competitive courses and top universities)',
      'UCAS personal statement (reworked into 3 shorter questions for 2026 entry)',
      'Course-specific admissions test where required (see below)',
      "A-Levels and IB are most common, but UCAS also accepts CBSE/ISC/State Board (ISC is generally treated as A-Level-equivalent) and a US high school diploma with GPA — each university sets its own minimum per curriculum (e.g. some ask for 65-90% in CBSE/ISC/State Board, or a GPA around 3.0-3.5 depending on the course), so check '[university] international entry requirements [your curriculum]' for the exact numbers.",
    ],
    extracurriculars: "Weighed much less than in the US. What matters is 'super-curricular' activity — subject-specific reading, MOOCs, taster lectures, Olympiads, an EPQ, or work experience tied to your course — not generic hobbies, which should stay under ~20% of the personal statement. Duke of Edinburgh earns no UCAS points and has no form section of its own, but is worth a mention in the statement for the leadership and resilience it shows.",
    tests: "No universal test. UCAT for medicine/dentistry (4 sections, cognitive score out of 2700), LNAT for law (42-question MCQ, no negative marking, plus a timed essay). Note: BMAT has been discontinued — UCAT is now the sole admissions test for UK undergraduate medicine and dentistry.",
    essays: "Yes, but different in kind from the US: the UCAS personal statement is about demonstrating academic fit and subject passion, not a personal-narrative story. Oxford and Cambridge and other top universities can weigh this and GCSEs more heavily than less selective ones.",
    essayResources: [
      { label: 'UCAS — official personal statement guide', url: 'https://www.ucas.com/applying/applying-to-university/writing-your-personal-statement/how-to-write-your-personal-statement-for-2026-entry-onwards' },
    ],
    prioritizes: "Overwhelmingly academic: predicted/actual grades and demonstrated subject-specific engagement. It's the most exam-and-subject-focused system on this list.",
  },
  AU: {
    code: 'AU',
    name: 'Australia',
    platform: "No single national platform — apply via your state's admissions center (e.g. UAC for NSW/ACT) or directly to the university.",
    platformLinks: [{ label: 'UAC (NSW/ACT example)', url: 'https://www.uac.edu.au/' }],
    howToApply: "International applicants with an IB, A-Level, or other non-ATAR qualification usually get it converted into an ATAR-equivalent 'Selection Rank' by the admissions center, then apply like any other applicant.",
    requirements: [
      'Final 2 years of secondary results (Year 11-12, or IB/A-Level equivalent)',
      'English language proficiency proof for international students',
      'No essay for most direct-entry programs',
      "CBSE/ISC/State Board (and IB/A-Levels) are converted to an ATAR-equivalent Selection Rank via your state's admissions center (e.g. UAC) — a US high school diploma works differently: GPA alone isn't enough for a direct rank conversion, so it's normally paired with an SAT or ACT score instead.",
    ],
    extracurriculars: "Generally not weighed for direct ATAR entry. 'Adjustment factor' bonus points — added on top of your ATAR to form a course-specific 'selection rank,' never changing the ATAR itself — exist for a few cases: subject bonus points (a strong result in a course-relevant Year 12 subject), regional/location, the Educational Access Scheme for disadvantage, and EAPL for elite athletes/performers (up to ~5 points). Most universities cap total adjustments around 10-15 points.",
    tests: 'No universal standardized test — the ATAR (or its international equivalent) is calculated from your coursework itself, not a separate exam.',
    essays: 'Not required for most direct-entry programs. Highly competitive programs (medicine, some law) may require additional statements, interviews, or admissions tests.',
    essayResources: [],
    prioritizes: 'Almost purely your academic score (ATAR or equivalent). This is the most straightforwardly numbers-driven system on this list.',
  },
  SG: {
    code: 'SG',
    name: 'Singapore',
    platform: 'Direct application to each university — NUS, NTU, and SMU each have their own portal.',
    platformLinks: [
      { label: 'NUS Admissions', url: 'https://nus.edu.sg/oam/admissions' },
      { label: 'NTU Admissions', url: 'https://www.ntu.edu.sg/admissions' },
    ],
    howToApply: 'Apply directly through each university you want, submitting your A-Level (or equivalent) results — universities publish Indicative Grade Profiles so you can gauge your chances against last year\'s admitted range.',
    requirements: [
      'A-Level results (H2/H1 subject combination) or equivalent (IB, etc.)',
      'Mother Tongue Language requirement at O-Level for Singapore-Cambridge track',
      'Portfolio or aptitude test for some programs (e.g. design, some scholarship tracks)',
      "CBSE/ISC/State Board and US high school diplomas are accepted too, on their own terms rather than being converted into A-Level points: NUS looks for a strong pass across 5 CBSE/ISC/State Board subjects (English included), and US-curriculum applicants are generally expected to pair their diploma with an SAT score plus supporting AP subjects.",
    ],
    extracurriculars: "Secondary to academics, but Co-Curricular Activity (CCA) does carry some weight. It was once a fixed ~5% of the admission score; since 2007, NUS and NTU folded it into a broader 'Discretionary Admission' scheme (leadership, projects, fit) instead — there's no separate platform or flag showing you've been assessed under it. Strong grades plus a purposeful record is what moves an application, not CCA titles alone.",
    tests: 'No separate national test beyond your A-Level/IB itself — some specific programs run their own aptitude or portfolio assessment.',
    essays: 'Not universal — mainly used for scholarship applications or specific aptitude-based ("discretionary") admission pathways rather than standard direct entry.',
    essayResources: [],
    prioritizes: "Your rank-points/academic score is the primary driver for most programs, with holistic review reserved for scholarship and aptitude-based tracks.",
  },
  HK: {
    code: 'HK',
    name: 'Hong Kong',
    platform: 'JUPAS for the local HKDSE track; international qualification holders (IB, A-Level, etc.) generally apply direct to each university\'s international-admissions office.',
    platformLinks: [{ label: 'JUPAS', url: 'https://www.jupas.edu.hk/' }],
    howToApply: 'HKDSE students apply through JUPAS with up to 20 program choices ranked by preference. International-qualification holders apply directly to each university\'s non-JUPAS/international pathway.',
    requirements: [
      'HKDSE results (4 core subjects: Chinese, English, Maths, Citizenship & Social Development) for the local JUPAS track',
      "For the international pathway: universities generally prefer IB or A-Levels, but also accept CBSE/ISC/State Board/NIOS, US diplomas (with SAT/ACT/AP), and other recognized curricula — some set explicit minimum thresholds (e.g. one Hong Kong university requires roughly 75%+ average across CBSE/CISCE Standard XII subjects for its non-local pathway), so check the specific university's international-admissions page for exact numbers",
      'English proficiency proof for non-native speakers',
    ],
    extracurriculars: 'Traditionally secondary to core subjects, but shifting toward holistic review. JUPAS\'s optional "Other Experiences and Achievements" (OEA) upload is the concrete mechanism on the local track; HKDSE itself also has a built-in "Other Learning Experiences" (OLE) component. Weight varies by university — neither replaces a strong core-subject result.',
    tests: 'HKDSE itself is the entrance exam for local students; international-track applicants are assessed on their own system\'s qualification (IB, A-Level, etc.) rather than a separate Hong Kong-specific test.',
    essays: 'Personal statements are sometimes required, especially via the non-JUPAS/international pathway — check the specific university and program.',
    essayResources: [],
    prioritizes: 'Core academic subject scores first, with a growing (but still secondary) role for broader achievement and personal statements on the international pathway.',
  },
  IN: {
    code: 'IN',
    name: 'India',
    platform: 'No single national platform for general admission — apply directly to universities, or via NTA-run entrance exams for specific fields.',
    platformLinks: [{ label: 'NTA (JEE, NEET, CUET)', url: 'https://nta.ac.in/' }],
    howToApply: "For most direct-entry programs, apply straight to the university/college with your Class XII board results. For engineering, medicine, or many central universities, you'll also need to register for and sit the relevant NTA entrance exam.",
    requirements: [
      'Class XII (12th grade) board exam results — this is what actually drives most direct admission',
      'JEE Main/Advanced for engineering (NITs/IIITs require 75% board marks or top-20th-percentile to be JoSAA-eligible)',
      'NEET for medical and dental programs',
      'CUET for many central universities across a wide range of fields',
      "If you're coming from IB, A-Levels, a US high school diploma (from a regionally-accredited school), or another international curriculum, most Indian universities require an AIU (Association of Indian Universities) equivalency certificate confirming your result is equivalent to Class XII before you can apply.",
    ],
    extracurriculars: "Minimal weight for most merit-based admission — grades 9-11 generally aren't considered either. Exceptions: Ashoka (60% board-marks floor, 4 essays, a timed on-the-spot essay, interview) and Krea (aptitude test + interview) run US-style holistic admission — still the exception nationally, not the norm.",
    tests: "JEE, NEET, CUET — run by the NTA, often more decisive than board marks. JEE Main runs twice a year and your better score counts; only the top ~2.5 lakh advance to JEE Advanced. NEET: 200 questions (180 attempted), +4/-1 marking, 720 total. CUET: pick up to 6 subject papers, 50 questions each, same +5/-1 pattern.",
    essays: 'Not required for most public or merit-based admissions. Some of the newer holistic-admission private universities do require them.',
    essayResources: [],
    prioritizes: 'Board exam percentage plus, for exam-gated fields, your entrance exam score/rank. Extracurriculars and essays are the exception at most institutions, not the norm.',
  },
  DE: {
    code: 'DE',
    name: 'Germany',
    platform: 'uni-assist handles international document checks for ~180 universities; some universities use their own portal instead. Hochschulstart (Stiftung für Hochschulzulassung) centrally coordinates the nationally-restricted subjects (medicine, dentistry, pharmacy, veterinary medicine).',
    platformLinks: [
      { label: 'uni-assist', url: 'https://www.uni-assist.de/en/' },
      { label: 'Hochschulstart', url: 'https://www.hochschulstart.de/' },
    ],
    howToApply: 'Check each university: apply either through uni-assist (about €75 for the first application plus €30 per additional one) or the university\'s own portal. Standard deadlines are 15 July for the winter semester and 15 January for the summer semester; decisions usually follow 4-8 weeks later. Applicants from India, China, and Vietnam must obtain an APS certificate before applying.',
    requirements: [
      'A secondary qualification recognized as equivalent to the German Abitur',
      'APS certificate (mandatory for applicants from India, China, and Vietnam)',
      'Language proof: German-taught programs need DSH-2 or TestDaF (level 4 in all four sections); English-taught programs need IELTS/TOEFL',
      'Short motivation letter and CV',
      "CBSE/ISC/State Board Standard XII can give direct university access if it matches the subject-and-marks pattern the German credential database (anabin) sets for Indian qualifications; where it doesn't, a one-year Studienkolleg foundation course plus the Feststellungsprüfung exam is required first. A US high school diploma is normally paired with SAT/AP scores.",
      'Many popular subjects are Numerus Clausus (NC) restricted — admission is a GPA cutoff (the "NC value") that shifts every semester with the applicant pool. Subjects without an NC (zulassungsfrei) admit everyone who meets the requirements.',
    ],
    extracurriculars: "Essentially not considered — NC admission runs on Abitur-equivalent GPA, waiting-semester rules, and occasionally a subject-specific aptitude test. Exceptions: a few private English-taught schools like WHU (motivation letter + video interview) and Jacobs University (admits on \"personal potential\") run US-style holistic admission — a small minority of the system.",
    tests: "No SAT/ACT equivalent. Medicine uses the TMS — a ~6-hour cognitive test (pattern matching, text comprehension, quantitative reasoning), not a knowledge test. Non-EU applicants often take TestAS instead (general cognitive Core Module + a Subject Module matched to your field). Otherwise your GPA is the deciding number.",
    essays: 'A short motivation letter is commonly required but weighs far less than in the US or UK — it confirms fit rather than deciding the case. Some English-taught and private-university programs do weigh it more heavily.',
    essayResources: [
      { label: 'DAAD — official application process guide', url: 'https://www.daad.de/en/studying-in-germany/requirements/application-process/' },
    ],
    prioritizes: 'Your Abitur-equivalent GPA above all for NC subjects, and simply meeting the entry bar for open-admission subjects. One of the most purely grades-driven systems on this list, with no holistic layer.',
  },
  FR: {
    code: 'FR',
    name: 'France',
    platform: 'Parcoursup for most undergraduate (licence) programs. Non-EU students from a Campus France "CEF" country (India included) must first complete the Campus France "Études en France" dossier. Many grandes écoles run their own concours (competitive exams) or post-bac admissions (SESAME/ACCÈS for business; GEIPI, Avenir, Puissance Alpha for engineering).',
    platformLinks: [
      { label: 'Parcoursup', url: 'https://www.parcoursup.gouv.fr/' },
      { label: 'Campus France — Études en France', url: 'https://www.campusfrance.org/en/application-etudes-en-france-procedure' },
    ],
    howToApply: 'Non-EU students from a CEF country complete the Campus France "Études en France" dossier first (academic records, motivation letter, language results, CV), then apply — via Parcoursup for licence programs (registration mid-January to mid-March, up to 20 wishes) or directly to grandes écoles and master\'s programs. EU students and applicants in non-CEF countries can apply directly to institutions.',
    requirements: [
      'A secondary diploma recognized as equivalent to the French Baccalauréat (CBSE/ISC/State Board, IB, and A-Levels are accepted; a US diploma is usually paired with SAT/AP)',
      'High-school transcripts (bulletins) from the last 2-3 years — weighed heavily for selective programs',
      'Motivation letter (lettre de motivation, roughly 1,500 characters on Parcoursup) and CV',
      'Language proof: French-taught programs need DELF/DALF B2 or the TCF; English-taught programs need IELTS/TOEFL',
      'For grandes écoles: usually two years of classes préparatoires (CPGE) followed by the concours, or a post-bac concours (SESAME, GEIPI, and similar)',
    ],
    extracurriculars: 'Limited weight at public universities. Selective programs look mainly at your record, with a sharp motivation letter as the main non-grade factor. The document behind that record is the "fiche Avenir" — teacher-assessed subject averages, class rank, and "compétences transversales" (autonomy, initiative) that your activities can feed into, though they never substitute for grades.',
    tests: 'No universal test. Grandes écoles rely on the concours (written and oral exams, usually after prépa) or post-bac exams (SESAME/ACCÈS for business, GEIPI/Avenir/Puissance Alpha for engineering). Public-university licence programs have no entrance exam.',
    essays: 'The lettre de motivation is required and does matter — especially for selective programs and on the Campus France dossier — but it is short and focused on program fit and academic motivation, not a US-style personal narrative.',
    essayResources: [
      { label: 'Campus France — applying to a French institution', url: 'https://www.campusfrance.org/en/application-higher-education-france' },
    ],
    prioritizes: 'Two very different tracks. Public-university licence: essentially non-selective — clearing the Baccalauréat-equivalent bar is usually enough (except oversubscribed fields like medicine, law, and psychology). Grandes écoles and selective programs: high-school grades and concours/exam performance, with the motivation letter as a real secondary factor.',
  },
}

// Alphabetical by full country name (not insertion order / code) so the
// tab row on /application-info is easy to scan.
export const APPLICATION_INFO_COUNTRIES = Object.keys(APPLICATION_INFO).sort((a, b) =>
  APPLICATION_INFO[a].name.localeCompare(APPLICATION_INFO[b].name),
)
