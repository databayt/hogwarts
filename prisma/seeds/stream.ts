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
 * - Bilingual content (Arabic/English) - SEPARATE records per language
 *
 * BILINGUAL STRATEGY (Phase 2):
 * - Each course exists as TWO separate database records
 * - Same slug, different lang field ("ar" or "en")
 * - Leverages @@unique([slug, schoolId, lang]) constraint
 * - Frontend filters by lang param to show correct version
 */

import { faker } from "@faker-js/faker"
import { StreamCourseLevel } from "@prisma/client"

import { CURRICULUM, SUBJECTS, YEAR_LEVELS } from "./constants"
import type { SeedPrisma, StudentRef, TeacherRef } from "./types"

// ============================================================================
// BILINGUAL DATA TYPES
// ============================================================================

interface BilingualLessonData {
  titleAr: string
  titleEn: string
  descriptionAr?: string
  descriptionEn?: string
  videoUrl?: string
  duration?: number
}

interface BilingualChapterData {
  titleAr: string
  titleEn: string
  descriptionAr: string
  descriptionEn: string
  lessons: BilingualLessonData[]
}

interface BilingualCourseData {
  slug: string
  titleAr: string
  titleEn: string
  descriptionAr: string
  descriptionEn: string
  price: number
  categoryKey: string // Maps to BILINGUAL_CATEGORIES
  level: StreamCourseLevel
  imageUrl: string
  chapters: BilingualChapterData[]
}

// Legacy types for backward compatibility during migration
interface LessonData {
  title: string
  videoUrl?: string
  description?: string
  duration?: number
  resources?: string[]
}

interface ChapterData {
  title: string
  description: string
  lessons: LessonData[]
}

interface CourseData {
  title: string
  slug: string
  description: string
  price: number
  categoryName: string
  chapters: ChapterData[]
  level?: StreamCourseLevel
  imageUrl: string
}

// ============================================================================
// BILINGUAL CATEGORY MAPPING
// ============================================================================

const BILINGUAL_CATEGORIES: Record<string, { ar: string; en: string }> = {
  "Islamic Studies": { ar: "الدراسات الإسلامية", en: "Islamic Studies" },
  Languages: { ar: "اللغات", en: "Languages" },
  Mathematics: { ar: "الرياضيات", en: "Mathematics" },
  Science: { ar: "العلوم", en: "Sciences" },
  Sciences: { ar: "العلوم", en: "Sciences" },
  Humanities: { ar: "العلوم الإنسانية", en: "Humanities" },
  Religion: { ar: "الدين", en: "Religion" },
  ICT: { ar: "تقنية المعلومات", en: "ICT" },
  Programming: { ar: "البرمجة", en: "Programming" },
  "Arts & PE": { ar: "الفنون والرياضة", en: "Arts & PE" },
}

// ============================================================================
// BILINGUAL CATEGORY SEEDING
// ============================================================================

/**
 * Seeds bilingual categories - one for AR and one for EN per category
 * Returns a map of categoryKey -> { arId, enId }
 */
async function seedBilingualCategories(
  prisma: SeedPrisma,
  schoolId: string
): Promise<Map<string, { arId: string; enId: string }>> {
  const categoryMap = new Map<string, { arId: string; enId: string }>()

  for (const [key, names] of Object.entries(BILINGUAL_CATEGORIES)) {
    // Create or find Arabic category
    let arCat = await prisma.streamCategory.findFirst({
      where: { schoolId, name: names.ar },
    })
    if (!arCat) {
      arCat = await prisma.streamCategory.create({
        data: { name: names.ar, schoolId },
      })
    }

    // Create or find English category
    let enCat = await prisma.streamCategory.findFirst({
      where: { schoolId, name: names.en },
    })
    if (!enCat) {
      enCat = await prisma.streamCategory.create({
        data: { name: names.en, schoolId },
      })
    }

    categoryMap.set(key, { arId: arCat.id, enId: enCat.id })
  }

  return categoryMap
}

// ============================================================================
// BILINGUAL COURSE CREATION HELPER
// ============================================================================

interface CreateBilingualCourseParams {
  prisma: SeedPrisma
  schoolId: string
  course: BilingualCourseData
  categoryMap: Map<string, { arId: string; enId: string }>
  teacherId: string // Required: userId is required in StreamCourse model
}

/**
 * Creates TWO course records - one Arabic, one English
 * Same slug, different lang field
 */
async function createBilingualCourse({
  prisma,
  schoolId,
  course,
  categoryMap,
  teacherId,
}: CreateBilingualCourseParams): Promise<{
  arCourse: { id: string }
  enCourse: { id: string }
}> {
  const cats = categoryMap.get(course.categoryKey)
  if (!cats) {
    throw new Error(`Category not found: ${course.categoryKey}`)
  }

  // Create Arabic course
  let arCourse = await prisma.streamCourse.findFirst({
    where: { schoolId, slug: course.slug, lang: "ar" },
  })

  if (!arCourse) {
    arCourse = await prisma.streamCourse.create({
      data: {
        slug: course.slug,
        title: course.titleAr,
        description: course.descriptionAr,
        price: course.price,
        level: course.level,
        imageUrl: course.imageUrl,
        isPublished: true,
        lang: "ar",
        schoolId,
        userId: teacherId,
        categoryId: cats.arId,
      },
    })

    // Create Arabic chapters and lessons
    for (let ci = 0; ci < course.chapters.length; ci++) {
      const ch = course.chapters[ci]
      const chapter = await prisma.streamChapter.create({
        data: {
          title: ch.titleAr,
          description: ch.descriptionAr,
          position: ci + 1,
          isPublished: true,
          courseId: arCourse.id,
        },
      })

      for (let li = 0; li < ch.lessons.length; li++) {
        const les = ch.lessons[li]
        await prisma.streamLesson.create({
          data: {
            title: les.titleAr,
            description: les.descriptionAr || `درس ${li + 1}`,
            position: li + 1,
            duration: les.duration || 30,
            videoUrl: les.videoUrl,
            isPublished: true,
            isFree: li === 0,
            chapterId: chapter.id,
          },
        })
      }
    }
  }

  // Create English course
  let enCourse = await prisma.streamCourse.findFirst({
    where: { schoolId, slug: course.slug, lang: "en" },
  })

  if (!enCourse) {
    enCourse = await prisma.streamCourse.create({
      data: {
        slug: course.slug,
        title: course.titleEn,
        description: course.descriptionEn,
        price: course.price,
        level: course.level,
        imageUrl: course.imageUrl,
        isPublished: true,
        lang: "en",
        schoolId,
        userId: teacherId,
        categoryId: cats.enId,
      },
    })

    // Create English chapters and lessons
    for (let ci = 0; ci < course.chapters.length; ci++) {
      const ch = course.chapters[ci]
      const chapter = await prisma.streamChapter.create({
        data: {
          title: ch.titleEn,
          description: ch.descriptionEn,
          position: ci + 1,
          isPublished: true,
          courseId: enCourse.id,
        },
      })

      for (let li = 0; li < ch.lessons.length; li++) {
        const les = ch.lessons[li]
        await prisma.streamLesson.create({
          data: {
            title: les.titleEn,
            description: les.descriptionEn || `Lesson ${li + 1}`,
            position: li + 1,
            duration: les.duration || 30,
            videoUrl: les.videoUrl,
            isPublished: true,
            isFree: li === 0,
            chapterId: chapter.id,
          },
        })
      }
    }
  }

  return { arCourse: { id: arCourse.id }, enCourse: { id: enCourse.id } }
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
}

