/**
 * Stream (LMS) Seed - ClickView Educational Content
 *
 * 59 K-12 courses with chapters (Arabic for demo school)
 *
 * Phase 7: LMS / Stream
 */

import type { PrismaClient } from "@prisma/client"

import { CLICKVIEW_COURSES, STREAM_CATEGORIES } from "./data/courses"
import type { StudentRef, UserRef } from "./types"
import { logSuccess, processBatch, randomNumber } from "./utils"

// Map English category slugs (used in course data) to Arabic names (used in DB)
const CATEGORY_SLUG_TO_NAME: Record<string, string> = {
  Mathematics: "الرياضيات",
  Sciences: "العلوم",
  "Languages & Literature": "اللغات والأدب",
  "Social Studies & History": "الدراسات الاجتماعية والتاريخ",
  "Health & Wellness": "الصحة والعافية",
  "Arts & Media": "الفنون والإعلام",
  "Technology & Computing": "التكنولوجيا والحوسبة",
  "Life Skills": "المهارات الحياتية",
}

// ============================================================================
// STREAM SEEDING
// ============================================================================

/**
 * Seed stream categories
 */
async function seedStreamCategories(
  prisma: PrismaClient,
  schoolId: string
): Promise<Map<string, string>> {
  const categoryMap = new Map<string, string>()

  for (const cat of STREAM_CATEGORIES) {
    try {
      const category = await prisma.streamCategory.upsert({
        where: {
          name_schoolId_lang: {
            name: cat.name,
            schoolId,
            lang: "ar",
          },
        },
        update: {},
        create: {
          schoolId,
          name: cat.name,
          lang: "ar",
        },
      })
      categoryMap.set(cat.name, category.id)
    } catch {
      const existing = await prisma.streamCategory.findFirst({
        where: { name: cat.name, schoolId, lang: "ar" },
      })
      categoryMap.set(cat.name, existing?.id || "")
    }
  }

  logSuccess("Stream Categories", STREAM_CATEGORIES.length, "AR")

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
    // Resolve category: course.category is an English slug, map to Arabic name for DB lookup
    const categoryName = CATEGORY_SLUG_TO_NAME[courseData.category]
    const categoryId = categoryName ? categoryMap.get(categoryName) : undefined

    try {
      const course = await prisma.streamCourse.upsert({
        where: {
          slug_schoolId_lang: {
            slug: courseData.slug,
            schoolId,
            lang: "ar",
          },
        },
        update: {
          title: courseData.title,
          description: courseData.description,
          imageUrl: courseData.image,
          isPublished: true,
        },
        create: {
          schoolId,
          lang: "ar",
          title: courseData.title,
          slug: courseData.slug,
          description: courseData.description,
          imageUrl: courseData.image,
          categoryId: categoryId || null,
          userId: instructor.id,
          isPublished: true,
          status: "PUBLISHED",
        },
      })

      await seedCourseChapters(prisma, course.id, courseData.chapters)
      courseCount++
    } catch (error) {
      console.error(`Failed to create course ${courseData.slug}:`, error)
    }
  })

  logSuccess(
    "Stream Courses",
    courseCount,
    `${CLICKVIEW_COURSES.length} topics with chapters`
  )

  return courseCount
}

/**
 * Seed stream enrollments (~200 student enrollments across courses)
 */
export async function seedStreamEnrollments(
  prisma: PrismaClient,
  schoolId: string,
  students: StudentRef[]
): Promise<number> {
  // Get all published courses
  const courses = await prisma.streamCourse.findMany({
    where: { schoolId, isPublished: true },
    select: { id: true },
  })

  if (courses.length === 0 || students.length === 0) {
    logSuccess("Stream Enrollments", 0, "no courses or students")
    return 0
  }

  // Clean existing enrollments
  await prisma.streamEnrollment.deleteMany({ where: { schoolId } })

  const enrollmentData: Array<{
    schoolId: string
    userId: string
    courseId: string
    isActive: boolean
    status: "ACTIVE" | "COMPLETED" | "PENDING"
  }> = []

  // Each student enrolls in 1-3 random courses, up to ~200 enrollments
  const enrolledPairs = new Set<string>()
  const targetEnrollments = Math.min(200, students.length * 2)
  let attempts = 0

  while (enrollmentData.length < targetEnrollments && attempts < 500) {
    attempts++
    const student = students[randomNumber(0, students.length - 1)]
    const course = courses[randomNumber(0, courses.length - 1)]
    const key = `${student.userId}_${course.id}`

    if (enrolledPairs.has(key)) continue
    enrolledPairs.add(key)

    // Status distribution: 60% ACTIVE, 25% COMPLETED, 15% PENDING
    const rand = enrollmentData.length % 20
    const status: "ACTIVE" | "COMPLETED" | "PENDING" =
      rand < 12 ? "ACTIVE" : rand < 17 ? "COMPLETED" : "PENDING"

    enrollmentData.push({
      schoolId,
      userId: student.userId,
      courseId: course.id,
      isActive: status === "ACTIVE",
      status,
    })
  }

  // Insert in batches
  let totalCreated = 0
  for (let i = 0; i < enrollmentData.length; i += 50) {
    const batch = enrollmentData.slice(i, i + 50)
    try {
      const result = await prisma.streamEnrollment.createMany({
        data: batch,
        skipDuplicates: true,
      })
      totalCreated += result.count
    } catch {
      // Fall back to individual creates
      for (const entry of batch) {
        try {
          await prisma.streamEnrollment.create({ data: entry })
          totalCreated++
        } catch {
          // Skip duplicate
        }
      }
    }
  }

  logSuccess("Stream Enrollments", totalCreated, "student course enrollments")
  return totalCreated
}

/**
 * Seed topic-specific chapters for a course
 */
async function seedCourseChapters(
  prisma: PrismaClient,
  courseId: string,
  chapters: Array<{ title: string }>
): Promise<void> {
  for (let i = 0; i < chapters.length; i++) {
    const title = chapters[i].title

    try {
      const existing = await prisma.streamChapter.findFirst({
        where: { courseId, position: i + 1 },
      })

      if (!existing) {
        await prisma.streamChapter.create({
          data: {
            courseId,
            title,
            description: `الفصل ${i + 1}: ${title}`,
            position: i + 1,
            isFree: i === 0,
            isPublished: true,
          },
        })
      }
    } catch {
      // Skip if chapter already exists
    }
  }
}
