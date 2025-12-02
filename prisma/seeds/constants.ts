/**
 * Seed Constants - Realistic K-12 School (100 Students)
 * Authentic Sudanese school data for demo.databayt.org
 *
 * School Structure:
 * - KG Section: KG1, KG2 (Ages 4-6)
 * - Primary Section: Grades 1-6 (Ages 6-12)
 * - Intermediate Section: Grades 7-9 (Ages 12-15)
 * - Secondary Section: Grades 10-12 (Ages 15-18)
 */

// Demo password for all accounts
export const DEMO_PASSWORD = "1234";

// Demo school configuration - Comboni School (K-12)
export const DEMO_SCHOOL = {
  domain: "demo",
  name: "مدرسة كمبوني",
  nameEn: "Comboni School",
  email: "info@demo.databayt.org",
  website: "https://demo.databayt.org",
  planType: "enterprise",
  maxStudents: 500,
  maxTeachers: 50,
  timezone: "Africa/Khartoum",
  currency: "SDG",
  address: "شارع الجامعة، الخرطوم",
  city: "الخرطوم",
  state: "ولاية الخرطوم",
  country: "السودان",
  postalCode: "11111",
  phone: "+249-183-123456",
  motto: "إلى الأمام دائماً",
  mottoEn: "Always Forward",
  founded: 1900,
  schoolType: "Full K-12 School",
  levels: ["Kindergarten", "Primary", "Intermediate", "Secondary"],
};

// Realistic student distribution for 100-student K-12 school
// Higher enrollment in lower grades, natural attrition up
export const STUDENT_DISTRIBUTION = [
  { level: "KG 1", count: 10, ageRange: [4, 5] },
  { level: "KG 2", count: 10, ageRange: [5, 6] },
  { level: "Grade 1", count: 9, ageRange: [6, 7] },
  { level: "Grade 2", count: 8, ageRange: [7, 8] },
  { level: "Grade 3", count: 8, ageRange: [8, 9] },
  { level: "Grade 4", count: 7, ageRange: [9, 10] },
  { level: "Grade 5", count: 7, ageRange: [10, 11] },
  { level: "Grade 6", count: 7, ageRange: [11, 12] },
  { level: "Grade 7", count: 6, ageRange: [12, 13] },
  { level: "Grade 8", count: 6, ageRange: [13, 14] },
  { level: "Grade 9", count: 6, ageRange: [14, 15] },
  { level: "Grade 10", count: 6, ageRange: [15, 16] },
  { level: "Grade 11", count: 5, ageRange: [16, 17] },
  { level: "Grade 12", count: 5, ageRange: [17, 18] },
]; // Total: 100 students

// Sudanese male names (authentic)
export const MALE_NAMES = [
  "Ahmed", "Mohamed", "Osman", "Ibrahim", "Khalid", "Hassan", "Ali", "Omar",
  "Abdalla", "Mustafa", "Kamal", "Tariq", "Yousif", "Salih", "Malik", "Bashir",
  "Hamza", "Idris", "Jamal", "Nabil", "Rashid", "Saeed", "Waleed", "Zain",
  "Amin", "Farouk", "Gamal", "Hisham", "Imad", "Jaafar", "Lutfi", "Munir",
  "Adam", "Babiker", "Dafalla", "Elamin", "Fadel", "Galal", "Hashim", "Ismail",
];

// Sudanese female names (authentic)
export const FEMALE_NAMES = [
  "Fatima", "Aisha", "Mariam", "Amina", "Khadija", "Huda", "Sara", "Layla",
  "Sumaya", "Rania", "Noura", "Zahra", "Samira", "Hana", "Dalal", "Nawal",
  "Mona", "Rehab", "Safaa", "Tahani", "Widad", "Yasmin", "Zainab", "Amal",
  "Basma", "Dalia", "Eman", "Fadia", "Ghada", "Hiba", "Inas", "Jumana",
  "Kawther", "Lubna", "Manal", "Nahla", "Ola", "Rasha", "Sawsan", "Taghreed",
];

