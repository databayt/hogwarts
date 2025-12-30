/**
 * Stream (LMS) Seed - ClickView Educational Content
 *
 * 59 K-12 courses with beautiful illustrations from ClickView
 * Each course has 5-8 topic-specific chapters in English and Arabic
 *
 * Phase 7: LMS / Stream
 */

import type { PrismaClient } from "@prisma/client"

import { CLICKVIEW_COURSES, STREAM_CATEGORIES } from "./data/courses"
import type { UserRef } from "./types"
import { logSuccess, processBatch } from "./utils"

// ============================================================================
// STREAM SEEDING
// ============================================================================

/**
 * Seed stream categories (creates both EN and AR versions)
 */
async function seedStreamCategories(
  prisma: PrismaClient,
  schoolId: string
): Promise<Map<string, { en: string; ar: string }>> {
  const categoryMap = new Map<string, { en: string; ar: string }>()

  for (const cat of STREAM_CATEGORIES) {
    let enId = ""
    let arId = ""

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
      enId = categoryEn.id
    } catch {
      // Find existing
      const existing = await prisma.streamCategory.findFirst({
        where: { name: cat.nameEn, schoolId, lang: "en" },
      })
      enId = existing?.id || ""
    }

    // Create Arabic version
    try {
      const categoryAr = await prisma.streamCategory.upsert({
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
      arId = categoryAr.id
    } catch {
      // Find existing
      const existing = await prisma.streamCategory.findFirst({
        where: { name: cat.nameAr, schoolId, lang: "ar" },
      })
      arId = existing?.id || ""
    }

    categoryMap.set(cat.nameEn, { en: enId, ar: arId })
  }

  logSuccess("Stream Categories", STREAM_CATEGORIES.length * 2, "EN + AR")

  return categoryMap
}

/**
 * Seed stream courses from ClickView educational content
 */
export async function seedStreamCourses(
  prisma: PrismaClient,
  schoolId: string,
  _subjects: unknown[], // Not used anymore, kept for API compatibility
  adminUsers: UserRef[]
): Promise<number> {
  const categoryMap = await seedStreamCategories(prisma, schoolId)
  let courseCount = 0

  // Get an admin user to be the instructor
  const instructor = adminUsers.find((u) => u.role === "ADMIN") || adminUsers[0]
  if (!instructor) return 0

  await processBatch(CLICKVIEW_COURSES, 5, async (courseData) => {
    const categoryIds = categoryMap.get(courseData.category)

    // Create English course
    try {
      const course = await prisma.streamCourse.upsert({
        where: {
          slug_schoolId_lang: {
            slug: courseData.slug,
            schoolId,
            lang: "en",
          },
        },
        update: {
          title: courseData.titleEn,
          description: courseData.descriptionEn,
          imageUrl: courseData.image,
          isPublished: true,
        },
        create: {
          schoolId,
          lang: "en",
          title: courseData.titleEn,
          slug: courseData.slug,
          description: courseData.descriptionEn,
          imageUrl: courseData.image,
          categoryId: categoryIds?.en || null,
          userId: instructor.id,
          isPublished: true,
          status: "PUBLISHED",
        },
      })

      // Create topic-specific chapters
      await seedCourseChapters(prisma, course.id, courseData.chapters, "en")
      courseCount++
    } catch (error) {
      console.error(`Failed to create EN course ${courseData.slug}:`, error)
    }

    // Create Arabic course
    try {
      const courseAr = await prisma.streamCourse.upsert({
        where: {
          slug_schoolId_lang: {
            slug: courseData.slug + "-ar",
            schoolId,
            lang: "ar",
          },
        },
        update: {
          title: courseData.titleAr,
          description: courseData.descriptionAr,
          imageUrl: courseData.image,
          isPublished: true,
        },
        create: {
          schoolId,
          lang: "ar",
          title: courseData.titleAr,
          slug: courseData.slug + "-ar",
          description: courseData.descriptionAr,
          imageUrl: courseData.image,
          categoryId: categoryIds?.ar || null,
          userId: instructor.id,
          isPublished: true,
          status: "PUBLISHED",
        },
      })

      await seedCourseChapters(prisma, courseAr.id, courseData.chapters, "ar")
      courseCount++
    } catch (error) {
      console.error(`Failed to create AR course ${courseData.slug}:`, error)
    }
  })

  logSuccess(
    "Stream Courses",
    courseCount,
    `${CLICKVIEW_COURSES.length} topics (EN + AR) with ${courseCount} chapters`
  )

  return courseCount
}

/**
 * Seed topic-specific chapters for a course
 */
async function seedCourseChapters(
  prisma: PrismaClient,
  courseId: string,
  chapters: Array<{ titleEn: string; titleAr: string }>,
  lang: string
): Promise<void> {
  for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i]
    const title = lang === "ar" ? chapter.titleAr : chapter.titleEn

    try {
      // Check if chapter already exists at this position
      const existing = await prisma.streamChapter.findFirst({
        where: { courseId, position: i + 1 },
      })

      if (!existing) {
        await prisma.streamChapter.create({
          data: {
            courseId,
            title,
            description:
              lang === "ar"
                ? `الفصل ${i + 1}: ${title}`
                : `Chapter ${i + 1}: ${title}`,
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
