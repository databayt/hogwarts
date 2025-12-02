/**
 * Seed Constants
 * Shared configuration for demo school seeding
 * Authentic Sudanese school data for demo.databayt.org
 */

// Demo password for all accounts (easy demo access)
export const DEMO_PASSWORD = "1234";

// Demo school configuration - Based on Comboni Schools of Sudan
// Comboni Schools are renowned in Sudan for academic excellence since 1900
// Named after Saint Daniel Comboni, first bishop of Central Africa
// Full K-12 school (KG through Grade 12)
export const DEMO_SCHOOL = {
  domain: "demo",
  name: "مدرسة كمبوني",  // Comboni School
  nameEn: "Comboni School",
  email: "info@demo.databayt.org",
  website: "https://demo.databayt.org",
  planType: "enterprise",
  maxStudents: 5000,
  maxTeachers: 500,
  timezone: "Africa/Khartoum",
  currency: "SDG",  // Sudanese Pound
  address: "الخرطوم، السودان",  // Khartoum, Sudan
  city: "الخرطوم",  // Khartoum
  state: "ولاية الخرطوم",  // Khartoum State
  country: "السودان",  // Sudan
  postalCode: "11111",
  phone: "+249-183-123456",
  fax: "+249-183-123457",
  motto: "إلى الأمام دائماً",  // Always Forward
  mottoEn: "Always Forward - Excellence Through Education",
  founded: 1900,  // Comboni schools established after 1898
  heritage: "Established in the tradition of Saint Daniel Comboni's vision for African education",
  schoolType: "Full K-12 School (Kindergarten through Grade 12)",
  levels: ["Kindergarten (KG1-KG2)", "Primary (Grades 1-6)", "Intermediate (Grades 7-9)", "Secondary (Grades 10-12)"],
  values: [
    "Academic Excellence",
    "Multicultural Harmony",
    "Character Formation",
    "Service to Community",
  ],
  // Comboni schools are known for educating students from diverse backgrounds
  diversity: "Students from Sudan, Egypt, Ethiopia, Eritrea, and other African nations",
};

// Sudanese/Arabic male names
export const MALE_NAMES = [
  "Ahmed", "Mohamed", "Osman", "Ibrahim", "Khalid", "Hassan", "Ali", "Omar",
  "Abdalla", "Mustafa", "Kamal", "Tariq", "Yousif", "Salih", "Malik", "Bashir",
  "Hamza", "Idris", "Jamal", "Nabil", "Rashid", "Saeed", "Waleed", "Zain",
  "Amin", "Farouk", "Gamal", "Hisham", "Imad", "Jaafar", "Lutfi", "Munir",
];

// Sudanese/Arabic female names
export const FEMALE_NAMES = [
  "Fatima", "Aisha", "Mariam", "Amina", "Khadija", "Huda", "Sara", "Layla",
  "Sumaya", "Rania", "Noura", "Zahra", "Samira", "Hana", "Dalal", "Nawal",
  "Mona", "Rehab", "Safaa", "Tahani", "Widad", "Yasmin", "Zainab", "Amal",
  "Basma", "Dalia", "Eman", "Fadia", "Ghada", "Hiba", "Inas", "Jumana",
];

// Sudanese/Arabic surnames
export const SURNAMES = [
  "Hassan", "Ali", "Ahmed", "Mohamed", "Ibrahim", "Osman", "Yousif", "Salih",
  "Abdalla", "Mustafa", "Khalid", "Omar", "Abdelrahman", "Kamal", "Malik",
  "Bashir", "Hamza", "Idris", "Jamal", "Nabil", "Abbas", "Badawi", "Elsayed",
  "Fadl", "Gaber", "Habib", "Ismail", "Jafar", "Karam", "Latif", "Mahdi",
];

// Year levels (KG through Grade 12) - Sudanese education system
export const YEAR_LEVELS = [
  { ar: "روضة أولى", en: "KG 1", order: 1 },
  { ar: "روضة ثانية", en: "KG 2", order: 2 },
  { ar: "الصف الأول", en: "Grade 1", order: 3 },
  { ar: "الصف الثاني", en: "Grade 2", order: 4 },
  { ar: "الصف الثالث", en: "Grade 3", order: 5 },
  { ar: "الصف الرابع", en: "Grade 4", order: 6 },
  { ar: "الصف الخامس", en: "Grade 5", order: 7 },
  { ar: "الصف السادس", en: "Grade 6", order: 8 },
  { ar: "الصف السابع", en: "Grade 7", order: 9 },
  { ar: "الصف الثامن", en: "Grade 8", order: 10 },
  { ar: "الصف التاسع", en: "Grade 9", order: 11 },  // End of basic education
  { ar: "الصف العاشر", en: "Grade 10", order: 12 },
  { ar: "الصف الحادي عشر", en: "Grade 11", order: 13 },
  { ar: "الصف الثاني عشر", en: "Grade 12", order: 14 },  // Sudan Certificate
];

