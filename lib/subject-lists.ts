// Real, standard subject lists per curriculum — used to power dropdowns in
// place of free-text subject-name entry. Not exhaustive of every niche
// vocational/regional option each board offers, but covers the subjects
// the overwhelming majority of students actually take. Alphabetical within
// each list/group so a student can scan for their subject quickly.

export const CBSE_SUBJECTS = [
  'Accountancy',
  'Applied Mathematics',
  'Biology',
  'Business Studies',
  'Chemistry',
  'Computer Science',
  'Economics',
  'English Core',
  'English Elective',
  'Entrepreneurship',
  'Fine Arts',
  'Geography',
  'Hindi Core',
  'Hindi Elective',
  'History',
  'Home Science',
  'Informatics Practices',
  'Legal Studies',
  'Mathematics',
  'Physical Education',
  'Physics',
  'Political Science',
  'Psychology',
  'Sociology',
] as const

// 'Business' (Cambridge International 9609 / AQA 7132 / Edexcel 9BS0) — not
// 'Business Studies'. Cambridge retired that name with its old 9707
// syllabus in 2016; every major UK board now examines this subject as
// plain 'Business'.
export const A_LEVEL_SUBJECTS = [
  'Accounting',
  'Art & Design',
  'Biology',
  'Business',
  'Chemistry',
  'Computer Science',
  'Design & Technology',
  'Drama & Theatre Studies',
  'Economics',
  'English Language',
  'English Literature',
  'French',
  'Further Mathematics',
  'Geography',
  'German',
  'History',
  'Law',
  'Mathematics',
  'Media Studies',
  'Music',
  'Philosophy',
  'Physics',
  'Politics',
  'Psychology',
  'Religious Studies',
  'Sociology',
  'Spanish',
] as const

// Keyed by IB subject group (1-6). Group 6 additionally includes the
// group 3/4 subjects a student may substitute in instead of an Arts
// subject, per the IB's own group 6 substitution rule — appended after the
// true group 6 (Arts) subjects and separately alphabetized, so the
// substitution set stays visually distinguishable in this source file
// even though the rendered dropdown is one flat alphabetical list.
export const IB_SUBJECTS_BY_GROUP: Record<1 | 2 | 3 | 4 | 5 | 6, readonly string[]> = {
  1: ['English A: Language and Literature', 'English A: Literature', 'Hindi A: Literature', 'Self-Taught Language A: Literature'],
  2: ['Classical Greek', 'French ab initio', 'French B', 'German B', 'Hindi B', 'Latin', 'Mandarin ab initio', 'Mandarin B', 'Spanish ab initio', 'Spanish B'],
  3: ['Business Management', 'Economics', 'Environmental Systems and Societies', 'Geography', 'Global Politics', 'History', 'Philosophy', 'Psychology'],
  4: ['Biology', 'Chemistry', 'Computer Science', 'Design Technology', 'Environmental Systems and Societies', 'Physics', 'Sports, Exercise and Health Science'],
  5: ['Mathematics: Analysis and Approaches', 'Mathematics: Applications and Interpretation'],
  6: [
    // true group 6 (Arts) subjects
    'Dance',
    'Film',
    'Literature and Performance',
    'Music',
    'Theatre',
    'Visual Arts',
    // group 3/4 substitution subjects
    'Biology',
    'Business Management',
    'Chemistry',
    'Computer Science',
    'Economics',
    'Geography',
    'History',
    'Physics',
    'Psychology',
  ],
}

// Every IB subject across all 6 groups, deduped (several appear in more than
// one group's list already, e.g. Economics in groups 3 and 6) — used so a
// student can pick any subject in any of their 6 slots rather than being
// locked to one group's list per slot.
export const ALL_IB_SUBJECTS = [...new Set(Object.values(IB_SUBJECTS_BY_GROUP).flat())]
