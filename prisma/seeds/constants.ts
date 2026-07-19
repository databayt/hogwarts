// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

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
  EventData,
  TeacherData,
  YearLevelData,
} from "./types"

// ============================================================================
// DEMO SCHOOL CONFIGURATION
// ============================================================================

export const DEMO_SCHOOL = {
  // Identity
  domain: "demo",
  name: "نموذج", // EN: "Demo"
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
  // Timetable structure — set so the provisioning doctor flags the demo's
  // schedule/timetable stages and auto-generates a timetable (zero-click).
  timetableStructure: "sd-private",
  description:
    "A leading educational institution in Khartoum dedicated to academic excellence and holistic student development.",

  // Location breakdown
  city: "Khartoum",
  state: "Khartoum",
  country: "SD",

  // Pricing (SDG — Sudanese Pound; realistic private-school figures)
  tuitionFee: 450000,
  registrationFee: 50000,
  applicationFee: 0,
  currency: "SDG",
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

// Blood group types
export const BLOOD_GROUPS = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
] as const

// ============================================================================
// HARRY POTTER CHARACTER MAPPING
// ============================================================================

/**
 * Maps named accounts to Harry Potter characters.
 * Source images are in /public/site/ -- profile-images seed uploads to S3.
 */
export const HP_CHARACTERS = {
  // Admin accounts
  dev: {
    nameAr: "سيفيروس سنيب",
    nameEn: "Severus Snape",
    bio: "أستاذ الجرعات ورئيس منزل سليذرين.",
    gender: "M" as const,
    sourceImage: "/public/site/dumbledore.jpeg",
    personalEmail: "severus-snape@hotmail.com",
  },
  admin: {
    nameAr: "ألباس دمبلدور",
    nameEn: "Albus Dumbledore",
    bio: "مدير المدرسة وكبير السحرة\nالتحويلات والسحر القديم",
    gender: "M" as const,
    sourceImage: "/public/site/dumbledore.jpeg",
    personalEmail: "albus-dumbledore@hotmail.com",
  },
  accountant: {
    nameAr: "فيليوس فليتويك",
    nameEn: "Filius Flitwick",
    bio: "أستاذ التعاويذ ورئيس منزل رافنكلو.",
    gender: "M" as const,
    sourceImage: "/public/site/dumbledore.jpeg",
    personalEmail: "filius-flitwick@hotmail.com",
  },
  // Teacher index 0
  teacher: {
    nameAr: "مينيرفا ماكغونغال",
    nameEn: "Minerva McGonagall",
    bio: "نائبة المدير وأستاذة التحويلات.",
    gender: "F" as const,
    sourceImage: "/public/site/mcgonagall.jpeg",
    birthDate: new Date("1935-10-04"),
    personalEmail: "minerva-mcgonagall@hotmail.com",
  },
  // Student index 0
  student: {
    nameAr: "هاري بوتر",
    nameEn: "Harry Potter",
    bio: "الفتى الذي عاش.",
    gender: "M" as const,
    sourceImage: "/public/site/harry.jpg",
    birthDate: new Date("2010-07-31"),
    personalEmail: "harry-potter@gmail.com",
    bloodGroup: "O+" as const,
    nationality: "GB",
    address: "4 Privet Drive, Little Whinging",
    emergencyContactName: "جيمس بوتر",
    medicalNotes: "Lightning bolt scar on forehead",
  },
  // Guardian index 0 (father of Harry)
  guardian0: {
    nameAr: "جيمس بوتر",
    nameEn: "James Potter",
    bio: "من خريجي غريفندور. أحد المشاغبين.",
    gender: "M" as const,
    // Reuse harry image as placeholder (james image not available)
    sourceImage: "/public/site/harry.jpg",
    personalEmail: "james-potter@gmail.com",
  },
  // Guardian index 1 (mother of Harry)
  guardian1: {
    nameAr: "ليلي بوتر",
    nameEn: "Lily Potter",
    bio: "ساحرة موهوبة استثنائياً، عُرفت بتضحيتها.",
    gender: "F" as const,
    // Reuse hermione image as placeholder (lily image not available)
    sourceImage: "/public/site/hermione.jpg",
    personalEmail: "lily-potter@gmail.com",
  },
  // Staff index 0
  staff: {
    nameAr: "روبياس هاغريد",
    nameEn: "Rubeus Hagrid",
    bio: "حارس المفاتيح والأراضي في هوغورتس.",
    gender: "M" as const,
    sourceImage: "/public/site/hagrid.jpeg",
    position: "حارس المفاتيح والأراضي",
    personalEmail: "rubeus-hagrid@hotmail.com",
  },
  // user@databayt.org
  user: {
    nameAr: "نيفيل لونغبوتوم",
    nameEn: "Neville Longbottom",
    bio: "طالب في غريفندور، أستاذ علم الأعشاب المستقبلي.",
    gender: "M" as const,
    // Reuse harry image as placeholder (neville image not available)
    sourceImage: "/public/site/harry.jpg",
  },
  // applicant@databayt.org
  applicant: {
    nameAr: "لونا لوفغود",
    nameEn: "Luna Lovegood",
    bio: "طالبة في رافنكلو، ترى ما لا يراه الآخرون.",
    gender: "F" as const,
    sourceImage: "/public/site/harry.jpg",
  },
} as const

