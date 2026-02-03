/**
 * Seed Constants
 * All static data for seeding the Demo School
 *
 * i18n Strategy:
 * - Static data: Both Arabic (AR) and English (EN) stored
 * - Personal names: Arabic script (authentic Sudanese)
 * - Locale: ar (default for Sudan)
 */

import type {
  AnnouncementData,
  ClassroomData,
  DepartmentData,
  EventData,
  SubjectData,
  TeacherData,
  YearLevelData,
} from "./types"

// ============================================================================
// DEMO SCHOOL CONFIGURATION
// ============================================================================

export const DEMO_SCHOOL = {
  // Identity
  domain: "demo",
  nameEn: "Demo School",
  nameAr: "المدرسة التجريبية",
  mottoEn: "Excellence in Education",
  mottoAr: "التميز في التعليم",

  // Contact
  email: "admin@demo.databayt.org",
  phoneEn: "+249-123-456-789",
  phoneAr: "٢٤٩-١٢٣-٤٥٦-٧٨٩",
  website: "https://demo.databayt.org",

  // Address (Khartoum, Sudan)
  addressEn: "123 Education Street, Khartoum, Sudan",
  addressAr: "١٢٣ شارع التعليم، الخرطوم، السودان",

  // Settings
  timezone: "Africa/Khartoum",
  planType: "premium",
  maxStudents: 2000,
  maxTeachers: 200,

  // Branding
  primaryColor: "#1e40af",
  secondaryColor: "#3b82f6",
  accentColor: "#f59e0b",
}

// Common password for all seed accounts
export const DEMO_PASSWORD = "1234"

// ============================================================================
// USER ACCOUNTS
// ============================================================================

export const ADMIN_USERS = [
  {
    email: "dev@databayt.org",
    role: "DEVELOPER",
    usernameEn: "Developer",
    usernameAr: "المطور",
  },
  {
    email: "admin@databayt.org",
    role: "ADMIN",
    usernameEn: "Admin",
    usernameAr: "المدير",
  },
  {
    email: "accountant@databayt.org",
    role: "ACCOUNTANT",
    usernameEn: "Accountant",
    usernameAr: "المحاسب",
  },
  {
    email: "staff@databayt.org",
    role: "STAFF",
    usernameEn: "Staff",
    usernameAr: "الموظف",
  },
  {
    email: "user@databayt.org",
    role: "USER",
    usernameEn: "New User",
    usernameAr: "مستخدم جديد",
  },
]

// ============================================================================
// YEAR LEVELS (K-12 Sudanese System)
// ============================================================================

export const YEAR_LEVELS: YearLevelData[] = [
  // Kindergarten (الروضة)
  {
    nameEn: "KG1",
    nameAr: "الروضة الأولى",
    order: 1,
    section: "KG",
    ageRange: [4, 5],
    studentsPerLevel: 50,
  },
  {
    nameEn: "KG2",
    nameAr: "الروضة الثانية",
    order: 2,
    section: "KG",
    ageRange: [5, 6],
    studentsPerLevel: 50,
  },

  // Primary (الابتدائي)
  {
    nameEn: "Grade 1",
    nameAr: "الصف الأول",
    order: 3,
    section: "Primary",
    ageRange: [6, 7],
    studentsPerLevel: 80,
  },
  {
    nameEn: "Grade 2",
    nameAr: "الصف الثاني",
    order: 4,
    section: "Primary",
    ageRange: [7, 8],
    studentsPerLevel: 80,
  },
  {
    nameEn: "Grade 3",
    nameAr: "الصف الثالث",
    order: 5,
    section: "Primary",
    ageRange: [8, 9],
    studentsPerLevel: 80,
  },
  {
    nameEn: "Grade 4",
    nameAr: "الصف الرابع",
    order: 6,
    section: "Primary",
    ageRange: [9, 10],
    studentsPerLevel: 80,
  },
  {
    nameEn: "Grade 5",
    nameAr: "الصف الخامس",
    order: 7,
    section: "Primary",
    ageRange: [10, 11],
    studentsPerLevel: 80,
  },
  {
    nameEn: "Grade 6",
    nameAr: "الصف السادس",
    order: 8,
    section: "Primary",
    ageRange: [11, 12],
    studentsPerLevel: 80,
  },

  // Intermediate (المتوسط)
  {
    nameEn: "Grade 7",
    nameAr: "الصف السابع",
    order: 9,
    section: "Intermediate",
    ageRange: [12, 13],
    studentsPerLevel: 70,
  },
  {
    nameEn: "Grade 8",
    nameAr: "الصف الثامن",
    order: 10,
    section: "Intermediate",
    ageRange: [13, 14],
    studentsPerLevel: 70,
  },
  {
    nameEn: "Grade 9",
    nameAr: "الصف التاسع",
    order: 11,
    section: "Intermediate",
    ageRange: [14, 15],
    studentsPerLevel: 70,
  },

  // Secondary (الثانوي)
  {
    nameEn: "Grade 10",
    nameAr: "الصف العاشر",
    order: 12,
    section: "Secondary",
    ageRange: [15, 16],
    studentsPerLevel: 60,
  },
  {
    nameEn: "Grade 11",
    nameAr: "الصف الحادي عشر",
    order: 13,
    section: "Secondary",
    ageRange: [16, 17],
    studentsPerLevel: 60,
  },
  {
    nameEn: "Grade 12",
    nameAr: "الصف الثاني عشر",
    order: 14,
    section: "Secondary",
    ageRange: [17, 18],
    studentsPerLevel: 60,
  },
]

