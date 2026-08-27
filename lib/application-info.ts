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
    ],
    extracurriculars: 'Weighed heavily. US admissions is genuinely holistic — depth in 1-2 activities ("spike") with real leadership or impact usually reads better than a long list of shallow involvements.',
    tests: 'SAT or ACT. Many schools are test-optional post-2020, but a strong score is still a meaningful plus, especially at selective schools.',
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
    ],
    extracurriculars: "Weighed much less than in the US. What actually matters is 'super-curricular' activity — subject-specific reading, competitions, or work experience that shows genuine interest in your chosen course. Generic extracurriculars (sports, clubs unrelated to your subject) are meant to make up only about 10-20% of a personal statement; the rest should be academic.",
    tests: 'No universal test. Specific competitive courses require their own: UCAT for most medicine/dentistry courses, BMAT for some medical schools, LNAT for law at several universities.',
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
    ],
    extracurriculars: "Generally not weighed for direct ATAR-based entry. Some universities offer small 'adjustment factor' bonus points for specific circumstances (educational access schemes, some leadership/service programs), but it's the exception, not the norm.",
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
    ],
    extracurriculars: "Secondary to academics for most direct-entry programs, but Co-Curricular Activity (CCA) records do carry some weight, especially for aptitude-based admission and scholarship pathways.",
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
      'HKDSE results (4 core subjects: Chinese, English, Maths, Citizenship & Social Development) for the local track, or your full transcript + predicted/final grades for the international pathway',
      'English proficiency proof for non-native speakers',
    ],
    extracurriculars: 'Traditionally secondary to core subject scores, but Hong Kong universities have been moving toward more holistic review that recognizes achievement beyond the four core subjects.',
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
    ],
    extracurriculars: "Minimal formal weight for most direct-entry, merit-based admission — 9th-11th grades generally aren't considered either. A growing number of newer, holistic-admission private universities (Ashoka, Krea, and similar) do weigh a broader profile, closer to the US model.",
    tests: 'JEE (engineering), NEET (medicine), CUET (many central universities and fields) — these entrance exams, run by the NTA, are often more decisive than board marks for exam-gated fields.',
    essays: 'Not required for most public or merit-based admissions. Some of the newer holistic-admission private universities do require them.',
    essayResources: [],
    prioritizes: 'Board exam percentage plus, for exam-gated fields, your entrance exam score/rank. Extracurriculars and essays are the exception at most institutions, not the norm.',
  },
}

export const APPLICATION_INFO_COUNTRIES = Object.keys(APPLICATION_INFO)