// ============================================================================
// USER ACCOUNTS
// ============================================================================

export const ADMIN_USERS = [
  {
    email: "dev@databayt.org",
    role: "DEVELOPER",
    username: HP_CHARACTERS.dev.nameAr,
    bio: HP_CHARACTERS.dev.bio,
    image: HP_CHARACTERS.dev.sourceImage.replace("/public", ""),
  },
  {
    email: "admin@databayt.org",
    role: "ADMIN",
    username: HP_CHARACTERS.admin.nameAr,
    bio: HP_CHARACTERS.admin.bio,
    image: HP_CHARACTERS.admin.sourceImage.replace("/public", ""),
  },
  {
    email: "accountant@databayt.org",
    role: "ACCOUNTANT",
    username: HP_CHARACTERS.accountant.nameAr,
    bio: HP_CHARACTERS.accountant.bio,
    image: HP_CHARACTERS.accountant.sourceImage.replace("/public", ""),
  },
  {
    email: "staff@databayt.org",
    role: "STAFF",
    username: HP_CHARACTERS.staff.nameAr,
    bio: HP_CHARACTERS.staff.bio,
    image: HP_CHARACTERS.staff.sourceImage.replace("/public", ""),
  },
  {
    email: "user@databayt.org",
    role: "USER",
    username: HP_CHARACTERS.user.nameAr,
    bio: HP_CHARACTERS.user.bio,
    image: HP_CHARACTERS.user.sourceImage.replace("/public", ""),
  },
  {
    email: "applicant@databayt.org",
    role: "USER",
    username: HP_CHARACTERS.applicant.nameAr,
    bio: HP_CHARACTERS.applicant.bio,
    image: HP_CHARACTERS.applicant.sourceImage.replace("/public", ""),
  },
]

// ============================================================================
// SEED PROFILE — "lite" vs "full"
// ============================================================================
//
// SEED_PROFILE=lite produces a small but realistic demo (~50 students across a
// full K-12 span, ~24 teachers, ~1 homeroom per grade) that STAYS small across
// deploys. It exists so the demo can run on a fresh Neon Free project (512 MB
// storage + a monthly compute quota) for a whole month without tripping either
// cap. Default ("full") is the canonical ~800-student demo — untouched unless
// SEED_PROFILE is explicitly set to "lite".
//
// All levers move together so the lean set is self-consistent AND is recognized
// as "fully seeded" by getDemoSeedStatus (SEED_THRESHOLDS in index.ts) —
// otherwise ensure-demo.ts would re-grow it to full on the next deploy.
export const SEED_IS_LITE = process.env.SEED_PROFILE === "lite"