// Sudanese cities and states
export const SUDANESE_CITIES = [
  { city: "الخرطوم", state: "ولاية الخرطوم", cityEn: "Khartoum", stateEn: "Khartoum State" },
  { city: "أم درمان", state: "ولاية الخرطوم", cityEn: "Omdurman", stateEn: "Khartoum State" },
  { city: "بحري", state: "ولاية الخرطوم", cityEn: "Bahri", stateEn: "Khartoum State" },
  { city: "بورتسودان", state: "ولاية البحر الأحمر", cityEn: "Port Sudan", stateEn: "Red Sea State" },
  { city: "كسلا", state: "ولاية كسلا", cityEn: "Kassala", stateEn: "Kassala State" },
  { city: "القضارف", state: "ولاية القضارف", cityEn: "Gedaref", stateEn: "Gedaref State" },
  { city: "مدني", state: "ولاية الجزيرة", cityEn: "Wad Madani", stateEn: "Gezira State" },
  { city: "كوستي", state: "ولاية النيل الأبيض", cityEn: "Kosti", stateEn: "White Nile State" },
  { city: "الأبيض", state: "ولاية شمال كردفان", cityEn: "El-Obeid", stateEn: "North Kordofan State" },
  { city: "نيالا", state: "ولاية جنوب دارفور", cityEn: "Nyala", stateEn: "South Darfur State" },
  { city: "الفاشر", state: "ولاية شمال دارفور", cityEn: "El-Fasher", stateEn: "North Darfur State" },
  { city: "عطبرة", state: "ولاية نهر النيل", cityEn: "Atbara", stateEn: "River Nile State" },
  { city: "دنقلا", state: "الولاية الشمالية", cityEn: "Dongola", stateEn: "Northern State" },
  { city: "سنار", state: "ولاية سنار", cityEn: "Sennar", stateEn: "Sennar State" },
];

// Sudanese neighborhoods in Khartoum for addresses
export const KHARTOUM_NEIGHBORHOODS = [
  "الرياض", "المنشية", "الصحافة", "الطائف", "جبرة", "الأمارات", "الخرطوم 2",
  "المعمورة", "الديوم الشرقية", "بري", "الشعبية", "كافوري", "الكلاكلة",
  "أركويت", "الصافية", "القوز", "الجريف", "سوبا", "الفردوس", "المنصورة",
];

