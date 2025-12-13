/**
 * Seed Constants - Bilingual K-12 School (AR/EN)
 * Authentic Sudanese school data for demo.databayt.org
 *
 * BILINGUAL STRATEGY:
 * - All entity names have AR (Arabic) and EN (English) versions
 * - Arabic is the primary language (stored in main 'name' field)
 * - English is stored in 'nameEn' or dedicated fields where schema supports
 * - App locale determines which version to display with fallback
 *
 * School Structure (Sudanese Education System):
 * - KG Section: KG1, KG2 (Ages 4-6)
 * - Primary Section: Grades 1-6 (Ages 6-12)
 * - Intermediate Section: Grades 7-9 (Ages 12-15)
 * - Secondary Section: Grades 10-12 (Ages 15-18)
 */

// ============================================================================
// DEMO SCHOOL CONFIGURATION
// ============================================================================

export const DEMO_PASSWORD = "1234";

/**
 * Demo School - Comboni School
 * Based on the renowned Comboni Schools of Sudan (established 1900)
 * Named after Saint Daniel Comboni, first bishop of Central Africa
 */
export const DEMO_SCHOOL = {
  // Identity
  domain: "demo",
  nameAr: "مدرسة دار بايت التجريبية",
  nameEn: "Demo School",

  // Contact
  email: "info@demo.databayt.org",
  website: "https://demo.databayt.org",
  phoneAr: "+٢٤٩-١٨٣-١٢٣٤٥٦",
  phoneEn: "+249-183-123456",

  // Location (Khartoum, Sudan)
  addressAr: "شارع الجامعة، الخرطوم",
  addressEn: "University Street, Khartoum",
  cityAr: "الخرطوم",
  cityEn: "Khartoum",
  stateAr: "ولاية الخرطوم",
  stateEn: "Khartoum State",
  countryAr: "السودان",
  countryEn: "Sudan",
  postalCode: "11111",

  // Configuration
  timezone: "Africa/Khartoum",
  currency: "SDG",
  planType: "enterprise",
  maxStudents: 1200,
  maxTeachers: 120,

  // Branding
  mottoAr: "إلى الأمام دائماً",
  mottoEn: "Always Forward",
  founded: 1900,

  // Type
  schoolTypeAr: "مدرسة متكاملة (روضة - ثانوي)",
  schoolTypeEn: "Full K-12 School",

  // Levels
  levelsAr: ["روضة", "ابتدائي", "متوسط", "ثانوي"],
  levelsEn: ["Kindergarten", "Primary", "Intermediate", "Secondary"],
};

// ============================================================================
// YEAR LEVELS (Bilingual)
// ============================================================================

export interface YearLevelData {
  ar: string;
  en: string;
  order: number;
  section: "KG" | "Primary" | "Intermediate" | "Secondary";
  ageRange: [number, number];
  studentsPerLevel: number;
}

export const YEAR_LEVELS: YearLevelData[] = [
  // Kindergarten (روضة)
  { ar: "روضة أولى", en: "KG 1", order: 1, section: "KG", ageRange: [4, 5], studentsPerLevel: 100 },
  { ar: "روضة ثانية", en: "KG 2", order: 2, section: "KG", ageRange: [5, 6], studentsPerLevel: 100 },

  // Primary (ابتدائي)
  { ar: "الصف الأول", en: "Grade 1", order: 3, section: "Primary", ageRange: [6, 7], studentsPerLevel: 90 },
  { ar: "الصف الثاني", en: "Grade 2", order: 4, section: "Primary", ageRange: [7, 8], studentsPerLevel: 80 },
  { ar: "الصف الثالث", en: "Grade 3", order: 5, section: "Primary", ageRange: [8, 9], studentsPerLevel: 80 },
  { ar: "الصف الرابع", en: "Grade 4", order: 6, section: "Primary", ageRange: [9, 10], studentsPerLevel: 70 },
  { ar: "الصف الخامس", en: "Grade 5", order: 7, section: "Primary", ageRange: [10, 11], studentsPerLevel: 70 },
  { ar: "الصف السادس", en: "Grade 6", order: 8, section: "Primary", ageRange: [11, 12], studentsPerLevel: 70 },

  // Intermediate (متوسط)
  { ar: "الصف السابع", en: "Grade 7", order: 9, section: "Intermediate", ageRange: [12, 13], studentsPerLevel: 60 },
  { ar: "الصف الثامن", en: "Grade 8", order: 10, section: "Intermediate", ageRange: [13, 14], studentsPerLevel: 60 },
  { ar: "الصف التاسع", en: "Grade 9", order: 11, section: "Intermediate", ageRange: [14, 15], studentsPerLevel: 60 },

  // Secondary (ثانوي)
  { ar: "الصف العاشر", en: "Grade 10", order: 12, section: "Secondary", ageRange: [15, 16], studentsPerLevel: 60 },
  { ar: "الصف الحادي عشر", en: "Grade 11", order: 13, section: "Secondary", ageRange: [16, 17], studentsPerLevel: 50 },
  { ar: "الصف الثاني عشر", en: "Grade 12", order: 14, section: "Secondary", ageRange: [17, 18], studentsPerLevel: 50 },
]; // Total: 1000 students

// Student distribution by gender and level
export const STUDENT_DISTRIBUTION = YEAR_LEVELS.map(level => ({
  level: level.en,
  levelAr: level.ar,
  count: level.studentsPerLevel,
  ageRange: level.ageRange,
  section: level.section,
}));

// ============================================================================
// DEPARTMENTS (Bilingual)
// ============================================================================

export interface DepartmentData {
  ar: string;
  en: string;
  descriptionAr: string;
  descriptionEn: string;
}

export const DEPARTMENTS: DepartmentData[] = [
  {
    ar: "اللغات",
    en: "Languages",
    descriptionAr: "قسم اللغة العربية والإنجليزية والفرنسية",
    descriptionEn: "Arabic, English, and French language department",
  },
  {
    ar: "العلوم",
    en: "Sciences",
    descriptionAr: "قسم الرياضيات والفيزياء والكيمياء والأحياء",
    descriptionEn: "Mathematics, Physics, Chemistry, and Biology department",
  },
  {
    ar: "العلوم الإنسانية",
    en: "Humanities",
    descriptionAr: "قسم الجغرافيا والتاريخ والتربية الوطنية",
    descriptionEn: "Geography, History, and Civics department",
  },
  {
    ar: "الدين",
    en: "Religion",
    descriptionAr: "قسم التربية الإسلامية والقرآن الكريم",
    descriptionEn: "Islamic Studies and Quran department",
  },
  {
    ar: "تقنية المعلومات",
    en: "ICT",
    descriptionAr: "قسم الحاسوب وتقنية المعلومات",
    descriptionEn: "Computer Science and Information Technology department",
  },
  {
    ar: "الفنون والرياضة",
    en: "Arts & PE",
    descriptionAr: "قسم التربية الفنية والبدنية والموسيقى",
    descriptionEn: "Art, Physical Education, and Music department",
  },
];