// Medium profile — a mid/large-school demo (~380 students across the full K-12
// span) that stays comfortably under the Neon Free 512 MB storage + monthly
// compute quota, unlike "full" (~1000 students, ~445 MB) which tripped the cap
// and caused the July outage. Bigger than "lite" (~55) so a "big school" pitch
// doesn't look thin. All levers move together, and the matching SEED_THRESHOLDS
// (index.ts) drop so ensure-demo.ts recognizes this set as fully seeded and
// never re-grows it to full on the next deploy.
export const SEED_IS_MEDIUM = process.env.SEED_PROFILE === "medium"

export const SEED_PROFILE_COUNTS = {
  // USER accounts minted in the auth phase — the hard ceiling on how many
  // students / teachers / guardians the later phases can create.
  studentUsers: SEED_IS_LITE ? 55 : SEED_IS_MEDIUM ? 380 : 1000,
  // Teachers are a CAPACITY constraint on the timetable, not just flavour: the
  // generator caps each teacher at maxPeriodsPerWeek=25 (catalog/provision.ts),
  // and lite's 12 sections x ~30 periods = ~360 slots to fill. 12 teachers could
  // supply at most 300 — so the grid was arithmetically unfillable and ~87% of
  // slots came out teacher-less. 24 gives ~600 of headroom (and 2 teachers per
  // grade is what a real 12-section school looks like anyway). Keep
  // teacherUsers >= ceil(sections * periodsPerWeek / 25) with room to spare.
  teacherUsers: SEED_IS_LITE ? 24 : SEED_IS_MEDIUM ? 36 : 100,
  guardianUsers: SEED_IS_LITE ? 110 : SEED_IS_MEDIUM ? 600 : 2000,
  // Per-K-12-level student cap. Lite 4×14≈52, medium 30×14≈380 — every grade
  // stays populated. min()'d with the full per-level counts, so "full" is a no-op.
  studentsPerLevelCap: SEED_IS_LITE
    ? 4
    : SEED_IS_MEDIUM
      ? 30
      : Number.POSITIVE_INFINITY,
  // Homeroom sections per grade. Lite uses one (A) so rooms aren't near-empty;
  // medium + full use two (A, B).
  sectionLetters: (SEED_IS_LITE ? ["A"] : ["A", "B"]) as string[],
  // Subjects used to generate classes (one class per subject × grade). The SD
  // catalog carries ~123 global subjects, so full makes ~1700 classes (123 × 13
  // grades) which then bloats every downstream per-class table. Lite + medium
  // keep ~12 core subjects/grade (~156 classes) — leaner AND more realistic,
  // since no student takes 123 subjects. min()'d via slice, so full is a no-op.
  classSubjectCap: SEED_IS_LITE
    ? 12
    : SEED_IS_MEDIUM
      ? 12
      : Number.POSITIVE_INFINITY,
}

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
// DEPARTMENTS (school-level, for demo school Subject records)
// ============================================================================