// Sudanese surnames (authentic)
export const SURNAMES = [
  "Hassan", "Ali", "Ahmed", "Mohamed", "Ibrahim", "Osman", "Yousif", "Salih",
  "Abdalla", "Mustafa", "Khalid", "Omar", "Abdelrahman", "Kamal", "Malik",
  "Bashir", "Hamza", "Idris", "Jamal", "Nabil", "Abbas", "Badawi", "Elsayed",
  "Fadl", "Gaber", "Habib", "Ismail", "Jafar", "Karam", "Latif", "Mahdi",
  "Nasr", "Qasim", "Rizk", "Salam", "Taha", "Wahab", "Yassin", "Zahran",
];

// Year levels (KG through Grade 12) - Sudanese education system
export const YEAR_LEVELS = [
  { ar: "روضة أولى", en: "KG 1", order: 1, section: "KG" },
  { ar: "روضة ثانية", en: "KG 2", order: 2, section: "KG" },
  { ar: "الصف الأول", en: "Grade 1", order: 3, section: "Primary" },
  { ar: "الصف الثاني", en: "Grade 2", order: 4, section: "Primary" },
  { ar: "الصف الثالث", en: "Grade 3", order: 5, section: "Primary" },
  { ar: "الصف الرابع", en: "Grade 4", order: 6, section: "Primary" },
  { ar: "الصف الخامس", en: "Grade 5", order: 7, section: "Primary" },
  { ar: "الصف السادس", en: "Grade 6", order: 8, section: "Primary" },
  { ar: "الصف السابع", en: "Grade 7", order: 9, section: "Intermediate" },
  { ar: "الصف الثامن", en: "Grade 8", order: 10, section: "Intermediate" },
  { ar: "الصف التاسع", en: "Grade 9", order: 11, section: "Intermediate" },
  { ar: "الصف العاشر", en: "Grade 10", order: 12, section: "Secondary" },
  { ar: "الصف الحادي عشر", en: "Grade 11", order: 13, section: "Secondary" },
  { ar: "الصف الثاني عشر", en: "Grade 12", order: 14, section: "Secondary" },
];