// ============================================================================
// DEPARTMENTS
// ============================================================================

export const DEPARTMENTS: DepartmentData[] = [
  {
    nameEn: "Languages",
    nameAr: "اللغات",
    descriptionEn: "Arabic, English, and French language instruction",
    descriptionAr: "تدريس اللغة العربية والإنجليزية والفرنسية",
  },
  {
    nameEn: "Sciences",
    nameAr: "العلوم",
    descriptionEn:
      "Mathematics, Physics, Chemistry, Biology, and Computer Science",
    descriptionAr: "الرياضيات والفيزياء والكيمياء والأحياء وعلوم الحاسوب",
  },
  {
    nameEn: "Humanities",
    nameAr: "العلوم الإنسانية",
    descriptionEn: "History, Geography, Social Studies, and Civics",
    descriptionAr: "التاريخ والجغرافيا والدراسات الاجتماعية والتربية الوطنية",
  },
  {
    nameEn: "Religion",
    nameAr: "الدين",
    descriptionEn: "Islamic Studies and Quran",
    descriptionAr: "التربية الإسلامية والقرآن الكريم",
  },
  {
    nameEn: "ICT",
    nameAr: "تقنية المعلومات",
    descriptionEn: "Information and Communication Technology",
    descriptionAr: "تقنية المعلومات والاتصالات",
  },
  {
    nameEn: "Arts & PE",
    nameAr: "الفنون والرياضة",
    descriptionEn: "Art, Music, and Physical Education",
    descriptionAr: "الفنون والموسيقى والتربية البدنية",
  },
]

// ============================================================================
// SUBJECTS (Bilingual)
// ============================================================================

