// The College Board's official current AP course/exam catalog (verified via
// apstudents.collegeboard.org/courses this session), grouped exactly as the
// College Board groups them. Used to let a student pick real AP courses
// they've taken from an actual list instead of typing free text — AP
// courses/exams are a real, internationally-recognized signal (referenced
// throughout lib/application-info.ts as something international-curriculum
// students commonly pair with their home diploma) independent of a
// student's primary curriculum (CBSE, A-Levels, IB, etc. can all include AP
// courses taken alongside).
export const AP_COURSE_CATEGORIES: { category: string; courses: string[] }[] = [
  {
    category: 'Arts',
    courses: ['AP 2-D Art and Design', 'AP 3-D Art and Design', 'AP Drawing', 'AP Art History', 'AP Music Theory'],
  },
  {
    category: 'English',
    courses: ['AP English Language and Composition', 'AP English Literature and Composition'],
  },
  {
    category: 'History and Social Sciences',
    courses: [
      'AP African American Studies',
      'AP Comparative Government and Politics',
      'AP European History',
      'AP Human Geography',
      'AP Macroeconomics',
      'AP Microeconomics',
      'AP Psychology',
      'AP United States Government and Politics',
      'AP United States History',
      'AP World History: Modern',
    ],
  },
  {
    category: 'Math and Computer Science',
    courses: [
      'AP Calculus AB',
      'AP Calculus BC',
      'AP Computer Science A',
      'AP Computer Science Principles',
      'AP Precalculus',
      'AP Statistics',
    ],
  },
  {
    category: 'Sciences',
    courses: [
      'AP Biology',
      'AP Chemistry',
      'AP Environmental Science',
      'AP Physics 1: Algebra-Based',
      'AP Physics 2: Algebra-Based',
      'AP Physics C: Electricity and Magnetism',
      'AP Physics C: Mechanics',
    ],
  },
  {
    category: 'World Languages and Cultures',
    courses: [
      'AP Chinese Language and Culture',
      'AP French Language and Culture',
      'AP German Language and Culture',
      'AP Italian Language and Culture',
      'AP Japanese Language and Culture',
      'AP Latin',
      'AP Spanish Language and Culture',
      'AP Spanish Literature and Culture',
    ],
  },
  {
    category: 'AP Capstone Diploma Program',
    courses: ['AP Research', 'AP Seminar'],
  },
  {
    category: 'AP Career Kickstart',
    courses: ['AP Business with Personal Finance', 'AP Cybersecurity'],
  },
]

export const AP_COURSES: string[] = AP_COURSE_CATEGORIES.flatMap((c) => c.courses)
