// Real, standard subject lists per curriculum — used to power dropdowns in
// place of free-text subject-name entry. Not exhaustive of every niche
// vocational/regional option each board offers, but covers the subjects
// the overwhelming majority of students actually take.

export const CBSE_SUBJECTS = [
  'English Core',
  'English Elective',
  'Hindi Core',
  'Hindi Elective',
  'Mathematics',
  'Applied Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'Informatics Practices',
  'Physical Education',
  'Accountancy',
  'Business Studies',
  'Economics',
  'History',
  'Political Science',
  'Geography',
  'Psychology',
  'Sociology',
  'Fine Arts',
  'Home Science',
  'Legal Studies',
  'Entrepreneurship',
] as const

// 'Business' (Cambridge International 9609 / AQA 7132 / Edexcel 9BS0) — not
// 'Business Studies'. Cambridge retired that name with its old 9707
// syllabus in 2016; every major UK board now examines this subject as
// plain 'Business'.
export const A_LEVEL_SUBJECTS = [
  'Mathematics',
  'Further Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'Economics',
  'Business',
  'Accounting',
  'English Literature',
  'English Language',
  'History',
  'Geography',
  'Politics',
  'Psychology',
  'Sociology',
  'Law',
  'Philosophy',
  'Religious Studies',
  'Art & Design',
  'Design & Technology',
  'Music',
  'Drama & Theatre Studies',
  'Media Studies',
  'French',
  'Spanish',
  'German',
] as const

// Keyed by IB subject group (1-6). Group 6 additionally includes the
// group 3/4 subjects a student may substitute in instead of an Arts
// subject, per the IB's own group 6 substitution rule.
export const IB_SUBJECTS_BY_GROUP: Record<1 | 2 | 3 | 4 | 5 | 6, readonly string[]> = {
  1: ['English A: Literature', 'English A: Language and Literature', 'Hindi A: Literature', 'Self-Taught Language A: Literature'],
  2: ['French B', 'Spanish B', 'German B', 'Mandarin B', 'Hindi B', 'French ab initio', 'Spanish ab initio', 'Mandarin ab initio', 'Classical Greek', 'Latin'],
  3: ['History', 'Geography', 'Economics', 'Business Management', 'Psychology', 'Philosophy', 'Global Politics', 'Environmental Systems and Societies'],
  4: ['Biology', 'Chemistry', 'Physics', 'Computer Science', 'Design Technology', 'Sports, Exercise and Health Science', 'Environmental Systems and Societies'],
  5: ['Mathematics: Analysis and Approaches', 'Mathematics: Applications and Interpretation'],
  6: [
    'Visual Arts',
    'Music',
    'Theatre',
    'Film',
    'Dance',
    'Literature and Performance',
    // Group 6 may instead be a 2nd subject from group 3 or 4:
    'History',
    'Geography',
    'Economics',
    'Business Management',
    'Psychology',
    'Biology',
    'Chemistry',
    'Physics',
    'Computer Science',
  ],
}

// Every IB subject across all 6 groups, deduped (several appear in more than
// one group's list already, e.g. Economics in groups 3 and 6) — used so a
// student can pick any subject in any of their 6 slots rather than being
// locked to one group's list per slot.
export const ALL_IB_SUBJECTS = [...new Set(Object.values(IB_SUBJECTS_BY_GROUP).flat())]