export const SUBJECTS: SubjectData[] = [
  // Languages Department
  {
    nameEn: "Arabic",
    nameAr: "اللغة العربية",
    departmentEn: "Languages",
    levels: ["all"],
    descriptionEn: "Arabic Language - Reading, Writing, Grammar, Literature",
    descriptionAr: "القراءة والكتابة والنحو والأدب",
  },
  {
    nameEn: "English",
    nameAr: "اللغة الإنجليزية",
    departmentEn: "Languages",
    levels: ["all"],
    descriptionEn: "English Language",
    descriptionAr: "اللغة الإنجليزية",
  },
  {
    nameEn: "French",
    nameAr: "اللغة الفرنسية",
    departmentEn: "Languages",
    levels: ["7-12"],
    descriptionEn: "French Language",
    descriptionAr: "اللغة الفرنسية",
  },

  // Sciences Department
  {
    nameEn: "Mathematics",
    nameAr: "الرياضيات",
    departmentEn: "Sciences",
    levels: ["all"],
    descriptionEn: "Mathematics - Arithmetic, Algebra, Geometry",
    descriptionAr: "الحساب والجبر والهندسة",
  },
  {
    nameEn: "Science",
    nameAr: "العلوم",
    departmentEn: "Sciences",
    levels: ["KG-6"],
    descriptionEn: "General Science",
    descriptionAr: "العلوم العامة",
  },
  {
    nameEn: "Physics",
    nameAr: "الفيزياء",
    departmentEn: "Sciences",
    levels: ["7-12"],
    descriptionEn: "Physics",
    descriptionAr: "الفيزياء",
  },
  {
    nameEn: "Chemistry",
    nameAr: "الكيمياء",
    departmentEn: "Sciences",
    levels: ["7-12"],
    descriptionEn: "Chemistry",
    descriptionAr: "الكيمياء",
  },
  {
    nameEn: "Biology",
    nameAr: "الأحياء",
    departmentEn: "Sciences",
    levels: ["7-12"],
    descriptionEn: "Biology",
    descriptionAr: "الأحياء",
  },
  {
    nameEn: "Computer Science",
    nameAr: "علوم الحاسوب",
    departmentEn: "Sciences",
    levels: ["7-12"],
    descriptionEn: "Computer Science",
    descriptionAr: "علوم الحاسوب",
  },

  // Humanities Department
  {
    nameEn: "History",
    nameAr: "التاريخ",
    departmentEn: "Humanities",
    levels: ["4-12"],
    descriptionEn: "History",
    descriptionAr: "التاريخ",
  },
  {
    nameEn: "Geography",
    nameAr: "الجغرافيا",
    departmentEn: "Humanities",
    levels: ["4-12"],
    descriptionEn: "Geography",
    descriptionAr: "الجغرافيا",
  },
  {
    nameEn: "Social Studies",
    nameAr: "الدراسات الاجتماعية",
    departmentEn: "Humanities",
    levels: ["1-6"],
    descriptionEn: "Social Studies",
    descriptionAr: "الدراسات الاجتماعية",
  },
  {
    nameEn: "Civics",
    nameAr: "التربية الوطنية",
    departmentEn: "Humanities",
    levels: ["7-12"],
    descriptionEn: "Civics",
    descriptionAr: "التربية الوطنية",
  },

  // Religion Department
  {
    nameEn: "Islamic Studies",
    nameAr: "التربية الإسلامية",
    departmentEn: "Religion",
    levels: ["all"],
    descriptionEn: "Islamic Studies - Faith, Jurisprudence, Ethics",
    descriptionAr: "العقيدة والفقه والأخلاق",
  },
  {
    nameEn: "Quran",
    nameAr: "القرآن الكريم",
    departmentEn: "Religion",
    levels: ["all"],
    descriptionEn: "Quran Memorization and Recitation",
    descriptionAr: "حفظ وتلاوة القرآن الكريم",
  },

  // ICT Department
  {
    nameEn: "ICT",
    nameAr: "الحاسوب",
    departmentEn: "ICT",
    levels: ["3-12"],
    descriptionEn: "Information and Communication Technology",
    descriptionAr: "تقنية المعلومات",
  },

  // Arts & PE Department
  {
    nameEn: "Art",
    nameAr: "التربية الفنية",
    departmentEn: "Arts & PE",
    levels: ["all"],
    descriptionEn: "Art and Drawing",
    descriptionAr: "الفنون والرسم",
  },
  {
    nameEn: "Music",
    nameAr: "الموسيقى",
    departmentEn: "Arts & PE",
    levels: ["KG-9"],
    descriptionEn: "Music",
    descriptionAr: "الموسيقى",
  },
  {
    nameEn: "Physical Education",
    nameAr: "التربية البدنية",
    departmentEn: "Arts & PE",
    levels: ["all"],
    descriptionEn: "Physical Education",
    descriptionAr: "التربية البدنية",
  },
]

// ============================================================================
// SUDANESE NAMES (Arabic Script)
// ============================================================================

export const MALE_NAMES_AR = [
  "محمد",
  "أحمد",
  "عثمان",
  "إبراهيم",
  "خالد",
  "عمر",
  "حسن",
  "يوسف",
  "علي",
  "عبدالله",
  "طارق",
  "مصطفى",
  "ياسر",
  "عبدالرحمن",
  "صلاح",
  "بكري",
  "الفاتح",
  "معاوية",
  "أنس",
  "زياد",
  "حمزة",
  "بلال",
  "سليمان",
  "موسى",
  "عبدالعزيز",
  "فيصل",
  "نادر",
  "سامر",
  "رامي",
  "هاني",
  "وليد",
  "ماهر",
  "عامر",
  "سيف",
  "هشام",
  "كريم",
  "منصور",
  "شريف",
  "أسامة",
  "جمال",
]

export const MALE_NAMES_EN = [
  "Mohammed",
  "Ahmed",
  "Othman",
  "Ibrahim",
  "Khalid",
  "Omar",
  "Hassan",
  "Youssef",
  "Ali",
  "Abdullah",
  "Tarek",
  "Mustafa",
  "Yasser",
  "Abdelrahman",
  "Salah",
  "Bakri",
  "Elfatih",
  "Muawiya",
  "Anas",
  "Ziad",
  "Hamza",
  "Bilal",
  "Suleiman",
  "Musa",
  "Abdelaziz",
  "Faisal",
  "Nader",
  "Samer",
  "Rami",
  "Hani",
  "Walid",
  "Maher",
  "Amer",
  "Saif",
  "Hisham",
  "Karim",
  "Mansour",
  "Sherif",
  "Osama",
  "Jamal",
]