export const DEPARTMENTS = [
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
    firstName: "فاطمة",
    lastName: "حسن",
    gender: "F",
    department: "اللغات",
    specialty: "Arabic",
  },
  {
    firstName: "محمد",
    lastName: "علي",
    gender: "M",
    department: "اللغات",
    specialty: "Arabic",
  },
  {
    firstName: "عائشة",
    lastName: "أحمد",
    gender: "F",
    department: "اللغات",
    specialty: "English",
  },
  {
    firstName: "أحمد",
    lastName: "محمد",
    gender: "M",
    department: "اللغات",
    specialty: "English",
  },
  {
    firstName: "مريم",
    lastName: "إبراهيم",
    gender: "F",
    department: "اللغات",
    specialty: "French",
  },

  // Sciences Department (25 teachers)
  {
    firstName: "إبراهيم",
    lastName: "عثمان",
    gender: "M",
    department: "العلوم",
    specialty: "Mathematics",
  },
  {
    firstName: "خالد",
    lastName: "عبدالرحمن",
    gender: "M",
    department: "العلوم",
    specialty: "Mathematics",
  },
  {
    firstName: "أمينة",
    lastName: "يوسف",
    gender: "F",
    department: "العلوم",
    specialty: "Physics",
  },
  {
    firstName: "عمر",
    lastName: "الحسن",
    gender: "M",
    department: "العلوم",
    specialty: "Physics",
  },
  {
    firstName: "خديجة",
    lastName: "النور",
    gender: "F",
    department: "العلوم",
    specialty: "Chemistry",
  },
  {
    firstName: "حسن",
    lastName: "عبدالله",
    gender: "M",
    department: "العلوم",
    specialty: "Chemistry",
  },
  {
    firstName: "زينب",
    lastName: "آدم",
    gender: "F",
    department: "العلوم",
    specialty: "Biology",
  },
  {
    firstName: "يوسف",
    lastName: "موسى",
    gender: "M",
    department: "العلوم",
    specialty: "Biology",
  },
  {
    firstName: "علي",
    lastName: "عيسى",
    gender: "M",
    department: "العلوم",
    specialty: "Computer Science",
  },
  {
    firstName: "هدى",
    lastName: "خليل",
    gender: "F",
    department: "العلوم",
    specialty: "Science",
  },

  // Humanities Department (15 teachers)
  {
    firstName: "سارة",
    lastName: "صالح",
    gender: "F",
    department: "العلوم الإنسانية",
    specialty: "History",
  },
  {
    firstName: "عبدالله",
    lastName: "عبدالقادر",
    gender: "M",
    department: "العلوم الإنسانية",
    specialty: "History",
  },
  {
    firstName: "نور",
    lastName: "الطيب",
    gender: "F",
    department: "العلوم الإنسانية",
    specialty: "Geography",
  },
  {
    firstName: "طارق",
    lastName: "بشير",
    gender: "M",
    department: "العلوم الإنسانية",
    specialty: "Geography",
  },
  {
    firstName: "ليلى",
    lastName: "جعفر",
    gender: "F",
    department: "العلوم الإنسانية",
    specialty: "Social Studies",
  },

  // Religion Department (15 teachers)
  {
    firstName: "مصطفى",
    lastName: "المهدي",
    gender: "M",
    department: "الدين",
    specialty: "Islamic Studies",
  },
  {
    firstName: "رقية",
    lastName: "الزين",
    gender: "F",
    department: "الدين",
    specialty: "Islamic Studies",
  },
  {
    firstName: "ياسر",
    lastName: "عمر",
    gender: "M",
    department: "الدين",
    specialty: "Quran",
  },
  {
    firstName: "حليمة",
    lastName: "سليمان",
    gender: "F",
    department: "الدين",
    specialty: "Quran",
  },

  // ICT Department (10 teachers)
  {
    firstName: "عبدالرحمن",
    lastName: "البشير",
    gender: "M",
    department: "تقنية المعلومات",
    specialty: "ICT",
  },
  {
    firstName: "سمية",
    lastName: "الأمين",
    gender: "F",
    department: "تقنية المعلومات",
    specialty: "ICT",
  },

  // Arts & PE Department (15 teachers)
  {
    firstName: "صلاح",
    lastName: "حامد",
    gender: "M",
    department: "الفنون والرياضة",
    specialty: "Physical Education",
  },
  {
    firstName: "ريم",
    lastName: "كمال",
    gender: "F",
    department: "الفنون والرياضة",
    specialty: "Physical Education",
  },
  {
    firstName: "دعاء",
    lastName: "جلال",
    gender: "F",
    department: "الفنون والرياضة",
    specialty: "Art",
  },
  {
    firstName: "بكري",
    lastName: "نصر",
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
  { name: "أ101", capacity: 30, type: "classroom", building: "A", floor: 1 },
  { name: "أ102", capacity: 30, type: "classroom", building: "A", floor: 1 },
  { name: "أ103", capacity: 30, type: "classroom", building: "A", floor: 1 },
  { name: "أ201", capacity: 30, type: "classroom", building: "A", floor: 2 },
  { name: "أ202", capacity: 30, type: "classroom", building: "A", floor: 2 },
  { name: "أ203", capacity: 30, type: "classroom", building: "A", floor: 2 },
  { name: "ب101", capacity: 35, type: "classroom", building: "B", floor: 1 },
  { name: "ب102", capacity: 35, type: "classroom", building: "B", floor: 1 },
  { name: "ب103", capacity: 35, type: "classroom", building: "B", floor: 1 },
  { name: "ب201", capacity: 35, type: "classroom", building: "B", floor: 2 },
  { name: "ب202", capacity: 35, type: "classroom", building: "B", floor: 2 },
  { name: "ب203", capacity: 35, type: "classroom", building: "B", floor: 2 },

  // Labs (10)
  {
    name: "مختبر الفيزياء",
    capacity: 25,
    type: "lab",
    building: "C",
    floor: 1,
  },
  {
    name: "مختبر الكيمياء",
    capacity: 25,
    type: "lab",
    building: "C",
    floor: 1,
  },
  { name: "مختبر الأحياء", capacity: 25, type: "lab", building: "C", floor: 1 },
  {
    name: "معمل الحاسوب 1",
    capacity: 30,
    type: "lab",
    building: "C",
    floor: 2,
  },
  {
    name: "معمل الحاسوب 2",
    capacity: 30,
    type: "lab",
    building: "C",
    floor: 2,
  },
  { name: "مختبر اللغات", capacity: 25, type: "lab", building: "C", floor: 2 },

  // Special Rooms (15)
  { name: "المكتبة", capacity: 100, type: "library", building: "D", floor: 1 },
  { name: "غرفة الفنون", capacity: 25, type: "art", building: "D", floor: 1 },
  {
    name: "غرفة الموسيقى",
    capacity: 30,
    type: "music",
    building: "D",
    floor: 1,
  },
  {
    name: "قاعة الاجتماعات الكبرى",
    capacity: 500,
    type: "hall",
    building: "D",
    floor: 1,
  },
  {
    name: "الصالة الرياضية",
    capacity: 200,
    type: "sports",
    building: "E",
    floor: 1,
  },
  {
    name: "ملعب كرة القدم",
    capacity: 100,
    type: "sports",
    building: "E",
    floor: 0,
  },
  {
    name: "ملعب كرة السلة",
    capacity: 50,
    type: "sports",
    building: "E",
    floor: 0,
  },

  // Admin Rooms
  {
    name: "مكتب المدير",
    capacity: 10,
    type: "admin",
    building: "A",
    floor: 1,
  },
  {
    name: "غرفة المعلمين",
    capacity: 40,
    type: "admin",
    building: "A",
    floor: 1,
  },
  {
    name: "غرفة الاجتماعات",
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
 * Get random lastName
 */
export function getRandomSurname(index: number): { ar: string; en: string } {
  const lastNameIndex = index % SURNAMES_AR.length
  return {
    ar: SURNAMES_AR[lastNameIndex],
    en: SURNAMES_EN[lastNameIndex],
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
 * Get English given name from Arabic given name
 */
export function getEnglishGivenName(
  arabicName: string,
  gender: "M" | "F"
): string {
  const namesAr = gender === "M" ? MALE_NAMES_AR : FEMALE_NAMES_AR
  const namesEn = gender === "M" ? MALE_NAMES_EN : FEMALE_NAMES_EN
  const idx = namesAr.indexOf(arabicName)
  return idx >= 0 ? namesEn[idx] : arabicName
}

/**
 * Get English lastName from Arabic lastName
 */
export function getEnglishSurname(arabicSurname: string): string {
  const idx = SURNAMES_AR.indexOf(arabicSurname)
  return idx >= 0 ? SURNAMES_EN[idx] : arabicSurname
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