// Departments and their subjects (Sudanese National Curriculum aligned - Full K-12)
export const DEPARTMENTS = [
  {
    name: "اللغات",  // Languages
    nameEn: "Languages",
    subjects: [
      { ar: "اللغة العربية", en: "Arabic" },
      { ar: "اللغة الإنجليزية", en: "English" },
      { ar: "اللغة الفرنسية", en: "French" },
      { ar: "القراءة", en: "Reading" },
      { ar: "الكتابة", en: "Writing" },
      { ar: "الإملاء", en: "Spelling" },
      { ar: "التعبير", en: "Composition" },
      { ar: "النحو والصرف", en: "Grammar" },
      { ar: "الأدب العربي", en: "Arabic Literature" },
      { ar: "الأدب الإنجليزي", en: "English Literature" },
      { ar: "الخط العربي", en: "Calligraphy" },
    ],
  },
  {
    name: "العلوم",  // Sciences
    nameEn: "Sciences",
    subjects: [
      { ar: "الرياضيات", en: "Mathematics" },
      { ar: "الحساب", en: "Arithmetic" },
      { ar: "الجبر", en: "Algebra" },
      { ar: "الهندسة", en: "Geometry" },
      { ar: "الإحصاء", en: "Statistics" },
      { ar: "العلوم", en: "Science" },
      { ar: "الفيزياء", en: "Physics" },
      { ar: "الكيمياء", en: "Chemistry" },
      { ar: "الأحياء", en: "Biology" },
      { ar: "علوم البيئة", en: "Environmental" },
      { ar: "علوم الأرض", en: "Earth Science" },
    ],
  },
  {
    name: "العلوم الإنسانية",  // Humanities
    nameEn: "Humanities",
    subjects: [
      { ar: "الدراسات الاجتماعية", en: "Social Studies" },
      { ar: "الجغرافيا", en: "Geography" },
      { ar: "التاريخ", en: "History" },
      { ar: "التاريخ السوداني", en: "Sudanese History" },
      { ar: "التربية الوطنية", en: "Civics" },
      { ar: "الاقتصاد", en: "Economics" },
      { ar: "علم النفس", en: "Psychology" },
      { ar: "علم الاجتماع", en: "Sociology" },
      { ar: "الفلسفة", en: "Philosophy" },
    ],
  },
  {
    name: "الدين",  // Religion
    nameEn: "Religion",
    subjects: [
      { ar: "التربية الإسلامية", en: "Islamic" },
      { ar: "القرآن الكريم", en: "Quran" },
      { ar: "التجويد", en: "Tajweed" },
      { ar: "الحديث النبوي", en: "Hadith" },
      { ar: "الفقه", en: "Fiqh" },
      { ar: "التوحيد", en: "Tawheed" },
      { ar: "السيرة النبوية", en: "Seerah" },
      { ar: "الأخلاق الإسلامية", en: "Islamic Ethics" },
    ],
  },
  {
    name: "تقنية المعلومات",  // ICT
    nameEn: "ICT",
    subjects: [
      { ar: "علوم الحاسوب", en: "Computer Science" },
      { ar: "تقنية المعلومات", en: "IT" },
      { ar: "الثقافة الرقمية", en: "Digital Literacy" },
      { ar: "البرمجة", en: "Programming" },
      { ar: "تصميم المواقع", en: "Web Design" },
      { ar: "الروبوتات", en: "Robotics" },
    ],
  },
  {
    name: "الفنون والرياضة",  // Arts & PE
    nameEn: "Arts & PE",
    subjects: [
      { ar: "التربية الفنية", en: "Art" },
      { ar: "التربية الموسيقية", en: "Music" },
      { ar: "التربية البدنية", en: "Physical" },
      { ar: "التربية الصحية", en: "Health" },
      { ar: "الأشغال اليدوية", en: "Crafts" },
      { ar: "المسرح", en: "Drama" },
      { ar: "التربية الأسرية", en: "Home Economics" },
    ],
  },
  {
    name: "مهارات الحياة",  // Life Skills
    nameEn: "Life Skills",
    subjects: [
      { ar: "المهارات الحياتية", en: "Life Skills" },
      { ar: "التوجيه المهني", en: "Career Guidance" },
      { ar: "ريادة الأعمال", en: "Entrepreneurship" },
      { ar: "التفكير النقدي", en: "Critical Thinking" },
      { ar: "مهارات التواصل", en: "Communication" },
    ],
  },
];

// Periods configuration
export const PERIODS = [
  { name: "Period 1", startHour: 7, startMin: 45, endHour: 8, endMin: 30 },
  { name: "Period 2", startHour: 8, startMin: 35, endHour: 9, endMin: 20 },
  { name: "Period 3", startHour: 9, startMin: 30, endHour: 10, endMin: 15 },
  { name: "Period 4", startHour: 10, startMin: 25, endHour: 11, endMin: 10 },
  { name: "Period 5", startHour: 11, startMin: 20, endHour: 12, endMin: 5 },
  { name: "Period 6", startHour: 12, startMin: 15, endHour: 13, endMin: 0 },
  { name: "Period 7", startHour: 13, startMin: 45, endHour: 14, endMin: 30 },
  { name: "Period 8", startHour: 14, startMin: 35, endHour: 15, endMin: 20 },
];

// Working days (Sun-Thu)
export const WORKING_DAYS = [0, 1, 2, 3, 4];

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

// Arabic labels for class generation
export const ARABIC_LABELS = {
  grade: "الصف",
  section: { A: "أ", B: "ب", C: "ج", D: "د" },
};

/**
 * Generate Arabic class name from English components
 * @param subjectAr - Arabic subject name (from DEPARTMENTS subjects)
 * @param grade - Grade number (10, 11, 12)
 * @param section - Section letter (A, B, C)
 * @returns Arabic class name like "الرياضيات الصف 10 أ"
 */
export function getClassNameAr(subjectAr: string, grade: string, section: string): string {
  const sectionAr = ARABIC_LABELS.section[section as keyof typeof ARABIC_LABELS.section] || section;
  return `${subjectAr} ${ARABIC_LABELS.grade} ${grade} ${sectionAr}`;
}

/**
 * Find Arabic subject name from English name
 */
export function findSubjectAr(subjectNameEn: string): string {
  for (const dept of DEPARTMENTS) {
    const subject = dept.subjects.find(s => s.en === subjectNameEn);
    if (subject) return subject.ar;
  }
  return subjectNameEn;  // Fallback to English if not found
}