export const FEMALE_NAMES_AR = [
  "فاطمة",
  "عائشة",
  "مريم",
  "أمينة",
  "خديجة",
  "زينب",
  "هدى",
  "سارة",
  "نور",
  "ليلى",
  "رقية",
  "حليمة",
  "سمية",
  "ريم",
  "دعاء",
  "إيمان",
  "أسماء",
  "هبة",
  "رنا",
  "منى",
  "سلمى",
  "ياسمين",
  "لمياء",
  "شيماء",
  "آية",
  "مروة",
  "نادية",
  "سهام",
  "وفاء",
  "صفاء",
  "رحاب",
  "إنتصار",
  "أميرة",
  "نهى",
  "هالة",
  "رشا",
  "لينا",
  "جميلة",
  "كوثر",
  "سعاد",
]

export const FEMALE_NAMES_EN = [
  "Fatima",
  "Aisha",
  "Mariam",
  "Amina",
  "Khadija",
  "Zainab",
  "Huda",
  "Sara",
  "Nour",
  "Laila",
  "Ruqaya",
  "Halima",
  "Sumaya",
  "Reem",
  "Duaa",
  "Iman",
  "Asma",
  "Hiba",
  "Rana",
  "Mona",
  "Salma",
  "Yasmin",
  "Lamia",
  "Shaimaa",
  "Aya",
  "Marwa",
  "Nadia",
  "Siham",
  "Wafaa",
  "Safaa",
  "Rehab",
  "Intisar",
  "Amira",
  "Nuha",
  "Hala",
  "Rasha",
  "Lina",
  "Jamila",
  "Kawthar",
  "Suaad",
]

export const SURNAMES_AR = [
  "حسن",
  "علي",
  "أحمد",
  "محمد",
  "إبراهيم",
  "عثمان",
  "عبدالرحمن",
  "يوسف",
  "الحسن",
  "النور",
  "عبدالله",
  "آدم",
  "موسى",
  "عيسى",
  "خليل",
  "صالح",
  "عبدالقادر",
  "الطيب",
  "بشير",
  "جعفر",
  "المهدي",
  "الزين",
  "عمر",
  "سليمان",
  "البشير",
  "الأمين",
  "حامد",
  "كمال",
  "جلال",
  "نصر",
]

export const SURNAMES_EN = [
  "Hassan",
  "Ali",
  "Ahmed",
  "Mohammed",
  "Ibrahim",
  "Othman",
  "Abdelrahman",
  "Youssef",
  "Elhasan",
  "Elnour",
  "Abdullah",
  "Adam",
  "Musa",
  "Issa",
  "Khalil",
  "Salih",
  "Abdelgadir",
  "Eltayeb",
  "Bashir",
  "Jaafar",
  "Elmahdi",
  "Elzein",
  "Omar",
  "Suleiman",
  "Elbashir",
  "Elamin",
  "Hamid",
  "Kamal",
  "Jalal",
  "Nasr",
]

// ============================================================================
// TEACHERS DATA (100 teachers with Arabic names)
// ============================================================================

