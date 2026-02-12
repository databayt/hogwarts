/**
 * Seed Constants
 * All static data for seeding the Demo School
 *
 * i18n Strategy:
 * - Single-language storage with `lang` field
 * - Arabic is primary language (lang: "ar")
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
  name: "المدرسة التجريبية", // EN: "Demo School"
  motto: "التميز في التعليم", // EN: "Excellence in Education"
  preferredLanguage: "ar",

  // Contact
  email: "admin@demo.databayt.org",
  phone: "+249-123-456-789",
  website: "https://demo.databayt.org",

  // Address (Khartoum, Sudan)
  address: "١٢٣ شارع التعليم، الخرطوم، السودان", // EN: "123 Education Street, Khartoum, Sudan"

  // Settings
  timezone: "Africa/Khartoum",
  planType: "premium",
  maxStudents: 2000,
  maxTeachers: 200,

  // Classification
  schoolType: "private",
  schoolLevel: "both",
  description:
    "A leading educational institution in Khartoum dedicated to academic excellence and holistic student development.",

  // Location breakdown
  city: "Khartoum",
  state: "Khartoum",
  country: "Sudan",

  // Pricing
  tuitionFee: 5000,
  registrationFee: 200,
  applicationFee: 50,
  currency: "USD",
  paymentSchedule: "annual",

  // Capacity
  maxClasses: 40,

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
    username: "المطور", // EN: "Developer"
  },
  {
    email: "admin@databayt.org",
    role: "ADMIN",
    username: "المدير", // EN: "Admin"
  },
  {
    email: "accountant@databayt.org",
    role: "ACCOUNTANT",
    username: "المحاسب", // EN: "Accountant"
  },
  {
    email: "staff@databayt.org",
    role: "STAFF",
    username: "الموظف", // EN: "Staff"
  },
  {
    email: "user@databayt.org",
    role: "USER",
    username: "مستخدم جديد", // EN: "New User"
  },
]

// ============================================================================
// YEAR LEVELS (K-12 Sudanese System)
// ============================================================================

export const YEAR_LEVELS: YearLevelData[] = [
  // Kindergarten (الروضة)
  {
    name: "الروضة الأولى",
    order: 1,
    section: "KG",
    ageRange: [4, 5],
    studentsPerLevel: 50,
  },
  {
    name: "الروضة الثانية",
    order: 2,
    section: "KG",
    ageRange: [5, 6],
    studentsPerLevel: 50,
  },

  // Primary (الابتدائي)
  {
    name: "الصف الأول",
    order: 3,
    section: "Primary",
    ageRange: [6, 7],
    studentsPerLevel: 80,
  },
  {
    name: "الصف الثاني",
    order: 4,
    section: "Primary",
    ageRange: [7, 8],
    studentsPerLevel: 80,
  },
  {
    name: "الصف الثالث",
    order: 5,
    section: "Primary",
    ageRange: [8, 9],
    studentsPerLevel: 80,
  },
  {
    name: "الصف الرابع",
    order: 6,
    section: "Primary",
    ageRange: [9, 10],
    studentsPerLevel: 80,
  },
  {
    name: "الصف الخامس",
    order: 7,
    section: "Primary",
    ageRange: [10, 11],
    studentsPerLevel: 80,
  },
  {
    name: "الصف السادس",
    order: 8,
    section: "Primary",
    ageRange: [11, 12],
    studentsPerLevel: 80,
  },

  // Intermediate (المتوسط)
  {
    name: "الصف السابع",
    order: 9,
    section: "Intermediate",
    ageRange: [12, 13],
    studentsPerLevel: 70,
  },
  {
    name: "الصف الثامن",
    order: 10,
    section: "Intermediate",
    ageRange: [13, 14],
    studentsPerLevel: 70,
  },
  {
    name: "الصف التاسع",
    order: 11,
    section: "Intermediate",
    ageRange: [14, 15],
    studentsPerLevel: 70,
  },

  // Secondary (الثانوي)
  {
    name: "الصف العاشر",
    order: 12,
    section: "Secondary",
    ageRange: [15, 16],
    studentsPerLevel: 60,
  },
  {
    name: "الصف الحادي عشر",
    order: 13,
    section: "Secondary",
    ageRange: [16, 17],
    studentsPerLevel: 60,
  },
  {
    name: "الصف الثاني عشر",
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
  { name: "اللغات", description: "تدريس اللغة العربية والإنجليزية والفرنسية" },
  {
    name: "العلوم",
    description: "الرياضيات والفيزياء والكيمياء والأحياء وعلوم الحاسوب",
  },
  {
    name: "العلوم الإنسانية",
    description: "التاريخ والجغرافيا والدراسات الاجتماعية والتربية الوطنية",
  },
  { name: "الدين", description: "التربية الإسلامية والقرآن الكريم" },
  { name: "تقنية المعلومات", description: "تقنية المعلومات والاتصالات" },
  { name: "الفنون والرياضة", description: "الفنون والموسيقى والتربية البدنية" },
]

// ============================================================================
// SUBJECTS
// ============================================================================

export const SUBJECTS: SubjectData[] = [
  // Languages Department (اللغات)
  {
    name: "اللغة العربية", // EN: "Arabic"
    department: "اللغات",
    levels: ["all"],
    description: "القراءة والكتابة والنحو والأدب", // EN: "Arabic Language - Reading, Writing, Grammar, Literature"
  },
  {
    name: "اللغة الإنجليزية", // EN: "English"
    department: "اللغات",
    levels: ["all"],
    description: "اللغة الإنجليزية", // EN: "English Language"
  },
  {
    name: "اللغة الفرنسية", // EN: "French"
    department: "اللغات",
    levels: ["7-12"],
    description: "اللغة الفرنسية", // EN: "French Language"
  },

  // Sciences Department (العلوم)
  {
    name: "الرياضيات", // EN: "Mathematics"
    department: "العلوم",
    levels: ["all"],
    description: "الحساب والجبر والهندسة", // EN: "Mathematics - Arithmetic, Algebra, Geometry"
  },
  {
    name: "العلوم", // EN: "Science"
    department: "العلوم",
    levels: ["KG-6"],
    description: "العلوم العامة", // EN: "General Science"
  },
  {
    name: "الفيزياء", // EN: "Physics"
    department: "العلوم",
    levels: ["7-12"],
    description: "الفيزياء",
  },
  {
    name: "الكيمياء", // EN: "Chemistry"
    department: "العلوم",
    levels: ["7-12"],
    description: "الكيمياء",
  },
  {
    name: "الأحياء", // EN: "Biology"
    department: "العلوم",
    levels: ["7-12"],
    description: "الأحياء",
  },
  {
    name: "علوم الحاسوب", // EN: "Computer Science"
    department: "العلوم",
    levels: ["7-12"],
    description: "علوم الحاسوب",
  },

  // Humanities Department (العلوم الإنسانية)
  {
    name: "التاريخ", // EN: "History"
    department: "العلوم الإنسانية",
    levels: ["4-12"],
    description: "التاريخ",
  },
  {
    name: "الجغرافيا", // EN: "Geography"
    department: "العلوم الإنسانية",
    levels: ["4-12"],
    description: "الجغرافيا",
  },
  {
    name: "الدراسات الاجتماعية", // EN: "Social Studies"
    department: "العلوم الإنسانية",
    levels: ["1-6"],
    description: "الدراسات الاجتماعية",
  },
  {
    name: "التربية الوطنية", // EN: "Civics"
    department: "العلوم الإنسانية",
    levels: ["7-12"],
    description: "التربية الوطنية",
  },

  // Religion Department (الدين)
  {
    name: "التربية الإسلامية", // EN: "Islamic Studies"
    department: "الدين",
    levels: ["all"],
    description: "العقيدة والفقه والأخلاق", // EN: "Islamic Studies - Faith, Jurisprudence, Ethics"
  },
  {
    name: "القرآن الكريم", // EN: "Quran"
    department: "الدين",
    levels: ["all"],
    description: "حفظ وتلاوة القرآن الكريم", // EN: "Quran Memorization and Recitation"
  },

  // ICT Department (تقنية المعلومات)
  {
    name: "الحاسوب", // EN: "ICT"
    department: "تقنية المعلومات",
    levels: ["3-12"],
    description: "تقنية المعلومات", // EN: "Information and Communication Technology"
  },

  // Arts & PE Department (الفنون والرياضة)
  {
    name: "التربية الفنية", // EN: "Art"
    department: "الفنون والرياضة",
    levels: ["all"],
    description: "الفنون والرسم", // EN: "Art and Drawing"
  },
  {
    name: "الموسيقى", // EN: "Music"
    department: "الفنون والرياضة",
    levels: ["KG-9"],
    description: "الموسيقى",
  },
  {
    name: "التربية البدنية", // EN: "Physical Education"
    department: "الفنون والرياضة",
    levels: ["all"],
    description: "التربية البدنية",
  },

  // Additional Sciences (from ClickView, MENA-adapted)
  {
    name: "علوم الأرض والفضاء",
    department: "العلوم",
    levels: ["7-12"],
    description: "علوم الأرض والفضاء",
  },
  {
    name: "العلوم والهندسة",
    department: "العلوم",
    levels: ["7-12"],
    description: "ممارسات العلوم والهندسة",
  },

  // Additional Humanities
  {
    name: "الاقتصاد والأعمال",
    department: "العلوم الإنسانية",
    levels: ["7-12"],
    description: "الاقتصاد وإدارة الأعمال",
  },
  {
    name: "المهارات الحياتية",
    department: "العلوم الإنسانية",
    levels: ["all"],
    description: "المهارات الحياتية",
  },
  {
    name: "علم النفس",
    department: "العلوم الإنسانية",
    levels: ["high"],
    description: "علم النفس",
  },
  {
    name: "تاريخ السودان",
    department: "العلوم الإنسانية",
    levels: ["7-12"],
    description: "تاريخ السودان",
  },
  {
    name: "تاريخ العالم",
    department: "العلوم الإنسانية",
    levels: ["7-12"],
    description: "تاريخ العالم",
  },

  // Additional Arts & PE
  {
    name: "الصحة",
    department: "الفنون والرياضة",
    levels: ["all"],
    description: "الصحة والسلامة",
  },
  {
    name: "التعليم المهني",
    department: "الفنون والرياضة",
    levels: ["7-12"],
    description: "التعليم والتدريب المهني",
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
    givenName: "فاطمة",
    surname: "حسن",
    gender: "F",
    department: "اللغات",
    specialty: "Arabic",
  },
  {
    givenName: "محمد",
    surname: "علي",
    gender: "M",
    department: "اللغات",
    specialty: "Arabic",
  },
  {
    givenName: "عائشة",
    surname: "أحمد",
    gender: "F",
    department: "اللغات",
    specialty: "English",
  },
  {
    givenName: "أحمد",
    surname: "محمد",
    gender: "M",
    department: "اللغات",
    specialty: "English",
  },
  {
    givenName: "مريم",
    surname: "إبراهيم",
    gender: "F",
    department: "اللغات",
    specialty: "French",
  },

  // Sciences Department (25 teachers)
  {
    givenName: "إبراهيم",
    surname: "عثمان",
    gender: "M",
    department: "العلوم",
    specialty: "Mathematics",
  },
  {
    givenName: "خالد",
    surname: "عبدالرحمن",
    gender: "M",
    department: "العلوم",
    specialty: "Mathematics",
  },
  {
    givenName: "أمينة",
    surname: "يوسف",
    gender: "F",
    department: "العلوم",
    specialty: "Physics",
  },
  {
    givenName: "عمر",
    surname: "الحسن",
    gender: "M",
    department: "العلوم",
    specialty: "Physics",
  },
  {
    givenName: "خديجة",
    surname: "النور",
    gender: "F",
    department: "العلوم",
    specialty: "Chemistry",
  },
  {
    givenName: "حسن",
    surname: "عبدالله",
    gender: "M",
    department: "العلوم",
    specialty: "Chemistry",
  },
  {
    givenName: "زينب",
    surname: "آدم",
    gender: "F",
    department: "العلوم",
    specialty: "Biology",
  },
  {
    givenName: "يوسف",
    surname: "موسى",
    gender: "M",
    department: "العلوم",
    specialty: "Biology",
  },
  {
    givenName: "علي",
    surname: "عيسى",
    gender: "M",
    department: "العلوم",
    specialty: "Computer Science",
  },
  {
    givenName: "هدى",
    surname: "خليل",
    gender: "F",
    department: "العلوم",
    specialty: "Science",
  },

  // Humanities Department (15 teachers)
  {
    givenName: "سارة",
    surname: "صالح",
    gender: "F",
    department: "العلوم الإنسانية",
    specialty: "History",
  },
  {
    givenName: "عبدالله",
    surname: "عبدالقادر",
    gender: "M",
    department: "العلوم الإنسانية",
    specialty: "History",
  },
  {
    givenName: "نور",
    surname: "الطيب",
    gender: "F",
    department: "العلوم الإنسانية",
    specialty: "Geography",
  },
  {
    givenName: "طارق",
    surname: "بشير",
    gender: "M",
    department: "العلوم الإنسانية",
    specialty: "Geography",
  },
  {
    givenName: "ليلى",
    surname: "جعفر",
    gender: "F",
    department: "العلوم الإنسانية",
    specialty: "Social Studies",
  },

  // Religion Department (15 teachers)
  {
    givenName: "مصطفى",
    surname: "المهدي",
    gender: "M",
    department: "الدين",
    specialty: "Islamic Studies",
  },
  {
    givenName: "رقية",
    surname: "الزين",
    gender: "F",
    department: "الدين",
    specialty: "Islamic Studies",
  },
  {
    givenName: "ياسر",
    surname: "عمر",
    gender: "M",
    department: "الدين",
    specialty: "Quran",
  },
  {
    givenName: "حليمة",
    surname: "سليمان",
    gender: "F",
    department: "الدين",
    specialty: "Quran",
  },

  // ICT Department (10 teachers)
  {
    givenName: "عبدالرحمن",
    surname: "البشير",
    gender: "M",
    department: "تقنية المعلومات",
    specialty: "ICT",
  },
  {
    givenName: "سمية",
    surname: "الأمين",
    gender: "F",
    department: "تقنية المعلومات",
    specialty: "ICT",
  },

  // Arts & PE Department (15 teachers)
  {
    givenName: "صلاح",
    surname: "حامد",
    gender: "M",
    department: "الفنون والرياضة",
    specialty: "Physical Education",
  },
  {
    givenName: "ريم",
    surname: "كمال",
    gender: "F",
    department: "الفنون والرياضة",
    specialty: "Physical Education",
  },
  {
    givenName: "دعاء",
    surname: "جلال",
    gender: "F",
    department: "الفنون والرياضة",
    specialty: "Art",
  },
  {
    givenName: "بكري",
    surname: "نصر",
    gender: "M",
    department: "الفنون والرياضة",
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
    description: "ممتاز", // EN: "Excellent"
  },
  {
    grade: "A",
    minScore: 90,
    maxScore: 94,
    gpa: 3.7,
    description: "جيد جداً", // EN: "Very Good"
  },
  {
    grade: "B+",
    minScore: 85,
    maxScore: 89,
    gpa: 3.3,
    description: "جيد+", // EN: "Good Plus"
  },
  {
    grade: "B",
    minScore: 80,
    maxScore: 84,
    gpa: 3.0,
    description: "جيد", // EN: "Good"
  },
  {
    grade: "C+",
    minScore: 75,
    maxScore: 79,
    gpa: 2.7,
    description: "مقبول+", // EN: "Satisfactory Plus"
  },
  {
    grade: "C",
    minScore: 70,
    maxScore: 74,
    gpa: 2.3,
    description: "مقبول", // EN: "Satisfactory"
  },
  {
    grade: "D+",
    minScore: 65,
    maxScore: 69,
    gpa: 2.0,
    description: "نجاح+", // EN: "Pass Plus"
  },
  {
    grade: "D",
    minScore: 60,
    maxScore: 64,
    gpa: 1.7,
    description: "نجاح", // EN: "Pass"
  },
  {
    grade: "F",
    minScore: 0,
    maxScore: 59,
    gpa: 0.0,
    description: "راسب", // EN: "Fail"
  },
]

// ============================================================================
// GUARDIAN TYPES
// ============================================================================

export const GUARDIAN_TYPES = [
  { name: "الأب" }, // EN: "Father"
  { name: "الأم" }, // EN: "Mother"
  { name: "ولي الأمر" }, // EN: "Guardian"
  { name: "الجد/الجدة" }, // EN: "Grandparent"
  { name: "الأخ/الأخت" }, // EN: "Sibling"
]

// ============================================================================
// KHARTOUM NEIGHBORHOODS
// ============================================================================

export const NEIGHBORHOODS = [
  { name: "الخرطوم" }, // EN: "Khartoum"
  { name: "أم درمان" }, // EN: "Omdurman"
  { name: "بحري" }, // EN: "Bahri"
  { name: "الرياض" }, // EN: "Riyadh"
  { name: "أركويت" }, // EN: "Arkawit"
  { name: "العمارات" }, // EN: "Amarat"
  { name: "بري" }, // EN: "Burri"
  { name: "سوبا" }, // EN: "Soba"
  { name: "جبرة" }, // EN: "Jabra"
  { name: "كلاكلة" }, // EN: "Kalakla"
]

// ============================================================================
// SAMPLE ANNOUNCEMENTS
// ============================================================================

export const ANNOUNCEMENTS: AnnouncementData[] = [
  {
    title: "مرحباً بكم في العام الدراسي 2025-2026",
    body: "يسرنا الترحيب بجميع الطلاب وأولياء الأمور والموظفين في العام الدراسي الجديد. لنجعل هذا العام ناجحاً!",
    scope: "school",
    priority: "high",
  },
  {
    title: "اجتماع أولياء الأمور والمعلمين",
    body: "سيعقد اجتماع أولياء الأمور والمعلمين الأول يوم الخميس القادم. يرجى مراجعة بريدكم الإلكتروني لمعرفة تفاصيل الجدول.",
    scope: "school",
    priority: "normal",
  },
  {
    title: "إعلان يوم الرياضة",
    body: "سيقام يوم الرياضة السنوي في 15 مارس. نشجع جميع الطلاب على المشاركة.",
    scope: "school",
    priority: "normal",
  },
]

// ============================================================================
// SAMPLE EVENTS
// ============================================================================

export const EVENTS: EventData[] = [
  {
    title: "اليوم الأول للمدرسة", // EN: "First Day of School"
    description: "حفل ترحيب لجميع الطلاب", // EN: "Welcome ceremony for all students"
    type: "academic",
    startDate: new Date("2025-09-01T08:00:00"),
    endDate: new Date("2025-09-01T12:00:00"),
  },
  {
    title: "امتحانات منتصف الفصل", // EN: "Midterm Exams"
    description: "امتحانات منتصف الفصل الأول", // EN: "First semester midterm examinations"
    type: "academic",
    startDate: new Date("2025-10-20T08:00:00"),
    endDate: new Date("2025-10-30T14:00:00"),
  },
  {
    title: "يوم الرياضة", // EN: "Sports Day"
    description: "المسابقة الرياضية السنوية", // EN: "Annual sports competition"
    type: "sports",
    startDate: new Date("2025-03-15T08:00:00"),
    endDate: new Date("2025-03-15T16:00:00"),
  },
  {
    title: "عطلة عيد الفطر", // EN: "Eid Al-Fitr Holiday"
    description: "احتفال وعطلة عيد الفطر المبارك", // EN: "Eid Al-Fitr celebration and holiday"
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
export function getRandomNeighborhood(index: number): string {
  const neighborhoodIndex = index % NEIGHBORHOODS.length
  return NEIGHBORHOODS[neighborhoodIndex].name
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
    اللغات: 20,
    العلوم: 25,
    "العلوم الإنسانية": 15,
    الدين: 15,
    "تقنية المعلومات": 10,
    "الفنون والرياضة": 15,
  }
}