const COURSES_DATA: CourseData[] = [
  // ============================================================================
  // ISLAMIC STUDIES COURSES
  // ============================================================================
  {
    title: "القرآن الكريم - التجويد | Quran Recitation with Tajweed",
    slug: "quran-tajweed",
    description:
      "تعلم أحكام التجويد وتلاوة القرآن الكريم بالطريقة الصحيحة. Learn proper Quran recitation with tajweed rules from expert reciters. This comprehensive course covers all major tajweed rules with practical examples from various surahs.",
    price: 0,
    categoryName: "Islamic Studies",
    level: StreamCourseLevel.BEGINNER,
    imageUrl:
      "https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=800&h=450&fit=crop",
    chapters: [
      {
        title: "مقدمة في التجويد | Introduction to Tajweed",
        description:
          "أساسيات علم التجويد وأهميته | Foundation of tajweed science",
        lessons: [
          {
            title: "أهمية التجويد | Importance of Tajweed",
            videoUrl: VIDEO_URLS.tajweed,
            duration: 25,
            description: "لماذا نتعلم التجويد؟ | Why study tajweed?",
          },
          {
            title: "مخارج الحروف | Letter Articulation Points",
            videoUrl: VIDEO_URLS.tajweed,
            duration: 35,
            description:
              "تعلم نطق الحروف بشكل صحيح | Learn correct letter pronunciation",
          },
          {
            title: "صفات الحروف | Letter Characteristics",
            videoUrl: VIDEO_URLS.tajweed,
            duration: 40,
            description: "خصائص كل حرف | Properties of each letter",
          },
          {
            title: "تطبيق عملي | Practical Application",
            videoUrl: VIDEO_URLS.tajweed,
            duration: 30,
            description: "تطبيق على سورة الفاتحة | Practice with Al-Fatiha",
          },
        ],
      },
      {
        title: "أحكام النون الساكنة | Rules of Noon Sakinah",
        description:
          "أحكام النون الساكنة والتنوين | Rules governing noon sakinah and tanween",
        lessons: [
          {
            title: "الإظهار | Izhar (Clear Pronunciation)",
            videoUrl: VIDEO_URLS.tajweed,
            duration: 30,
            description:
              "متى ننطق النون بوضوح | When to pronounce noon clearly",
          },
          {
            title: "الإدغام | Idgham (Merging)",
            videoUrl: VIDEO_URLS.tajweed,
            duration: 35,
            description:
              "دمج النون مع الحرف التالي | Merging noon with following letters",
          },
          {
            title: "الإقلاب | Iqlab (Conversion)",
            videoUrl: VIDEO_URLS.tajweed,
            duration: 25,
            description: "تحويل النون إلى ميم | Converting noon to meem",
          },
          {
            title: "الإخفاء | Ikhfa (Concealment)",
            videoUrl: VIDEO_URLS.tajweed,
            duration: 35,
            description: "إخفاء النون | Concealing the noon sound",
          },
        ],
      },
      {
        title: "أحكام الميم الساكنة | Rules of Meem Sakinah",
        description: "أحكام الميم الساكنة والشفوية | Meem sakinah rules",
        lessons: [
          {
            title: "الإخفاء الشفوي | Oral Concealment",
            videoUrl: VIDEO_URLS.tajweed,
            duration: 25,
            description: "إخفاء الميم الساكنة",
          },
          {
            title: "الإدغام الشفوي | Oral Merging",
            videoUrl: VIDEO_URLS.tajweed,
            duration: 25,
            description: "إدغام الميم في الميم",
          },
          {
            title: "الإظهار الشفوي | Oral Clear Pronunciation",
            videoUrl: VIDEO_URLS.tajweed,
            duration: 25,
            description: "إظهار الميم الساكنة",
          },
        ],
      },
    ],
  },
  {
    title: "السيرة النبوية | Life of Prophet Muhammad ﷺ",
    slug: "seerah-nabawiyyah",
    description:
      "دراسة شاملة لسيرة النبي محمد صلى الله عليه وسلم من الميلاد إلى الوفاة. Comprehensive study of the Prophet's life including historical context, key events, and timeless lessons.",
    price: 0,
    categoryName: "Islamic Studies",
    level: StreamCourseLevel.INTERMEDIATE,
    imageUrl:
      "https://images.unsplash.com/photo-1564769625905-50e93615e769?w=800&h=450&fit=crop",
    chapters: [
      {
        title: "الفترة المكية | Meccan Period",
        description: "من الميلاد إلى الهجرة | From birth to migration",
        lessons: [
          {
            title: "الميلاد والنشأة | Birth and Childhood",
            videoUrl: VIDEO_URLS.seerah,
            duration: 45,
            description: "نشأة النبي في مكة",
          },
          {
            title: "البعثة | The Revelation",
            videoUrl: VIDEO_URLS.seerah,
            duration: 50,
            description: "بدء الوحي في غار حراء",
          },
          {
            title: "الدعوة السرية | Secret Call",
            videoUrl: VIDEO_URLS.seerah,
            duration: 35,
            description: "السنوات الأولى من الدعوة",
          },
          {
            title: "الدعوة الجهرية | Public Call",
            videoUrl: VIDEO_URLS.seerah,
            duration: 40,
            description: "الدعوة العلنية ومواجهة قريش",
          },
          {
            title: "الإسراء والمعراج | Night Journey",
            videoUrl: VIDEO_URLS.seerah,
            duration: 45,
            description: "رحلة الإسراء والمعراج",
          },
        ],
      },
      {
        title: "الفترة المدنية | Medinan Period",
        description: "من الهجرة إلى الوفاة | From migration to passing",
        lessons: [
          {
            title: "الهجرة | The Migration",
            videoUrl: VIDEO_URLS.seerah,
            duration: 50,
            description: "الهجرة من مكة إلى المدينة",
          },
          {
            title: "بناء الدولة | Building the State",
            videoUrl: VIDEO_URLS.seerah,
            duration: 40,
            description: "تأسيس الدولة الإسلامية",
          },
          {
            title: "غزوة بدر | Battle of Badr",
            videoUrl: VIDEO_URLS.seerah,
            duration: 55,
            description: "أول معركة فاصلة",
          },
          {
            title: "غزوة أحد | Battle of Uhud",
            videoUrl: VIDEO_URLS.seerah,
            duration: 45,
            description: "دروس من غزوة أحد",
          },
          {
            title: "فتح مكة | Conquest of Mecca",
            videoUrl: VIDEO_URLS.seerah,
            duration: 50,
            description: "عودة الفاتحين",
          },
          {
            title: "حجة الوداع | Farewell Pilgrimage",
            videoUrl: VIDEO_URLS.seerah,
            duration: 40,
            description: "آخر حج للنبي",
          },
        ],
      },
    ],
  },
  {
    title: "الفقه الإسلامي: العبادات | Islamic Jurisprudence: Worship",
    slug: "fiqh-ibadat",
    description:
      "أحكام العبادات في الإسلام من الطهارة إلى الحج. Comprehensive study of Islamic worship rulings.",
    price: 0,
    categoryName: "Islamic Studies",
    level: StreamCourseLevel.BEGINNER,
    imageUrl:
      "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=800&h=450&fit=crop",
    chapters: [
      {
        title: "الطهارة والصلاة | Purification and Prayer",
        description:
          "أحكام الوضوء والغسل والصلاة | Ablution and prayer rulings",
        lessons: [
          {
            title: "أنواع الطهارة | Types of Purification",
            videoUrl: VIDEO_URLS.tajweed,
            duration: 30,
          },
          {
            title: "الوضوء | Ablution (Wudu)",
            videoUrl: VIDEO_URLS.tajweed,
            duration: 35,
          },
          {
            title: "أركان الصلاة | Pillars of Prayer",
            videoUrl: VIDEO_URLS.tajweed,
            duration: 40,
          },
          {
            title: "واجبات الصلاة | Obligations of Prayer",
            videoUrl: VIDEO_URLS.tajweed,
            duration: 35,
          },
        ],
      },
      {
        title: "الصيام والزكاة | Fasting and Zakat",
        description: "أحكام الصوم والزكاة | Fasting and charity rulings",
        lessons: [
          {
            title: "أحكام الصيام | Fasting Rulings",
            videoUrl: VIDEO_URLS.tajweed,
            duration: 40,
          },
          {
            title: "أركان الصيام ومبطلاته | Pillars and Invalidators",
            videoUrl: VIDEO_URLS.tajweed,
            duration: 35,
          },
          {
            title: "الزكاة وأنصبتها | Zakat and Its Thresholds",
            videoUrl: VIDEO_URLS.tajweed,
            duration: 45,
          },
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
    description:
      "أساسيات النحو العربي للمبتدئين والمتوسطين. Complete Arabic grammar course covering nominal and verbal sentences, cases, and advanced constructions.",
    price: 0,
    categoryName: "Languages",
    level: StreamCourseLevel.INTERMEDIATE,
    imageUrl:
      "https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?w=800&h=450&fit=crop",
    chapters: [
      {
        title: "الجملة الاسمية | Nominal Sentence",
        description:
          "بناء الجملة الاسمية ومكوناتها | Structure of nominal sentences",
        lessons: [
          {
            title: "المبتدأ والخبر | Subject and Predicate",
            videoUrl: VIDEO_URLS.arabic,
            duration: 40,
            description: "أساسيات الجملة الاسمية",
          },
          {
            title: "أنواع الخبر | Types of Predicate",
            videoUrl: VIDEO_URLS.arabic,
            duration: 35,
            description: "الخبر المفرد والجملة وشبه الجملة",
          },
          {
            title: "كان وأخواتها | Kana and Sisters",
            videoUrl: VIDEO_URLS.arabic,
            duration: 45,
            description: "الأفعال الناقصة",
          },
          {
            title: "إن وأخواتها | Inna and Sisters",
            videoUrl: VIDEO_URLS.arabic,
            duration: 40,
            description: "الحروف المشبهة بالفعل",
          },
        ],
      },
      {
        title: "الجملة الفعلية | Verbal Sentence",
        description: "بناء الجملة الفعلية | Structure of verbal sentences",
        lessons: [
          {
            title: "الفعل والفاعل | Verb and Subject",
            videoUrl: VIDEO_URLS.arabic,
            duration: 35,
            description: "أساسيات الجملة الفعلية",
          },
          {
            title: "المفعول به | Direct Object",
            videoUrl: VIDEO_URLS.arabic,
            duration: 30,
            description: "المفاعيل في الجملة",
          },
          {
            title: "الفعل المبني للمجهول | Passive Voice",
            videoUrl: VIDEO_URLS.arabic,
            duration: 40,
            description: "تحويل الفعل للمبني للمجهول",
          },
          {
            title: "المفاعيل الخمسة | The Five Objects",
            videoUrl: VIDEO_URLS.arabic,
            duration: 45,
            description: "المفعول المطلق، فيه، له، معه",
          },
        ],
      },
    ],
  },
  {
    title: "English Language Mastery",
    slug: "english-language-mastery",
    description:
      "Comprehensive English skills for academic success. Master grammar, writing, reading comprehension, and vocabulary building.",
    price: 0,
    categoryName: "Languages",
    level: StreamCourseLevel.INTERMEDIATE,
    imageUrl:
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=450&fit=crop",
    chapters: [
      {
        title: "Grammar Essentials",
        description: "Core grammar rules and structures",
        lessons: [
          {
            title: "Tenses Overview",
            videoUrl: VIDEO_URLS.english,
            duration: 45,
            description: "Understanding all English tenses",
          },
          {
            title: "Present & Past Tense",
            videoUrl: VIDEO_URLS.english,
            duration: 40,
            description: "Simple, continuous, perfect forms",
          },
          {
            title: "Future & Conditional",
            videoUrl: VIDEO_URLS.english,
            duration: 35,
            description: "Future forms and conditionals",
          },
          {
            title: "Modal Verbs",
            videoUrl: VIDEO_URLS.english,
            duration: 30,
            description: "Can, could, should, must, etc.",
          },
        ],
      },
      {
        title: "Academic Writing",
        description: "Writing skills for academic success",
        lessons: [
          {
            title: "Essay Structure",
            videoUrl: VIDEO_URLS.english,
            duration: 40,
            description: "Introduction, body, conclusion",
          },
          {
            title: "Research Writing",
            videoUrl: VIDEO_URLS.english,
            duration: 45,
            description: "Academic research papers",
          },
          {
            title: "Citations & References",
            videoUrl: VIDEO_URLS.english,
            duration: 35,
            description: "APA and MLA formatting",
          },
          {
            title: "Persuasive Writing",
            videoUrl: VIDEO_URLS.english,
            duration: 40,
            description: "Argumentative essays",
          },
        ],
      },
      {
        title: "Reading Comprehension",
        description: "Advanced reading skills",
        lessons: [
          {
            title: "Active Reading Strategies",
            videoUrl: VIDEO_URLS.english,
            duration: 35,
            description: "How to read effectively",
          },
          {
            title: "Inference and Analysis",
            videoUrl: VIDEO_URLS.english,
            duration: 40,
            description: "Reading between the lines",
          },
          {
            title: "Critical Thinking",
            videoUrl: VIDEO_URLS.english,
            duration: 45,
            description: "Evaluating arguments and evidence",
          },
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
    description:
      "دورة شاملة في التفاضل والتكامل والجبر الخطي. Comprehensive course covering calculus, linear algebra, and differential equations for high school students.",
    price: 0,
    categoryName: "Mathematics",
    level: StreamCourseLevel.ADVANCED,
    imageUrl:
      "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&h=450&fit=crop",
    chapters: [
      {
        title: "التفاضل | Calculus - Differentiation",
        description: "مفاهيم التفاضل والمشتقات | Differentiation concepts",
        lessons: [
          {
            title: "النهايات | Limits",
            videoUrl: VIDEO_URLS.math,
            duration: 45,
            description: "مفهوم النهاية وحسابها",
          },
          {
            title: "المشتقات | Derivatives",
            videoUrl: VIDEO_URLS.math,
            duration: 50,
            description: "قواعد الاشتقاق",
          },
          {
            title: "قاعدة السلسلة | Chain Rule",
            videoUrl: VIDEO_URLS.math,
            duration: 40,
            description: "اشتقاق الدوال المركبة",
          },
          {
            title: "تطبيقات المشتقات | Applications",
            videoUrl: VIDEO_URLS.math,
            duration: 45,
            description: "المعدلات والأمثلة",
          },
        ],
      },
      {
        title: "التكامل | Calculus - Integration",
        description: "مفاهيم التكامل | Integration concepts",
        lessons: [
          {
            title: "التكامل غير المحدد | Indefinite Integrals",
            videoUrl: VIDEO_URLS.math,
            duration: 45,
          },
          {
            title: "التكامل المحدد | Definite Integrals",
            videoUrl: VIDEO_URLS.math,
            duration: 50,
          },
          {
            title: "التكامل بالتعويض | Integration by Substitution",
            videoUrl: VIDEO_URLS.math,
            duration: 40,
          },
          {
            title: "المساحات والحجوم | Areas and Volumes",
            videoUrl: VIDEO_URLS.math,
            duration: 55,
          },
        ],
      },
      {
        title: "الجبر الخطي | Linear Algebra",
        description: "المصفوفات والمتجهات | Matrices and vectors",
        lessons: [
          {
            title: "المصفوفات | Matrices",
            videoUrl: VIDEO_URLS.math,
            duration: 40,
          },
          {
            title: "المحددات | Determinants",
            videoUrl: VIDEO_URLS.math,
            duration: 35,
          },
          {
            title: "المتجهات | Vectors",
            videoUrl: VIDEO_URLS.math,
            duration: 45,
          },
          {
            title: "التحويلات الخطية | Linear Transformations",
            videoUrl: VIDEO_URLS.math,
            duration: 50,
          },
        ],
      },
    ],
  },
  {
    title: "الجبر للمرحلة المتوسطة | Algebra for Middle School",
    slug: "algebra-middle-school",
    description:
      "أساسيات الجبر للصفوف 7-9. Foundational algebra concepts for grades 7-9.",
    price: 0,
    categoryName: "Mathematics",
    level: StreamCourseLevel.BEGINNER,
    imageUrl:
      "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&h=450&fit=crop",
    chapters: [
      {
        title: "المتغيرات والتعبيرات | Variables and Expressions",
        description: "أساسيات الجبر | Algebra basics",
        lessons: [
          {
            title: "ما هو المتغير؟ | What is a Variable?",
            videoUrl: VIDEO_URLS.math,
            duration: 25,
          },
          {
            title: "التعبيرات الجبرية | Algebraic Expressions",
            videoUrl: VIDEO_URLS.math,
            duration: 30,
          },
          {
            title: "تبسيط التعبيرات | Simplifying Expressions",
            videoUrl: VIDEO_URLS.math,
            duration: 35,
          },
        ],
      },
      {
        title: "المعادلات | Equations",
        description: "حل المعادلات الخطية | Solving linear equations",
        lessons: [
          {
            title: "المعادلات البسيطة | Simple Equations",
            videoUrl: VIDEO_URLS.math,
            duration: 30,
          },
          {
            title: "معادلات بخطوتين | Two-Step Equations",
            videoUrl: VIDEO_URLS.math,
            duration: 35,
          },
          {
            title: "معادلات بمتغيرات على الجانبين | Variables on Both Sides",
            videoUrl: VIDEO_URLS.math,
            duration: 40,
          },
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
    description:
      "دراسة الميكانيكا الكلاسيكية والقوى والحركة. Classical mechanics covering Newton's laws, energy, momentum, and real-world applications.",
    price: 0,
    categoryName: "Science",
    level: StreamCourseLevel.INTERMEDIATE,
    imageUrl:
      "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=800&h=450&fit=crop",
    chapters: [
      {
        title: "قوانين نيوتن | Newton's Laws",
        description:
          "أساسيات الميكانيكا الكلاسيكية | Classical mechanics fundamentals",
        lessons: [
          {
            title: "القانون الأول: القصور الذاتي | First Law: Inertia",
            videoUrl: VIDEO_URLS.physics,
            duration: 35,
          },
          {
            title: "القانون الثاني: F=ma",
            videoUrl: VIDEO_URLS.physics,
            duration: 40,
          },
          {
            title:
              "القانون الثالث: الفعل ورد الفعل | Third Law: Action-Reaction",
            videoUrl: VIDEO_URLS.physics,
            duration: 35,
          },
          {
            title: "تطبيقات عملية | Practical Applications",
            videoUrl: VIDEO_URLS.physics,
            duration: 45,
          },
        ],
      },
      {
        title: "الطاقة والشغل | Energy and Work",
        description: "مفاهيم الطاقة والحركة | Energy concepts",
        lessons: [
          { title: "الشغل | Work", videoUrl: VIDEO_URLS.physics, duration: 30 },
          {
            title: "الطاقة الحركية | Kinetic Energy",
            videoUrl: VIDEO_URLS.physics,
            duration: 35,
          },
          {
            title: "الطاقة الكامنة | Potential Energy",
            videoUrl: VIDEO_URLS.physics,
            duration: 35,
          },
          {
            title: "حفظ الطاقة | Conservation of Energy",
            videoUrl: VIDEO_URLS.physics,
            duration: 45,
          },
        ],
      },
    ],
  },
  {
    title: "الكيمياء: أساسيات | Chemistry Fundamentals",
    slug: "chemistry-fundamentals",
    description:
      "مقدمة في الكيمياء العامة. Introduction to general chemistry covering atomic structure, bonding, and reactions.",
    price: 0,
    categoryName: "Science",
    level: StreamCourseLevel.BEGINNER,
    imageUrl:
      "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&h=450&fit=crop",
    chapters: [
      {
        title: "بنية الذرة | Atomic Structure",
        description: "فهم تركيب الذرة | Understanding atomic composition",
        lessons: [
          {
            title: "مكونات الذرة | Components of an Atom",
            videoUrl: VIDEO_URLS.chemistry,
            duration: 30,
          },
          {
            title: "النموذج الذري | Atomic Models",
            videoUrl: VIDEO_URLS.chemistry,
            duration: 35,
          },
          {
            title: "التوزيع الإلكتروني | Electron Configuration",
            videoUrl: VIDEO_URLS.chemistry,
            duration: 40,
          },
        ],
      },
      {
        title: "الجدول الدوري | Periodic Table",
        description: "فهم الجدول الدوري | Understanding the periodic table",
        lessons: [
          {
            title: "تنظيم الجدول الدوري | Organization of the Periodic Table",
            videoUrl: VIDEO_URLS.chemistry,
            duration: 35,
          },
          {
            title: "الاتجاهات الدورية | Periodic Trends",
            videoUrl: VIDEO_URLS.chemistry,
            duration: 40,
          },
          {
            title: "المجموعات والدورات | Groups and Periods",
            videoUrl: VIDEO_URLS.chemistry,
            duration: 35,
          },
        ],
      },
    ],
  },
  {
    title: "الأحياء: علم الخلية | Biology: Cell Biology",
    slug: "biology-cell",
    description:
      "دراسة الخلية وعملياتها الحيوية. Comprehensive study of cell structure, function, and processes.",
    price: 0,
    categoryName: "Science",
    level: StreamCourseLevel.INTERMEDIATE,
    imageUrl:
      "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800&h=450&fit=crop",
    chapters: [
      {
        title: "تركيب الخلية | Cell Structure",
        description: "العضيات الخلوية ووظائفها | Cell organelles and functions",
        lessons: [
          {
            title: "أنواع الخلايا | Types of Cells",
            videoUrl: VIDEO_URLS.biology,
            duration: 30,
          },
          {
            title: "النواة | The Nucleus",
            videoUrl: VIDEO_URLS.biology,
            duration: 35,
          },
          {
            title: "العضيات الخلوية | Cell Organelles",
            videoUrl: VIDEO_URLS.biology,
            duration: 45,
          },
          {
            title: "غشاء الخلية | Cell Membrane",
            videoUrl: VIDEO_URLS.biology,
            duration: 35,
          },
        ],
      },
      {
        title: "عمليات الخلية | Cell Processes",
        description: "العمليات الحيوية في الخلية | Biological processes",
        lessons: [
          {
            title: "الانقسام الخلوي | Cell Division",
            videoUrl: VIDEO_URLS.biology,
            duration: 45,
          },
          {
            title: "التنفس الخلوي | Cellular Respiration",
            videoUrl: VIDEO_URLS.biology,
            duration: 50,
          },
          {
            title: "البناء الضوئي | Photosynthesis",
            videoUrl: VIDEO_URLS.biology,
            duration: 45,
          },
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
    description:
      "تعلم أساسيات البرمجة باستخدام بايثون. Learn programming fundamentals with Python. Perfect for beginners with no prior experience.",
    price: 0,
    categoryName: "Programming",
    level: StreamCourseLevel.BEGINNER,
    imageUrl:
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&h=450&fit=crop",
    chapters: [
      {
        title: "البداية مع بايثون | Getting Started with Python",
        description:
          "إعداد بيئة التطوير | Setting up your development environment",
        lessons: [
          {
            title: "ما هي البرمجة؟ | What is Programming?",
            videoUrl: VIDEO_URLS.programming,
            duration: 20,
          },
          {
            title: "تثبيت بايثون | Installing Python",
            videoUrl: VIDEO_URLS.programming,
            duration: 25,
          },
          {
            title: "برنامجك الأول | Your First Program",
            videoUrl: VIDEO_URLS.programming,
            duration: 30,
          },
          {
            title: "استخدام IDLE | Using IDLE",
            videoUrl: VIDEO_URLS.programming,
            duration: 25,
          },
        ],
      },
      {
        title: "أساسيات بايثون | Python Basics",
        description: "المتغيرات والعمليات | Variables and operations",
        lessons: [
          {
            title: "المتغيرات | Variables",
            videoUrl: VIDEO_URLS.programming,
            duration: 35,
          },
          {
            title: "أنواع البيانات | Data Types",
            videoUrl: VIDEO_URLS.programming,
            duration: 40,
          },
          {
            title: "العمليات الحسابية | Operators",
            videoUrl: VIDEO_URLS.programming,
            duration: 30,
          },
          {
            title: "المدخلات والمخرجات | Input and Output",
            videoUrl: VIDEO_URLS.programming,
            duration: 35,
          },
        ],
      },
      {
        title: "التحكم بالتدفق | Control Flow",
        description: "الشروط والحلقات | Conditions and loops",
        lessons: [
          {
            title: "جمل الشرط if | If Statements",
            videoUrl: VIDEO_URLS.programming,
            duration: 40,
          },
          {
            title: "حلقة while | While Loops",
            videoUrl: VIDEO_URLS.programming,
            duration: 35,
          },
          {
            title: "حلقة for | For Loops",
            videoUrl: VIDEO_URLS.programming,
            duration: 40,
          },
          {
            title: "الدوال | Functions",
            videoUrl: VIDEO_URLS.programming,
            duration: 45,
          },
        ],
      },
    ],
  },
  {
    title: "تطوير الويب | Web Development Basics",
    slug: "web-development",
    description:
      "تعلم HTML, CSS, JavaScript. Learn to build websites from scratch.",
    price: 0,
    categoryName: "Programming",
    level: StreamCourseLevel.BEGINNER,
    imageUrl:
      "https://images.unsplash.com/photo-1547658719-da2b51169166?w=800&h=450&fit=crop",
    chapters: [
      {
        title: "HTML الأساسيات | HTML Fundamentals",
        description: "بناء صفحات الويب | Building web pages",
        lessons: [
          {
            title: "مقدمة في HTML | Introduction to HTML",
            videoUrl: VIDEO_URLS.programming,
            duration: 30,
          },
          {
            title: "العناصر والوسوم | Elements and Tags",
            videoUrl: VIDEO_URLS.programming,
            duration: 35,
          },
          {
            title: "الروابط والصور | Links and Images",
            videoUrl: VIDEO_URLS.programming,
            duration: 30,
          },
          {
            title: "النماذج | Forms",
            videoUrl: VIDEO_URLS.programming,
            duration: 40,
          },
        ],
      },
      {
        title: "CSS التنسيق | CSS Styling",
        description: "تنسيق صفحات الويب | Styling web pages",
        lessons: [
          {
            title: "مقدمة في CSS | Introduction to CSS",
            videoUrl: VIDEO_URLS.programming,
            duration: 35,
          },
          {
            title: "الألوان والخطوط | Colors and Fonts",
            videoUrl: VIDEO_URLS.programming,
            duration: 30,
          },
          {
            title: "Box Model",
            videoUrl: VIDEO_URLS.programming,
            duration: 40,
          },
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
    description:
      "دراسة شاملة لتاريخ السودان من الممالك القديمة إلى العصر الحديث. Comprehensive study of Sudan's history from ancient kingdoms to modern era.",
    price: 0,
    categoryName: "Humanities",
    level: StreamCourseLevel.INTERMEDIATE,
    imageUrl:
      "https://images.unsplash.com/photo-1590845947670-c009801ffa74?w=800&h=450&fit=crop",
    chapters: [
      {
        title: "الممالك القديمة | Ancient Kingdoms",
        description: "الحضارات القديمة في السودان | Ancient civilizations",
        lessons: [
          {
            title: "مملكة كوش | Kingdom of Kush",
            videoUrl: VIDEO_URLS.history,
            duration: 45,
          },
          {
            title: "نبتة ومروي | Napata and Meroe",
            videoUrl: VIDEO_URLS.history,
            duration: 50,
          },
          {
            title: "الممالك المسيحية | Christian Kingdoms",
            videoUrl: VIDEO_URLS.history,
            duration: 45,
          },
          {
            title: "الآثار السودانية | Sudanese Artifacts",
            videoUrl: VIDEO_URLS.history,
            duration: 40,
          },
        ],
      },
      {
        title: "السودان الحديث | Modern Sudan",
        description:
          "من الدولة المهدية إلى الاستقلال | From Mahdist state to independence",
        lessons: [
          {
            title: "الدولة المهدية | Mahdist State",
            videoUrl: VIDEO_URLS.history,
            duration: 50,
          },
          {
            title: "الحكم الثنائي | Condominium Rule",
            videoUrl: VIDEO_URLS.history,
            duration: 45,
          },
          {
            title: "الاستقلال | Independence",
            videoUrl: VIDEO_URLS.history,
            duration: 40,
          },
          {
            title: "السودان المعاصر | Contemporary Sudan",
            videoUrl: VIDEO_URLS.history,
            duration: 45,
          },
        ],
      },
    ],
  },
]

// ============================================================================
// K-12 SUBJECT CHAPTER TEMPLATES
// ============================================================================

/**
 * Generate chapter templates for K-12 subjects
 * Returns 4-8 chapters based on subject complexity
 */
function getSubjectChapters(
  subjectEn: string,
  gradeLevel: string
): BilingualChapterData[] {
  const templates: Record<string, BilingualChapterData[]> = {
    Arabic: [
      {
        titleAr: "مهارات القراءة",
        titleEn: "Reading Skills",
        descriptionAr: "تنمية مهارات القراءة والفهم",
        descriptionEn: "Developing reading and comprehension skills",
        lessons: [
          {
            titleAr: "قراءة النصوص",
            titleEn: "Reading Texts",
            duration: 30,
          },
          {
            titleAr: "فهم المقروء",
            titleEn: "Reading Comprehension",
            duration: 35,
          },
          {
            titleAr: "التحليل الأدبي",
            titleEn: "Literary Analysis",
            duration: 40,
          },
        ],
      },
      {
        titleAr: "مهارات الكتابة",
        titleEn: "Writing Skills",
        descriptionAr: "تطوير مهارات الكتابة والتعبير",
        descriptionEn: "Developing writing and expression skills",
        lessons: [
          { titleAr: "الإملاء", titleEn: "Spelling", duration: 25 },
          {
            titleAr: "التعبير الكتابي",
            titleEn: "Written Expression",
            duration: 35,
          },
          { titleAr: "كتابة المقال", titleEn: "Essay Writing", duration: 40 },
        ],
      },
      {
        titleAr: "النحو والصرف",
        titleEn: "Grammar",
        descriptionAr: "قواعد اللغة العربية",
        descriptionEn: "Arabic language rules",
        lessons: [
          {
            titleAr: "الجملة الاسمية",
            titleEn: "Nominal Sentence",
            duration: 35,
          },
          {
            titleAr: "الجملة الفعلية",
            titleEn: "Verbal Sentence",
            duration: 35,
          },
          { titleAr: "الإعراب", titleEn: "Parsing", duration: 40 },
        ],
      },
      {
        titleAr: "الأدب والنصوص",
        titleEn: "Literature",
        descriptionAr: "دراسة النصوص الأدبية",
        descriptionEn: "Study of literary texts",
        lessons: [
          { titleAr: "الشعر العربي", titleEn: "Arabic Poetry", duration: 40 },
          { titleAr: "القصة القصيرة", titleEn: "Short Story", duration: 35 },
          { titleAr: "المسرحية", titleEn: "Drama", duration: 35 },
        ],
      },
    ],
    English: [
      {
        titleAr: "مهارات القراءة",
        titleEn: "Reading Skills",
        descriptionAr: "تطوير مهارات القراءة الإنجليزية",
        descriptionEn: "Developing English reading skills",
        lessons: [
          { titleAr: "قراءة النصوص", titleEn: "Reading Texts", duration: 30 },
          { titleAr: "المفردات", titleEn: "Vocabulary", duration: 25 },
          {
            titleAr: "الفهم القرائي",
            titleEn: "Reading Comprehension",
            duration: 35,
          },
        ],
      },
      {
        titleAr: "القواعد",
        titleEn: "Grammar",
        descriptionAr: "قواعد اللغة الإنجليزية",
        descriptionEn: "English grammar rules",
        lessons: [
          { titleAr: "الأزمنة", titleEn: "Tenses", duration: 40 },
          { titleAr: "الجملة", titleEn: "Sentence Structure", duration: 35 },
          { titleAr: "أدوات الربط", titleEn: "Conjunctions", duration: 30 },
        ],
      },
      {
        titleAr: "الكتابة",
        titleEn: "Writing",
        descriptionAr: "مهارات الكتابة الإنجليزية",
        descriptionEn: "English writing skills",
        lessons: [
          {
            titleAr: "كتابة الفقرة",
            titleEn: "Paragraph Writing",
            duration: 35,
          },
          { titleAr: "كتابة المقال", titleEn: "Essay Writing", duration: 40 },
          {
            titleAr: "الكتابة الإبداعية",
            titleEn: "Creative Writing",
            duration: 35,
          },
        ],
      },
      {
        titleAr: "المحادثة",
        titleEn: "Speaking",
        descriptionAr: "مهارات التحدث والاستماع",
        descriptionEn: "Speaking and listening skills",
        lessons: [
          { titleAr: "النطق", titleEn: "Pronunciation", duration: 30 },
          { titleAr: "المحادثة", titleEn: "Conversation", duration: 35 },
          {
            titleAr: "العروض التقديمية",
            titleEn: "Presentations",
            duration: 40,
          },
        ],
      },
    ],
    Mathematics: [
      {
        titleAr: "الأعداد والعمليات",
        titleEn: "Numbers and Operations",
        descriptionAr: "الأعداد والعمليات الحسابية",
        descriptionEn: "Numbers and arithmetic operations",
        lessons: [
          { titleAr: "الأعداد", titleEn: "Numbers", duration: 30 },
          {
            titleAr: "الجمع والطرح",
            titleEn: "Addition and Subtraction",
            duration: 35,
          },
          {
            titleAr: "الضرب والقسمة",
            titleEn: "Multiplication and Division",
            duration: 35,
          },
        ],
      },
      {
        titleAr: "الجبر",
        titleEn: "Algebra",
        descriptionAr: "أساسيات الجبر والمعادلات",
        descriptionEn: "Algebra basics and equations",
        lessons: [
          { titleAr: "المتغيرات", titleEn: "Variables", duration: 35 },
          { titleAr: "المعادلات", titleEn: "Equations", duration: 40 },
          { titleAr: "المتباينات", titleEn: "Inequalities", duration: 35 },
        ],
      },
      {
        titleAr: "الهندسة",
        titleEn: "Geometry",
        descriptionAr: "الأشكال الهندسية والقياسات",
        descriptionEn: "Geometric shapes and measurements",
        lessons: [
          {
            titleAr: "الأشكال المستوية",
            titleEn: "Plane Shapes",
            duration: 35,
          },
          {
            titleAr: "المساحة والمحيط",
            titleEn: "Area and Perimeter",
            duration: 40,
          },
          { titleAr: "الأشكال المجسمة", titleEn: "3D Shapes", duration: 35 },
        ],
      },
      {
        titleAr: "الإحصاء",
        titleEn: "Statistics",
        descriptionAr: "جمع البيانات وتحليلها",
        descriptionEn: "Data collection and analysis",
        lessons: [
          { titleAr: "جمع البيانات", titleEn: "Data Collection", duration: 30 },
          { titleAr: "الرسوم البيانية", titleEn: "Graphs", duration: 35 },
          { titleAr: "المتوسطات", titleEn: "Averages", duration: 35 },
        ],
      },
    ],
    Science: [
      {
        titleAr: "الكائنات الحية",
        titleEn: "Living Things",
        descriptionAr: "دراسة الكائنات الحية",
        descriptionEn: "Study of living organisms",
        lessons: [
          { titleAr: "النباتات", titleEn: "Plants", duration: 35 },
          { titleAr: "الحيوانات", titleEn: "Animals", duration: 35 },
          { titleAr: "جسم الإنسان", titleEn: "Human Body", duration: 40 },
        ],
      },
      {
        titleAr: "المادة والطاقة",
        titleEn: "Matter and Energy",
        descriptionAr: "خصائص المادة وأشكال الطاقة",
        descriptionEn: "Properties of matter and forms of energy",
        lessons: [
          {
            titleAr: "حالات المادة",
            titleEn: "States of Matter",
            duration: 35,
          },
          { titleAr: "الطاقة", titleEn: "Energy", duration: 35 },
          { titleAr: "الحرارة", titleEn: "Heat", duration: 30 },
        ],
      },
      {
        titleAr: "الأرض والفضاء",
        titleEn: "Earth and Space",
        descriptionAr: "علوم الأرض والفضاء",
        descriptionEn: "Earth and space sciences",
        lessons: [
          { titleAr: "طبقات الأرض", titleEn: "Earth's Layers", duration: 35 },
          {
            titleAr: "الطقس والمناخ",
            titleEn: "Weather and Climate",
            duration: 35,
          },
          { titleAr: "النظام الشمسي", titleEn: "Solar System", duration: 40 },
        ],
      },
    ],
    Physics: [
      {
        titleAr: "الميكانيكا",
        titleEn: "Mechanics",
        descriptionAr: "الحركة والقوى",
        descriptionEn: "Motion and forces",
        lessons: [
          { titleAr: "الحركة", titleEn: "Motion", duration: 40 },
          { titleAr: "القوى", titleEn: "Forces", duration: 40 },
          { titleAr: "قوانين نيوتن", titleEn: "Newton's Laws", duration: 45 },
        ],
      },
      {
        titleAr: "الطاقة",
        titleEn: "Energy",
        descriptionAr: "أشكال الطاقة وتحولاتها",
        descriptionEn: "Forms of energy and transformations",
        lessons: [
          {
            titleAr: "الطاقة الحركية",
            titleEn: "Kinetic Energy",
            duration: 35,
          },
          {
            titleAr: "الطاقة الكامنة",
            titleEn: "Potential Energy",
            duration: 35,
          },
          {
            titleAr: "حفظ الطاقة",
            titleEn: "Conservation of Energy",
            duration: 40,
          },
        ],
      },
      {
        titleAr: "الكهرباء",
        titleEn: "Electricity",
        descriptionAr: "الدوائر الكهربائية",
        descriptionEn: "Electric circuits",
        lessons: [
          {
            titleAr: "التيار الكهربائي",
            titleEn: "Electric Current",
            duration: 40,
          },
          { titleAr: "المقاومة", titleEn: "Resistance", duration: 35 },
          { titleAr: "الدوائر", titleEn: "Circuits", duration: 40 },
        ],
      },
      {
        titleAr: "الموجات",
        titleEn: "Waves",
        descriptionAr: "الموجات والصوت والضوء",
        descriptionEn: "Waves, sound, and light",
        lessons: [
          {
            titleAr: "خصائص الموجات",
            titleEn: "Wave Properties",
            duration: 35,
          },
          { titleAr: "الصوت", titleEn: "Sound", duration: 35 },
          { titleAr: "الضوء", titleEn: "Light", duration: 40 },
        ],
      },
    ],
    Chemistry: [
      {
        titleAr: "بنية المادة",
        titleEn: "Structure of Matter",
        descriptionAr: "الذرات والجزيئات",
        descriptionEn: "Atoms and molecules",
        lessons: [
          { titleAr: "الذرة", titleEn: "The Atom", duration: 40 },
          { titleAr: "الجدول الدوري", titleEn: "Periodic Table", duration: 40 },
          {
            titleAr: "الروابط الكيميائية",
            titleEn: "Chemical Bonds",
            duration: 45,
          },
        ],
      },
      {
        titleAr: "التفاعلات الكيميائية",
        titleEn: "Chemical Reactions",
        descriptionAr: "أنواع التفاعلات ومعادلاتها",
        descriptionEn: "Types of reactions and equations",
        lessons: [
          {
            titleAr: "أنواع التفاعلات",
            titleEn: "Types of Reactions",
            duration: 40,
          },
          {
            titleAr: "موازنة المعادلات",
            titleEn: "Balancing Equations",
            duration: 35,
          },
          { titleAr: "سرعة التفاعل", titleEn: "Reaction Rate", duration: 35 },
        ],
      },
      {
        titleAr: "الكيمياء العضوية",
        titleEn: "Organic Chemistry",
        descriptionAr: "مركبات الكربون",
        descriptionEn: "Carbon compounds",
        lessons: [
          { titleAr: "الهيدروكربونات", titleEn: "Hydrocarbons", duration: 40 },
          {
            titleAr: "المجموعات الوظيفية",
            titleEn: "Functional Groups",
            duration: 40,
          },
          { titleAr: "البوليمرات", titleEn: "Polymers", duration: 35 },
        ],
      },
    ],
    Biology: [
      {
        titleAr: "الخلية",
        titleEn: "The Cell",
        descriptionAr: "تركيب الخلية ووظائفها",
        descriptionEn: "Cell structure and functions",
        lessons: [
          { titleAr: "أنواع الخلايا", titleEn: "Types of Cells", duration: 35 },
          { titleAr: "العضيات", titleEn: "Organelles", duration: 40 },
          { titleAr: "انقسام الخلية", titleEn: "Cell Division", duration: 40 },
        ],
      },
      {
        titleAr: "الوراثة",
        titleEn: "Genetics",
        descriptionAr: "الجينات والوراثة",
        descriptionEn: "Genes and inheritance",
        lessons: [
          { titleAr: "DNA", titleEn: "DNA", duration: 40 },
          { titleAr: "قوانين مندل", titleEn: "Mendel's Laws", duration: 35 },
          { titleAr: "الطفرات", titleEn: "Mutations", duration: 35 },
        ],
      },
      {
        titleAr: "البيئة",
        titleEn: "Ecology",
        descriptionAr: "الأنظمة البيئية",
        descriptionEn: "Ecosystems",
        lessons: [
          { titleAr: "السلاسل الغذائية", titleEn: "Food Chains", duration: 35 },
          {
            titleAr: "التوازن البيئي",
            titleEn: "Ecological Balance",
            duration: 35,
          },
          { titleAr: "التنوع الحيوي", titleEn: "Biodiversity", duration: 35 },
        ],
      },
      {
        titleAr: "جسم الإنسان",
        titleEn: "Human Body",
        descriptionAr: "أجهزة الجسم البشري",
        descriptionEn: "Human body systems",
        lessons: [
          {
            titleAr: "الجهاز الهضمي",
            titleEn: "Digestive System",
            duration: 40,
          },
          {
            titleAr: "الجهاز الدوري",
            titleEn: "Circulatory System",
            duration: 40,
          },
          { titleAr: "الجهاز العصبي", titleEn: "Nervous System", duration: 40 },
        ],
      },
    ],
    "Islamic Studies": [
      {
        titleAr: "العقيدة",
        titleEn: "Faith",
        descriptionAr: "أركان الإيمان والتوحيد",
        descriptionEn: "Pillars of faith and monotheism",
        lessons: [
          {
            titleAr: "أركان الإيمان",
            titleEn: "Pillars of Faith",
            duration: 35,
          },
          { titleAr: "التوحيد", titleEn: "Monotheism", duration: 35 },
          {
            titleAr: "الإيمان بالملائكة",
            titleEn: "Belief in Angels",
            duration: 30,
          },
        ],
      },
      {
        titleAr: "الفقه",
        titleEn: "Jurisprudence",
        descriptionAr: "الأحكام الشرعية العملية",
        descriptionEn: "Practical Islamic rulings",
        lessons: [
          { titleAr: "الطهارة", titleEn: "Purification", duration: 35 },
          { titleAr: "الصلاة", titleEn: "Prayer", duration: 40 },
          { titleAr: "الصيام", titleEn: "Fasting", duration: 35 },
        ],
      },
      {
        titleAr: "السيرة النبوية",
        titleEn: "Prophet's Biography",
        descriptionAr: "حياة النبي محمد ﷺ",
        descriptionEn: "Life of Prophet Muhammad ﷺ",
        lessons: [
          {
            titleAr: "الميلاد والنشأة",
            titleEn: "Birth and Childhood",
            duration: 40,
          },
          { titleAr: "البعثة", titleEn: "The Revelation", duration: 40 },
          { titleAr: "الهجرة", titleEn: "The Migration", duration: 40 },
        ],
      },
      {
        titleAr: "الأخلاق الإسلامية",
        titleEn: "Islamic Ethics",
        descriptionAr: "الآداب والأخلاق",
        descriptionEn: "Manners and ethics",
        lessons: [
          { titleAr: "الصدق", titleEn: "Truthfulness", duration: 30 },
          { titleAr: "الأمانة", titleEn: "Trustworthiness", duration: 30 },
          { titleAr: "بر الوالدين", titleEn: "Honoring Parents", duration: 35 },
        ],
      },
    ],
    Quran: [
      {
        titleAr: "التجويد",
        titleEn: "Tajweed",
        descriptionAr: "أحكام تلاوة القرآن",
        descriptionEn: "Rules of Quran recitation",
        lessons: [
          {
            titleAr: "مخارج الحروف",
            titleEn: "Articulation Points",
            duration: 35,
          },
          {
            titleAr: "أحكام النون الساكنة",
            titleEn: "Noon Sakinah Rules",
            duration: 40,
          },
          { titleAr: "المدود", titleEn: "Elongation Rules", duration: 35 },
        ],
      },
      {
        titleAr: "الحفظ",
        titleEn: "Memorization",
        descriptionAr: "حفظ سور القرآن الكريم",
        descriptionEn: "Quran memorization",
        lessons: [
          { titleAr: "جزء عم", titleEn: "Juz Amma", duration: 45 },
          { titleAr: "السور القصيرة", titleEn: "Short Surahs", duration: 40 },
          {
            titleAr: "تقنيات الحفظ",
            titleEn: "Memorization Techniques",
            duration: 35,
          },
        ],
      },
      {
        titleAr: "التفسير",
        titleEn: "Interpretation",
        descriptionAr: "فهم معاني الآيات",
        descriptionEn: "Understanding verse meanings",
        lessons: [
          {
            titleAr: "أسباب النزول",
            titleEn: "Reasons for Revelation",
            duration: 40,
          },
          {
            titleAr: "تفسير الآيات",
            titleEn: "Verse Interpretation",
            duration: 45,
          },
          {
            titleAr: "الدروس المستفادة",
            titleEn: "Lessons Learned",
            duration: 35,
          },
        ],
      },
    ],
    "Computer Science": [
      {
        titleAr: "أساسيات الحاسوب",
        titleEn: "Computer Basics",
        descriptionAr: "مكونات الحاسوب واستخدامه",
        descriptionEn: "Computer components and usage",
        lessons: [
          {
            titleAr: "مكونات الحاسوب",
            titleEn: "Computer Components",
            duration: 30,
          },
          {
            titleAr: "نظام التشغيل",
            titleEn: "Operating System",
            duration: 35,
          },
          {
            titleAr: "الملفات والمجلدات",
            titleEn: "Files and Folders",
            duration: 30,
          },
        ],
      },
      {
        titleAr: "البرمجة",
        titleEn: "Programming",
        descriptionAr: "أساسيات البرمجة",
        descriptionEn: "Programming basics",
        lessons: [
          {
            titleAr: "مفهوم البرمجة",
            titleEn: "Programming Concepts",
            duration: 35,
          },
          { titleAr: "المتغيرات", titleEn: "Variables", duration: 35 },
          { titleAr: "الحلقات", titleEn: "Loops", duration: 40 },
        ],
      },
      {
        titleAr: "التطبيقات",
        titleEn: "Applications",
        descriptionAr: "برامج الحاسوب الأساسية",
        descriptionEn: "Essential computer programs",
        lessons: [
          { titleAr: "معالج النصوص", titleEn: "Word Processing", duration: 35 },
          { titleAr: "جداول البيانات", titleEn: "Spreadsheets", duration: 35 },
          {
            titleAr: "العروض التقديمية",
            titleEn: "Presentations",
            duration: 35,
          },
        ],
      },
    ],
    Geography: [
      {
        titleAr: "الجغرافيا الطبيعية",
        titleEn: "Physical Geography",
        descriptionAr: "التضاريس والمناخ",
        descriptionEn: "Landforms and climate",
        lessons: [
          { titleAr: "التضاريس", titleEn: "Landforms", duration: 35 },
          { titleAr: "المناخ", titleEn: "Climate", duration: 35 },
          {
            titleAr: "الموارد الطبيعية",
            titleEn: "Natural Resources",
            duration: 35,
          },
        ],
      },
      {
        titleAr: "الجغرافيا البشرية",
        titleEn: "Human Geography",
        descriptionAr: "السكان والعمران",
        descriptionEn: "Population and urbanization",
        lessons: [
          { titleAr: "السكان", titleEn: "Population", duration: 35 },
          { titleAr: "الهجرة", titleEn: "Migration", duration: 30 },
          { titleAr: "المدن", titleEn: "Cities", duration: 35 },
        ],
      },
      {
        titleAr: "جغرافية السودان",
        titleEn: "Sudan Geography",
        descriptionAr: "جغرافية السودان الطبيعية والبشرية",
        descriptionEn: "Physical and human geography of Sudan",
        lessons: [
          {
            titleAr: "الموقع والحدود",
            titleEn: "Location and Borders",
            duration: 35,
          },
          { titleAr: "النيل", titleEn: "The Nile", duration: 35 },
          { titleAr: "الولايات", titleEn: "States", duration: 35 },
        ],
      },
    ],
    History: [
      {
        titleAr: "التاريخ القديم",
        titleEn: "Ancient History",
        descriptionAr: "الحضارات القديمة",
        descriptionEn: "Ancient civilizations",
        lessons: [
          {
            titleAr: "حضارات ما بين النهرين",
            titleEn: "Mesopotamian Civilizations",
            duration: 40,
          },
          {
            titleAr: "الحضارة المصرية",
            titleEn: "Egyptian Civilization",
            duration: 40,
          },
          { titleAr: "مملكة كوش", titleEn: "Kingdom of Kush", duration: 40 },
        ],
      },
      {
        titleAr: "التاريخ الإسلامي",
        titleEn: "Islamic History",
        descriptionAr: "تاريخ الدولة الإسلامية",
        descriptionEn: "History of the Islamic state",
        lessons: [
          {
            titleAr: "الخلفاء الراشدون",
            titleEn: "Rightly Guided Caliphs",
            duration: 45,
          },
          {
            titleAr: "الدولة الأموية",
            titleEn: "Umayyad Dynasty",
            duration: 40,
          },
          {
            titleAr: "الدولة العباسية",
            titleEn: "Abbasid Dynasty",
            duration: 40,
          },
        ],
      },
      {
        titleAr: "تاريخ السودان",
        titleEn: "Sudan History",
        descriptionAr: "تاريخ السودان الحديث والمعاصر",
        descriptionEn: "Modern and contemporary Sudan history",
        lessons: [
          { titleAr: "الدولة المهدية", titleEn: "Mahdist State", duration: 45 },
          {
            titleAr: "الحكم الثنائي",
            titleEn: "Condominium Rule",
            duration: 40,
          },
          { titleAr: "الاستقلال", titleEn: "Independence", duration: 40 },
        ],
      },
    ],
    Art: [
      {
        titleAr: "الرسم",
        titleEn: "Drawing",
        descriptionAr: "أساسيات الرسم والتلوين",
        descriptionEn: "Drawing and coloring basics",
        lessons: [
          {
            titleAr: "الخطوط والأشكال",
            titleEn: "Lines and Shapes",
            duration: 30,
          },
          { titleAr: "الظل والنور", titleEn: "Light and Shadow", duration: 35 },
          { titleAr: "التلوين", titleEn: "Coloring", duration: 30 },
        ],
      },
      {
        titleAr: "الأشغال اليدوية",
        titleEn: "Handicrafts",
        descriptionAr: "الحرف اليدوية والإبداعية",
        descriptionEn: "Creative handicrafts",
        lessons: [
          { titleAr: "الورق", titleEn: "Paper Crafts", duration: 35 },
          { titleAr: "الصلصال", titleEn: "Clay Work", duration: 35 },
          {
            titleAr: "إعادة التدوير",
            titleEn: "Recycling Crafts",
            duration: 35,
          },
        ],
      },
      {
        titleAr: "الفن السوداني",
        titleEn: "Sudanese Art",
        descriptionAr: "التراث الفني السوداني",
        descriptionEn: "Sudanese artistic heritage",
        lessons: [
          {
            titleAr: "الزخارف السودانية",
            titleEn: "Sudanese Ornaments",
            duration: 35,
          },
          { titleAr: "الحناء", titleEn: "Henna Art", duration: 30 },
          {
            titleAr: "النسيج التقليدي",
            titleEn: "Traditional Weaving",
            duration: 35,
          },
        ],
      },
    ],
    "Physical Education": [
      {
        titleAr: "اللياقة البدنية",
        titleEn: "Physical Fitness",
        descriptionAr: "تمارين اللياقة البدنية",
        descriptionEn: "Physical fitness exercises",
        lessons: [
          { titleAr: "الإحماء", titleEn: "Warm-up", duration: 25 },
          {
            titleAr: "تمارين القوة",
            titleEn: "Strength Exercises",
            duration: 35,
          },
          {
            titleAr: "تمارين المرونة",
            titleEn: "Flexibility Exercises",
            duration: 30,
          },
        ],
      },
      {
        titleAr: "الألعاب الجماعية",
        titleEn: "Team Sports",
        descriptionAr: "الرياضات الجماعية",
        descriptionEn: "Team sports",
        lessons: [
          { titleAr: "كرة القدم", titleEn: "Football", duration: 40 },
          { titleAr: "كرة السلة", titleEn: "Basketball", duration: 40 },
          { titleAr: "الكرة الطائرة", titleEn: "Volleyball", duration: 40 },
        ],
      },
      {
        titleAr: "الصحة والسلامة",
        titleEn: "Health and Safety",
        descriptionAr: "التغذية السليمة والسلامة",
        descriptionEn: "Proper nutrition and safety",
        lessons: [
          {
            titleAr: "التغذية السليمة",
            titleEn: "Proper Nutrition",
            duration: 30,
          },
          {
            titleAr: "النظافة الشخصية",
            titleEn: "Personal Hygiene",
            duration: 25,
          },
          { titleAr: "الإسعافات الأولية", titleEn: "First Aid", duration: 35 },
        ],
      },
    ],
  }

  // Return chapters for the subject, or default generic chapters
  return (
    templates[subjectEn] || [
      {
        titleAr: "الوحدة الأولى",
        titleEn: "Unit 1",
        descriptionAr: "المفاهيم الأساسية",
        descriptionEn: "Basic concepts",
        lessons: [
          { titleAr: "الدرس الأول", titleEn: "Lesson 1", duration: 30 },
          { titleAr: "الدرس الثاني", titleEn: "Lesson 2", duration: 30 },
          { titleAr: "الدرس الثالث", titleEn: "Lesson 3", duration: 30 },
        ],
      },
      {
        titleAr: "الوحدة الثانية",
        titleEn: "Unit 2",
        descriptionAr: "التطبيقات العملية",
        descriptionEn: "Practical applications",
        lessons: [
          { titleAr: "الدرس الأول", titleEn: "Lesson 1", duration: 30 },
          { titleAr: "الدرس الثاني", titleEn: "Lesson 2", duration: 30 },
          { titleAr: "الدرس الثالث", titleEn: "Lesson 3", duration: 30 },
        ],
      },
      {
        titleAr: "الوحدة الثالثة",
        titleEn: "Unit 3",
        descriptionAr: "المراجعة والتقييم",
        descriptionEn: "Review and assessment",
        lessons: [
          { titleAr: "الدرس الأول", titleEn: "Lesson 1", duration: 30 },
          { titleAr: "الدرس الثاني", titleEn: "Lesson 2", duration: 30 },
          { titleAr: "المراجعة", titleEn: "Review", duration: 35 },
        ],
      },
    ]
  )
}

/**
 * Determine course level based on grade level
 */
function getLevelForGrade(gradeLevelEn: string): StreamCourseLevel {
  if (
    gradeLevelEn.includes("KG") ||
    ["Grade 1", "Grade 2", "Grade 3"].includes(gradeLevelEn)
  ) {
    return StreamCourseLevel.BEGINNER
  }
  if (
    ["Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8"].includes(
      gradeLevelEn
    )
  ) {
    return StreamCourseLevel.INTERMEDIATE
  }
  return StreamCourseLevel.ADVANCED
}

/**
 * Get category key for a subject's department
 */
function getCategoryKeyForSubject(departmentEn: string): string {
  const mapping: Record<string, string> = {
    Languages: "Languages",
    Sciences: "Sciences",
    Humanities: "Humanities",
    Religion: "Religion",
    ICT: "ICT",
    "Arts & PE": "Arts & PE",
  }
  return mapping[departmentEn] || "Sciences"
}

/**
 * Generate image URL based on subject
 */
function getImageForSubject(subjectEn: string): string {
  const images: Record<string, string> = {
    Arabic:
      "https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?w=800&h=450&fit=crop",
    English:
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=450&fit=crop",
    Mathematics:
      "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&h=450&fit=crop",
    Science:
      "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&h=450&fit=crop",
    Physics:
      "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=800&h=450&fit=crop",
    Chemistry:
      "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&h=450&fit=crop",
    Biology:
      "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800&h=450&fit=crop",
    "Islamic Studies":
      "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=800&h=450&fit=crop",
    Quran:
      "https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=800&h=450&fit=crop",
    "Computer Science":
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&h=450&fit=crop",
    Geography:
      "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&h=450&fit=crop",
    History:
      "https://images.unsplash.com/photo-1590845947670-c009801ffa74?w=800&h=450&fit=crop",
    Art: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&h=450&fit=crop",
    "Physical Education":
      "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=450&fit=crop",
  }
  return (
    images[subjectEn] ||
    "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=450&fit=crop"
  )
}

// ============================================================================
// K-12 SUBJECT COURSES SEEDING
// ============================================================================

/**
 * Seeds K-12 subject courses for all grade levels
 * Creates ~324 courses (162 subjects × 2 languages)
 */
async function seedK12SubjectCourses(
  prisma: SeedPrisma,
  schoolId: string,
  categoryMap: Map<string, { arId: string; enId: string }>,
  teacherId: string // Required: userId is required in StreamCourse model
): Promise<{
  arCount: number
  enCount: number
  chapterCount: number
  lessonCount: number
}> {
  let arCount = 0
  let enCount = 0
  let chapterCount = 0
  let lessonCount = 0

  // For each grade level, seed all subjects in its curriculum
  for (const yearLevel of YEAR_LEVELS) {
    const gradeSubjects = CURRICULUM[yearLevel.en]
    if (!gradeSubjects) continue

    for (const subjectEn of gradeSubjects) {
      // Find subject data
      const subject = SUBJECTS.find((s) => s.en === subjectEn)
      if (!subject) continue

      // Generate slug: subject-grade (e.g., "arabic-grade-7")
      const gradeSlug = yearLevel.en.toLowerCase().replace(/\s+/g, "-")
      const slug = `${subjectEn.toLowerCase().replace(/\s+/g, "-")}-${gradeSlug}`

      // Get chapters for this subject
      const chapters = getSubjectChapters(subjectEn, yearLevel.en)

      const course: BilingualCourseData = {
        slug,
        titleAr: `${subject.ar} - ${yearLevel.ar}`,
        titleEn: `${subject.en} - ${yearLevel.en}`,
        descriptionAr: `${subject.descriptionAr} للصف ${yearLevel.ar}`,
        descriptionEn: `${subject.descriptionEn} for ${yearLevel.en}`,
        price: 0,
        categoryKey: getCategoryKeyForSubject(subject.departmentEn),
        level: getLevelForGrade(yearLevel.en),
        imageUrl: getImageForSubject(subjectEn),
        chapters,
      }

      // Create bilingual course
      await createBilingualCourse({
        prisma,
        schoolId,
        course,
        categoryMap,
        teacherId,
      })

      arCount++
      enCount++
      chapterCount += chapters.length * 2 // Both AR and EN
      lessonCount +=
        chapters.reduce((sum, ch) => sum + ch.lessons.length, 0) * 2
    }
  }

  return { arCount, enCount, chapterCount, lessonCount }
}

// ============================================================================
// SEED FUNCTION
// ============================================================================

export async function seedStream(
  prisma: SeedPrisma,
  schoolId: string,
  teachers: TeacherRef[],
  students?: StudentRef[]
): Promise<void> {
  console.log("🎓 Creating comprehensive bilingual LMS platform...")

  // Phase 1: Create bilingual categories
  console.log("   📁 Creating bilingual categories...")
  const categoryMap = await seedBilingualCategories(prisma, schoolId)
  console.log(
    `   ✅ Categories: ${categoryMap.size} bilingual category pairs created`
  )

  // Get a teacher for course assignment (required for course creation)
  const teacherId = teachers[0]?.userId
  if (!teacherId) {
    console.log("   ⚠️  No teachers available - skipping K-12 course seeding")
    console.log(
      "   📊 Bilingual LMS Summary: No courses seeded (no teachers)\n"
    )
    return
  }

  // Phase 2: Seed K-12 subject courses (bilingual)
  console.log("   📚 Seeding K-12 subject courses (bilingual)...")
  const k12Stats = await seedK12SubjectCourses(
    prisma,
    schoolId,
    categoryMap,
    teacherId
  )
  console.log(
    `   ✅ K-12 Courses: ${k12Stats.arCount} AR + ${k12Stats.enCount} EN = ${k12Stats.arCount + k12Stats.enCount} total`
  )
  console.log(`   ✅ K-12 Chapters: ${k12Stats.chapterCount}`)
  console.log(`   ✅ K-12 Lessons: ${k12Stats.lessonCount}`)

  // Phase 3: Keep legacy courses (backward compatibility, single-lang for now)
  // These use the old combined format - can be migrated later
  console.log("   📖 Seeding legacy courses...")
  let legacyCourseCount = 0
  let legacyChapterCount = 0
  let legacyLessonCount = 0
  const createdCourses: { id: string; title: string }[] = []

  // Create legacy categories (for old courses that reference them)
  const legacyCategories = new Map<string, string>()
  const legacyCategoryNames = [
    "Islamic Studies",
    "Languages",
    "Mathematics",
    "Science",
    "Programming",
    "Humanities",
  ]
  for (const name of legacyCategoryNames) {
    let cat = await prisma.streamCategory.findFirst({
      where: { schoolId, name },
    })
    if (!cat) {
      cat = await prisma.streamCategory.create({
        data: { name, schoolId },
      })
    }
    legacyCategories.set(name, cat.id)
  }

  for (const courseData of COURSES_DATA) {
    const { chapters, categoryName, level, imageUrl, ...courseInfo } =
      courseData

    // Check if course already exists (any language)
    let course = await prisma.streamCourse.findFirst({
      where: { schoolId, slug: courseInfo.slug },
    })

    if (!course) {
      // Assign teacher
      const assignedTeacher = teachers[legacyCourseCount % teachers.length]

      course = await prisma.streamCourse.create({
        data: {
          ...courseInfo,
          schoolId,
          userId: assignedTeacher?.userId,
          categoryId: legacyCategories.get(categoryName),
          isPublished: true,
          imageUrl,
          level: level || StreamCourseLevel.BEGINNER,
          lang: "en", // Default to English for legacy
        },
      })

      // Create chapters and lessons
      for (let ci = 0; ci < chapters.length; ci++) {
        const chapterData = chapters[ci]
        const chapter = await prisma.streamChapter.create({
          data: {
            title: chapterData.title,
            description: chapterData.description,
            position: ci + 1,
            isPublished: true,
            courseId: course.id,
          },
        })
        legacyChapterCount++

        for (let li = 0; li < chapterData.lessons.length; li++) {
          const lessonData = chapterData.lessons[li]
          await prisma.streamLesson.create({
            data: {
              title: lessonData.title,
              description:
                lessonData.description ||
                `Lesson ${li + 1} of ${chapterData.title}`,
              position: li + 1,
              duration:
                lessonData.duration || faker.number.int({ min: 20, max: 50 }),
              videoUrl: lessonData.videoUrl,
              isPublished: true,
              isFree: li === 0,
              chapterId: chapter.id,
            },
          })
          legacyLessonCount++
        }
      }
    }

    createdCourses.push({ id: course.id, title: course.title })
    legacyCourseCount++
  }

  console.log(`   ✅ Legacy courses: ${legacyCourseCount}`)
  console.log(`   ✅ Legacy chapters: ${legacyChapterCount}`)
  console.log(`   ✅ Legacy lessons: ${legacyLessonCount}`)

  // Phase 4: Create student enrollments (on all courses)
  if (students && students.length > 0) {
    let enrollmentCount = 0
    let progressCount = 0

    // Get all courses for enrollment
    const allCourses = await prisma.streamCourse.findMany({
      where: { schoolId },
      select: { id: true, title: true },
    })

    // Enroll 50 students in 2-5 random courses each
    for (const student of students.slice(0, Math.min(50, students.length))) {
      const numCourses = faker.number.int({ min: 2, max: 5 })
      const selectedCourses = faker.helpers.arrayElements(
        allCourses,
        numCourses
      )

      for (const course of selectedCourses) {
        // Check if enrollment exists
        const existingEnrollment = await prisma.streamEnrollment.findFirst({
          where: { schoolId, userId: student.userId, courseId: course.id },
        })

        if (!existingEnrollment) {
          await prisma.streamEnrollment.create({
            data: {
              schoolId,
              userId: student.userId,
              courseId: course.id,
            },
          })
          enrollmentCount++

          // Create progress for some lessons (30-80% completion)
          const completionRate = faker.number.float({ min: 0.3, max: 0.8 })
          const chapters = await prisma.streamChapter.findMany({
            where: { courseId: course.id },
            include: { lessons: true },
          })

          for (const chapter of chapters) {
            const lessonsToComplete = Math.floor(
              chapter.lessons.length * completionRate
            )
            const completedLessons = chapter.lessons.slice(0, lessonsToComplete)

            for (const lesson of completedLessons) {
              await prisma.streamLessonProgress.create({
                data: {
                  lessonId: lesson.id,
                  userId: student.userId,
                  isCompleted: true,
                },
              })
              progressCount++
            }
          }
        }
      }
    }

    console.log(`   ✅ Enrollments: ${enrollmentCount}`)
    console.log(`   ✅ Progress records: ${progressCount}`)
  }

  // Summary
  const totalCourses = k12Stats.arCount + k12Stats.enCount + legacyCourseCount
  const totalChapters = k12Stats.chapterCount + legacyChapterCount
  const totalLessons = k12Stats.lessonCount + legacyLessonCount

  console.log(`\n   📊 Bilingual LMS Summary:`)
  console.log(`      ┌─────────────────────────────────────────┐`)
  console.log(
    `      │ K-12 Subject Courses: ${String(k12Stats.arCount + k12Stats.enCount).padStart(4)} (${k12Stats.arCount} AR + ${k12Stats.enCount} EN) │`
  )
  console.log(
    `      │ Legacy Courses:       ${String(legacyCourseCount).padStart(4)}                    │`
  )
  console.log(`      ├─────────────────────────────────────────┤`)
  console.log(
    `      │ Total Courses:        ${String(totalCourses).padStart(4)}                    │`
  )
  console.log(
    `      │ Total Chapters:       ${String(totalChapters).padStart(4)}                    │`
  )
  console.log(
    `      │ Total Lessons:        ${String(totalLessons).padStart(4)}                    │`
  )
  console.log(`      └─────────────────────────────────────────┘\n`)
}

// ============================================================================
// COMPREHENSIVE COURSE PROGRESS SEEDING
// ============================================================================

/**
 * Seeds comprehensive course progress data:
 * - 500+ enrollments (50% of students)
 * - 2,000+ lesson progress records
 * - Certificates for completed courses
 */
export async function seedCourseProgress(
  prisma: SeedPrisma,
  schoolId: string
): Promise<void> {
  console.log("📊 Creating comprehensive course progress data...")

  // Check existing counts
  const existingEnrollments = await prisma.streamEnrollment.count({
    where: { schoolId },
  })
  const existingProgress = await prisma.streamLessonProgress.count()
  const existingCerts = await prisma.streamCertificate.count({
    where: { schoolId },
  })

  if (existingEnrollments >= 300 && existingProgress >= 1000) {
    console.log(
      `   ✅ Progress data already exists (${existingEnrollments} enrollments, ${existingProgress} progress), skipping\n`
    )
    return
  }

  // Get students with user accounts
  const students = await prisma.student.findMany({
    where: { schoolId, userId: { not: null } },
    select: { id: true, userId: true, givenName: true },
    take: 500, // Target 500 students
  })

  // Get all courses
  const courses = await prisma.streamCourse.findMany({
    where: { schoolId },
    select: { id: true, title: true, slug: true },
  })

  // Get all lessons for progress tracking
  const lessons = await prisma.streamLesson.findMany({
    where: {
      chapter: {
        course: { schoolId },
      },
    },
    include: {
      chapter: {
        select: { courseId: true },
      },
    },
  })

  if (students.length === 0 || courses.length === 0) {
    console.log(
      "   ⚠️  No students or courses found, skipping progress seeding\n"
    )
    return
  }

  const now = new Date()
  const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

  let enrollmentCount = 0
  let progressCount = 0
  let certificateCount = 0

  // Group lessons by course for easier lookup
  const lessonsByCourse = new Map<string, typeof lessons>()
  for (const lesson of lessons) {
    const courseId = lesson.chapter.courseId
    if (!lessonsByCourse.has(courseId)) {
      lessonsByCourse.set(courseId, [])
    }
    lessonsByCourse.get(courseId)!.push(lesson)
  }

  // Enroll 50% of students in 2-4 courses each
  const enrolledStudents = students.slice(0, Math.ceil(students.length * 0.5))

  for (const [studentIndex, student] of enrolledStudents.entries()) {
    if (!student.userId) continue

    // Each student enrolls in 2-4 random courses
    const numCourses = 2 + Math.floor(Math.random() * 3)
    const selectedCourses = courses
      .sort(() => Math.random() - 0.5)
      .slice(0, numCourses)

    for (const course of selectedCourses) {
      // Check if enrollment exists
      const existingEnrollment = await prisma.streamEnrollment.findFirst({
        where: {
          schoolId,
          userId: student.userId,
          courseId: course.id,
        },
      })

      if (!existingEnrollment) {
        // Create enrollment with random status
        const status =
          Math.random() < 0.8
            ? "ACTIVE"
            : Math.random() < 0.5
              ? "PENDING"
              : "COMPLETED"

        await prisma.streamEnrollment.create({
          data: {
            schoolId,
            userId: student.userId,
            courseId: course.id,
            status: status as "ACTIVE" | "PENDING" | "COMPLETED",
            isActive: status !== "PENDING",
            createdAt: new Date(
              threeMonthsAgo.getTime() +
                Math.random() * (now.getTime() - threeMonthsAgo.getTime())
            ),
          },
        })
        enrollmentCount++
      }

      // Create lesson progress for this course
      const courseLessons = lessonsByCourse.get(course.id) || []
      if (courseLessons.length === 0) continue

      // Completion rate: 20-100% of lessons
      const completionRate = 0.2 + Math.random() * 0.8
      const lessonsToComplete = Math.floor(
        courseLessons.length * completionRate
      )

      // Sort lessons by position and complete in order
      const sortedLessons = [...courseLessons].sort(
        (a, b) => a.position - b.position
      )
      const completedLessons = sortedLessons.slice(0, lessonsToComplete)

      for (const lesson of completedLessons) {
        // Check if progress exists
        const existingProgressRecord =
          await prisma.streamLessonProgress.findFirst({
            where: {
              userId: student.userId,
              lessonId: lesson.id,
            },
          })

        if (!existingProgressRecord) {
          await prisma.streamLessonProgress.create({
            data: {
              userId: student.userId,
              lessonId: lesson.id,
              isCompleted: true,
              createdAt: new Date(
                threeMonthsAgo.getTime() +
                  Math.random() * (now.getTime() - threeMonthsAgo.getTime())
              ),
            },
          })
          progressCount++
        }
      }

      // Award certificate if course is 100% completed (10% of enrollments)
      if (completionRate >= 0.95 && Math.random() < 0.3) {
        const existingCert = await prisma.streamCertificate.findFirst({
          where: {
            schoolId,
            userId: student.userId,
            courseId: course.id,
          },
        })

        if (!existingCert) {
          const certNumber = `CERT-${schoolId.slice(0, 4).toUpperCase()}-${String(certificateCount + 1).padStart(5, "0")}`
          const completedDate = new Date(
            threeMonthsAgo.getTime() +
              Math.random() * (now.getTime() - threeMonthsAgo.getTime())
          )

          await prisma.streamCertificate.create({
            data: {
              schoolId,
              userId: student.userId,
              courseId: course.id,
              courseTitle: course.title,
              certificateNumber: certNumber,
              completedAt: completedDate,
              issuedAt: new Date(completedDate.getTime() + 24 * 60 * 60 * 1000), // Issued next day
            },
          })
          certificateCount++
        }
      }
    }

    // Progress indicator
    if ((studentIndex + 1) % 100 === 0) {
      console.log(
        `   ... processed ${studentIndex + 1}/${enrolledStudents.length} students`
      )
    }
  }

  console.log(`   ✅ Course progress data created:`)
  console.log(
    `      - ${enrollmentCount} new enrollments (${enrolledStudents.length} students)`
  )
  console.log(`      - ${progressCount} lesson progress records`)
  console.log(`      - ${certificateCount} completion certificates\n`)
}