export const TEACHER_DATA: TeacherData[] = [
  // Languages Department (20 teachers)
  {
    givenNameAr: "فاطمة",
    givenNameEn: "Fatima",
    surnameAr: "حسن",
    surnameEn: "Hassan",
    gender: "F",
    departmentEn: "Languages",
    specialty: "Arabic",
  },
  {
    givenNameAr: "محمد",
    givenNameEn: "Mohammed",
    surnameAr: "علي",
    surnameEn: "Ali",
    gender: "M",
    departmentEn: "Languages",
    specialty: "Arabic",
  },
  {
    givenNameAr: "عائشة",
    givenNameEn: "Aisha",
    surnameAr: "أحمد",
    surnameEn: "Ahmed",
    gender: "F",
    departmentEn: "Languages",
    specialty: "English",
  },
  {
    givenNameAr: "أحمد",
    givenNameEn: "Ahmed",
    surnameAr: "محمد",
    surnameEn: "Mohammed",
    gender: "M",
    departmentEn: "Languages",
    specialty: "English",
  },
  {
    givenNameAr: "مريم",
    givenNameEn: "Mariam",
    surnameAr: "إبراهيم",
    surnameEn: "Ibrahim",
    gender: "F",
    departmentEn: "Languages",
    specialty: "French",
  },

  // Sciences Department (25 teachers)
  {
    givenNameAr: "إبراهيم",
    givenNameEn: "Ibrahim",
    surnameAr: "عثمان",
    surnameEn: "Othman",
    gender: "M",
    departmentEn: "Sciences",
    specialty: "Mathematics",
  },
  {
    givenNameAr: "خالد",
    givenNameEn: "Khalid",
    surnameAr: "عبدالرحمن",
    surnameEn: "Abdelrahman",
    gender: "M",
    departmentEn: "Sciences",
    specialty: "Mathematics",
  },
  {
    givenNameAr: "أمينة",
    givenNameEn: "Amina",
    surnameAr: "يوسف",
    surnameEn: "Youssef",
    gender: "F",
    departmentEn: "Sciences",
    specialty: "Physics",
  },
  {
    givenNameAr: "عمر",
    givenNameEn: "Omar",
    surnameAr: "الحسن",
    surnameEn: "Elhasan",
    gender: "M",
    departmentEn: "Sciences",
    specialty: "Physics",
  },
  {
    givenNameAr: "خديجة",
    givenNameEn: "Khadija",
    surnameAr: "النور",
    surnameEn: "Elnour",
    gender: "F",
    departmentEn: "Sciences",
    specialty: "Chemistry",
  },
  {
    givenNameAr: "حسن",
    givenNameEn: "Hassan",
    surnameAr: "عبدالله",
    surnameEn: "Abdullah",
    gender: "M",
    departmentEn: "Sciences",
    specialty: "Chemistry",
  },
  {
    givenNameAr: "زينب",
    givenNameEn: "Zainab",
    surnameAr: "آدم",
    surnameEn: "Adam",
    gender: "F",
    departmentEn: "Sciences",
    specialty: "Biology",
  },
  {
    givenNameAr: "يوسف",
    givenNameEn: "Youssef",
    surnameAr: "موسى",
    surnameEn: "Musa",
    gender: "M",
    departmentEn: "Sciences",
    specialty: "Biology",
  },
  {
    givenNameAr: "علي",
    givenNameEn: "Ali",
    surnameAr: "عيسى",
    surnameEn: "Issa",
    gender: "M",
    departmentEn: "Sciences",
    specialty: "Computer Science",
  },
  {
    givenNameAr: "هدى",
    givenNameEn: "Huda",
    surnameAr: "خليل",
    surnameEn: "Khalil",
    gender: "F",
    departmentEn: "Sciences",
    specialty: "Science",
  },

  // Humanities Department (15 teachers)
  {
    givenNameAr: "سارة",
    givenNameEn: "Sara",
    surnameAr: "صالح",
    surnameEn: "Salih",
    gender: "F",
    departmentEn: "Humanities",
    specialty: "History",
  },
  {
    givenNameAr: "عبدالله",
    givenNameEn: "Abdullah",
    surnameAr: "عبدالقادر",
    surnameEn: "Abdelgadir",
    gender: "M",
    departmentEn: "Humanities",
    specialty: "History",
  },
  {
    givenNameAr: "نور",
    givenNameEn: "Nour",
    surnameAr: "الطيب",
    surnameEn: "Eltayeb",
    gender: "F",
    departmentEn: "Humanities",
    specialty: "Geography",
  },
  {
    givenNameAr: "طارق",
    givenNameEn: "Tarek",
    surnameAr: "بشير",
    surnameEn: "Bashir",
    gender: "M",
    departmentEn: "Humanities",
    specialty: "Geography",
  },
  {
    givenNameAr: "ليلى",
    givenNameEn: "Laila",
    surnameAr: "جعفر",
    surnameEn: "Jaafar",
    gender: "F",
    departmentEn: "Humanities",
    specialty: "Social Studies",
  },

  // Religion Department (15 teachers)
  {
    givenNameAr: "مصطفى",
    givenNameEn: "Mustafa",
    surnameAr: "المهدي",
    surnameEn: "Elmahdi",
    gender: "M",
    departmentEn: "Religion",
    specialty: "Islamic Studies",
  },
  {
    givenNameAr: "رقية",
    givenNameEn: "Ruqaya",
    surnameAr: "الزين",
    surnameEn: "Elzein",
    gender: "F",
    departmentEn: "Religion",
    specialty: "Islamic Studies",
  },
  {
    givenNameAr: "ياسر",
    givenNameEn: "Yasser",
    surnameAr: "عمر",
    surnameEn: "Omar",
    gender: "M",
    departmentEn: "Religion",
    specialty: "Quran",
  },
  {
    givenNameAr: "حليمة",
    givenNameEn: "Halima",
    surnameAr: "سليمان",
    surnameEn: "Suleiman",
    gender: "F",
    departmentEn: "Religion",
    specialty: "Quran",
  },

  // ICT Department (10 teachers)
  {
    givenNameAr: "عبدالرحمن",
    givenNameEn: "Abdelrahman",
    surnameAr: "البشير",
    surnameEn: "Elbashir",
    gender: "M",
    departmentEn: "ICT",
    specialty: "ICT",
  },
  {
    givenNameAr: "سمية",
    givenNameEn: "Sumaya",
    surnameAr: "الأمين",
    surnameEn: "Elamin",
    gender: "F",
    departmentEn: "ICT",
    specialty: "ICT",
  },

  // Arts & PE Department (15 teachers)
  {
    givenNameAr: "صلاح",
    givenNameEn: "Salah",
    surnameAr: "حامد",
    surnameEn: "Hamid",
    gender: "M",
    departmentEn: "Arts & PE",
    specialty: "Physical Education",
  },
  {
    givenNameAr: "ريم",
    givenNameEn: "Reem",
    surnameAr: "كمال",
    surnameEn: "Kamal",
    gender: "F",
    departmentEn: "Arts & PE",
    specialty: "Physical Education",
  },
  {
    givenNameAr: "دعاء",
    givenNameEn: "Duaa",
    surnameAr: "جلال",
    surnameEn: "Jalal",
    gender: "F",
    departmentEn: "Arts & PE",
    specialty: "Art",
  },
  {
    givenNameAr: "بكري",
    givenNameEn: "Bakri",
    surnameAr: "نصر",
    surnameEn: "Nasr",
    gender: "M",
    departmentEn: "Arts & PE",
    specialty: "Music",
  },
]

