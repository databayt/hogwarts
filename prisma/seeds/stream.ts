/**
 * Stream (LMS) Seed
 * Creates Courses, Chapters, and Video content
 *
 * Phase 7: LMS / Stream
 */

import type { PrismaClient } from "@prisma/client"

import { SUBJECTS } from "./constants"
import type { SubjectRef, UserRef } from "./types"
import { logSuccess, processBatch, slugify } from "./utils"

// ============================================================================
// STREAM CATEGORIES
// ============================================================================

const STREAM_CATEGORIES = [
  { nameEn: "Languages", nameAr: "اللغات" },
  { nameEn: "Sciences", nameAr: "العلوم" },
  { nameEn: "Humanities", nameAr: "العلوم الإنسانية" },
  { nameEn: "Religion", nameAr: "الدين" },
  { nameEn: "ICT", nameAr: "تقنية المعلومات" },
  { nameEn: "Arts & PE", nameAr: "الفنون والرياضة" },
]

// ============================================================================
// STREAM SEEDING
// ============================================================================

/**
 * Seed stream categories (creates both EN and AR versions)
 */
async function seedStreamCategories(
  prisma: PrismaClient,
  schoolId: string
): Promise<Map<string, string>> {
  const categoryMap = new Map<string, string>()

  for (const cat of STREAM_CATEGORIES) {
    // Create English version
    try {
      const categoryEn = await prisma.streamCategory.upsert({
        where: {
          name_schoolId_lang: {
            name: cat.nameEn,
            schoolId,
            lang: "en",
          },
        },
        update: {},
        create: {
          schoolId,
          name: cat.nameEn,
          lang: "en",
        },
      })
      categoryMap.set(cat.nameEn, categoryEn.id)
    } catch {
      // Already exists
    }

    // Create Arabic version
    try {
      await prisma.streamCategory.upsert({
        where: {
          name_schoolId_lang: {
            name: cat.nameAr,
            schoolId,
            lang: "ar",
          },
        },
        update: {},
        create: {
          schoolId,
          name: cat.nameAr,
          lang: "ar",
        },
      })
    } catch {
      // Already exists
    }
  }

  logSuccess("Stream Categories", STREAM_CATEGORIES.length * 2, "EN + AR")

  return categoryMap
}

/**
 * Seed stream courses (one per subject)
 */
export async function seedStreamCourses(
  prisma: PrismaClient,
  schoolId: string,
  subjects: SubjectRef[],
  adminUsers: UserRef[]
): Promise<number> {
  const categoryMap = await seedStreamCategories(prisma, schoolId)
  let courseCount = 0

  // Get an admin user to be the instructor
  const instructor = adminUsers.find((u) => u.role === "ADMIN") || adminUsers[0]
  if (!instructor) return 0

  await processBatch(subjects, 10, async (subject) => {
    // Find category based on subject department
    const subjectConfig = SUBJECTS.find((s) => s.nameEn === subject.subjectName)
    const categoryId = categoryMap.get(
      subjectConfig?.departmentEn || "Sciences"
    )

    const courseSlug = slugify(subject.subjectName)

    try {
      // Create English course
      const course = await prisma.streamCourse.upsert({
        where: {
          slug_schoolId_lang: {
            slug: courseSlug,
            schoolId,
            lang: "en",
          },
        },
        update: {
          title: subject.subjectName,
          isPublished: true,
        },
        create: {
          schoolId,
          lang: "en",
          title: subject.subjectName,
          slug: courseSlug,
          description: `Comprehensive course on ${subject.subjectName}`,
          categoryId,
          userId: instructor.id,
          isPublished: true,
          status: "PUBLISHED",
        },
      })

      // Create chapters for the course
      await seedCourseChapters(prisma, course.id, "en")
      courseCount++
    } catch {
      // Skip if course already exists
    }

    // Create Arabic course
    const courseSlugAr = slugify(subject.subjectNameAr || subject.subjectName)
    try {
      const courseAr = await prisma.streamCourse.upsert({
        where: {
          slug_schoolId_lang: {
            slug: courseSlugAr + "-ar",
            schoolId,
            lang: "ar",
          },
        },
        update: {
          title: subject.subjectNameAr || subject.subjectName,
          isPublished: true,
        },
        create: {
          schoolId,
          lang: "ar",
          title: subject.subjectNameAr || subject.subjectName,
          slug: courseSlugAr + "-ar",
          description: `دورة شاملة في ${subject.subjectNameAr || subject.subjectName}`,
          categoryId,
          userId: instructor.id,
          isPublished: true,
          status: "PUBLISHED",
        },
      })

      await seedCourseChapters(prisma, courseAr.id, "ar")
      courseCount++
    } catch {
      // Skip if course already exists
    }
  })

  logSuccess("Stream Courses", courseCount, "EN + AR with chapters")

  return courseCount
}

/**
 * Seed chapters for a course (10 chapters each)
 */
async function seedCourseChapters(
  prisma: PrismaClient,
  courseId: string,
  lang: string
): Promise<void> {
  const chaptersEn = [
    "Introduction & Overview",
    "Basic Concepts",
    "Fundamentals",
    "Core Principles",
    "Practical Applications",
    "Advanced Topics",
    "Case Studies",
    "Problem Solving",
    "Review & Practice",
    "Final Assessment",
  ]

  const chaptersAr = [
    "مقدمة ونظرة عامة",
    "المفاهيم الأساسية",
    "الأساسيات",
    "المبادئ الأساسية",
    "التطبيقات العملية",
    "مواضيع متقدمة",
    "دراسات حالة",
    "حل المشكلات",
    "مراجعة وتطبيق",
    "التقييم النهائي",
  ]

  const chapters = lang === "ar" ? chaptersAr : chaptersEn

  for (let i = 0; i < chapters.length; i++) {
    try {
      // Check if chapter already exists at this position
      const existing = await prisma.streamChapter.findFirst({
        where: { courseId, position: i + 1 },
      })

      if (!existing) {
        await prisma.streamChapter.create({
          data: {
            courseId,
            title: chapters[i],
            description: `${lang === "ar" ? "الفصل" : "Chapter"} ${i + 1}: ${chapters[i]}`,
            position: i + 1,
            isFree: i === 0, // First chapter is free
            isPublished: true,
          },
        })
      }
    } catch {
      // Skip if chapter already exists
    }
  }
}
