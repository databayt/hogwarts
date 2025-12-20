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

// ============================================================================
// LEGACY COURSES DATA - NOW BILINGUAL FORMAT
// Each course creates TWO database records (one AR, one EN)
// ============================================================================

const BILINGUAL_LEGACY_COURSES: BilingualCourseData[] = [
  // ============================================================================
  // ISLAMIC STUDIES COURSES
  // ============================================================================
  {
    slug: "quran-tajweed",
    titleAr: "القرآن الكريم - التجويد",
    titleEn: "Quran Recitation with Tajweed",
    descriptionAr:
      "تعلم أحكام التجويد وتلاوة القرآن الكريم بالطريقة الصحيحة. دورة شاملة تغطي جميع أحكام التجويد الرئيسية مع أمثلة عملية من سور مختلفة.",
    descriptionEn:
      "Learn proper Quran recitation with tajweed rules from expert reciters. This comprehensive course covers all major tajweed rules with practical examples from various surahs.",
    price: 0,
    categoryKey: "Islamic Studies",
    level: StreamCourseLevel.BEGINNER,
    imageUrl:
      "https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=800&h=450&fit=crop",
    chapters: [
      {
        titleAr: "مقدمة في التجويد",
        titleEn: "Introduction to Tajweed",
        descriptionAr: "أساسيات علم التجويد وأهميته",
        descriptionEn: "Foundation of tajweed science",
        lessons: [
          {
            titleAr: "أهمية التجويد",
            titleEn: "Importance of Tajweed",
            videoUrl: VIDEO_URLS.tajweed,
            duration: 25,
            descriptionAr: "لماذا نتعلم التجويد؟",
            descriptionEn: "Why study tajweed?",
          },
          {
            titleAr: "مخارج الحروف",
            titleEn: "Letter Articulation Points",
            videoUrl: VIDEO_URLS.tajweed,
            duration: 35,
            descriptionAr: "تعلم نطق الحروف بشكل صحيح",
            descriptionEn: "Learn correct letter pronunciation",
          },
          {
            titleAr: "صفات الحروف",
            titleEn: "Letter Characteristics",
            videoUrl: VIDEO_URLS.tajweed,
            duration: 40,
            descriptionAr: "خصائص كل حرف",
            descriptionEn: "Properties of each letter",
          },
          {
            titleAr: "تطبيق عملي",
            titleEn: "Practical Application",
            videoUrl: VIDEO_URLS.tajweed,
            duration: 30,
            descriptionAr: "تطبيق على سورة الفاتحة",
            descriptionEn: "Practice with Al-Fatiha",
          },
        ],
      },
      {
        titleAr: "أحكام النون الساكنة",
        titleEn: "Rules of Noon Sakinah",
        descriptionAr: "أحكام النون الساكنة والتنوين",
        descriptionEn: "Rules governing noon sakinah and tanween",
        lessons: [
          {
            titleAr: "الإظهار",
            titleEn: "Izhar (Clear Pronunciation)",
            videoUrl: VIDEO_URLS.tajweed,
            duration: 30,
            descriptionAr: "متى ننطق النون بوضوح",
            descriptionEn: "When to pronounce noon clearly",
          },
          {
            titleAr: "الإدغام",
            titleEn: "Idgham (Merging)",
            videoUrl: VIDEO_URLS.tajweed,
            duration: 35,
            descriptionAr: "دمج النون مع الحرف التالي",
            descriptionEn: "Merging noon with following letters",
          },
          {
            titleAr: "الإقلاب",
            titleEn: "Iqlab (Conversion)",
            videoUrl: VIDEO_URLS.tajweed,
            duration: 25,
            descriptionAr: "تحويل النون إلى ميم",
            descriptionEn: "Converting noon to meem",
          },
          {
            titleAr: "الإخفاء",
            titleEn: "Ikhfa (Concealment)",
            videoUrl: VIDEO_URLS.tajweed,
            duration: 35,
            descriptionAr: "إخفاء النون",
            descriptionEn: "Concealing the noon sound",
          },
        ],
      },
      {
        titleAr: "أحكام الميم الساكنة",
        titleEn: "Rules of Meem Sakinah",
        descriptionAr: "أحكام الميم الساكنة والشفوية",
        descriptionEn: "Meem sakinah rules",
        lessons: [
          {
            titleAr: "الإخفاء الشفوي",
            titleEn: "Oral Concealment",
            videoUrl: VIDEO_URLS.tajweed,
            duration: 25,
            descriptionAr: "إخفاء الميم الساكنة",
            descriptionEn: "Concealing the silent meem",
          },
          {
            titleAr: "الإدغام الشفوي",
            titleEn: "Oral Merging",
            videoUrl: VIDEO_URLS.tajweed,
            duration: 25,
            descriptionAr: "إدغام الميم في الميم",
            descriptionEn: "Merging meem with meem",
          },
          {
            titleAr: "الإظهار الشفوي",
            titleEn: "Oral Clear Pronunciation",
            videoUrl: VIDEO_URLS.tajweed,
            duration: 25,
            descriptionAr: "إظهار الميم الساكنة",
            descriptionEn: "Clear pronunciation of silent meem",
          },
        ],
      },
    ],
  },
  {
    slug: "seerah-nabawiyyah",
    titleAr: "السيرة النبوية",
    titleEn: "Life of Prophet Muhammad ﷺ",
    descriptionAr:
      "دراسة شاملة لسيرة النبي محمد صلى الله عليه وسلم من الميلاد إلى الوفاة. تتضمن السياق التاريخي والأحداث الرئيسية والدروس الخالدة.",
    descriptionEn:
      "Comprehensive study of the Prophet's life including historical context, key events, and timeless lessons.",
    price: 0,
    categoryKey: "Islamic Studies",
    level: StreamCourseLevel.INTERMEDIATE,
    imageUrl:
      "https://images.unsplash.com/photo-1564769625905-50e93615e769?w=800&h=450&fit=crop",
    chapters: [
      {
        titleAr: "الفترة المكية",
        titleEn: "Meccan Period",
        descriptionAr: "من الميلاد إلى الهجرة",
        descriptionEn: "From birth to migration",
        lessons: [
          {
            titleAr: "الميلاد والنشأة",
            titleEn: "Birth and Childhood",
            videoUrl: VIDEO_URLS.seerah,
            duration: 45,
            descriptionAr: "نشأة النبي في مكة",
            descriptionEn: "The Prophet's upbringing in Mecca",
          },
          {
            titleAr: "البعثة",
            titleEn: "The Revelation",
            videoUrl: VIDEO_URLS.seerah,
            duration: 50,
            descriptionAr: "بدء الوحي في غار حراء",
            descriptionEn: "Beginning of revelation in Cave Hira",
          },
          {
            titleAr: "الدعوة السرية",
            titleEn: "Secret Call",
            videoUrl: VIDEO_URLS.seerah,
            duration: 35,
            descriptionAr: "السنوات الأولى من الدعوة",
            descriptionEn: "The early years of the call",
          },
          {
            titleAr: "الدعوة الجهرية",
            titleEn: "Public Call",
            videoUrl: VIDEO_URLS.seerah,
            duration: 40,
            descriptionAr: "الدعوة العلنية ومواجهة قريش",
            descriptionEn: "Public call and confrontation with Quraish",
          },
          {
            titleAr: "الإسراء والمعراج",
            titleEn: "Night Journey",
            videoUrl: VIDEO_URLS.seerah,
            duration: 45,
            descriptionAr: "رحلة الإسراء والمعراج",
            descriptionEn: "The miraculous night journey",
          },
        ],
      },
      {
        titleAr: "الفترة المدنية",
        titleEn: "Medinan Period",
        descriptionAr: "من الهجرة إلى الوفاة",
        descriptionEn: "From migration to passing",
        lessons: [
          {
            titleAr: "الهجرة",
            titleEn: "The Migration",
            videoUrl: VIDEO_URLS.seerah,
            duration: 50,
            descriptionAr: "الهجرة من مكة إلى المدينة",
            descriptionEn: "Migration from Mecca to Medina",
          },
          {
            titleAr: "بناء الدولة",
            titleEn: "Building the State",
            videoUrl: VIDEO_URLS.seerah,
            duration: 40,
            descriptionAr: "تأسيس الدولة الإسلامية",
            descriptionEn: "Establishing the Islamic state",
          },
          {
            titleAr: "غزوة بدر",
            titleEn: "Battle of Badr",
            videoUrl: VIDEO_URLS.seerah,
            duration: 55,
            descriptionAr: "أول معركة فاصلة",
            descriptionEn: "The first decisive battle",
          },
          {
            titleAr: "غزوة أحد",
            titleEn: "Battle of Uhud",
            videoUrl: VIDEO_URLS.seerah,
            duration: 45,
            descriptionAr: "دروس من غزوة أحد",
            descriptionEn: "Lessons from the Battle of Uhud",
          },
          {
            titleAr: "فتح مكة",
            titleEn: "Conquest of Mecca",
            videoUrl: VIDEO_URLS.seerah,
            duration: 50,
            descriptionAr: "عودة الفاتحين",
            descriptionEn: "Return of the victors",
          },
          {
            titleAr: "حجة الوداع",
            titleEn: "Farewell Pilgrimage",
            videoUrl: VIDEO_URLS.seerah,
            duration: 40,
            descriptionAr: "آخر حج للنبي",
            descriptionEn: "The Prophet's final pilgrimage",
          },
        ],
      },
    ],
  },
  {
    slug: "fiqh-ibadat",
    titleAr: "الفقه الإسلامي: العبادات",
    titleEn: "Islamic Jurisprudence: Worship",
    descriptionAr:
      "أحكام العبادات في الإسلام من الطهارة إلى الحج. دراسة شاملة لأحكام العبادات الإسلامية.",
    descriptionEn:
      "Comprehensive study of Islamic worship rulings from purification to pilgrimage.",
    price: 0,
    categoryKey: "Islamic Studies",
    level: StreamCourseLevel.BEGINNER,
    imageUrl:
      "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=800&h=450&fit=crop",
    chapters: [
      {
        titleAr: "الطهارة والصلاة",
        titleEn: "Purification and Prayer",
        descriptionAr: "أحكام الوضوء والغسل والصلاة",
        descriptionEn: "Ablution and prayer rulings",
        lessons: [
          {
            titleAr: "أنواع الطهارة",
            titleEn: "Types of Purification",
            videoUrl: VIDEO_URLS.tajweed,
            duration: 30,
            descriptionAr: "التعرف على أنواع الطهارة المختلفة",
            descriptionEn: "Learning about different types of purification",
          },
          {
            titleAr: "الوضوء",
            titleEn: "Ablution (Wudu)",
            videoUrl: VIDEO_URLS.tajweed,
            duration: 35,
            descriptionAr: "كيفية الوضوء الصحيح",
            descriptionEn: "How to perform proper ablution",
          },
          {
            titleAr: "أركان الصلاة",
            titleEn: "Pillars of Prayer",
            videoUrl: VIDEO_URLS.tajweed,
            duration: 40,
            descriptionAr: "الأركان الأساسية للصلاة",
            descriptionEn: "Essential pillars of prayer",
          },
          {
            titleAr: "واجبات الصلاة",
            titleEn: "Obligations of Prayer",
            videoUrl: VIDEO_URLS.tajweed,
            duration: 35,
            descriptionAr: "الواجبات التي تجب في الصلاة",
            descriptionEn: "Obligations required in prayer",
          },
        ],
      },
      {
        titleAr: "الصيام والزكاة",
        titleEn: "Fasting and Zakat",
        descriptionAr: "أحكام الصوم والزكاة",
        descriptionEn: "Fasting and charity rulings",
        lessons: [
          {
            titleAr: "أحكام الصيام",
            titleEn: "Fasting Rulings",
            videoUrl: VIDEO_URLS.tajweed,
            duration: 40,
            descriptionAr: "قواعد وأحكام الصيام",
            descriptionEn: "Rules and rulings of fasting",
          },
          {
            titleAr: "أركان الصيام ومبطلاته",
            titleEn: "Pillars and Invalidators",
            videoUrl: VIDEO_URLS.tajweed,
            duration: 35,
            descriptionAr: "ما يصح به الصوم وما يبطله",
            descriptionEn: "What validates and invalidates fasting",
          },
          {
            titleAr: "الزكاة وأنصبتها",
            titleEn: "Zakat and Its Thresholds",
            videoUrl: VIDEO_URLS.tajweed,
            duration: 45,
            descriptionAr: "أحكام الزكاة ومقاديرها",
            descriptionEn: "Zakat rulings and amounts",
          },
        ],
      },
    ],
  },

  // ============================================================================
  // LANGUAGE COURSES
  // ============================================================================
  {
    slug: "arabic-grammar",
    titleAr: "النحو العربي",
    titleEn: "Arabic Grammar",
    descriptionAr:
      "أساسيات النحو العربي للمبتدئين والمتوسطين. دورة شاملة تغطي الجملة الاسمية والفعلية والإعراب والتراكيب المتقدمة.",
    descriptionEn:
      "Complete Arabic grammar course covering nominal and verbal sentences, cases, and advanced constructions.",
    price: 0,
    categoryKey: "Languages",
    level: StreamCourseLevel.INTERMEDIATE,
    imageUrl:
      "https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?w=800&h=450&fit=crop",
    chapters: [
      {
        titleAr: "الجملة الاسمية",
        titleEn: "Nominal Sentence",
        descriptionAr: "بناء الجملة الاسمية ومكوناتها",
        descriptionEn: "Structure of nominal sentences",
        lessons: [
          {
            titleAr: "المبتدأ والخبر",
            titleEn: "Subject and Predicate",
            videoUrl: VIDEO_URLS.arabic,
            duration: 40,
            descriptionAr: "أساسيات الجملة الاسمية",
            descriptionEn: "Basics of nominal sentence",
          },
          {
            titleAr: "أنواع الخبر",
            titleEn: "Types of Predicate",
            videoUrl: VIDEO_URLS.arabic,
            duration: 35,
            descriptionAr: "الخبر المفرد والجملة وشبه الجملة",
            descriptionEn: "Single, sentence, and semi-sentence predicates",
          },
          {
            titleAr: "كان وأخواتها",
            titleEn: "Kana and Sisters",
            videoUrl: VIDEO_URLS.arabic,
            duration: 45,
            descriptionAr: "الأفعال الناقصة",
            descriptionEn: "Deficient verbs",
          },
          {
            titleAr: "إن وأخواتها",
            titleEn: "Inna and Sisters",
            videoUrl: VIDEO_URLS.arabic,
            duration: 40,
            descriptionAr: "الحروف المشبهة بالفعل",
            descriptionEn: "Verb-like particles",
          },
        ],
      },
      {
        titleAr: "الجملة الفعلية",
        titleEn: "Verbal Sentence",
        descriptionAr: "بناء الجملة الفعلية",
        descriptionEn: "Structure of verbal sentences",
        lessons: [
          {
            titleAr: "الفعل والفاعل",
            titleEn: "Verb and Subject",
            videoUrl: VIDEO_URLS.arabic,
            duration: 35,
            descriptionAr: "أساسيات الجملة الفعلية",
            descriptionEn: "Basics of verbal sentence",
          },
          {
            titleAr: "المفعول به",
            titleEn: "Direct Object",
            videoUrl: VIDEO_URLS.arabic,
            duration: 30,
            descriptionAr: "المفاعيل في الجملة",
            descriptionEn: "Objects in the sentence",
          },
          {
            titleAr: "الفعل المبني للمجهول",
            titleEn: "Passive Voice",
            videoUrl: VIDEO_URLS.arabic,
            duration: 40,
            descriptionAr: "تحويل الفعل للمبني للمجهول",
            descriptionEn: "Converting verbs to passive voice",
          },
          {
            titleAr: "المفاعيل الخمسة",
            titleEn: "The Five Objects",
            videoUrl: VIDEO_URLS.arabic,
            duration: 45,
            descriptionAr: "المفعول المطلق، فيه، له، معه",
            descriptionEn: "Absolute, locative, and other objects",
          },
        ],
      },
    ],
  },
  {
    slug: "english-language-mastery",
    titleAr: "إتقان اللغة الإنجليزية",
    titleEn: "English Language Mastery",
    descriptionAr:
      "مهارات شاملة في اللغة الإنجليزية للنجاح الأكاديمي. إتقان القواعد والكتابة والفهم القرائي وبناء المفردات.",
    descriptionEn:
      "Comprehensive English skills for academic success. Master grammar, writing, reading comprehension, and vocabulary building.",
    price: 0,
    categoryKey: "Languages",
    level: StreamCourseLevel.INTERMEDIATE,
    imageUrl:
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=450&fit=crop",
    chapters: [
      {
        titleAr: "أساسيات القواعد",
        titleEn: "Grammar Essentials",
        descriptionAr: "قواعد وتراكيب اللغة الأساسية",
        descriptionEn: "Core grammar rules and structures",
        lessons: [
          {
            titleAr: "نظرة عامة على الأزمنة",
            titleEn: "Tenses Overview",
            videoUrl: VIDEO_URLS.english,
            duration: 45,
            descriptionAr: "فهم جميع أزمنة اللغة الإنجليزية",
            descriptionEn: "Understanding all English tenses",
          },
          {
            titleAr: "المضارع والماضي",
            titleEn: "Present & Past Tense",
            videoUrl: VIDEO_URLS.english,
            duration: 40,
            descriptionAr: "الأشكال البسيطة والمستمرة والتامة",
            descriptionEn: "Simple, continuous, perfect forms",
          },
          {
            titleAr: "المستقبل والشرطي",
            titleEn: "Future & Conditional",
            videoUrl: VIDEO_URLS.english,
            duration: 35,
            descriptionAr: "أشكال المستقبل والجمل الشرطية",
            descriptionEn: "Future forms and conditionals",
          },
          {
            titleAr: "الأفعال الناقصة",
            titleEn: "Modal Verbs",
            videoUrl: VIDEO_URLS.english,
            duration: 30,
            descriptionAr: "can, could, should, must وغيرها",
            descriptionEn: "Can, could, should, must, etc.",
          },
        ],
      },
      {
        titleAr: "الكتابة الأكاديمية",
        titleEn: "Academic Writing",
        descriptionAr: "مهارات الكتابة للنجاح الأكاديمي",
        descriptionEn: "Writing skills for academic success",
        lessons: [
          {
            titleAr: "هيكل المقال",
            titleEn: "Essay Structure",
            videoUrl: VIDEO_URLS.english,
            duration: 40,
            descriptionAr: "المقدمة والمتن والخاتمة",
            descriptionEn: "Introduction, body, conclusion",
          },
          {
            titleAr: "كتابة البحث",
            titleEn: "Research Writing",
            videoUrl: VIDEO_URLS.english,
            duration: 45,
            descriptionAr: "أوراق البحث الأكاديمي",
            descriptionEn: "Academic research papers",
          },
          {
            titleAr: "الاستشهادات والمراجع",
            titleEn: "Citations & References",
            videoUrl: VIDEO_URLS.english,
            duration: 35,
            descriptionAr: "تنسيق APA و MLA",
            descriptionEn: "APA and MLA formatting",
          },
          {
            titleAr: "الكتابة الإقناعية",
            titleEn: "Persuasive Writing",
            videoUrl: VIDEO_URLS.english,
            duration: 40,
            descriptionAr: "المقالات الجدلية",
            descriptionEn: "Argumentative essays",
          },
        ],
      },
      {
        titleAr: "الفهم القرائي",
        titleEn: "Reading Comprehension",
        descriptionAr: "مهارات القراءة المتقدمة",
        descriptionEn: "Advanced reading skills",
        lessons: [
          {
            titleAr: "استراتيجيات القراءة الفعالة",
            titleEn: "Active Reading Strategies",
            videoUrl: VIDEO_URLS.english,
            duration: 35,
            descriptionAr: "كيفية القراءة بفعالية",
            descriptionEn: "How to read effectively",
          },
          {
            titleAr: "الاستنتاج والتحليل",
            titleEn: "Inference and Analysis",
            videoUrl: VIDEO_URLS.english,
            duration: 40,
            descriptionAr: "القراءة بين السطور",
            descriptionEn: "Reading between the lines",
          },
          {
            titleAr: "التفكير النقدي",
            titleEn: "Critical Thinking",
            videoUrl: VIDEO_URLS.english,
            duration: 45,
            descriptionAr: "تقييم الحجج والأدلة",
            descriptionEn: "Evaluating arguments and evidence",
          },
        ],
      },
    ],
  },

  // ============================================================================
  // MATHEMATICS COURSES
  // ============================================================================
  {
    slug: "advanced-mathematics",
    titleAr: "الرياضيات المتقدمة",
    titleEn: "Advanced Mathematics",
    descriptionAr:
      "دورة شاملة في التفاضل والتكامل والجبر الخطي. مصممة لطلاب المرحلة الثانوية.",
    descriptionEn:
      "Comprehensive course covering calculus, linear algebra, and differential equations for high school students.",
    price: 0,
    categoryKey: "Mathematics",
    level: StreamCourseLevel.ADVANCED,
    imageUrl:
      "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&h=450&fit=crop",
    chapters: [
      {
        titleAr: "التفاضل",
        titleEn: "Calculus - Differentiation",
        descriptionAr: "مفاهيم التفاضل والمشتقات",
        descriptionEn: "Differentiation concepts",
        lessons: [
          {
            titleAr: "النهايات",
            titleEn: "Limits",
            videoUrl: VIDEO_URLS.math,
            duration: 45,
            descriptionAr: "مفهوم النهاية وحسابها",
            descriptionEn: "Concept and calculation of limits",
          },
          {
            titleAr: "المشتقات",
            titleEn: "Derivatives",
            videoUrl: VIDEO_URLS.math,
            duration: 50,
            descriptionAr: "قواعد الاشتقاق",
            descriptionEn: "Differentiation rules",
          },
          {
            titleAr: "قاعدة السلسلة",
            titleEn: "Chain Rule",
            videoUrl: VIDEO_URLS.math,
            duration: 40,
            descriptionAr: "اشتقاق الدوال المركبة",
            descriptionEn: "Differentiating composite functions",
          },
          {
            titleAr: "تطبيقات المشتقات",
            titleEn: "Applications",
            videoUrl: VIDEO_URLS.math,
            duration: 45,
            descriptionAr: "المعدلات والأمثلة",
            descriptionEn: "Rates and optimization",
          },
        ],
      },
      {
        titleAr: "التكامل",
        titleEn: "Calculus - Integration",
        descriptionAr: "مفاهيم التكامل",
        descriptionEn: "Integration concepts",
        lessons: [
          {
            titleAr: "التكامل غير المحدد",
            titleEn: "Indefinite Integrals",
            videoUrl: VIDEO_URLS.math,
            duration: 45,
            descriptionAr: "التكامل بدون حدود",
            descriptionEn: "Integrals without bounds",
          },
          {
            titleAr: "التكامل المحدد",
            titleEn: "Definite Integrals",
            videoUrl: VIDEO_URLS.math,
            duration: 50,
            descriptionAr: "التكامل مع الحدود",
            descriptionEn: "Integrals with bounds",
          },
          {
            titleAr: "التكامل بالتعويض",
            titleEn: "Integration by Substitution",
            videoUrl: VIDEO_URLS.math,
            duration: 40,
            descriptionAr: "طريقة التعويض في التكامل",
            descriptionEn: "Substitution method for integration",
          },
          {
            titleAr: "المساحات والحجوم",
            titleEn: "Areas and Volumes",
            videoUrl: VIDEO_URLS.math,
            duration: 55,
            descriptionAr: "حساب المساحات والحجوم",
            descriptionEn: "Calculating areas and volumes",
          },
        ],
      },
      {
        titleAr: "الجبر الخطي",
        titleEn: "Linear Algebra",
        descriptionAr: "المصفوفات والمتجهات",
        descriptionEn: "Matrices and vectors",
        lessons: [
          {
            titleAr: "المصفوفات",
            titleEn: "Matrices",
            videoUrl: VIDEO_URLS.math,
            duration: 40,
            descriptionAr: "أساسيات المصفوفات",
            descriptionEn: "Matrix fundamentals",
          },
          {
            titleAr: "المحددات",
            titleEn: "Determinants",
            videoUrl: VIDEO_URLS.math,
            duration: 35,
            descriptionAr: "حساب المحددات",
            descriptionEn: "Calculating determinants",
          },
          {
            titleAr: "المتجهات",
            titleEn: "Vectors",
            videoUrl: VIDEO_URLS.math,
            duration: 45,
            descriptionAr: "أساسيات المتجهات",
            descriptionEn: "Vector fundamentals",
          },
          {
            titleAr: "التحويلات الخطية",
            titleEn: "Linear Transformations",
            videoUrl: VIDEO_URLS.math,
            duration: 50,
            descriptionAr: "فهم التحويلات الخطية",
            descriptionEn: "Understanding linear transformations",
          },
        ],
      },
    ],
  },
  {
    slug: "algebra-middle-school",
    titleAr: "الجبر للمرحلة المتوسطة",
    titleEn: "Algebra for Middle School",
    descriptionAr: "أساسيات الجبر للصفوف 7-9. مفاهيم الجبر التأسيسية.",
    descriptionEn: "Foundational algebra concepts for grades 7-9.",
    price: 0,
    categoryKey: "Mathematics",
    level: StreamCourseLevel.BEGINNER,
    imageUrl:
      "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&h=450&fit=crop",
    chapters: [
      {
        titleAr: "المتغيرات والتعبيرات",
        titleEn: "Variables and Expressions",
        descriptionAr: "أساسيات الجبر",
        descriptionEn: "Algebra basics",
        lessons: [
          {
            titleAr: "ما هو المتغير؟",
            titleEn: "What is a Variable?",
            videoUrl: VIDEO_URLS.math,
            duration: 25,
            descriptionAr: "فهم مفهوم المتغير",
            descriptionEn: "Understanding the variable concept",
          },
          {
            titleAr: "التعبيرات الجبرية",
            titleEn: "Algebraic Expressions",
            videoUrl: VIDEO_URLS.math,
            duration: 30,
            descriptionAr: "كتابة التعبيرات الجبرية",
            descriptionEn: "Writing algebraic expressions",
          },
          {
            titleAr: "تبسيط التعبيرات",
            titleEn: "Simplifying Expressions",
            videoUrl: VIDEO_URLS.math,
            duration: 35,
            descriptionAr: "تبسيط التعبيرات الجبرية",
            descriptionEn: "Simplifying algebraic expressions",
          },
        ],
      },
      {
        titleAr: "المعادلات",
        titleEn: "Equations",
        descriptionAr: "حل المعادلات الخطية",
        descriptionEn: "Solving linear equations",
        lessons: [
          {
            titleAr: "المعادلات البسيطة",
            titleEn: "Simple Equations",
            videoUrl: VIDEO_URLS.math,
            duration: 30,
            descriptionAr: "حل المعادلات بخطوة واحدة",
            descriptionEn: "Solving one-step equations",
          },
          {
            titleAr: "معادلات بخطوتين",
            titleEn: "Two-Step Equations",
            videoUrl: VIDEO_URLS.math,
            duration: 35,
            descriptionAr: "حل المعادلات بخطوتين",
            descriptionEn: "Solving two-step equations",
          },
          {
            titleAr: "معادلات بمتغيرات على الجانبين",
            titleEn: "Variables on Both Sides",
            videoUrl: VIDEO_URLS.math,
            duration: 40,
            descriptionAr: "حل المعادلات بمتغيرات على الجانبين",
            descriptionEn: "Solving equations with variables on both sides",
          },
        ],
      },
    ],
  },

  // ============================================================================
  // SCIENCE COURSES
  // ============================================================================
  {
    slug: "physics-mechanics",
    titleAr: "الفيزياء: الميكانيكا",
    titleEn: "Physics: Mechanics",
    descriptionAr:
      "دراسة الميكانيكا الكلاسيكية والقوى والحركة. تغطي قوانين نيوتن والطاقة والزخم والتطبيقات العملية.",
    descriptionEn:
      "Classical mechanics covering Newton's laws, energy, momentum, and real-world applications.",
    price: 0,
    categoryKey: "Science",
    level: StreamCourseLevel.INTERMEDIATE,
    imageUrl:
      "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=800&h=450&fit=crop",
    chapters: [
      {
        titleAr: "قوانين نيوتن",
        titleEn: "Newton's Laws",
        descriptionAr: "أساسيات الميكانيكا الكلاسيكية",
        descriptionEn: "Classical mechanics fundamentals",
        lessons: [
          {
            titleAr: "القانون الأول: القصور الذاتي",
            titleEn: "First Law: Inertia",
            videoUrl: VIDEO_URLS.physics,
            duration: 35,
            descriptionAr: "قانون القصور الذاتي",
            descriptionEn: "Law of inertia",
          },
          {
            titleAr: "القانون الثاني: F=ma",
            titleEn: "Second Law: F=ma",
            videoUrl: VIDEO_URLS.physics,
            duration: 40,
            descriptionAr: "العلاقة بين القوة والكتلة والتسارع",
            descriptionEn: "Relationship between force, mass, and acceleration",
          },
          {
            titleAr: "القانون الثالث: الفعل ورد الفعل",
            titleEn: "Third Law: Action-Reaction",
            videoUrl: VIDEO_URLS.physics,
            duration: 35,
            descriptionAr: "لكل فعل رد فعل مساوٍ ومعاكس",
            descriptionEn:
              "For every action there is an equal and opposite reaction",
          },
          {
            titleAr: "تطبيقات عملية",
            titleEn: "Practical Applications",
            videoUrl: VIDEO_URLS.physics,
            duration: 45,
            descriptionAr: "تطبيق قوانين نيوتن في الحياة",
            descriptionEn: "Applying Newton's laws in real life",
          },
        ],
      },
      {
        titleAr: "الطاقة والشغل",
        titleEn: "Energy and Work",
        descriptionAr: "مفاهيم الطاقة والحركة",
        descriptionEn: "Energy concepts",
        lessons: [
          {
            titleAr: "الشغل",
            titleEn: "Work",
            videoUrl: VIDEO_URLS.physics,
            duration: 30,
            descriptionAr: "مفهوم الشغل الفيزيائي",
            descriptionEn: "Physical work concept",
          },
          {
            titleAr: "الطاقة الحركية",
            titleEn: "Kinetic Energy",
            videoUrl: VIDEO_URLS.physics,
            duration: 35,
            descriptionAr: "طاقة الحركة",
            descriptionEn: "Energy of motion",
          },
          {
            titleAr: "الطاقة الكامنة",
            titleEn: "Potential Energy",
            videoUrl: VIDEO_URLS.physics,
            duration: 35,
            descriptionAr: "الطاقة المخزنة",
            descriptionEn: "Stored energy",
          },
          {
            titleAr: "حفظ الطاقة",
            titleEn: "Conservation of Energy",
            videoUrl: VIDEO_URLS.physics,
            duration: 45,
            descriptionAr: "قانون حفظ الطاقة",
            descriptionEn: "Law of conservation of energy",
          },
        ],
      },
    ],
  },
  {
    slug: "chemistry-fundamentals",
    titleAr: "الكيمياء: أساسيات",
    titleEn: "Chemistry Fundamentals",
    descriptionAr:
      "مقدمة في الكيمياء العامة. تغطي بنية الذرة والروابط والتفاعلات الكيميائية.",
    descriptionEn:
      "Introduction to general chemistry covering atomic structure, bonding, and reactions.",
    price: 0,
    categoryKey: "Science",
    level: StreamCourseLevel.BEGINNER,
    imageUrl:
      "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&h=450&fit=crop",
    chapters: [
      {
        titleAr: "بنية الذرة",
        titleEn: "Atomic Structure",
        descriptionAr: "فهم تركيب الذرة",
        descriptionEn: "Understanding atomic composition",
        lessons: [
          {
            titleAr: "مكونات الذرة",
            titleEn: "Components of an Atom",
            videoUrl: VIDEO_URLS.chemistry,
            duration: 30,
            descriptionAr: "البروتونات والنيوترونات والإلكترونات",
            descriptionEn: "Protons, neutrons, and electrons",
          },
          {
            titleAr: "النموذج الذري",
            titleEn: "Atomic Models",
            videoUrl: VIDEO_URLS.chemistry,
            duration: 35,
            descriptionAr: "تطور النماذج الذرية",
            descriptionEn: "Evolution of atomic models",
          },
          {
            titleAr: "التوزيع الإلكتروني",
            titleEn: "Electron Configuration",
            videoUrl: VIDEO_URLS.chemistry,
            duration: 40,
            descriptionAr: "توزيع الإلكترونات في الذرة",
            descriptionEn: "Distribution of electrons in atoms",
          },
        ],
      },
      {
        titleAr: "الجدول الدوري",
        titleEn: "Periodic Table",
        descriptionAr: "فهم الجدول الدوري",
        descriptionEn: "Understanding the periodic table",
        lessons: [
          {
            titleAr: "تنظيم الجدول الدوري",
            titleEn: "Organization of the Periodic Table",
            videoUrl: VIDEO_URLS.chemistry,
            duration: 35,
            descriptionAr: "كيفية ترتيب العناصر",
            descriptionEn: "How elements are arranged",
          },
          {
            titleAr: "الاتجاهات الدورية",
            titleEn: "Periodic Trends",
            videoUrl: VIDEO_URLS.chemistry,
            duration: 40,
            descriptionAr: "الأنماط في الجدول الدوري",
            descriptionEn: "Patterns in the periodic table",
          },
          {
            titleAr: "المجموعات والدورات",
            titleEn: "Groups and Periods",
            videoUrl: VIDEO_URLS.chemistry,
            duration: 35,
            descriptionAr: "فهم المجموعات والدورات",
            descriptionEn: "Understanding groups and periods",
          },
        ],
      },
    ],
  },
  {
    slug: "biology-cell",
    titleAr: "الأحياء: علم الخلية",
    titleEn: "Biology: Cell Biology",
    descriptionAr:
      "دراسة الخلية وعملياتها الحيوية. دراسة شاملة لتركيب الخلية ووظائفها وعملياتها.",
    descriptionEn:
      "Comprehensive study of cell structure, function, and processes.",
    price: 0,
    categoryKey: "Science",
    level: StreamCourseLevel.INTERMEDIATE,
    imageUrl:
      "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800&h=450&fit=crop",
    chapters: [
      {
        titleAr: "تركيب الخلية",
        titleEn: "Cell Structure",
        descriptionAr: "العضيات الخلوية ووظائفها",
        descriptionEn: "Cell organelles and functions",
        lessons: [
          {
            titleAr: "أنواع الخلايا",
            titleEn: "Types of Cells",
            videoUrl: VIDEO_URLS.biology,
            duration: 30,
            descriptionAr: "الخلايا حقيقية النواة وبدائية النواة",
            descriptionEn: "Prokaryotic and eukaryotic cells",
          },
          {
            titleAr: "النواة",
            titleEn: "The Nucleus",
            videoUrl: VIDEO_URLS.biology,
            duration: 35,
            descriptionAr: "مركز التحكم في الخلية",
            descriptionEn: "The cell's control center",
          },
          {
            titleAr: "العضيات الخلوية",
            titleEn: "Cell Organelles",
            videoUrl: VIDEO_URLS.biology,
            duration: 45,
            descriptionAr: "الميتوكوندريا والريبوسومات وغيرها",
            descriptionEn: "Mitochondria, ribosomes, and more",
          },
          {
            titleAr: "غشاء الخلية",
            titleEn: "Cell Membrane",
            videoUrl: VIDEO_URLS.biology,
            duration: 35,
            descriptionAr: "الحاجز الانتقائي للخلية",
            descriptionEn: "The cell's selective barrier",
          },
        ],
      },
      {
        titleAr: "عمليات الخلية",
        titleEn: "Cell Processes",
        descriptionAr: "العمليات الحيوية في الخلية",
        descriptionEn: "Biological processes",
        lessons: [
          {
            titleAr: "الانقسام الخلوي",
            titleEn: "Cell Division",
            videoUrl: VIDEO_URLS.biology,
            duration: 45,
            descriptionAr: "الانقسام المتساوي والاختزالي",
            descriptionEn: "Mitosis and meiosis",
          },
          {
            titleAr: "التنفس الخلوي",
            titleEn: "Cellular Respiration",
            videoUrl: VIDEO_URLS.biology,
            duration: 50,
            descriptionAr: "إنتاج الطاقة في الخلية",
            descriptionEn: "Energy production in cells",
          },
          {
            titleAr: "البناء الضوئي",
            titleEn: "Photosynthesis",
            videoUrl: VIDEO_URLS.biology,
            duration: 45,
            descriptionAr: "تحويل الضوء إلى طاقة",
            descriptionEn: "Converting light to energy",
          },
        ],
      },
    ],
  },

  // ============================================================================
  // PROGRAMMING COURSES
  // ============================================================================
  {
    slug: "intro-programming",
    titleAr: "مقدمة في البرمجة",
    titleEn: "Introduction to Programming",
    descriptionAr:
      "تعلم أساسيات البرمجة باستخدام بايثون. مثالي للمبتدئين بدون خبرة سابقة.",
    descriptionEn:
      "Learn programming fundamentals with Python. Perfect for beginners with no prior experience.",
    price: 0,
    categoryKey: "Programming",
    level: StreamCourseLevel.BEGINNER,
    imageUrl:
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&h=450&fit=crop",
    chapters: [
      {
        titleAr: "البداية مع بايثون",
        titleEn: "Getting Started with Python",
        descriptionAr: "إعداد بيئة التطوير",
        descriptionEn: "Setting up your development environment",
        lessons: [
          {
            titleAr: "ما هي البرمجة؟",
            titleEn: "What is Programming?",
            videoUrl: VIDEO_URLS.programming,
            duration: 20,
            descriptionAr: "مقدمة عن عالم البرمجة",
            descriptionEn: "Introduction to the programming world",
          },
          {
            titleAr: "تثبيت بايثون",
            titleEn: "Installing Python",
            videoUrl: VIDEO_URLS.programming,
            duration: 25,
            descriptionAr: "كيفية تثبيت بايثون على جهازك",
            descriptionEn: "How to install Python on your machine",
          },
          {
            titleAr: "برنامجك الأول",
            titleEn: "Your First Program",
            videoUrl: VIDEO_URLS.programming,
            duration: 30,
            descriptionAr: "كتابة أول برنامج بايثون",
            descriptionEn: "Writing your first Python program",
          },
          {
            titleAr: "استخدام IDLE",
            titleEn: "Using IDLE",
            videoUrl: VIDEO_URLS.programming,
            duration: 25,
            descriptionAr: "التعرف على بيئة IDLE",
            descriptionEn: "Getting to know the IDLE environment",
          },
        ],
      },
      {
        titleAr: "أساسيات بايثون",
        titleEn: "Python Basics",
        descriptionAr: "المتغيرات والعمليات",
        descriptionEn: "Variables and operations",
        lessons: [
          {
            titleAr: "المتغيرات",
            titleEn: "Variables",
            videoUrl: VIDEO_URLS.programming,
            duration: 35,
            descriptionAr: "تخزين البيانات في المتغيرات",
            descriptionEn: "Storing data in variables",
          },
          {
            titleAr: "أنواع البيانات",
            titleEn: "Data Types",
            videoUrl: VIDEO_URLS.programming,
            duration: 40,
            descriptionAr: "الأنواع المختلفة للبيانات",
            descriptionEn: "Different types of data",
          },
          {
            titleAr: "العمليات الحسابية",
            titleEn: "Operators",
            videoUrl: VIDEO_URLS.programming,
            duration: 30,
            descriptionAr: "العمليات الرياضية في بايثون",
            descriptionEn: "Mathematical operations in Python",
          },
          {
            titleAr: "المدخلات والمخرجات",
            titleEn: "Input and Output",
            videoUrl: VIDEO_URLS.programming,
            duration: 35,
            descriptionAr: "التفاعل مع المستخدم",
            descriptionEn: "Interacting with the user",
          },
        ],
      },
      {
        titleAr: "التحكم بالتدفق",
        titleEn: "Control Flow",
        descriptionAr: "الشروط والحلقات",
        descriptionEn: "Conditions and loops",
        lessons: [
          {
            titleAr: "جمل الشرط if",
            titleEn: "If Statements",
            videoUrl: VIDEO_URLS.programming,
            duration: 40,
            descriptionAr: "اتخاذ القرارات في البرنامج",
            descriptionEn: "Making decisions in your program",
          },
          {
            titleAr: "حلقة while",
            titleEn: "While Loops",
            videoUrl: VIDEO_URLS.programming,
            duration: 35,
            descriptionAr: "تكرار الأوامر",
            descriptionEn: "Repeating commands",
          },
          {
            titleAr: "حلقة for",
            titleEn: "For Loops",
            videoUrl: VIDEO_URLS.programming,
            duration: 40,
            descriptionAr: "التكرار على المجموعات",
            descriptionEn: "Iterating over collections",
          },
          {
            titleAr: "الدوال",
            titleEn: "Functions",
            videoUrl: VIDEO_URLS.programming,
            duration: 45,
            descriptionAr: "إنشاء دوال قابلة لإعادة الاستخدام",
            descriptionEn: "Creating reusable functions",
          },
        ],
      },
    ],
  },
  {
    slug: "web-development",
    titleAr: "تطوير الويب",
    titleEn: "Web Development Basics",
    descriptionAr:
      "تعلم HTML, CSS, JavaScript. تعلم بناء مواقع الويب من الصفر.",
    descriptionEn:
      "Learn HTML, CSS, JavaScript. Learn to build websites from scratch.",
    price: 0,
    categoryKey: "Programming",
    level: StreamCourseLevel.BEGINNER,
    imageUrl:
      "https://images.unsplash.com/photo-1547658719-da2b51169166?w=800&h=450&fit=crop",
    chapters: [
      {
        titleAr: "أساسيات HTML",
        titleEn: "HTML Fundamentals",
        descriptionAr: "بناء صفحات الويب",
        descriptionEn: "Building web pages",
        lessons: [
          {
            titleAr: "مقدمة في HTML",
            titleEn: "Introduction to HTML",
            videoUrl: VIDEO_URLS.programming,
            duration: 30,
            descriptionAr: "ما هي HTML؟",
            descriptionEn: "What is HTML?",
          },
          {
            titleAr: "العناصر والوسوم",
            titleEn: "Elements and Tags",
            videoUrl: VIDEO_URLS.programming,
            duration: 35,
            descriptionAr: "بناء الصفحات بالوسوم",
            descriptionEn: "Building pages with tags",
          },
          {
            titleAr: "الروابط والصور",
            titleEn: "Links and Images",
            videoUrl: VIDEO_URLS.programming,
            duration: 30,
            descriptionAr: "إضافة الروابط والصور",
            descriptionEn: "Adding links and images",
          },
          {
            titleAr: "النماذج",
            titleEn: "Forms",
            videoUrl: VIDEO_URLS.programming,
            duration: 40,
            descriptionAr: "إنشاء نماذج المستخدم",
            descriptionEn: "Creating user forms",
          },
        ],
      },
      {
        titleAr: "تنسيق CSS",
        titleEn: "CSS Styling",
        descriptionAr: "تنسيق صفحات الويب",
        descriptionEn: "Styling web pages",
        lessons: [
          {
            titleAr: "مقدمة في CSS",
            titleEn: "Introduction to CSS",
            videoUrl: VIDEO_URLS.programming,
            duration: 35,
            descriptionAr: "أساسيات التنسيق",
            descriptionEn: "Styling basics",
          },
          {
            titleAr: "الألوان والخطوط",
            titleEn: "Colors and Fonts",
            videoUrl: VIDEO_URLS.programming,
            duration: 30,
            descriptionAr: "تخصيص المظهر",
            descriptionEn: "Customizing appearance",
          },
          {
            titleAr: "نموذج الصندوق",
            titleEn: "Box Model",
            videoUrl: VIDEO_URLS.programming,
            duration: 40,
            descriptionAr: "فهم نموذج الصندوق",
            descriptionEn: "Understanding the box model",
          },
          {
            titleAr: "فلكس بوكس",
            titleEn: "Flexbox",
            videoUrl: VIDEO_URLS.programming,
            duration: 45,
            descriptionAr: "تخطيط مرن للصفحات",
            descriptionEn: "Flexible page layouts",
          },
        ],
      },
    ],
  },

  // ============================================================================
  // HUMANITIES COURSES
  // ============================================================================
  {
    slug: "sudanese-history",
    titleAr: "تاريخ السودان",
    titleEn: "Sudanese History",
    descriptionAr:
      "دراسة شاملة لتاريخ السودان من الممالك القديمة إلى العصر الحديث.",
    descriptionEn:
      "Comprehensive study of Sudan's history from ancient kingdoms to modern era.",
    price: 0,
    categoryKey: "Humanities",
    level: StreamCourseLevel.INTERMEDIATE,
    imageUrl:
      "https://images.unsplash.com/photo-1590845947670-c009801ffa74?w=800&h=450&fit=crop",
    chapters: [
      {
        titleAr: "الممالك القديمة",
        titleEn: "Ancient Kingdoms",
        descriptionAr: "الحضارات القديمة في السودان",
        descriptionEn: "Ancient civilizations",
        lessons: [
          {
            titleAr: "مملكة كوش",
            titleEn: "Kingdom of Kush",
            videoUrl: VIDEO_URLS.history,
            duration: 45,
            descriptionAr: "تاريخ مملكة كوش العظيمة",
            descriptionEn: "History of the great Kingdom of Kush",
          },
          {
            titleAr: "نبتة ومروي",
            titleEn: "Napata and Meroe",
            videoUrl: VIDEO_URLS.history,
            duration: 50,
            descriptionAr: "العاصمتان القديمتان",
            descriptionEn: "The ancient capitals",
          },
          {
            titleAr: "الممالك المسيحية",
            titleEn: "Christian Kingdoms",
            videoUrl: VIDEO_URLS.history,
            duration: 45,
            descriptionAr: "فترة الممالك المسيحية",
            descriptionEn: "Period of Christian kingdoms",
          },
          {
            titleAr: "الآثار السودانية",
            titleEn: "Sudanese Artifacts",
            videoUrl: VIDEO_URLS.history,
            duration: 40,
            descriptionAr: "الكنوز الأثرية السودانية",
            descriptionEn: "Sudanese archaeological treasures",
          },
        ],
      },
      {
        titleAr: "السودان الحديث",
        titleEn: "Modern Sudan",
        descriptionAr: "من الدولة المهدية إلى الاستقلال",
        descriptionEn: "From Mahdist state to independence",
        lessons: [
          {
            titleAr: "الدولة المهدية",
            titleEn: "Mahdist State",
            videoUrl: VIDEO_URLS.history,
            duration: 50,
            descriptionAr: "قيام الدولة المهدية",
            descriptionEn: "Rise of the Mahdist state",
          },
          {
            titleAr: "الحكم الثنائي",
            titleEn: "Condominium Rule",
            videoUrl: VIDEO_URLS.history,
            duration: 45,
            descriptionAr: "فترة الحكم الثنائي",
            descriptionEn: "Period of Anglo-Egyptian rule",
          },
          {
            titleAr: "الاستقلال",
            titleEn: "Independence",
            videoUrl: VIDEO_URLS.history,
            duration: 40,
            descriptionAr: "استقلال السودان",
            descriptionEn: "Sudan's independence",
          },
          {
            titleAr: "السودان المعاصر",
            titleEn: "Contemporary Sudan",
            videoUrl: VIDEO_URLS.history,
            duration: 45,
            descriptionAr: "السودان في العصر الحديث",
            descriptionEn: "Sudan in the modern era",
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

  // Phase 3: Seed legacy courses (now bilingual using BILINGUAL_LEGACY_COURSES)
  console.log("   📖 Seeding legacy courses (bilingual)...")
  let legacyArCount = 0
  let legacyEnCount = 0
  let legacyChapterCount = 0
  let legacyLessonCount = 0

  for (const courseData of BILINGUAL_LEGACY_COURSES) {
    // Check if course already exists (both languages)
    const existingCourse = await prisma.streamCourse.findFirst({
      where: { schoolId, slug: courseData.slug },
    })

    if (!existingCourse) {
      // Create bilingual course (creates AR + EN versions)
      await createBilingualCourse({
        prisma,
        schoolId,
        course: courseData,
        categoryMap,
        teacherId,
      })

      legacyArCount++
      legacyEnCount++
      legacyChapterCount += courseData.chapters.length * 2 // Both AR and EN
      legacyLessonCount +=
        courseData.chapters.reduce((sum, ch) => sum + ch.lessons.length, 0) * 2
    }
  }

  console.log(
    `   ✅ Legacy courses: ${legacyArCount} AR + ${legacyEnCount} EN = ${legacyArCount + legacyEnCount} total`
  )
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

  // Summary (all bilingual now)
  const legacyTotal = legacyArCount + legacyEnCount
  const totalCourses = k12Stats.arCount + k12Stats.enCount + legacyTotal
  const totalChapters = k12Stats.chapterCount + legacyChapterCount
  const totalLessons = k12Stats.lessonCount + legacyLessonCount

  console.log(`\n   📊 Bilingual LMS Summary:`)
  console.log(`      ┌─────────────────────────────────────────────────┐`)
  console.log(
    `      │ K-12 Subject Courses: ${String(k12Stats.arCount + k12Stats.enCount).padStart(4)} (${k12Stats.arCount} AR + ${k12Stats.enCount} EN)     │`
  )
  console.log(
    `      │ Legacy Courses:       ${String(legacyTotal).padStart(4)} (${legacyArCount} AR + ${legacyEnCount} EN)     │`
  )
  console.log(`      ├─────────────────────────────────────────────────┤`)
  console.log(
    `      │ Total Courses:        ${String(totalCourses).padStart(4)}                        │`
  )
  console.log(
    `      │ Total Chapters:       ${String(totalChapters).padStart(4)}                        │`
  )
  console.log(
    `      │ Total Lessons:        ${String(totalLessons).padStart(4)}                        │`
  )
  console.log(`      └─────────────────────────────────────────────────┘\n`)
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