// ============================================================================
// CLASSROOMS
// ============================================================================

export const CLASSROOMS: ClassroomData[] = [
  // Regular Classrooms (30)
  { name: "A101", capacity: 30, type: "classroom", building: "A", floor: 1 },
  { name: "A102", capacity: 30, type: "classroom", building: "A", floor: 1 },
  { name: "A103", capacity: 30, type: "classroom", building: "A", floor: 1 },
  { name: "A201", capacity: 30, type: "classroom", building: "A", floor: 2 },
  { name: "A202", capacity: 30, type: "classroom", building: "A", floor: 2 },
  { name: "A203", capacity: 30, type: "classroom", building: "A", floor: 2 },
  { name: "B101", capacity: 35, type: "classroom", building: "B", floor: 1 },
  { name: "B102", capacity: 35, type: "classroom", building: "B", floor: 1 },
  { name: "B103", capacity: 35, type: "classroom", building: "B", floor: 1 },
  { name: "B201", capacity: 35, type: "classroom", building: "B", floor: 2 },
  { name: "B202", capacity: 35, type: "classroom", building: "B", floor: 2 },
  { name: "B203", capacity: 35, type: "classroom", building: "B", floor: 2 },

  // Labs (10)
  { name: "Physics Lab", capacity: 25, type: "lab", building: "C", floor: 1 },
  { name: "Chemistry Lab", capacity: 25, type: "lab", building: "C", floor: 1 },
  { name: "Biology Lab", capacity: 25, type: "lab", building: "C", floor: 1 },
  {
    name: "Computer Lab 1",
    capacity: 30,
    type: "lab",
    building: "C",
    floor: 2,
  },
  {
    name: "Computer Lab 2",
    capacity: 30,
    type: "lab",
    building: "C",
    floor: 2,
  },
  { name: "Language Lab", capacity: 25, type: "lab", building: "C", floor: 2 },

  // Special Rooms (15)
  { name: "Library", capacity: 100, type: "library", building: "D", floor: 1 },
  { name: "Art Room", capacity: 25, type: "art", building: "D", floor: 1 },
  { name: "Music Room", capacity: 30, type: "music", building: "D", floor: 1 },
  {
    name: "Assembly Hall",
    capacity: 500,
    type: "hall",
    building: "D",
    floor: 1,
  },
  {
    name: "Sports Hall",
    capacity: 200,
    type: "sports",
    building: "E",
    floor: 1,
  },
  {
    name: "Football Field",
    capacity: 100,
    type: "sports",
    building: "E",
    floor: 0,
  },
  {
    name: "Basketball Court",
    capacity: 50,
    type: "sports",
    building: "E",
    floor: 0,
  },

  // Admin Rooms
  {
    name: "Principal Office",
    capacity: 10,
    type: "admin",
    building: "A",
    floor: 1,
  },
  { name: "Staff Room", capacity: 40, type: "admin", building: "A", floor: 1 },
  {
    name: "Meeting Room",
    capacity: 20,
    type: "admin",
    building: "A",
    floor: 1,
  },
]

// ============================================================================
// SCHOOL PERIODS (Sudanese School Day)
// ============================================================================

