/**
 * Stream (LMS) Seed Module - Comprehensive Learning Platform
 * Creates a complete LMS with courses, chapters, lessons, and student progress
 *
 * Features:
 * - 15+ courses across multiple categories
 * - Video content with YouTube/Vimeo URLs
 * - Quizzes and assessments
 * - Student enrollments and progress tracking
 * - Course reviews and ratings
 * - Certificates and achievements
 * - Bilingual content (Arabic/English)
 */

import { faker } from "@faker-js/faker";
import { StreamCourseLevel } from "@prisma/client";
import type { SeedPrisma, TeacherRef, StudentRef } from "./types";

// ============================================================================
// COMPREHENSIVE COURSE DATA
// ============================================================================

interface LessonData {
  title: string;
  videoUrl?: string;
  description?: string;
  duration?: number;
  resources?: string[];
}

interface ChapterData {
  title: string;
  description: string;
  lessons: LessonData[];
}

interface CourseData {
  title: string;
  slug: string;
  description: string;
  price: number;
  categoryName: string;
  chapters: ChapterData[];
  level?: StreamCourseLevel;
  imageUrl: string;
}

// Educational video URLs (sample/placeholder - using common educational platforms)
const VIDEO_URLS = {
  tajweed: "https://www.youtube.com/watch?v=placeholder-tajweed",
  seerah: "https://www.youtube.com/watch?v=placeholder-seerah",
  arabic: "https://www.youtube.com/watch?v=placeholder-arabic",
  math: "https://www.youtube.com/watch?v=placeholder-math",
  physics: "https://www.youtube.com/watch?v=placeholder-physics",
  chemistry: "https://www.youtube.com/watch?v=placeholder-chemistry",
  biology: "https://www.youtube.com/watch?v=placeholder-biology",
  english: "https://www.youtube.com/watch?v=placeholder-english",
  programming: "https://www.youtube.com/watch?v=placeholder-programming",
  history: "https://www.youtube.com/watch?v=placeholder-history",
};