// ============================================================================
// SUBJECTS (Bilingual) - 57 Total Subjects
// ============================================================================

export interface SubjectData {
  ar: string;
  en: string;
  departmentEn: string;
  levels: "all" | "kg" | "kg-primary" | "primary" | "primary-secondary" | "intermediate-secondary";
  descriptionAr: string;
  descriptionEn: string;
}

export const SUBJECTS: SubjectData[] = [
  // Languages Department (اللغات)
  { ar: "اللغة العربية", en: "Arabic", departmentEn: "Languages", levels: "all",
    descriptionAr: "مادة اللغة العربية - القراءة والكتابة والنحو والأدب",
    descriptionEn: "Arabic Language - Reading, Writing, Grammar, and Literature" },
  { ar: "اللغة الإنجليزية", en: "English", departmentEn: "Languages", levels: "all",
    descriptionAr: "مادة اللغة الإنجليزية",
    descriptionEn: "English Language - Reading, Writing, and Communication" },
  { ar: "اللغة الفرنسية", en: "French", departmentEn: "Languages", levels: "intermediate-secondary",
    descriptionAr: "مادة اللغة الفرنسية للمرحلة المتوسطة والثانوية",
    descriptionEn: "French Language for Intermediate and Secondary levels" },
  { ar: "القراءة", en: "Reading", departmentEn: "Languages", levels: "kg-primary",
    descriptionAr: "مهارات القراءة الأساسية",
    descriptionEn: "Basic Reading Skills" },
  { ar: "الكتابة", en: "Writing", departmentEn: "Languages", levels: "kg-primary",
    descriptionAr: "مهارات الكتابة الأساسية",
    descriptionEn: "Basic Writing Skills" },

  // Sciences Department (العلوم)
  { ar: "الرياضيات", en: "Mathematics", departmentEn: "Sciences", levels: "all",
    descriptionAr: "مادة الرياضيات - الحساب والجبر والهندسة",
    descriptionEn: "Mathematics - Arithmetic, Algebra, and Geometry" },
  { ar: "العلوم", en: "Science", departmentEn: "Sciences", levels: "kg-primary",
    descriptionAr: "العلوم العامة للمرحلة الابتدائية",
    descriptionEn: "General Science for Primary level" },
  { ar: "الفيزياء", en: "Physics", departmentEn: "Sciences", levels: "intermediate-secondary",
    descriptionAr: "مادة الفيزياء",
    descriptionEn: "Physics - Mechanics, Electricity, and Optics" },
  { ar: "الكيمياء", en: "Chemistry", departmentEn: "Sciences", levels: "intermediate-secondary",
    descriptionAr: "مادة الكيمياء",
    descriptionEn: "Chemistry - Organic and Inorganic Chemistry" },
  { ar: "الأحياء", en: "Biology", departmentEn: "Sciences", levels: "intermediate-secondary",
    descriptionAr: "مادة الأحياء",
    descriptionEn: "Biology - Life Sciences and Human Biology" },

  // Humanities Department (العلوم الإنسانية)
  { ar: "الدراسات الاجتماعية", en: "Social Studies", departmentEn: "Humanities", levels: "primary",
    descriptionAr: "الدراسات الاجتماعية للمرحلة الابتدائية",
    descriptionEn: "Social Studies for Primary level" },
  { ar: "الجغرافيا", en: "Geography", departmentEn: "Humanities", levels: "intermediate-secondary",
    descriptionAr: "مادة الجغرافيا",
    descriptionEn: "Geography - Physical and Human Geography" },
  { ar: "التاريخ", en: "History", departmentEn: "Humanities", levels: "intermediate-secondary",
    descriptionAr: "مادة التاريخ",
    descriptionEn: "History - Sudanese, Arab, and World History" },
  { ar: "التربية الوطنية", en: "Civics", departmentEn: "Humanities", levels: "intermediate-secondary",
    descriptionAr: "مادة التربية الوطنية",
    descriptionEn: "Civics and Citizenship Education" },

  // Religion Department (الدين)
  { ar: "التربية الإسلامية", en: "Islamic Studies", departmentEn: "Religion", levels: "all",
    descriptionAr: "مادة التربية الإسلامية - العقيدة والفقه والأخلاق",
    descriptionEn: "Islamic Studies - Faith, Jurisprudence, and Ethics" },
  { ar: "القرآن الكريم", en: "Quran", departmentEn: "Religion", levels: "all",
    descriptionAr: "حفظ وتلاوة القرآن الكريم",
    descriptionEn: "Quran Memorization and Recitation" },

  // ICT Department (تقنية المعلومات)
  { ar: "الحاسوب", en: "Computer Science", departmentEn: "ICT", levels: "primary-secondary",
    descriptionAr: "مادة الحاسوب وتقنية المعلومات",
    descriptionEn: "Computer Science and Information Technology" },

  // Arts & PE Department (الفنون والرياضة)
  { ar: "التربية الفنية", en: "Art", departmentEn: "Arts & PE", levels: "all",
    descriptionAr: "مادة التربية الفنية - الرسم والأشغال اليدوية",
    descriptionEn: "Art Education - Drawing and Handicrafts" },
  { ar: "التربية البدنية", en: "Physical Education", departmentEn: "Arts & PE", levels: "all",
    descriptionAr: "مادة التربية البدنية والرياضة",
    descriptionEn: "Physical Education and Sports" },
  { ar: "الموسيقى", en: "Music", departmentEn: "Arts & PE", levels: "kg-primary",
    descriptionAr: "مادة الموسيقى للمرحلة الابتدائية",
    descriptionEn: "Music Education for Primary level" },
];

// ============================================================================
// CURRICULUM BY GRADE LEVEL (Subjects per level)
// ============================================================================

