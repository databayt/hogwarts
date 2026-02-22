"use server"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

export interface LessonContent {
  questions: Array<{
    id: string
    questionText: string
    questionType: string
    options: unknown
    sampleAnswer: string | null
  }>
}

/**
 * Fetch all supplementary content for a catalog lesson.
 * Returns quiz questions scoped to the lesson (approved + visible to school).
 */
export async function getLessonContent(
  catalogLessonId: string
): Promise<LessonContent> {
  const { schoolId } = await getTenantContext()

  // Fetch approved questions for this lesson
  const questions = await db.catalogQuestion.findMany({
    where: {
      catalogLessonId,
      approvalStatus: "APPROVED",
      OR: [
        { visibility: "PUBLIC" },
        ...(schoolId ? [{ contributedSchoolId: schoolId }] : []),
      ],
    },
    select: {
      id: true,
      questionText: true,
      questionType: true,
      options: true,
      sampleAnswer: true,
    },
    orderBy: { createdAt: "asc" },
    take: 10, // Limit practice quiz to 10 questions
  })

  return { questions }
}