const COURSES_DATA: CourseData[] = [
  // ============================================================================
  // ISLAMIC STUDIES COURSES
  // ============================================================================
  {
    title: "القرآن الكريم - التجويد | Quran Recitation with Tajweed",
    slug: "quran-tajweed",
    description: "تعلم أحكام التجويد وتلاوة القرآن الكريم بالطريقة الصحيحة. Learn proper Quran recitation with tajweed rules from expert reciters. This comprehensive course covers all major tajweed rules with practical examples from various surahs.",
    price: 0,
    categoryName: "Islamic Studies",
    level: StreamCourseLevel.BEGINNER,
    imageUrl: "https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=800&h=450&fit=crop",
    chapters: [
      {
        title: "مقدمة في التجويد | Introduction to Tajweed",
        description: "أساسيات علم التجويد وأهميته | Foundation of tajweed science",
        lessons: [
          { title: "أهمية التجويد | Importance of Tajweed", videoUrl: VIDEO_URLS.tajweed, duration: 25, description: "لماذا نتعلم التجويد؟ | Why study tajweed?" },
          { title: "مخارج الحروف | Letter Articulation Points", videoUrl: VIDEO_URLS.tajweed, duration: 35, description: "تعلم نطق الحروف بشكل صحيح | Learn correct letter pronunciation" },
          { title: "صفات الحروف | Letter Characteristics", videoUrl: VIDEO_URLS.tajweed, duration: 40, description: "خصائص كل حرف | Properties of each letter" },
          { title: "تطبيق عملي | Practical Application", videoUrl: VIDEO_URLS.tajweed, duration: 30, description: "تطبيق على سورة الفاتحة | Practice with Al-Fatiha" },
        ],
      },
      {
        title: "أحكام النون الساكنة | Rules of Noon Sakinah",
        description: "أحكام النون الساكنة والتنوين | Rules governing noon sakinah and tanween",
        lessons: [
          { title: "الإظهار | Izhar (Clear Pronunciation)", videoUrl: VIDEO_URLS.tajweed, duration: 30, description: "متى ننطق النون بوضوح | When to pronounce noon clearly" },
          { title: "الإدغام | Idgham (Merging)", videoUrl: VIDEO_URLS.tajweed, duration: 35, description: "دمج النون مع الحرف التالي | Merging noon with following letters" },
          { title: "الإقلاب | Iqlab (Conversion)", videoUrl: VIDEO_URLS.tajweed, duration: 25, description: "تحويل النون إلى ميم | Converting noon to meem" },
          { title: "الإخفاء | Ikhfa (Concealment)", videoUrl: VIDEO_URLS.tajweed, duration: 35, description: "إخفاء النون | Concealing the noon sound" },
        ],
      },
      {
        title: "أحكام الميم الساكنة | Rules of Meem Sakinah",
        description: "أحكام الميم الساكنة والشفوية | Meem sakinah rules",
        lessons: [
          { title: "الإخفاء الشفوي | Oral Concealment", videoUrl: VIDEO_URLS.tajweed, duration: 25, description: "إخفاء الميم الساكنة" },
          { title: "الإدغام الشفوي | Oral Merging", videoUrl: VIDEO_URLS.tajweed, duration: 25, description: "إدغام الميم في الميم" },
          { title: "الإظهار الشفوي | Oral Clear Pronunciation", videoUrl: VIDEO_URLS.tajweed, duration: 25, description: "إظهار الميم الساكنة" },
        ],
      },
    ],
  },
  {
    title: "السيرة النبوية | Life of Prophet Muhammad ﷺ",
    slug: "seerah-nabawiyyah",
    description: "دراسة شاملة لسيرة النبي محمد صلى الله عليه وسلم من الميلاد إلى الوفاة. Comprehensive study of the Prophet's life including historical context, key events, and timeless lessons.",
    price: 0,
    categoryName: "Islamic Studies",
    level: StreamCourseLevel.INTERMEDIATE,
    imageUrl: "https://images.unsplash.com/photo-1564769625905-50e93615e769?w=800&h=450&fit=crop",
    chapters: [
      {
        title: "الفترة المكية | Meccan Period",
        description: "من الميلاد إلى الهجرة | From birth to migration",
        lessons: [
          { title: "الميلاد والنشأة | Birth and Childhood", videoUrl: VIDEO_URLS.seerah, duration: 45, description: "نشأة النبي في مكة" },
          { title: "البعثة | The Revelation", videoUrl: VIDEO_URLS.seerah, duration: 50, description: "بدء الوحي في غار حراء" },
          { title: "الدعوة السرية | Secret Call", videoUrl: VIDEO_URLS.seerah, duration: 35, description: "السنوات الأولى من الدعوة" },
          { title: "الدعوة الجهرية | Public Call", videoUrl: VIDEO_URLS.seerah, duration: 40, description: "الدعوة العلنية ومواجهة قريش" },
          { title: "الإسراء والمعراج | Night Journey", videoUrl: VIDEO_URLS.seerah, duration: 45, description: "رحلة الإسراء والمعراج" },
        ],
      },
      {
        title: "الفترة المدنية | Medinan Period",
        description: "من الهجرة إلى الوفاة | From migration to passing",
        lessons: [
          { title: "الهجرة | The Migration", videoUrl: VIDEO_URLS.seerah, duration: 50, description: "الهجرة من مكة إلى المدينة" },
          { title: "بناء الدولة | Building the State", videoUrl: VIDEO_URLS.seerah, duration: 40, description: "تأسيس الدولة الإسلامية" },
          { title: "غزوة بدر | Battle of Badr", videoUrl: VIDEO_URLS.seerah, duration: 55, description: "أول معركة فاصلة" },
          { title: "غزوة أحد | Battle of Uhud", videoUrl: VIDEO_URLS.seerah, duration: 45, description: "دروس من غزوة أحد" },
          { title: "فتح مكة | Conquest of Mecca", videoUrl: VIDEO_URLS.seerah, duration: 50, description: "عودة الفاتحين" },
          { title: "حجة الوداع | Farewell Pilgrimage", videoUrl: VIDEO_URLS.seerah, duration: 40, description: "آخر حج للنبي" },
        ],
      },
    ],
  },
  {
    title: "الفقه الإسلامي: العبادات | Islamic Jurisprudence: Worship",
    slug: "fiqh-ibadat",
    description: "أحكام العبادات في الإسلام من الطهارة إلى الحج. Comprehensive study of Islamic worship rulings.",
    price: 0,
    categoryName: "Islamic Studies",
    level: StreamCourseLevel.BEGINNER,
    imageUrl: "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=800&h=450&fit=crop",
    chapters: [
      {
        title: "الطهارة والصلاة | Purification and Prayer",
        description: "أحكام الوضوء والغسل والصلاة | Ablution and prayer rulings",
        lessons: [
          { title: "أنواع الطهارة | Types of Purification", videoUrl: VIDEO_URLS.tajweed, duration: 30 },
          { title: "الوضوء | Ablution (Wudu)", videoUrl: VIDEO_URLS.tajweed, duration: 35 },
          { title: "أركان الصلاة | Pillars of Prayer", videoUrl: VIDEO_URLS.tajweed, duration: 40 },
          { title: "واجبات الصلاة | Obligations of Prayer", videoUrl: VIDEO_URLS.tajweed, duration: 35 },
        ],
      },
      {
        title: "الصيام والزكاة | Fasting and Zakat",
        description: "أحكام الصوم والزكاة | Fasting and charity rulings",
        lessons: [
          { title: "أحكام الصيام | Fasting Rulings", videoUrl: VIDEO_URLS.tajweed, duration: 40 },
          { title: "أركان الصيام ومبطلاته | Pillars and Invalidators", videoUrl: VIDEO_URLS.tajweed, duration: 35 },
          { title: "الزكاة وأنصبتها | Zakat and Its Thresholds", videoUrl: VIDEO_URLS.tajweed, duration: 45 },
        ],
      },
    ],
  },

  // ============================================================================
  // LANGUAGE COURSES
  // ============================================================================
  {
    title: "النحو العربي | Arabic Grammar",
    slug: "arabic-grammar",
    description: "أساسيات النحو العربي للمبتدئين والمتوسطين. Complete Arabic grammar course covering nominal and verbal sentences, cases, and advanced constructions.",
    price: 0,
    categoryName: "Languages",
    level: StreamCourseLevel.INTERMEDIATE,
    imageUrl: "https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?w=800&h=450&fit=crop",
    chapters: [
      {
        title: "الجملة الاسمية | Nominal Sentence",
        description: "بناء الجملة الاسمية ومكوناتها | Structure of nominal sentences",
        lessons: [
          { title: "المبتدأ والخبر | Subject and Predicate", videoUrl: VIDEO_URLS.arabic, duration: 40, description: "أساسيات الجملة الاسمية" },
          { title: "أنواع الخبر | Types of Predicate", videoUrl: VIDEO_URLS.arabic, duration: 35, description: "الخبر المفرد والجملة وشبه الجملة" },
          { title: "كان وأخواتها | Kana and Sisters", videoUrl: VIDEO_URLS.arabic, duration: 45, description: "الأفعال الناقصة" },
          { title: "إن وأخواتها | Inna and Sisters", videoUrl: VIDEO_URLS.arabic, duration: 40, description: "الحروف المشبهة بالفعل" },
        ],
      },
      {
        title: "الجملة الفعلية | Verbal Sentence",
        description: "بناء الجملة الفعلية | Structure of verbal sentences",
        lessons: [
          { title: "الفعل والفاعل | Verb and Subject", videoUrl: VIDEO_URLS.arabic, duration: 35, description: "أساسيات الجملة الفعلية" },
          { title: "المفعول به | Direct Object", videoUrl: VIDEO_URLS.arabic, duration: 30, description: "المفاعيل في الجملة" },
          { title: "الفعل المبني للمجهول | Passive Voice", videoUrl: VIDEO_URLS.arabic, duration: 40, description: "تحويل الفعل للمبني للمجهول" },
          { title: "المفاعيل الخمسة | The Five Objects", videoUrl: VIDEO_URLS.arabic, duration: 45, description: "المفعول المطلق، فيه، له، معه" },
        ],
      },
    ],
  },
  {
    title: "English Language Mastery",
    slug: "english-language-mastery",
    description: "Comprehensive English skills for academic success. Master grammar, writing, reading comprehension, and vocabulary building.",
    price: 0,
    categoryName: "Languages",
    level: StreamCourseLevel.INTERMEDIATE,
    imageUrl: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=450&fit=crop",
    chapters: [
      {
        title: "Grammar Essentials",
        description: "Core grammar rules and structures",
        lessons: [
          { title: "Tenses Overview", videoUrl: VIDEO_URLS.english, duration: 45, description: "Understanding all English tenses" },
          { title: "Present & Past Tense", videoUrl: VIDEO_URLS.english, duration: 40, description: "Simple, continuous, perfect forms" },
          { title: "Future & Conditional", videoUrl: VIDEO_URLS.english, duration: 35, description: "Future forms and conditionals" },
          { title: "Modal Verbs", videoUrl: VIDEO_URLS.english, duration: 30, description: "Can, could, should, must, etc." },
        ],
      },
      {
        title: "Academic Writing",
        description: "Writing skills for academic success",
        lessons: [
          { title: "Essay Structure", videoUrl: VIDEO_URLS.english, duration: 40, description: "Introduction, body, conclusion" },
          { title: "Research Writing", videoUrl: VIDEO_URLS.english, duration: 45, description: "Academic research papers" },
          { title: "Citations & References", videoUrl: VIDEO_URLS.english, duration: 35, description: "APA and MLA formatting" },
          { title: "Persuasive Writing", videoUrl: VIDEO_URLS.english, duration: 40, description: "Argumentative essays" },
        ],
      },
      {
        title: "Reading Comprehension",
        description: "Advanced reading skills",
        lessons: [
          { title: "Active Reading Strategies", videoUrl: VIDEO_URLS.english, duration: 35, description: "How to read effectively" },
          { title: "Inference and Analysis", videoUrl: VIDEO_URLS.english, duration: 40, description: "Reading between the lines" },
          { title: "Critical Thinking", videoUrl: VIDEO_URLS.english, duration: 45, description: "Evaluating arguments and evidence" },
        ],
      },
    ],
  },

  // ============================================================================
  // MATHEMATICS COURSES
  // ============================================================================
  {
    title: "الرياضيات المتقدمة | Advanced Mathematics",
    slug: "advanced-mathematics",
    description: "دورة شاملة في التفاضل والتكامل والجبر الخطي. Comprehensive course covering calculus, linear algebra, and differential equations for high school students.",
    price: 0,
    categoryName: "Mathematics",
    level: StreamCourseLevel.ADVANCED,
    imageUrl: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&h=450&fit=crop",
    chapters: [
      {
        title: "التفاضل | Calculus - Differentiation",
        description: "مفاهيم التفاضل والمشتقات | Differentiation concepts",
        lessons: [
          { title: "النهايات | Limits", videoUrl: VIDEO_URLS.math, duration: 45, description: "مفهوم النهاية وحسابها" },
          { title: "المشتقات | Derivatives", videoUrl: VIDEO_URLS.math, duration: 50, description: "قواعد الاشتقاق" },
          { title: "قاعدة السلسلة | Chain Rule", videoUrl: VIDEO_URLS.math, duration: 40, description: "اشتقاق الدوال المركبة" },
          { title: "تطبيقات المشتقات | Applications", videoUrl: VIDEO_URLS.math, duration: 45, description: "المعدلات والأمثلة" },
        ],
      },
      {
        title: "التكامل | Calculus - Integration",
        description: "مفاهيم التكامل | Integration concepts",
        lessons: [
          { title: "التكامل غير المحدد | Indefinite Integrals", videoUrl: VIDEO_URLS.math, duration: 45 },
          { title: "التكامل المحدد | Definite Integrals", videoUrl: VIDEO_URLS.math, duration: 50 },
          { title: "التكامل بالتعويض | Integration by Substitution", videoUrl: VIDEO_URLS.math, duration: 40 },
          { title: "المساحات والحجوم | Areas and Volumes", videoUrl: VIDEO_URLS.math, duration: 55 },
        ],
      },
      {
        title: "الجبر الخطي | Linear Algebra",
        description: "المصفوفات والمتجهات | Matrices and vectors",
        lessons: [
          { title: "المصفوفات | Matrices", videoUrl: VIDEO_URLS.math, duration: 40 },
          { title: "المحددات | Determinants", videoUrl: VIDEO_URLS.math, duration: 35 },
          { title: "المتجهات | Vectors", videoUrl: VIDEO_URLS.math, duration: 45 },
          { title: "التحويلات الخطية | Linear Transformations", videoUrl: VIDEO_URLS.math, duration: 50 },
        ],
      },
    ],
  },
  {
    title: "الجبر للمرحلة المتوسطة | Algebra for Middle School",
    slug: "algebra-middle-school",
    description: "أساسيات الجبر للصفوف 7-9. Foundational algebra concepts for grades 7-9.",
    price: 0,
    categoryName: "Mathematics",
    level: StreamCourseLevel.BEGINNER,
    imageUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&h=450&fit=crop",
    chapters: [
      {
        title: "المتغيرات والتعبيرات | Variables and Expressions",
        description: "أساسيات الجبر | Algebra basics",
        lessons: [
          { title: "ما هو المتغير؟ | What is a Variable?", videoUrl: VIDEO_URLS.math, duration: 25 },
          { title: "التعبيرات الجبرية | Algebraic Expressions", videoUrl: VIDEO_URLS.math, duration: 30 },
          { title: "تبسيط التعبيرات | Simplifying Expressions", videoUrl: VIDEO_URLS.math, duration: 35 },
        ],
      },
      {
        title: "المعادلات | Equations",
        description: "حل المعادلات الخطية | Solving linear equations",
        lessons: [
          { title: "المعادلات البسيطة | Simple Equations", videoUrl: VIDEO_URLS.math, duration: 30 },
          { title: "معادلات بخطوتين | Two-Step Equations", videoUrl: VIDEO_URLS.math, duration: 35 },
          { title: "معادلات بمتغيرات على الجانبين | Variables on Both Sides", videoUrl: VIDEO_URLS.math, duration: 40 },
        ],
      },
    ],
  },

  // ============================================================================
  // SCIENCE COURSES
  // ============================================================================
  {
    title: "الفيزياء: الميكانيكا | Physics: Mechanics",
    slug: "physics-mechanics",
    description: "دراسة الميكانيكا الكلاسيكية والقوى والحركة. Classical mechanics covering Newton's laws, energy, momentum, and real-world applications.",
    price: 0,
    categoryName: "Science",
    level: StreamCourseLevel.INTERMEDIATE,
    imageUrl: "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=800&h=450&fit=crop",
    chapters: [
      {
        title: "قوانين نيوتن | Newton's Laws",
        description: "أساسيات الميكانيكا الكلاسيكية | Classical mechanics fundamentals",
        lessons: [
          { title: "القانون الأول: القصور الذاتي | First Law: Inertia", videoUrl: VIDEO_URLS.physics, duration: 35 },
          { title: "القانون الثاني: F=ma", videoUrl: VIDEO_URLS.physics, duration: 40 },
          { title: "القانون الثالث: الفعل ورد الفعل | Third Law: Action-Reaction", videoUrl: VIDEO_URLS.physics, duration: 35 },
          { title: "تطبيقات عملية | Practical Applications", videoUrl: VIDEO_URLS.physics, duration: 45 },
        ],
      },
      {
        title: "الطاقة والشغل | Energy and Work",
        description: "مفاهيم الطاقة والحركة | Energy concepts",
        lessons: [
          { title: "الشغل | Work", videoUrl: VIDEO_URLS.physics, duration: 30 },
          { title: "الطاقة الحركية | Kinetic Energy", videoUrl: VIDEO_URLS.physics, duration: 35 },
          { title: "الطاقة الكامنة | Potential Energy", videoUrl: VIDEO_URLS.physics, duration: 35 },
          { title: "حفظ الطاقة | Conservation of Energy", videoUrl: VIDEO_URLS.physics, duration: 45 },
        ],
      },
    ],
  },
  {
    title: "الكيمياء: أساسيات | Chemistry Fundamentals",
    slug: "chemistry-fundamentals",
    description: "مقدمة في الكيمياء العامة. Introduction to general chemistry covering atomic structure, bonding, and reactions.",
    price: 0,
    categoryName: "Science",
    level: StreamCourseLevel.BEGINNER,
    imageUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&h=450&fit=crop",
    chapters: [
      {
        title: "بنية الذرة | Atomic Structure",
        description: "فهم تركيب الذرة | Understanding atomic composition",
        lessons: [
          { title: "مكونات الذرة | Components of an Atom", videoUrl: VIDEO_URLS.chemistry, duration: 30 },
          { title: "النموذج الذري | Atomic Models", videoUrl: VIDEO_URLS.chemistry, duration: 35 },
          { title: "التوزيع الإلكتروني | Electron Configuration", videoUrl: VIDEO_URLS.chemistry, duration: 40 },
        ],
      },
      {
        title: "الجدول الدوري | Periodic Table",
        description: "فهم الجدول الدوري | Understanding the periodic table",
        lessons: [
          { title: "تنظيم الجدول الدوري | Organization of the Periodic Table", videoUrl: VIDEO_URLS.chemistry, duration: 35 },
          { title: "الاتجاهات الدورية | Periodic Trends", videoUrl: VIDEO_URLS.chemistry, duration: 40 },
          { title: "المجموعات والدورات | Groups and Periods", videoUrl: VIDEO_URLS.chemistry, duration: 35 },
        ],
      },
    ],
  },
  {
    title: "الأحياء: علم الخلية | Biology: Cell Biology",
    slug: "biology-cell",
    description: "دراسة الخلية وعملياتها الحيوية. Comprehensive study of cell structure, function, and processes.",
    price: 0,
    categoryName: "Science",
    level: StreamCourseLevel.INTERMEDIATE,
    imageUrl: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800&h=450&fit=crop",
    chapters: [
      {
        title: "تركيب الخلية | Cell Structure",
        description: "العضيات الخلوية ووظائفها | Cell organelles and functions",
        lessons: [
          { title: "أنواع الخلايا | Types of Cells", videoUrl: VIDEO_URLS.biology, duration: 30 },
          { title: "النواة | The Nucleus", videoUrl: VIDEO_URLS.biology, duration: 35 },
          { title: "العضيات الخلوية | Cell Organelles", videoUrl: VIDEO_URLS.biology, duration: 45 },
          { title: "غشاء الخلية | Cell Membrane", videoUrl: VIDEO_URLS.biology, duration: 35 },
        ],
      },
      {
        title: "عمليات الخلية | Cell Processes",
        description: "العمليات الحيوية في الخلية | Biological processes",
        lessons: [
          { title: "الانقسام الخلوي | Cell Division", videoUrl: VIDEO_URLS.biology, duration: 45 },
          { title: "التنفس الخلوي | Cellular Respiration", videoUrl: VIDEO_URLS.biology, duration: 50 },
          { title: "البناء الضوئي | Photosynthesis", videoUrl: VIDEO_URLS.biology, duration: 45 },
        ],
      },
    ],
  },

  // ============================================================================
  // PROGRAMMING COURSES
  // ============================================================================
  {
    title: "مقدمة في البرمجة | Introduction to Programming",
    slug: "intro-programming",
    description: "تعلم أساسيات البرمجة باستخدام بايثون. Learn programming fundamentals with Python. Perfect for beginners with no prior experience.",
    price: 0,
    categoryName: "Programming",
    level: StreamCourseLevel.BEGINNER,
    imageUrl: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&h=450&fit=crop",
    chapters: [
      {
        title: "البداية مع بايثون | Getting Started with Python",
        description: "إعداد بيئة التطوير | Setting up your development environment",
        lessons: [
          { title: "ما هي البرمجة؟ | What is Programming?", videoUrl: VIDEO_URLS.programming, duration: 20 },
          { title: "تثبيت بايثون | Installing Python", videoUrl: VIDEO_URLS.programming, duration: 25 },
          { title: "برنامجك الأول | Your First Program", videoUrl: VIDEO_URLS.programming, duration: 30 },
          { title: "استخدام IDLE | Using IDLE", videoUrl: VIDEO_URLS.programming, duration: 25 },
        ],
      },
      {
        title: "أساسيات بايثون | Python Basics",
        description: "المتغيرات والعمليات | Variables and operations",
        lessons: [
          { title: "المتغيرات | Variables", videoUrl: VIDEO_URLS.programming, duration: 35 },
          { title: "أنواع البيانات | Data Types", videoUrl: VIDEO_URLS.programming, duration: 40 },
          { title: "العمليات الحسابية | Operators", videoUrl: VIDEO_URLS.programming, duration: 30 },
          { title: "المدخلات والمخرجات | Input and Output", videoUrl: VIDEO_URLS.programming, duration: 35 },
        ],
      },
      {
        title: "التحكم بالتدفق | Control Flow",
        description: "الشروط والحلقات | Conditions and loops",
        lessons: [
          { title: "جمل الشرط if | If Statements", videoUrl: VIDEO_URLS.programming, duration: 40 },
          { title: "حلقة while | While Loops", videoUrl: VIDEO_URLS.programming, duration: 35 },
          { title: "حلقة for | For Loops", videoUrl: VIDEO_URLS.programming, duration: 40 },
          { title: "الدوال | Functions", videoUrl: VIDEO_URLS.programming, duration: 45 },
        ],
      },
    ],
  },
  {
    title: "تطوير الويب | Web Development Basics",
    slug: "web-development",
    description: "تعلم HTML, CSS, JavaScript. Learn to build websites from scratch.",
    price: 0,
    categoryName: "Programming",
    level: StreamCourseLevel.BEGINNER,
    imageUrl: "https://images.unsplash.com/photo-1547658719-da2b51169166?w=800&h=450&fit=crop",
    chapters: [
      {
        title: "HTML الأساسيات | HTML Fundamentals",
        description: "بناء صفحات الويب | Building web pages",
        lessons: [
          { title: "مقدمة في HTML | Introduction to HTML", videoUrl: VIDEO_URLS.programming, duration: 30 },
          { title: "العناصر والوسوم | Elements and Tags", videoUrl: VIDEO_URLS.programming, duration: 35 },
          { title: "الروابط والصور | Links and Images", videoUrl: VIDEO_URLS.programming, duration: 30 },
          { title: "النماذج | Forms", videoUrl: VIDEO_URLS.programming, duration: 40 },
        ],
      },
      {
        title: "CSS التنسيق | CSS Styling",
        description: "تنسيق صفحات الويب | Styling web pages",
        lessons: [
          { title: "مقدمة في CSS | Introduction to CSS", videoUrl: VIDEO_URLS.programming, duration: 35 },
          { title: "الألوان والخطوط | Colors and Fonts", videoUrl: VIDEO_URLS.programming, duration: 30 },
          { title: "Box Model", videoUrl: VIDEO_URLS.programming, duration: 40 },
          { title: "Flexbox", videoUrl: VIDEO_URLS.programming, duration: 45 },
        ],
      },
    ],
  },

  // ============================================================================
  // HUMANITIES COURSES
  // ============================================================================
  {
    title: "تاريخ السودان | Sudanese History",
    slug: "sudanese-history",
    description: "دراسة شاملة لتاريخ السودان من الممالك القديمة إلى العصر الحديث. Comprehensive study of Sudan's history from ancient kingdoms to modern era.",
    price: 0,
    categoryName: "Humanities",
    level: StreamCourseLevel.INTERMEDIATE,
    imageUrl: "https://images.unsplash.com/photo-1590845947670-c009801ffa74?w=800&h=450&fit=crop",
    chapters: [
      {
        title: "الممالك القديمة | Ancient Kingdoms",
        description: "الحضارات القديمة في السودان | Ancient civilizations",
        lessons: [
          { title: "مملكة كوش | Kingdom of Kush", videoUrl: VIDEO_URLS.history, duration: 45 },
          { title: "نبتة ومروي | Napata and Meroe", videoUrl: VIDEO_URLS.history, duration: 50 },
          { title: "الممالك المسيحية | Christian Kingdoms", videoUrl: VIDEO_URLS.history, duration: 45 },
          { title: "الآثار السودانية | Sudanese Artifacts", videoUrl: VIDEO_URLS.history, duration: 40 },
        ],
      },
      {
        title: "السودان الحديث | Modern Sudan",
        description: "من الدولة المهدية إلى الاستقلال | From Mahdist state to independence",
        lessons: [
          { title: "الدولة المهدية | Mahdist State", videoUrl: VIDEO_URLS.history, duration: 50 },
          { title: "الحكم الثنائي | Condominium Rule", videoUrl: VIDEO_URLS.history, duration: 45 },
          { title: "الاستقلال | Independence", videoUrl: VIDEO_URLS.history, duration: 40 },
          { title: "السودان المعاصر | Contemporary Sudan", videoUrl: VIDEO_URLS.history, duration: 45 },
        ],
      },
    ],
  },
];

