// Common abbreviations/short forms that don't appear as a literal substring
// in the official catalog name (e.g. "MIT" isn't a substring of
// "Massachusetts Institute of Technology"), checked before the substring
// fallback so they resolve to the real school instead of an accidental
// substring collision (e.g. "MIT" -> "Goldsmiths, University of London",
// since "mit" is buried inside "goldsmiths").
//
// Plain data, not a server action — shared as-is by analyze-target-university.ts
// (submit-time resolution) and target-university-analysis.tsx (autocomplete
// suggestions), so an abbreviation like "NUS" surfaces in the dropdown too,
// not just after hitting Analyze.
export const UNIVERSITY_ALIASES: Record<string, string> = {
  mit: 'Massachusetts Institute of Technology',
  caltech: 'California Institute of Technology',
  berkeley: 'University of California, Berkeley',
  'uc berkeley': 'University of California, Berkeley',
  cal: 'University of California, Berkeley',
  ucla: 'University of California, Los Angeles',
  ucsd: 'University of California, San Diego',
  ucsb: 'University of California, Santa Barbara',
  uci: 'University of California, Irvine',
  'uc davis': 'University of California, Davis',
  ucsc: 'University of California, Santa Cruz',
  'uc riverside': 'University of California, Riverside',
  'georgia tech': 'Georgia Institute of Technology',
  gatech: 'Georgia Institute of Technology',
  cmu: 'Carnegie Mellon University',
  upenn: 'University of Pennsylvania',
  penn: 'University of Pennsylvania',
  nyu: 'New York University',
  usc: 'University of Southern California',
  'ut austin': 'University of Texas at Austin',
  uw: 'University of Washington',
  unc: 'University of North Carolina at Chapel Hill',
  'unc chapel hill': 'University of North Carolina at Chapel Hill',
  uiuc: 'University of Illinois Urbana-Champaign',
  'uw madison': 'University of Wisconsin-Madison',
  umich: 'University of Michigan',
  'william and mary': 'College of William & Mary',
  'william & mary': 'College of William & Mary',
  'ohio state': 'Ohio State University',

  ucl: 'University College London',
  lse: 'London School of Economics',
  kcl: "King's College London",

  unsw: 'University of New South Wales',
  anu: 'Australian National University',
  uwa: 'University of Western Australia',
  uq: 'University of Queensland',

  hku: 'University of Hong Kong',
  hkust: 'Hong Kong University of Science and Technology',
  cuhk: 'Chinese University of Hong Kong',
  polyu: 'Hong Kong Polytechnic University',
  cityu: 'City University of Hong Kong',

  nus: 'National University of Singapore',
  ntu: 'Nanyang Technological University',

  'iit delhi': 'Indian Institute of Technology Delhi',
  'iit bombay': 'Indian Institute of Technology Bombay',
  'iit madras': 'Indian Institute of Technology Madras',
  'iit kanpur': 'Indian Institute of Technology Kanpur',
  'iit kharagpur': 'Indian Institute of Technology Kharagpur',
  'iit roorkee': 'Indian Institute of Technology Roorkee',
  'iit guwahati': 'Indian Institute of Technology Guwahati',
  'iit hyderabad': 'Indian Institute of Technology Hyderabad',
  'iit indore': 'Indian Institute of Technology Indore',
  'iit bhu': 'Indian Institute of Technology (BHU) Varanasi',
  'iit varanasi': 'Indian Institute of Technology (BHU) Varanasi',
  iisc: 'Indian Institute of Science',
  'bits pilani': 'Birla Institute of Technology and Science, Pilani',
  dtu: 'Delhi Technological University',
  'iim ahmedabad': 'Indian Institute of Management Ahmedabad',
  'iim bangalore': 'Indian Institute of Management Bangalore',
  'iim calcutta': 'Indian Institute of Management Calcutta',
  'aiims delhi': 'All India Institute of Medical Sciences, Delhi',
  jnu: 'Jawaharlal Nehru University',
}