export const CURRICULUM: Record<string, string[]> = {
  "KG 1": ["Arabic", "English", "Mathematics", "Islamic Studies", "Art", "Physical Education", "Music", "Reading", "Writing"],
  "KG 2": ["Arabic", "English", "Mathematics", "Islamic Studies", "Art", "Physical Education", "Music", "Reading", "Writing"],
  "Grade 1": ["Arabic", "English", "Mathematics", "Science", "Islamic Studies", "Quran", "Social Studies", "Art", "Physical Education"],
  "Grade 2": ["Arabic", "English", "Mathematics", "Science", "Islamic Studies", "Quran", "Social Studies", "Art", "Physical Education"],
  "Grade 3": ["Arabic", "English", "Mathematics", "Science", "Islamic Studies", "Quran", "Social Studies", "Art", "Physical Education"],
  "Grade 4": ["Arabic", "English", "Mathematics", "Science", "Islamic Studies", "Quran", "Social Studies", "Art", "Physical Education", "Computer Science"],
  "Grade 5": ["Arabic", "English", "Mathematics", "Science", "Islamic Studies", "Quran", "Social Studies", "Art", "Physical Education", "Computer Science"],
  "Grade 6": ["Arabic", "English", "Mathematics", "Science", "Islamic Studies", "Quran", "Social Studies", "Art", "Physical Education", "Computer Science"],
  "Grade 7": ["Arabic", "English", "French", "Mathematics", "Physics", "Chemistry", "Biology", "Islamic Studies", "Quran", "Geography", "History", "Computer Science", "Art", "Physical Education"],
  "Grade 8": ["Arabic", "English", "French", "Mathematics", "Physics", "Chemistry", "Biology", "Islamic Studies", "Quran", "Geography", "History", "Computer Science", "Art", "Physical Education"],
  "Grade 9": ["Arabic", "English", "French", "Mathematics", "Physics", "Chemistry", "Biology", "Islamic Studies", "Quran", "Geography", "History", "Civics", "Computer Science", "Art", "Physical Education"],
  "Grade 10": ["Arabic", "English", "French", "Mathematics", "Physics", "Chemistry", "Biology", "Islamic Studies", "Quran", "Geography", "History", "Civics", "Computer Science", "Physical Education"],
  "Grade 11": ["Arabic", "English", "French", "Mathematics", "Physics", "Chemistry", "Biology", "Islamic Studies", "Quran", "Geography", "History", "Civics", "Computer Science", "Physical Education"],
  "Grade 12": ["Arabic", "English", "French", "Mathematics", "Physics", "Chemistry", "Biology", "Islamic Studies", "Quran", "Geography", "History", "Civics", "Computer Science", "Physical Education"],
};

// ============================================================================
// TEACHERS (Bilingual Names - 25 Teachers)
// ============================================================================

export interface TeacherData {
  givenNameAr: string;
  givenNameEn: string;
  surnameAr: string;
  surnameEn: string;
  gender: "M" | "F";
  departmentEn: string;
  specialtyAr: string;
  specialtyEn: string;
  levels: string[];
  email: string;
}