// Teacher assignments - 25 teachers for 100 students (1:4 ratio)
export const TEACHER_DATA = [
  // KG Teachers (3) - Generalists
  { givenName: "Fatima", surname: "Hassan", gender: "F", dept: "Languages", specialty: "KG Teacher", levels: ["KG 1", "KG 2"] },
  { givenName: "Mariam", surname: "Ali", gender: "F", dept: "Languages", specialty: "KG Teacher", levels: ["KG 1", "KG 2"] },
  { givenName: "Aisha", surname: "Ibrahim", gender: "F", dept: "Arts & PE", specialty: "KG Teacher", levels: ["KG 1", "KG 2"] },

  // Primary Teachers (8) - Generalists + Specialists
  { givenName: "Sara", surname: "Mohamed", gender: "F", dept: "Languages", specialty: "Primary Arabic", levels: ["Grade 1", "Grade 2", "Grade 3"] },
  { givenName: "Huda", surname: "Osman", gender: "F", dept: "Languages", specialty: "Primary English", levels: ["Grade 1", "Grade 2", "Grade 3"] },
  { givenName: "Ahmed", surname: "Khalid", gender: "M", dept: "Sciences", specialty: "Primary Math", levels: ["Grade 4", "Grade 5", "Grade 6"] },
  { givenName: "Mohamed", surname: "Hassan", gender: "M", dept: "Sciences", specialty: "Primary Science", levels: ["Grade 4", "Grade 5", "Grade 6"] },
  { givenName: "Amina", surname: "Yousif", gender: "F", dept: "Religion", specialty: "Primary Islamic", levels: ["Grade 1", "Grade 2", "Grade 3"] },
  { givenName: "Khadija", surname: "Salih", gender: "F", dept: "Humanities", specialty: "Primary Social", levels: ["Grade 4", "Grade 5", "Grade 6"] },
  { givenName: "Layla", surname: "Ahmed", gender: "F", dept: "Languages", specialty: "Primary Arabic", levels: ["Grade 4", "Grade 5", "Grade 6"] },
  { givenName: "Noura", surname: "Ibrahim", gender: "F", dept: "Languages", specialty: "Primary English", levels: ["Grade 1", "Grade 2", "Grade 3"] },

  // Intermediate & Secondary Teachers (14) - Subject Specialists
  { givenName: "Ibrahim", surname: "Malik", gender: "M", dept: "Sciences", specialty: "Mathematics", levels: ["Grade 7", "Grade 8", "Grade 9"] },
  { givenName: "Osman", surname: "Ali", gender: "M", dept: "Sciences", specialty: "Mathematics", levels: ["Grade 10", "Grade 11", "Grade 12"] },
  { givenName: "Mustafa", surname: "Hassan", gender: "M", dept: "Sciences", specialty: "Physics", levels: ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"] },
  { givenName: "Hassan", surname: "Omar", gender: "M", dept: "Sciences", specialty: "Chemistry", levels: ["Grade 9", "Grade 10", "Grade 11", "Grade 12"] },
  { givenName: "Khalid", surname: "Ibrahim", gender: "M", dept: "Sciences", specialty: "Biology", levels: ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"] },
  { givenName: "Omar", surname: "Salih", gender: "M", dept: "Languages", specialty: "Arabic", levels: ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"] },
  { givenName: "Tariq", surname: "Ahmed", gender: "M", dept: "Languages", specialty: "English", levels: ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"] },
  { givenName: "Saeed", surname: "Yousif", gender: "M", dept: "Humanities", specialty: "Geography", levels: ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"] },
  { givenName: "Waleed", surname: "Mohamed", gender: "M", dept: "Humanities", specialty: "History", levels: ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"] },
  { givenName: "Jamal", surname: "Osman", gender: "M", dept: "Religion", specialty: "Islamic Studies", levels: ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"] },
  { givenName: "Imad", surname: "Khalid", gender: "M", dept: "ICT", specialty: "Computer Science", levels: ["Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"] },
  { givenName: "Munir", surname: "Hassan", gender: "M", dept: "Arts & PE", specialty: "Physical Education", levels: ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"] },
  { givenName: "Basma", surname: "Ali", gender: "F", dept: "Arts & PE", specialty: "Art", levels: ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9"] },
  { givenName: "Dalia", surname: "Mohamed", gender: "F", dept: "Languages", specialty: "French", levels: ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"] },
];

// Departments with subjects by grade level applicability
export const DEPARTMENTS = [
  {
    name: "اللغات",
    nameEn: "Languages",
    subjects: [
      { ar: "اللغة العربية", en: "Arabic", levels: "all" },
      { ar: "اللغة الإنجليزية", en: "English", levels: "all" },
      { ar: "اللغة الفرنسية", en: "French", levels: "intermediate-secondary" },
      { ar: "القراءة", en: "Reading", levels: "kg-primary" },
      { ar: "الكتابة", en: "Writing", levels: "kg-primary" },
    ],
  },
  {
    name: "العلوم",
    nameEn: "Sciences",
    subjects: [
      { ar: "الرياضيات", en: "Mathematics", levels: "all" },
      { ar: "العلوم", en: "Science", levels: "kg-primary" },
      { ar: "الفيزياء", en: "Physics", levels: "intermediate-secondary" },
      { ar: "الكيمياء", en: "Chemistry", levels: "intermediate-secondary" },
      { ar: "الأحياء", en: "Biology", levels: "intermediate-secondary" },
    ],
  },
  {
    name: "العلوم الإنسانية",
    nameEn: "Humanities",
    subjects: [
      { ar: "الدراسات الاجتماعية", en: "Social Studies", levels: "primary" },
      { ar: "الجغرافيا", en: "Geography", levels: "intermediate-secondary" },
      { ar: "التاريخ", en: "History", levels: "intermediate-secondary" },
      { ar: "التربية الوطنية", en: "Civics", levels: "intermediate-secondary" },
    ],
  },
  {
    name: "الدين",
    nameEn: "Religion",
    subjects: [
      { ar: "التربية الإسلامية", en: "Islamic Studies", levels: "all" },
      { ar: "القرآن الكريم", en: "Quran", levels: "all" },
    ],
  },
  {
    name: "تقنية المعلومات",
    nameEn: "ICT",
    subjects: [
      { ar: "الحاسوب", en: "Computer Science", levels: "primary-secondary" },
    ],
  },
  {
    name: "الفنون والرياضة",
    nameEn: "Arts & PE",
    subjects: [
      { ar: "التربية الفنية", en: "Art", levels: "all" },
      { ar: "التربية البدنية", en: "Physical Education", levels: "all" },
      { ar: "الموسيقى", en: "Music", levels: "kg-primary" },
    ],
  },
];

// Subjects per grade level - Realistic curriculum
export const CURRICULUM = {
  "KG 1": ["Arabic", "English", "Mathematics", "Islamic Studies", "Art", "Physical Education", "Music"],
  "KG 2": ["Arabic", "English", "Mathematics", "Islamic Studies", "Art", "Physical Education", "Music"],
  "Grade 1": ["Arabic", "English", "Mathematics", "Science", "Islamic Studies", "Social Studies", "Art", "Physical Education"],
  "Grade 2": ["Arabic", "English", "Mathematics", "Science", "Islamic Studies", "Social Studies", "Art", "Physical Education"],
  "Grade 3": ["Arabic", "English", "Mathematics", "Science", "Islamic Studies", "Social Studies", "Art", "Physical Education"],
  "Grade 4": ["Arabic", "English", "Mathematics", "Science", "Islamic Studies", "Social Studies", "Art", "Physical Education", "Computer Science"],
  "Grade 5": ["Arabic", "English", "Mathematics", "Science", "Islamic Studies", "Social Studies", "Art", "Physical Education", "Computer Science"],
  "Grade 6": ["Arabic", "English", "Mathematics", "Science", "Islamic Studies", "Social Studies", "Art", "Physical Education", "Computer Science"],
  "Grade 7": ["Arabic", "English", "French", "Mathematics", "Physics", "Chemistry", "Biology", "Islamic Studies", "Geography", "History", "Computer Science", "Art", "Physical Education"],
  "Grade 8": ["Arabic", "English", "French", "Mathematics", "Physics", "Chemistry", "Biology", "Islamic Studies", "Geography", "History", "Computer Science", "Art", "Physical Education"],
  "Grade 9": ["Arabic", "English", "French", "Mathematics", "Physics", "Chemistry", "Biology", "Islamic Studies", "Geography", "History", "Computer Science", "Art", "Physical Education"],
  "Grade 10": ["Arabic", "English", "French", "Mathematics", "Physics", "Chemistry", "Biology", "Islamic Studies", "Geography", "History", "Computer Science", "Physical Education"],
  "Grade 11": ["Arabic", "English", "French", "Mathematics", "Physics", "Chemistry", "Biology", "Islamic Studies", "Geography", "History", "Computer Science", "Physical Education"],
  "Grade 12": ["Arabic", "English", "French", "Mathematics", "Physics", "Chemistry", "Biology", "Islamic Studies", "Geography", "History", "Computer Science", "Physical Education"],
};

// Periods - Sudanese school day (7:45 AM - 2:30 PM, Sun-Thu)
export const PERIODS = [
  { name: "Period 1", startHour: 7, startMin: 45, endHour: 8, endMin: 30 },
  { name: "Period 2", startHour: 8, startMin: 35, endHour: 9, endMin: 20 },
  { name: "Break", startHour: 9, startMin: 20, endHour: 9, endMin: 40 },
  { name: "Period 3", startHour: 9, startMin: 40, endHour: 10, endMin: 25 },
  { name: "Period 4", startHour: 10, startMin: 30, endHour: 11, endMin: 15 },
  { name: "Period 5", startHour: 11, startMin: 20, endHour: 12, endMin: 5 },
  { name: "Lunch", startHour: 12, startMin: 5, endHour: 12, endMin: 45 },
  { name: "Period 6", startHour: 12, startMin: 45, endHour: 13, endMin: 30 },
  { name: "Period 7", startHour: 13, startMin: 35, endHour: 14, endMin: 20 },
];

// Working days (Sun-Thu for Sudan)
export const WORKING_DAYS = [0, 1, 2, 3, 4]; // Sunday=0 to Thursday=4

// Khartoum neighborhoods for addresses
export const KHARTOUM_NEIGHBORHOODS = [
  "الرياض", "المنشية", "الصحافة", "الطائف", "جبرة", "الأمارات", "الخرطوم 2",
  "المعمورة", "الديوم الشرقية", "بري", "الشعبية", "كافوري", "الكلاكلة",
  "أركويت", "الصافية", "القوز", "الجريف", "سوبا", "الفردوس", "المنصورة",
];

// Classroom configuration for 100-student school
export const CLASSROOMS = [
  // KG Classrooms
  { name: "KG Room 1", type: "KG Classroom", capacity: 20 },
  { name: "KG Room 2", type: "KG Classroom", capacity: 20 },
  // Primary Classrooms
  { name: "Room 101", type: "Standard Classroom", capacity: 25 },
  { name: "Room 102", type: "Standard Classroom", capacity: 25 },
  { name: "Room 103", type: "Standard Classroom", capacity: 25 },
  { name: "Room 104", type: "Standard Classroom", capacity: 25 },
  { name: "Room 105", type: "Standard Classroom", capacity: 25 },
  { name: "Room 106", type: "Standard Classroom", capacity: 25 },
  // Intermediate & Secondary Classrooms
  { name: "Room 201", type: "Standard Classroom", capacity: 30 },
  { name: "Room 202", type: "Standard Classroom", capacity: 30 },
  { name: "Room 203", type: "Standard Classroom", capacity: 30 },
  { name: "Room 204", type: "Standard Classroom", capacity: 30 },
  // Specialized Rooms
  { name: "Science Lab", type: "Laboratory", capacity: 25 },
  { name: "Computer Lab", type: "Computer Lab", capacity: 25 },
  { name: "Library", type: "Library", capacity: 40 },
  { name: "Art Room", type: "Art Room", capacity: 20 },
  { name: "Sports Hall", type: "Sports Hall", capacity: 100 },
];

// Helper functions
export function getRandomName(gender: "M" | "F"): { givenName: string; surname: string } {
  const names = gender === "M" ? MALE_NAMES : FEMALE_NAMES;
  return {
    givenName: names[Math.floor(Math.random() * names.length)],
    surname: SURNAMES[Math.floor(Math.random() * SURNAMES.length)],
  };
}

export function timeAt(hour: number, minute = 0): Date {
  return new Date(Date.UTC(1970, 0, 1, hour, minute, 0, 0));
}

export function getAgeForGrade(level: string, currentYear: number): number {
  const dist = STUDENT_DISTRIBUTION.find(d => d.level === level);
  if (!dist) return 10;
  const [minAge, maxAge] = dist.ageRange;
  return minAge + Math.floor(Math.random() * (maxAge - minAge + 1));
}

export function getBirthYearForGrade(level: string, currentYear: number = 2025): number {
  const age = getAgeForGrade(level, currentYear);
  return currentYear - age;
}

// Arabic labels
export const ARABIC_LABELS = {
  grade: "الصف",
  section: { A: "أ", B: "ب", C: "ج", D: "د" },
};

export function getClassNameAr(subjectAr: string, grade: string, section: string): string {
  const sectionAr = ARABIC_LABELS.section[section as keyof typeof ARABIC_LABELS.section] || section;
  return `${subjectAr} ${ARABIC_LABELS.grade} ${grade} ${sectionAr}`;
}

export function findSubjectAr(subjectNameEn: string): string {
  for (const dept of DEPARTMENTS) {
    const subject = dept.subjects.find(s => s.en === subjectNameEn);
    if (subject) return subject.ar;
  }
  return subjectNameEn;
}
