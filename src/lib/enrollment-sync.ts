import { db } from "@/lib/db"

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