export const SCHOOL_PERIODS = [
  {
    name: "Period 1",
    startTime: "07:45",
    endTime: "08:30",
    order: 1,
    isBreak: false,
  },
  {
    name: "Period 2",
    startTime: "08:35",
    endTime: "09:20",
    order: 2,
    isBreak: false,
  },
  {
    name: "Period 3",
    startTime: "09:25",
    endTime: "10:10",
    order: 3,
    isBreak: false,
  },
  {
    name: "Break 1",
    startTime: "10:10",
    endTime: "10:30",
    order: 4,
    isBreak: true,
  },
  {
    name: "Period 4",
    startTime: "10:30",
    endTime: "11:15",
    order: 5,
    isBreak: false,
  },
  {
    name: "Period 5",
    startTime: "11:20",
    endTime: "12:05",
    order: 6,
    isBreak: false,
  },
  {
    name: "Period 6",
    startTime: "12:10",
    endTime: "12:55",
    order: 7,
    isBreak: false,
  },
  {
    name: "Break 2",
    startTime: "12:55",
    endTime: "13:25",
    order: 8,
    isBreak: true,
  },
  {
    name: "Period 7",
    startTime: "13:25",
    endTime: "14:10",
    order: 9,
    isBreak: false,
  },
  {
    name: "Period 8",
    startTime: "14:15",
    endTime: "15:00",
    order: 10,
    isBreak: false,
  },
]

// Working days (Sunday to Thursday in Sudan)
export const WORKING_DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
]

// ============================================================================
// GRADING SCALE (Sudanese System)
// ============================================================================

export const GRADE_SCALE = [
  {
    grade: "A+",
    minScore: 95,
    maxScore: 100,
    gpa: 4.0,
    descriptionEn: "Excellent",
    descriptionAr: "ممتاز",
  },
  {
    grade: "A",
    minScore: 90,
    maxScore: 94,
    gpa: 3.7,
    descriptionEn: "Very Good",
    descriptionAr: "جيد جداً",
  },
  {
    grade: "B+",
    minScore: 85,
    maxScore: 89,
    gpa: 3.3,
    descriptionEn: "Good Plus",
    descriptionAr: "جيد+",
  },
  {
    grade: "B",
    minScore: 80,
    maxScore: 84,
    gpa: 3.0,
    descriptionEn: "Good",
    descriptionAr: "جيد",
  },
  {
    grade: "C+",
    minScore: 75,
    maxScore: 79,
    gpa: 2.7,
    descriptionEn: "Satisfactory Plus",
    descriptionAr: "مقبول+",
  },
  {
    grade: "C",
    minScore: 70,
    maxScore: 74,
    gpa: 2.3,
    descriptionEn: "Satisfactory",
    descriptionAr: "مقبول",
  },
  {
    grade: "D+",
    minScore: 65,
    maxScore: 69,
    gpa: 2.0,
    descriptionEn: "Pass Plus",
    descriptionAr: "نجاح+",
  },
  {
    grade: "D",
    minScore: 60,
    maxScore: 64,
    gpa: 1.7,
    descriptionEn: "Pass",
    descriptionAr: "نجاح",
  },
  {
    grade: "F",
    minScore: 0,
    maxScore: 59,
    gpa: 0.0,
    descriptionEn: "Fail",
    descriptionAr: "راسب",
  },
]

// ============================================================================
// GUARDIAN TYPES
// ============================================================================

export const GUARDIAN_TYPES = [
  { nameEn: "Father", nameAr: "الأب" },
  { nameEn: "Mother", nameAr: "الأم" },
  { nameEn: "Guardian", nameAr: "ولي الأمر" },
  { nameEn: "Grandparent", nameAr: "الجد/الجدة" },
  { nameEn: "Sibling", nameAr: "الأخ/الأخت" },
]

// ============================================================================
// KHARTOUM NEIGHBORHOODS
// ============================================================================

export const NEIGHBORHOODS = [
  { nameEn: "Khartoum", nameAr: "الخرطوم" },
  { nameEn: "Omdurman", nameAr: "أم درمان" },
  { nameEn: "Bahri", nameAr: "بحري" },
  { nameEn: "Riyadh", nameAr: "الرياض" },
  { nameEn: "Arkawit", nameAr: "أركويت" },
  { nameEn: "Amarat", nameAr: "العمارات" },
  { nameEn: "Burri", nameAr: "بري" },
  { nameEn: "Soba", nameAr: "سوبا" },
  { nameEn: "Jabra", nameAr: "جبرة" },
  { nameEn: "Kalakla", nameAr: "كلاكلة" },
]

// ============================================================================
// SAMPLE ANNOUNCEMENTS
// ============================================================================