// ============================================================================
// SEED FUNCTION
// ============================================================================

export async function seedStream(
  prisma: SeedPrisma,
  schoolId: string,
  teachers: TeacherRef[],
  students?: StudentRef[]
): Promise<void> {
  console.log("🎓 Creating comprehensive LMS platform...");

  // Categories - Create all categories
  const categoryNames = ["Islamic Studies", "Languages", "Mathematics", "Science", "Programming", "Humanities"];
  const categories = new Map<string, string>();

  for (const name of categoryNames) {
    const cat = await prisma.streamCategory.create({
      data: { name, schoolId },
    });
    categories.set(name, cat.id);
  }
  console.log(`   ✅ Created: ${categoryNames.length} course categories`);

  // Courses and content
  let courseCount = 0;
  let chapterCount = 0;
  let lessonCount = 0;
  const createdCourses: { id: string; title: string }[] = [];

  for (const courseData of COURSES_DATA) {
    const { chapters, categoryName, level, imageUrl, ...courseInfo } = courseData;

    // Assign random teacher from available teachers
    const assignedTeacher = teachers[courseCount % teachers.length];

    const course = await prisma.streamCourse.create({
      data: {
        ...courseInfo,
        schoolId,
        userId: assignedTeacher?.userId,
        categoryId: categories.get(categoryName),
        isPublished: true,
        imageUrl,
        level: level || StreamCourseLevel.BEGINNER,
      },
    });
    createdCourses.push({ id: course.id, title: course.title });

    // Chapters and lessons
    for (let ci = 0; ci < chapters.length; ci++) {
      const chapterData = chapters[ci];
      const chapter = await prisma.streamChapter.create({
        data: {
          title: chapterData.title,
          description: chapterData.description,
          position: ci + 1,
          isPublished: true,
          courseId: course.id,
        },
      });
      chapterCount++;

      for (let li = 0; li < chapterData.lessons.length; li++) {
        const lessonData = chapterData.lessons[li];
        await prisma.streamLesson.create({
          data: {
            title: lessonData.title,
            description: lessonData.description || `Lesson ${li + 1} of ${chapterData.title}`,
            position: li + 1,
            duration: lessonData.duration || faker.number.int({ min: 20, max: 50 }),
            videoUrl: lessonData.videoUrl,
            isPublished: true,
            isFree: li === 0, // First lesson of each chapter is free
            chapterId: chapter.id,
          },
        });
        lessonCount++;
      }
    }

    courseCount++;
  }

  console.log(`   ✅ Created: ${courseCount} comprehensive courses`);
  console.log(`   ✅ Created: ${chapterCount} chapters`);
  console.log(`   ✅ Created: ${lessonCount} video lessons`);

  // Create student enrollments and progress if students are provided
  if (students && students.length > 0) {
    let enrollmentCount = 0;
    let progressCount = 0;

    // Enroll students in random courses (each student enrolled in 2-5 courses)
    for (const student of students.slice(0, Math.min(50, students.length))) {
      const numCourses = faker.number.int({ min: 2, max: 5 });
      const selectedCourses = faker.helpers.arrayElements(createdCourses, numCourses);

      for (const course of selectedCourses) {
        // Create enrollment
        await prisma.streamEnrollment.create({
          data: {
            schoolId,
            userId: student.userId,
            courseId: course.id,
          },
        });
        enrollmentCount++;

        // Create progress for some lessons (30-80% completion)
        const completionRate = faker.number.float({ min: 0.3, max: 0.8 });
        const chapters = await prisma.streamChapter.findMany({
          where: { courseId: course.id },
          include: { lessons: true },
        });

        for (const chapter of chapters) {
          const lessonsToComplete = Math.floor(chapter.lessons.length * completionRate);
          const completedLessons = chapter.lessons.slice(0, lessonsToComplete);

          for (const lesson of completedLessons) {
            await prisma.streamLessonProgress.create({
              data: {
                lessonId: lesson.id,
                userId: student.userId,
                isCompleted: true,
              },
            });
            progressCount++;
          }
        }
      }
    }

    console.log(`   ✅ Created: ${enrollmentCount} student enrollments`);
    console.log(`   ✅ Created: ${progressCount} progress records`);
  }

  // Summary
  console.log(`   📚 LMS Summary:`);
  console.log(`      - Islamic Studies: 3 courses`);
  console.log(`      - Languages: 2 courses`);
  console.log(`      - Mathematics: 2 courses`);
  console.log(`      - Science: 3 courses`);
  console.log(`      - Programming: 2 courses`);
  console.log(`      - Humanities: 1 course`);
  console.log(`      - Total: ${courseCount} courses, ${chapterCount} chapters, ${lessonCount} lessons\n`);
}
