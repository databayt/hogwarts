import type { PrismaClient } from "@prisma/client"

import { db } from "@/lib/db"

/**
 * Enroll a student in all classes for a given grade.
 * Creates StudentClass records (idempotent via unique constraint)
 * and syncs LMS enrollments.
 *
 * Used by: student wizard enrollment, admission placement, CSV import.
 */
export async function enrollStudentInGradeClasses(
  schoolId: string,
  studentId: string,
  gradeId: string,
  tx?: Pick<PrismaClient, "class" | "studentClass">
): Promise<{ classIds: string[]; warning?: string }> {
  const client = tx ?? db

  const gradeClasses = await client.class.findMany({
    where: { schoolId, gradeId },
    select: { id: true },
  })

  if (gradeClasses.length === 0) {
    return {
      classIds: [],
      warning:
        "No classes found for this grade. Generate classes first via Classrooms > Configure.",
    }
  }

  await Promise.all(
    gradeClasses.map((cls) =>
      client.studentClass.upsert({
        where: {
          schoolId_studentId_classId: {
            schoolId,
            studentId,
            classId: cls.id,
          },
        },
        create: { schoolId, studentId, classId: cls.id },
        update: {},
      })
    )
  )

  const classIds = gradeClasses.map((cls) => cls.id)

  // Sync LMS enrollments (non-blocking, outside any transaction)
  if (!tx) {
    for (const classId of classIds) {
      syncStudentClassToEnrollment(schoolId, studentId, classId).catch(() => {})
    }
  }

  return { classIds }
}

/**
 * Sync a StudentClass enrollment to the LMS Enrollment system.
 *
 * When a student is enrolled in a Class (timetable/attendance),
 * this creates a corresponding Enrollment record for catalog/LMS access.
 *
 * Non-blocking: logs failures but never throws.
 */
export async function syncStudentClassToEnrollment(
  schoolId: string,
  studentId: string,
  classId: string
): Promise<void> {
  try {
    // Get class -> subject -> catalogSubjectId chain
    const classData = await db.class.findFirst({
      where: { id: classId, schoolId },
      select: {
        subject: {
          select: { catalogSubjectId: true },
        },
      },
    })

    const catalogSubjectId = classData?.subject?.catalogSubjectId
    if (!catalogSubjectId) {
      // Class has no catalog link - skip silently
      return
    }

    // Get student -> userId
    const student = await db.student.findFirst({
      where: { id: studentId, schoolId },
      select: { userId: true },
    })

    if (!student?.userId) {
      return
    }

    // Upsert enrollment (idempotent)
    await db.enrollment.upsert({
      where: {
        userId_catalogSubjectId: {
          userId: student.userId,
          catalogSubjectId,
        },
      },
      create: {
        userId: student.userId,
        catalogSubjectId,
        schoolId,
        status: "ACTIVE",
      },
      update: {
        status: "ACTIVE",
      },
    })
  } catch (error) {
    // Non-blocking: log but don't throw
    console.warn(
      `[syncStudentClassToEnrollment] Failed for student=${studentId} class=${classId}:`,
      error
    )
  }
}