export const ANNOUNCEMENTS: AnnouncementData[] = [
  {
    titleEn: "Welcome to Academic Year 2025-2026",
    titleAr: "مرحباً بكم في العام الدراسي 2025-2026",
    bodyEn:
      "We are pleased to welcome all students, parents, and staff to the new academic year. Let's make this year a successful one!",
    bodyAr:
      "يسرنا الترحيب بجميع الطلاب وأولياء الأمور والموظفين في العام الدراسي الجديد. لنجعل هذا العام ناجحاً!",
    scope: "school",
    priority: "high",
  },
  {
    titleEn: "Parent-Teacher Conference",
    titleAr: "اجتماع أولياء الأمور والمعلمين",
    bodyEn:
      "The first parent-teacher conference will be held next Thursday. Please check your email for schedule details.",
    bodyAr:
      "سيعقد اجتماع أولياء الأمور والمعلمين الأول يوم الخميس القادم. يرجى مراجعة بريدكم الإلكتروني لمعرفة تفاصيل الجدول.",
    scope: "school",
    priority: "normal",
  },
  {
    titleEn: "Sports Day Announcement",
    titleAr: "إعلان يوم الرياضة",
    bodyEn:
      "Annual Sports Day will be held on March 15th. All students are encouraged to participate.",
    bodyAr:
      "سيقام يوم الرياضة السنوي في 15 مارس. نشجع جميع الطلاب على المشاركة.",
    scope: "school",
    priority: "normal",
  },
]

// ============================================================================
// SAMPLE EVENTS
// ============================================================================

export const EVENTS: EventData[] = [
  {
    titleEn: "First Day of School",
    titleAr: "اليوم الأول للمدرسة",
    descriptionEn: "Welcome ceremony for all students",
    descriptionAr: "حفل ترحيب لجميع الطلاب",
    type: "academic",
    startDate: new Date("2025-09-01T08:00:00"),
    endDate: new Date("2025-09-01T12:00:00"),
  },
  {
    titleEn: "Midterm Exams",
    titleAr: "امتحانات منتصف الفصل",
    descriptionEn: "First semester midterm examinations",
    descriptionAr: "امتحانات منتصف الفصل الأول",
    type: "academic",
    startDate: new Date("2025-10-20T08:00:00"),
    endDate: new Date("2025-10-30T14:00:00"),
  },
  {
    titleEn: "Sports Day",
    titleAr: "يوم الرياضة",
    descriptionEn: "Annual sports competition",
    descriptionAr: "المسابقة الرياضية السنوية",
    type: "sports",
    startDate: new Date("2025-03-15T08:00:00"),
    endDate: new Date("2025-03-15T16:00:00"),
  },
  {
    titleEn: "Eid Al-Fitr Holiday",
    titleAr: "عطلة عيد الفطر",
    descriptionEn: "Eid Al-Fitr celebration and holiday",
    descriptionAr: "احتفال وعطلة عيد الفطر المبارك",
    type: "religious",
    startDate: new Date("2026-03-30T00:00:00"),
    endDate: new Date("2026-04-05T23:59:59"),
  },
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get random name based on gender
 */
export function getRandomName(
  gender: "M" | "F",
  index: number
): { ar: string; en: string } {
  const names =
    gender === "M"
      ? { ar: MALE_NAMES_AR, en: MALE_NAMES_EN }
      : { ar: FEMALE_NAMES_AR, en: FEMALE_NAMES_EN }

  const nameIndex = index % names.ar.length
  return {
    ar: names.ar[nameIndex],
    en: names.en[nameIndex],
  }
}

/**
 * Get random surname
 */
export function getRandomSurname(index: number): { ar: string; en: string } {
  const surnameIndex = index % SURNAMES_AR.length
  return {
    ar: SURNAMES_AR[surnameIndex],
    en: SURNAMES_EN[surnameIndex],
  }
}

/**
 * Get random neighborhood
 */
export function getRandomNeighborhood(index: number): {
  ar: string
  en: string
} {
  const neighborhoodIndex = index % NEIGHBORHOODS.length
  const neighborhood = NEIGHBORHOODS[neighborhoodIndex]
  return {
    ar: neighborhood.nameAr,
    en: neighborhood.nameEn,
  }
}

/**
 * Calculate birth date for a student based on year level
 */
export function getStudentBirthDate(yearLevelOrder: number): Date {
  const currentYear = new Date().getFullYear()
  const age = yearLevelOrder + 4 // KG1 = order 1, age ~5
  const birthYear = currentYear - age
  const month = Math.floor(Math.random() * 12)
  const day = Math.floor(Math.random() * 28) + 1
  return new Date(birthYear, month, day)
}

/**
 * Generate teacher count per department to reach 100 total
 */
export function getTeachersPerDepartment(): Record<string, number> {
  return {
    Languages: 20,
    Sciences: 25,
    Humanities: 15,
    Religion: 15,
    ICT: 10,
    "Arts & PE": 15,
  }
}