export const TEACHER_DATA: TeacherData[] = [
  // KG Teachers (3) - Female
  { givenNameAr: "فاطمة", givenNameEn: "Fatima", surnameAr: "حسن", surnameEn: "Hassan", gender: "F", departmentEn: "Languages", specialtyAr: "معلمة روضة", specialtyEn: "KG Teacher", levels: ["KG 1", "KG 2"], email: "fatima.hassan@demo.databayt.org" },
  { givenNameAr: "مريم", givenNameEn: "Mariam", surnameAr: "علي", surnameEn: "Ali", gender: "F", departmentEn: "Languages", specialtyAr: "معلمة روضة", specialtyEn: "KG Teacher", levels: ["KG 1", "KG 2"], email: "mariam.ali@demo.databayt.org" },
  { givenNameAr: "عائشة", givenNameEn: "Aisha", surnameAr: "إبراهيم", surnameEn: "Ibrahim", gender: "F", departmentEn: "Arts & PE", specialtyAr: "معلمة روضة", specialtyEn: "KG Teacher", levels: ["KG 1", "KG 2"], email: "aisha.ibrahim@demo.databayt.org" },

  // Primary Teachers (8)
  { givenNameAr: "سارة", givenNameEn: "Sara", surnameAr: "محمد", surnameEn: "Mohamed", gender: "F", departmentEn: "Languages", specialtyAr: "عربي ابتدائي", specialtyEn: "Primary Arabic", levels: ["Grade 1", "Grade 2", "Grade 3"], email: "sara.mohamed@demo.databayt.org" },
  { givenNameAr: "هدى", givenNameEn: "Huda", surnameAr: "عثمان", surnameEn: "Osman", gender: "F", departmentEn: "Languages", specialtyAr: "إنجليزي ابتدائي", specialtyEn: "Primary English", levels: ["Grade 1", "Grade 2", "Grade 3"], email: "huda.osman@demo.databayt.org" },
  { givenNameAr: "أحمد", givenNameEn: "Ahmed", surnameAr: "خالد", surnameEn: "Khalid", gender: "M", departmentEn: "Sciences", specialtyAr: "رياضيات ابتدائي", specialtyEn: "Primary Math", levels: ["Grade 4", "Grade 5", "Grade 6"], email: "ahmed.khalid@demo.databayt.org" },
  { givenNameAr: "محمد", givenNameEn: "Mohamed", surnameAr: "حسن", surnameEn: "Hassan", gender: "M", departmentEn: "Sciences", specialtyAr: "علوم ابتدائي", specialtyEn: "Primary Science", levels: ["Grade 4", "Grade 5", "Grade 6"], email: "mohamed.hassan@demo.databayt.org" },
  { givenNameAr: "أمينة", givenNameEn: "Amina", surnameAr: "يوسف", surnameEn: "Yousif", gender: "F", departmentEn: "Religion", specialtyAr: "إسلامية ابتدائي", specialtyEn: "Primary Islamic", levels: ["Grade 1", "Grade 2", "Grade 3"], email: "amina.yousif@demo.databayt.org" },
  { givenNameAr: "خديجة", givenNameEn: "Khadija", surnameAr: "صالح", surnameEn: "Salih", gender: "F", departmentEn: "Humanities", specialtyAr: "اجتماعيات ابتدائي", specialtyEn: "Primary Social", levels: ["Grade 4", "Grade 5", "Grade 6"], email: "khadija.salih@demo.databayt.org" },
  { givenNameAr: "ليلى", givenNameEn: "Layla", surnameAr: "أحمد", surnameEn: "Ahmed", gender: "F", departmentEn: "Languages", specialtyAr: "عربي ابتدائي", specialtyEn: "Primary Arabic", levels: ["Grade 4", "Grade 5", "Grade 6"], email: "layla.ahmed@demo.databayt.org" },
  { givenNameAr: "نورة", givenNameEn: "Noura", surnameAr: "إبراهيم", surnameEn: "Ibrahim", gender: "F", departmentEn: "Languages", specialtyAr: "إنجليزي ابتدائي", specialtyEn: "Primary English", levels: ["Grade 1", "Grade 2", "Grade 3"], email: "noura.ibrahim@demo.databayt.org" },

  // Intermediate & Secondary Teachers (14)
  { givenNameAr: "إبراهيم", givenNameEn: "Ibrahim", surnameAr: "مالك", surnameEn: "Malik", gender: "M", departmentEn: "Sciences", specialtyAr: "رياضيات متوسط", specialtyEn: "Mathematics", levels: ["Grade 7", "Grade 8", "Grade 9"], email: "ibrahim.malik@demo.databayt.org" },
  { givenNameAr: "عثمان", givenNameEn: "Osman", surnameAr: "علي", surnameEn: "Ali", gender: "M", departmentEn: "Sciences", specialtyAr: "رياضيات ثانوي", specialtyEn: "Mathematics", levels: ["Grade 10", "Grade 11", "Grade 12"], email: "osman.ali@demo.databayt.org" },
  { givenNameAr: "مصطفى", givenNameEn: "Mustafa", surnameAr: "حسن", surnameEn: "Hassan", gender: "M", departmentEn: "Sciences", specialtyAr: "فيزياء", specialtyEn: "Physics", levels: ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"], email: "mustafa.hassan@demo.databayt.org" },
  { givenNameAr: "حسن", givenNameEn: "Hassan", surnameAr: "عمر", surnameEn: "Omar", gender: "M", departmentEn: "Sciences", specialtyAr: "كيمياء", specialtyEn: "Chemistry", levels: ["Grade 9", "Grade 10", "Grade 11", "Grade 12"], email: "hassan.omar@demo.databayt.org" },
  { givenNameAr: "خالد", givenNameEn: "Khalid", surnameAr: "إبراهيم", surnameEn: "Ibrahim", gender: "M", departmentEn: "Sciences", specialtyAr: "أحياء", specialtyEn: "Biology", levels: ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"], email: "khalid.ibrahim@demo.databayt.org" },
  { givenNameAr: "عمر", givenNameEn: "Omar", surnameAr: "صالح", surnameEn: "Salih", gender: "M", departmentEn: "Languages", specialtyAr: "عربي", specialtyEn: "Arabic", levels: ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"], email: "omar.salih@demo.databayt.org" },
  { givenNameAr: "طارق", givenNameEn: "Tariq", surnameAr: "أحمد", surnameEn: "Ahmed", gender: "M", departmentEn: "Languages", specialtyAr: "إنجليزي", specialtyEn: "English", levels: ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"], email: "tariq.ahmed@demo.databayt.org" },
  { givenNameAr: "سعيد", givenNameEn: "Saeed", surnameAr: "يوسف", surnameEn: "Yousif", gender: "M", departmentEn: "Humanities", specialtyAr: "جغرافيا", specialtyEn: "Geography", levels: ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"], email: "saeed.yousif@demo.databayt.org" },
  { givenNameAr: "وليد", givenNameEn: "Waleed", surnameAr: "محمد", surnameEn: "Mohamed", gender: "M", departmentEn: "Humanities", specialtyAr: "تاريخ", specialtyEn: "History", levels: ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"], email: "waleed.mohamed@demo.databayt.org" },
  { givenNameAr: "جمال", givenNameEn: "Jamal", surnameAr: "عثمان", surnameEn: "Osman", gender: "M", departmentEn: "Religion", specialtyAr: "تربية إسلامية", specialtyEn: "Islamic Studies", levels: ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"], email: "jamal.osman@demo.databayt.org" },
  { givenNameAr: "عماد", givenNameEn: "Imad", surnameAr: "خالد", surnameEn: "Khalid", gender: "M", departmentEn: "ICT", specialtyAr: "حاسوب", specialtyEn: "Computer Science", levels: ["Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"], email: "imad.khalid@demo.databayt.org" },
  { givenNameAr: "منير", givenNameEn: "Munir", surnameAr: "حسن", surnameEn: "Hassan", gender: "M", departmentEn: "Arts & PE", specialtyAr: "تربية بدنية", specialtyEn: "Physical Education", levels: ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"], email: "munir.hassan@demo.databayt.org" },
  { givenNameAr: "بسمة", givenNameEn: "Basma", surnameAr: "علي", surnameEn: "Ali", gender: "F", departmentEn: "Arts & PE", specialtyAr: "تربية فنية", specialtyEn: "Art", levels: ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9"], email: "basma.ali@demo.databayt.org" },
  { givenNameAr: "داليا", givenNameEn: "Dalia", surnameAr: "محمد", surnameEn: "Mohamed", gender: "F", departmentEn: "Languages", specialtyAr: "فرنسي", specialtyEn: "French", levels: ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"], email: "dalia.mohamed@demo.databayt.org" },
];

// ============================================================================
// TEACHER SCALING CONFIG (Generate additional teachers to reach 100)
// ============================================================================

export const TARGET_TEACHER_COUNT = 100;

/**
 * Teacher specialties with bilingual names for generation
 */
export const TEACHER_SPECIALTIES = [
  { departmentEn: "Languages", specialtyAr: "عربي", specialtyEn: "Arabic", levels: ["all"] },
  { departmentEn: "Languages", specialtyAr: "إنجليزي", specialtyEn: "English", levels: ["all"] },
  { departmentEn: "Languages", specialtyAr: "فرنسي", specialtyEn: "French", levels: ["intermediate-secondary"] },
  { departmentEn: "Sciences", specialtyAr: "رياضيات", specialtyEn: "Mathematics", levels: ["all"] },
  { departmentEn: "Sciences", specialtyAr: "فيزياء", specialtyEn: "Physics", levels: ["intermediate-secondary"] },
  { departmentEn: "Sciences", specialtyAr: "كيمياء", specialtyEn: "Chemistry", levels: ["intermediate-secondary"] },
  { departmentEn: "Sciences", specialtyAr: "أحياء", specialtyEn: "Biology", levels: ["intermediate-secondary"] },
  { departmentEn: "Sciences", specialtyAr: "علوم", specialtyEn: "Science", levels: ["kg-primary"] },
  { departmentEn: "Humanities", specialtyAr: "تاريخ", specialtyEn: "History", levels: ["intermediate-secondary"] },
  { departmentEn: "Humanities", specialtyAr: "جغرافيا", specialtyEn: "Geography", levels: ["intermediate-secondary"] },
  { departmentEn: "Humanities", specialtyAr: "دراسات اجتماعية", specialtyEn: "Social Studies", levels: ["primary"] },
  { departmentEn: "Religion", specialtyAr: "تربية إسلامية", specialtyEn: "Islamic Studies", levels: ["all"] },
  { departmentEn: "Religion", specialtyAr: "قرآن", specialtyEn: "Quran", levels: ["all"] },
  { departmentEn: "ICT", specialtyAr: "حاسوب", specialtyEn: "Computer Science", levels: ["primary-secondary"] },
  { departmentEn: "Arts & PE", specialtyAr: "تربية بدنية", specialtyEn: "Physical Education", levels: ["all"] },
  { departmentEn: "Arts & PE", specialtyAr: "تربية فنية", specialtyEn: "Art", levels: ["all"] },
  { departmentEn: "Arts & PE", specialtyAr: "موسيقى", specialtyEn: "Music", levels: ["kg-primary"] },
];

/**
 * Generate additional teachers dynamically
 * Supplements the hand-crafted TEACHER_DATA to reach TARGET_TEACHER_COUNT
 */
export function generateAdditionalTeachers(startIndex: number = 25): TeacherData[] {
  const additionalTeachers: TeacherData[] = [];
  const totalToGenerate = TARGET_TEACHER_COUNT - TEACHER_DATA.length;

  for (let i = 0; i < totalToGenerate; i++) {
    const index = startIndex + i;
    const gender = i % 3 === 0 ? "F" : "M"; // 1/3 female, 2/3 male
    const names = gender === "M" ? MALE_NAMES : FEMALE_NAMES;

    const givenIndex = index % names.givenAr.length;
    const surnameIndex = Math.floor(index / names.givenAr.length) % SURNAMES.ar.length;
    const specialty = TEACHER_SPECIALTIES[i % TEACHER_SPECIALTIES.length];

    // Map levels string to actual grade names
    const levelMapping: Record<string, string[]> = {
      "all": ["KG 1", "KG 2", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"],
      "kg": ["KG 1", "KG 2"],
      "kg-primary": ["KG 1", "KG 2", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"],
      "primary": ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"],
      "primary-secondary": ["Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"],
      "intermediate-secondary": ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"],
    };

    // Assign a subset of levels (not all) for diversity
    const allLevels = levelMapping[specialty.levels[0]] || levelMapping["all"];
    const levelStart = i % Math.max(1, allLevels.length - 3);
    const levelCount = 3 + (i % 4); // 3-6 levels per teacher
    const assignedLevels = allLevels.slice(levelStart, Math.min(levelStart + levelCount, allLevels.length));

    additionalTeachers.push({
      givenNameAr: names.givenAr[givenIndex],
      givenNameEn: names.givenEn[givenIndex],
      surnameAr: SURNAMES.ar[surnameIndex],
      surnameEn: SURNAMES.en[surnameIndex],
      gender: gender as "M" | "F",
      departmentEn: specialty.departmentEn,
      specialtyAr: specialty.specialtyAr,
      specialtyEn: specialty.specialtyEn,
      levels: assignedLevels.length > 0 ? assignedLevels : allLevels.slice(0, 3),
      email: `generated${index}@demo.databayt.org`, // Will be replaced with personal email in people.ts
    });
  }

  return additionalTeachers;
}

/**
 * Get all teachers (hand-crafted + generated) for seeding
 * Returns 100 teachers total
 */
export function getAllTeachers(): TeacherData[] {
  return [...TEACHER_DATA, ...generateAdditionalTeachers()];
}

// ============================================================================
// SUDANESE NAMES (For generating students and guardians)
// ============================================================================

export const MALE_NAMES = {
  givenAr: ["أحمد", "محمد", "عثمان", "إبراهيم", "خالد", "حسن", "علي", "عمر", "عبدالله", "مصطفى", "كمال", "طارق", "يوسف", "صالح", "مالك", "بشير", "حمزة", "إدريس", "جمال", "نبيل", "راشد", "سعيد", "وليد", "زين", "أمين", "فاروق", "جلال", "هشام", "عماد", "جعفر", "لطفي", "منير", "آدم", "بابكر", "ضفالله", "الأمين", "فاضل", "جلال", "هاشم", "إسماعيل"],
  givenEn: ["Ahmed", "Mohamed", "Osman", "Ibrahim", "Khalid", "Hassan", "Ali", "Omar", "Abdalla", "Mustafa", "Kamal", "Tariq", "Yousif", "Salih", "Malik", "Bashir", "Hamza", "Idris", "Jamal", "Nabil", "Rashid", "Saeed", "Waleed", "Zain", "Amin", "Farouk", "Galal", "Hisham", "Imad", "Jaafar", "Lutfi", "Munir", "Adam", "Babiker", "Dafalla", "Elamin", "Fadel", "Galal", "Hashim", "Ismail"],
};

export const FEMALE_NAMES = {
  givenAr: ["فاطمة", "عائشة", "مريم", "أمينة", "خديجة", "هدى", "سارة", "ليلى", "سمية", "رانيا", "نورة", "زهرة", "سميرة", "هناء", "دلال", "نوال", "منى", "رحاب", "صفاء", "تهاني", "وداد", "ياسمين", "زينب", "أمل", "بسمة", "داليا", "إيمان", "فادية", "غادة", "هبة", "إيناس", "جمانة", "كوثر", "لبنى", "منال", "نهلة", "علا", "رشا", "سوسن", "تغريد"],
  givenEn: ["Fatima", "Aisha", "Mariam", "Amina", "Khadija", "Huda", "Sara", "Layla", "Sumaya", "Rania", "Noura", "Zahra", "Samira", "Hana", "Dalal", "Nawal", "Mona", "Rehab", "Safaa", "Tahani", "Widad", "Yasmin", "Zainab", "Amal", "Basma", "Dalia", "Eman", "Fadia", "Ghada", "Hiba", "Inas", "Jumana", "Kawther", "Lubna", "Manal", "Nahla", "Ola", "Rasha", "Sawsan", "Taghreed"],
};

export const SURNAMES = {
  ar: ["حسن", "علي", "أحمد", "محمد", "إبراهيم", "عثمان", "يوسف", "صالح", "عبدالله", "مصطفى", "خالد", "عمر", "عبدالرحمن", "كمال", "مالك", "بشير", "حمزة", "إدريس", "جمال", "نبيل", "عباس", "بدوي", "السيد", "فضل", "جابر", "حبيب", "إسماعيل", "جعفر", "كرم", "لطيف", "مهدي", "نصر", "قاسم", "رزق", "سلام", "طه", "وهاب", "ياسين", "زهران"],
  en: ["Hassan", "Ali", "Ahmed", "Mohamed", "Ibrahim", "Osman", "Yousif", "Salih", "Abdalla", "Mustafa", "Khalid", "Omar", "Abdelrahman", "Kamal", "Malik", "Bashir", "Hamza", "Idris", "Jamal", "Nabil", "Abbas", "Badawi", "Elsayed", "Fadl", "Gaber", "Habib", "Ismail", "Jafar", "Karam", "Latif", "Mahdi", "Nasr", "Qasim", "Rizk", "Salam", "Taha", "Wahab", "Yassin", "Zahran"],
};

// ============================================================================
// CLASSROOMS (Bilingual)
// ============================================================================

export interface ClassroomData {
  nameAr: string;
  nameEn: string;
  typeAr: string;
  typeEn: string;
  capacity: number;
  floor: number;
}

export const CLASSROOMS: ClassroomData[] = [
  // KG Classrooms
  { nameAr: "غرفة الروضة ١", nameEn: "KG Room 1", typeAr: "فصل روضة", typeEn: "KG Classroom", capacity: 20, floor: 0 },
  { nameAr: "غرفة الروضة ٢", nameEn: "KG Room 2", typeAr: "فصل روضة", typeEn: "KG Classroom", capacity: 20, floor: 0 },

  // Primary Classrooms (Ground Floor)
  { nameAr: "الفصل ١٠١", nameEn: "Room 101", typeAr: "فصل دراسي", typeEn: "Standard Classroom", capacity: 25, floor: 1 },
  { nameAr: "الفصل ١٠٢", nameEn: "Room 102", typeAr: "فصل دراسي", typeEn: "Standard Classroom", capacity: 25, floor: 1 },
  { nameAr: "الفصل ١٠٣", nameEn: "Room 103", typeAr: "فصل دراسي", typeEn: "Standard Classroom", capacity: 25, floor: 1 },
  { nameAr: "الفصل ١٠٤", nameEn: "Room 104", typeAr: "فصل دراسي", typeEn: "Standard Classroom", capacity: 25, floor: 1 },
  { nameAr: "الفصل ١٠٥", nameEn: "Room 105", typeAr: "فصل دراسي", typeEn: "Standard Classroom", capacity: 25, floor: 1 },
  { nameAr: "الفصل ١٠٦", nameEn: "Room 106", typeAr: "فصل دراسي", typeEn: "Standard Classroom", capacity: 25, floor: 1 },

  // Intermediate & Secondary Classrooms (Second Floor)
  { nameAr: "الفصل ٢٠١", nameEn: "Room 201", typeAr: "فصل دراسي", typeEn: "Standard Classroom", capacity: 30, floor: 2 },
  { nameAr: "الفصل ٢٠٢", nameEn: "Room 202", typeAr: "فصل دراسي", typeEn: "Standard Classroom", capacity: 30, floor: 2 },
  { nameAr: "الفصل ٢٠٣", nameEn: "Room 203", typeAr: "فصل دراسي", typeEn: "Standard Classroom", capacity: 30, floor: 2 },
  { nameAr: "الفصل ٢٠٤", nameEn: "Room 204", typeAr: "فصل دراسي", typeEn: "Standard Classroom", capacity: 30, floor: 2 },

  // Specialized Rooms
  { nameAr: "معمل العلوم", nameEn: "Science Lab", typeAr: "معمل", typeEn: "Laboratory", capacity: 25, floor: 1 },
  { nameAr: "معمل الحاسوب", nameEn: "Computer Lab", typeAr: "معمل حاسوب", typeEn: "Computer Lab", capacity: 25, floor: 2 },
  { nameAr: "المكتبة", nameEn: "Library", typeAr: "مكتبة", typeEn: "Library", capacity: 40, floor: 0 },
  { nameAr: "غرفة الفنون", nameEn: "Art Room", typeAr: "غرفة فنون", typeEn: "Art Room", capacity: 20, floor: 1 },
  { nameAr: "الصالة الرياضية", nameEn: "Sports Hall", typeAr: "صالة رياضية", typeEn: "Sports Hall", capacity: 100, floor: 0 },
];

// ============================================================================
// PERIODS (Bilingual) - Sudanese School Day
// ============================================================================

export interface PeriodData {
  nameAr: string;
  nameEn: string;
  startHour: number;
  startMin: number;
  endHour: number;
  endMin: number;
  order: number;
  isBreak: boolean;
}

export const PERIODS: PeriodData[] = [
  { nameAr: "الحصة الأولى", nameEn: "Period 1", startHour: 7, startMin: 45, endHour: 8, endMin: 30, order: 1, isBreak: false },
  { nameAr: "الحصة الثانية", nameEn: "Period 2", startHour: 8, startMin: 35, endHour: 9, endMin: 20, order: 2, isBreak: false },
  { nameAr: "الاستراحة", nameEn: "Break", startHour: 9, startMin: 20, endHour: 9, endMin: 40, order: 3, isBreak: true },
  { nameAr: "الحصة الثالثة", nameEn: "Period 3", startHour: 9, startMin: 40, endHour: 10, endMin: 25, order: 4, isBreak: false },
  { nameAr: "الحصة الرابعة", nameEn: "Period 4", startHour: 10, startMin: 30, endHour: 11, endMin: 15, order: 5, isBreak: false },
  { nameAr: "الحصة الخامسة", nameEn: "Period 5", startHour: 11, startMin: 20, endHour: 12, endMin: 5, order: 6, isBreak: false },
  { nameAr: "الغداء", nameEn: "Lunch", startHour: 12, startMin: 5, endHour: 12, endMin: 45, order: 7, isBreak: true },
  { nameAr: "الحصة السادسة", nameEn: "Period 6", startHour: 12, startMin: 45, endHour: 13, endMin: 30, order: 8, isBreak: false },
  { nameAr: "الحصة السابعة", nameEn: "Period 7", startHour: 13, startMin: 35, endHour: 14, endMin: 20, order: 9, isBreak: false },
];

// Working days (Sun-Thu for Sudan)
export const WORKING_DAYS = [0, 1, 2, 3, 4]; // Sunday=0 to Thursday=4
export const WORKING_DAYS_AR = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس"];
export const WORKING_DAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];

// ============================================================================
// EMAIL DOMAINS (Personal emails - NOT numbered IDs)
// ============================================================================

export interface EmailDomainData {
  domain: string;
  weight: number; // Percentage (must sum to 100)
}

/**
 * Personal email domains for realistic data
 * - Use personal emails like osman@gmail.com, fatima.hassan@hotmail.com
 * - NOT numbered IDs like student001@school.sd
 */
export const EMAIL_DOMAINS: EmailDomainData[] = [
  { domain: "gmail.com", weight: 40 },
  { domain: "hotmail.com", weight: 25 },
  { domain: "outlook.com", weight: 15 },
  { domain: "yahoo.com", weight: 15 },
  { domain: "sudanet.sd", weight: 5 },
];

/**
 * Get a random email domain based on weighted distribution
 */
export function getRandomEmailDomain(index: number): string {
  const cumulativeWeights: number[] = [];
  let sum = 0;
  for (const d of EMAIL_DOMAINS) {
    sum += d.weight;
    cumulativeWeights.push(sum);
  }

  // Use index as seed for deterministic but varied distribution
  const roll = (index * 17 + 13) % 100;

  for (let i = 0; i < cumulativeWeights.length; i++) {
    if (roll < cumulativeWeights[i]) {
      return EMAIL_DOMAINS[i].domain;
    }
  }
  return EMAIL_DOMAINS[0].domain;
}

/**
 * Generate a personal email address (NOT numbered)
 * Format: firstnamelastname@domain.com
 */
export function generatePersonalEmail(
  givenName: string,
  surname: string,
  index: number
): string {
  const domain = getRandomEmailDomain(index);
  const firstName = givenName.toLowerCase().replace(/\s+/g, "");
  const lastName = surname.toLowerCase().replace(/\s+/g, "");

  return `${firstName}${lastName}@${domain}`;
}

// ============================================================================
// KHARTOUM NEIGHBORHOODS (For addresses)
// ============================================================================

export const KHARTOUM_NEIGHBORHOODS = {
  ar: ["الرياض", "المنشية", "الصحافة", "الطائف", "جبرة", "الأمارات", "الخرطوم ٢", "المعمورة", "الديوم الشرقية", "بري", "الشعبية", "كافوري", "الكلاكلة", "أركويت", "الصافية", "القوز", "الجريف", "سوبا", "الفردوس", "المنصورة"],
  en: ["Riyadh", "Manshia", "Sahafa", "Taif", "Jabra", "Amarat", "Khartoum 2", "Maamura", "Deim Shargi", "Burri", "Shaabiya", "Kafouri", "Kalakla", "Arkawit", "Safiya", "Goz", "Jarif", "Soba", "Firdaus", "Mansura"],
};

// ============================================================================
// GUARDIAN TYPES (Bilingual)
// ============================================================================

export const GUARDIAN_TYPES = {
  ar: ["أب", "أم", "ولي أمر"],
  en: ["Father", "Mother", "Guardian"],
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get random name with bilingual support
 * Returns both AR/EN versions plus backwards-compatible givenName/surname
 */
export function getRandomName(gender: "M" | "F", index: number = 0): {
  givenNameAr: string;
  givenNameEn: string;
  surnameAr: string;
  surnameEn: string;
  // Backwards compatible aliases
  givenName: string;
  surname: string;
} {
  const names = gender === "M" ? MALE_NAMES : FEMALE_NAMES;
  const givenIndex = index % names.givenAr.length;
  const surnameIndex = Math.floor(index / names.givenAr.length) % SURNAMES.ar.length;

  return {
    givenNameAr: names.givenAr[givenIndex],
    givenNameEn: names.givenEn[givenIndex],
    surnameAr: SURNAMES.ar[surnameIndex],
    surnameEn: SURNAMES.en[surnameIndex],
    // Backwards compatible - use English as default
    givenName: names.givenEn[givenIndex],
    surname: SURNAMES.en[surnameIndex],
  };
}

export function timeAt(hour: number, minute = 0): Date {
  return new Date(Date.UTC(1970, 0, 1, hour, minute, 0, 0));
}

export function getAgeForGrade(levelEn: string, currentYear: number): number {
  const level = YEAR_LEVELS.find(l => l.en === levelEn);
  if (!level) return 10;
  const [minAge, maxAge] = level.ageRange;
  return minAge + Math.floor(Math.random() * (maxAge - minAge + 1));
}

export function getBirthYearForGrade(levelEn: string, currentYear: number = 2025): number {
  const age = getAgeForGrade(levelEn, currentYear);
  return currentYear - age;
}

export function getRandomNeighborhood(index: number): { ar: string; en: string } {
  const idx = index % KHARTOUM_NEIGHBORHOODS.ar.length;
  return {
    ar: KHARTOUM_NEIGHBORHOODS.ar[idx],
    en: KHARTOUM_NEIGHBORHOODS.en[idx],
  };
}

// Get Arabic name for subject
export function findSubjectAr(subjectNameEn: string): string {
  const subject = SUBJECTS.find(s => s.en === subjectNameEn);
  return subject?.ar || subjectNameEn;
}

// Get Arabic name for year level
export function findYearLevelAr(levelEn: string): string {
  const level = YEAR_LEVELS.find(l => l.en === levelEn);
  return level?.ar || levelEn;
}

// Get class name in both languages
export function getClassName(subjectEn: string, levelEn: string, section: string): { ar: string; en: string } {
  const subjectAr = findSubjectAr(subjectEn);
  const levelAr = findYearLevelAr(levelEn);
  const sectionAr = { A: "أ", B: "ب", C: "ج", D: "د" }[section] || section;

  return {
    ar: `${subjectAr} - ${levelAr} (${sectionAr})`,
    en: `${subjectEn} - ${levelEn} (${section})`,
  };
}

// ============================================================================
// ADMIN USERS (Bilingual)
// ============================================================================

export interface AdminUserData {
  email: string;
  usernameAr: string;
  usernameEn: string;
  role: "DEVELOPER" | "ADMIN" | "ACCOUNTANT" | "STAFF";
  descriptionAr: string;
  descriptionEn: string;
}

export const ADMIN_USERS: AdminUserData[] = [
  {
    email: "dev@databayt.org",
    usernameAr: "مطور النظام",
    usernameEn: "System Developer",
    role: "DEVELOPER",
    descriptionAr: "مطور المنصة - صلاحيات كاملة",
    descriptionEn: "Platform Developer - Full Access",
  },
  {
    email: "admin@databayt.org",
    usernameAr: "مدير المدرسة",
    usernameEn: "School Admin",
    role: "ADMIN",
    descriptionAr: "مدير المدرسة - صلاحيات إدارية",
    descriptionEn: "School Administrator - Admin Access",
  },
  {
    email: "accountant@databayt.org",
    usernameAr: "محاسب المدرسة",
    usernameEn: "School Accountant",
    role: "ACCOUNTANT",
    descriptionAr: "محاسب المدرسة - صلاحيات مالية",
    descriptionEn: "School Accountant - Financial Access",
  },
  {
    email: "staff@databayt.org",
    usernameAr: "موظف المدرسة",
    usernameEn: "School Staff",
    role: "STAFF",
    descriptionAr: "موظف المدرسة - صلاحيات محدودة",
    descriptionEn: "School Staff - Limited Access",
  },
];

// ============================================================================
// BACKWARDS COMPATIBLE EXPORTS (for existing seed files)
// These will be deprecated once all seeds are updated to bilingual
// ============================================================================

/**
 * @deprecated Use TEACHER_DATA with givenNameEn/surnameEn instead
 * Provides backwards compatible teacher data with 'specialty' field
 */
export const TEACHER_DATA_LEGACY = TEACHER_DATA.map(t => ({
  ...t,
  givenName: t.givenNameEn,
  surname: t.surnameEn,
  specialty: t.specialtyEn,
}));

/**
 * @deprecated Use PERIODS with nameEn instead
 * Provides backwards compatible periods with 'name' field
 */
export const PERIODS_LEGACY = PERIODS.map(p => ({
  ...p,
  name: p.nameEn,
}));

/**
 * @deprecated Use DEPARTMENTS with en instead
 * Provides backwards compatible departments with 'name' and 'nameEn' fields
 */
export const DEPARTMENTS_LEGACY = DEPARTMENTS.map(d => ({
  ...d,
  name: d.ar,
  nameEn: d.en,
}));

/**
 * @deprecated Use CLASSROOMS with nameEn instead
 * Provides backwards compatible classrooms with 'name' field
 */
export const CLASSROOMS_LEGACY = CLASSROOMS.map(c => ({
  ...c,
  name: c.nameEn,
  type: c.typeEn,
}));

// Legacy MALE_NAMES array (for admission.ts)
export const MALE_NAMES_LEGACY = MALE_NAMES.givenEn;
export const FEMALE_NAMES_LEGACY = FEMALE_NAMES.givenEn;
export const SURNAMES_LEGACY = SURNAMES.en;

// ============================================================================
// GRADE SCALES (Bilingual) - Sudanese/Arabic Education System
// ============================================================================

export interface GradeScaleData {
  grade: string;
  ar: string;
  en: string;
  minPercentage: number;
  maxPercentage: number;
  gpa: number;
  descriptionAr: string;
  descriptionEn: string;
}

/**
 * Sudanese/Arabic Education System Grade Scale
 * Bilingual grade labels with Arabic and English equivalents
 */
export const GRADE_SCALE: GradeScaleData[] = [
  { grade: "A+", ar: "ممتاز مرتفع", en: "Excellent High", minPercentage: 95, maxPercentage: 100, gpa: 4.0, descriptionAr: "أداء استثنائي", descriptionEn: "Exceptional performance" },
  { grade: "A", ar: "ممتاز", en: "Excellent", minPercentage: 90, maxPercentage: 94, gpa: 4.0, descriptionAr: "أداء متميز", descriptionEn: "Outstanding performance" },
  { grade: "A-", ar: "ممتاز منخفض", en: "Excellent Low", minPercentage: 85, maxPercentage: 89, gpa: 3.7, descriptionAr: "أداء ممتاز", descriptionEn: "Excellent performance" },
  { grade: "B+", ar: "جيد جداً مرتفع", en: "Very Good High", minPercentage: 80, maxPercentage: 84, gpa: 3.3, descriptionAr: "أداء جيد جداً", descriptionEn: "Very good performance" },
  { grade: "B", ar: "جيد جداً", en: "Very Good", minPercentage: 75, maxPercentage: 79, gpa: 3.0, descriptionAr: "أداء جيد جداً", descriptionEn: "Very good performance" },
  { grade: "B-", ar: "جيد جداً منخفض", en: "Very Good Low", minPercentage: 70, maxPercentage: 74, gpa: 2.7, descriptionAr: "أداء جيد", descriptionEn: "Good performance" },
  { grade: "C+", ar: "جيد مرتفع", en: "Good High", minPercentage: 65, maxPercentage: 69, gpa: 2.3, descriptionAr: "أداء جيد", descriptionEn: "Good performance" },
  { grade: "C", ar: "جيد", en: "Good", minPercentage: 60, maxPercentage: 64, gpa: 2.0, descriptionAr: "أداء مقبول", descriptionEn: "Acceptable performance" },
  { grade: "C-", ar: "جيد منخفض", en: "Good Low", minPercentage: 55, maxPercentage: 59, gpa: 1.7, descriptionAr: "أداء أقل من الجيد", descriptionEn: "Below good performance" },
  { grade: "D+", ar: "مقبول مرتفع", en: "Pass High", minPercentage: 50, maxPercentage: 54, gpa: 1.3, descriptionAr: "أداء مقبول", descriptionEn: "Passing performance" },
  { grade: "D", ar: "مقبول", en: "Pass", minPercentage: 45, maxPercentage: 49, gpa: 1.0, descriptionAr: "أداء ضعيف ولكن ناجح", descriptionEn: "Weak but passing performance" },
  { grade: "F", ar: "راسب", en: "Fail", minPercentage: 0, maxPercentage: 44, gpa: 0.0, descriptionAr: "لم يحقق الحد الأدنى", descriptionEn: "Did not meet minimum requirements" },
];

/**
 * Get bilingual grade info from percentage
 */
export function getGradeInfo(percentage: number): GradeScaleData | undefined {
  return GRADE_SCALE.find(g => percentage >= g.minPercentage && percentage <= g.maxPercentage);
}

/**
 * Get grade letter from percentage
 */
export function calculateGrade(percentage: number): string {
  const info = getGradeInfo(percentage);
  return info?.grade || "F";
}

/**
 * Get bilingual grade label
 */
export function getGradeLabel(percentage: number, locale: "ar" | "en"): string {
  const info = getGradeInfo(percentage);
  return locale === "ar" ? (info?.ar || "راسب") : (info?.en || "Fail");
}

// ============================================================================
// REPORT CARD CONSTANTS (Bilingual)
// ============================================================================

export interface ReportTermData {
  termNumber: number;
  ar: string;
  en: string;
  months: string[];
}

export const REPORT_TERMS: ReportTermData[] = [
  { termNumber: 1, ar: "الفصل الدراسي الأول", en: "First Semester", months: ["Sep", "Oct", "Nov", "Dec"] },
  { termNumber: 2, ar: "الفصل الدراسي الثاني", en: "Second Semester", months: ["Jan", "Feb", "Mar", "Apr", "May"] },
];

export const REPORT_CATEGORIES = {
  academic: { ar: "الأداء الأكاديمي", en: "Academic Performance" },
  behavior: { ar: "السلوك والانضباط", en: "Behavior & Discipline" },
  attendance: { ar: "الحضور والمواظبة", en: "Attendance" },
  extracurricular: { ar: "الأنشطة اللاصفية", en: "Extracurricular Activities" },
  skills: { ar: "المهارات الشخصية", en: "Personal Skills" },
};

export const BEHAVIOR_RATINGS = [
  { value: 5, ar: "ممتاز", en: "Excellent" },
  { value: 4, ar: "جيد جداً", en: "Very Good" },
  { value: 3, ar: "جيد", en: "Good" },
  { value: 2, ar: "مقبول", en: "Satisfactory" },
  { value: 1, ar: "يحتاج تحسين", en: "Needs Improvement" },
];
