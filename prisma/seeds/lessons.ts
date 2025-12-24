/**
 * Lessons Seed
 * Creates Lessons for classes
 *
 * Phase 5: LMS - Lessons
 *
 * Note: Lesson model has NO unique constraint - uses findFirst + create pattern
 * Schema fields: title, description, lessonDate, startTime, endTime, status
 * NO bilingual fields (titleAr, descriptionAr)
 * NO weekNumber, lessonOrder, duration, isPublished
 */

import type { PrismaClient } from "@prisma/client"

import type { ClassRef } from "./types"
import { logPhase, logSuccess, processBatch } from "./utils"

// ============================================================================
// LESSON CONTENT
// ============================================================================

const LESSON_TEMPLATES = [
  { titleEn: "Introduction", week: 1 },
  { titleEn: "Fundamentals", week: 2 },
  { titleEn: "Core Concepts", week: 3 },
  { titleEn: "Practice Session", week: 4 },
  { titleEn: "Advanced Topics", week: 5 },
  { titleEn: "Problem Solving", week: 6 },
  { titleEn: "Case Studies", week: 7 },
  { titleEn: "Group Project", week: 8 },
  { titleEn: "Review", week: 9 },
  { titleEn: "Assessment Prep", week: 10 },
]

// ============================================================================
// LESSONS SEEDING
// ============================================================================

/**
 * Create lessons for each class (10 lessons per class)
 * Note: Lesson model has NO unique constraint - uses findFirst + create
 */
export async function seedLessons(
  prisma: PrismaClient,
  schoolId: string,
  classes: ClassRef[]
): Promise<number> {
  logPhase(5, "LMS / STREAM", "نظام إدارة التعلم")

  let lessonCount = 0

  // Term start date for lesson scheduling
  const termStart = new Date("2025-09-01")

  await processBatch(classes, 10, async (classInfo) => {
    for (const template of LESSON_TEMPLATES) {
      const lessonTitle = `${template.titleEn} - ${classInfo.name}`

      // Calculate lesson date based on week
      const lessonDate = new Date(termStart)
      lessonDate.setDate(lessonDate.getDate() + (template.week - 1) * 7)

      try {
        // Check if lesson exists (no unique constraint)
        const existing = await prisma.lesson.findFirst({
          where: {
            schoolId,
            classId: classInfo.id,
            title: lessonTitle,
          },
        })

        if (!existing) {
          await prisma.lesson.create({
            data: {
              schoolId,
              classId: classInfo.id,
              title: lessonTitle,
              description: `Week ${template.week}: ${template.titleEn}`,
              lessonDate,
              startTime: "08:00", // HH:MM format
              endTime: "08:45", // HH:MM format
              objectives: `Learning objectives for ${template.titleEn}`,
              materials: "Textbook, notebook, pen",
              activities: "Lecture, discussion, practice exercises",
              status: "PLANNED",
            },
          })
          lessonCount++
        }
      } catch {
        // Skip if lesson already exists
      }
    }
  })

  logSuccess("Lessons", lessonCount, "10 per class")

  return lessonCount
}
