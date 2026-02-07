"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import type { Prisma } from "@prisma/client"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { reviewExcuseSchema, submitExcuseSchema } from "../shared/validation"
import type { ActionResponse } from "./core"

/**
 * Submit an excuse for an absence (called by parent/guardian)
 */
export async function submitExcuse(input: {
  attendanceId: string
  reason:
    | "MEDICAL"
    | "FAMILY_EMERGENCY"
    | "RELIGIOUS"
    | "SCHOOL_ACTIVITY"
    | "TRANSPORTATION"
    | "WEATHER"
    | "OTHER"
  description?: string
  attachments?: string[]
}): Promise<ActionResponse<{ excuseId: string }>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" }
    }

    // Validate input
    const parsed = submitExcuseSchema.parse(input)

    // Get the attendance record
    const attendance = await db.attendance.findFirst({
      where: {
        id: parsed.attendanceId,
        schoolId,
      },
      include: {
        student: {
          include: {
            studentGuardians: {
              include: {
                guardian: {
                  select: { userId: true },
                },
              },
            },
          },
        },
        excuse: true, // Check if excuse already exists
      },
    })

    if (!attendance) {
      return { success: false, error: "Attendance record not found" }
    }

    // Check if an excuse already exists
    if (attendance.excuse) {
      return {
        success: false,
        error: "An excuse has already been submitted for this absence",
      }
    }

    // Verify user is a guardian of this student
    const isGuardian = attendance.student.studentGuardians.some(
      (sg) => sg.guardian.userId === session.user.id
    )

    // Also allow admins and teachers to submit on behalf
    const isStaff =
      session.user.role === "ADMIN" || session.user.role === "TEACHER"

    if (!isGuardian && !isStaff) {
      return {
        success: false,
        error: "You are not authorized to submit an excuse for this student",
      }
    }

    // Create the excuse
    const excuse = await db.attendanceExcuse.create({
      data: {
        schoolId,
        attendanceId: parsed.attendanceId,
        reason: parsed.reason,
        description: parsed.description,
        attachments: parsed.attachments || [],
        submittedBy: session.user.id,
        status: "PENDING",
      },
    })

    // Send notification to teacher/admin about new excuse submission
    const classTeachers = await db.classTeacher.findMany({
      where: {
        schoolId,
        classId: attendance.classId,
      },
      include: {
        teacher: {
          select: { userId: true, givenName: true, surname: true },
        },
      },
    })

    const studentName = `${attendance.student.givenName} ${attendance.student.surname}`
    const dateStr = attendance.date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    // Notify each teacher assigned to the class
    for (const ct of classTeachers) {
      if (ct.teacher.userId) {
        await db.notification.create({
          data: {
            schoolId,
            userId: ct.teacher.userId,
            type: "attendance_alert",
            priority: "normal",
            title: `Excuse Submitted: ${studentName}`,
            body: `An excuse has been submitted for ${studentName}'s absence on ${dateStr}. Please review and approve or reject.`,
            metadata: {
              excuseId: excuse.id,
              studentId: attendance.studentId,
              studentName,
              attendanceId: attendance.id,
              date: attendance.date.toISOString(),
              reason: parsed.reason,
            },
            channels: ["in_app", "email"],
            actorId: session.user.id,
          },
        })
      }
    }

    revalidatePath("/attendance")
    revalidatePath("/parent-portal/attendance")

    return { success: true, data: { excuseId: excuse.id } }
  } catch (error) {
    console.error("[submitExcuse] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to submit excuse",
    }
  }
}

/**
 * Review (approve/reject) an excuse (called by teacher/admin)
 */
export async function reviewExcuse(input: {
  excuseId: string
  status: "APPROVED" | "REJECTED"
  reviewNotes?: string
}): Promise<ActionResponse<{ updated: boolean }>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" }
    }

    // Validate input
    const parsed = reviewExcuseSchema.parse(input)

    // Check user role - only teachers and admins can review
    if (session.user.role !== "ADMIN" && session.user.role !== "TEACHER") {
      return {
        success: false,
        error: "Only teachers and administrators can review excuses",
      }
    }

    // Get the excuse
    const excuse = await db.attendanceExcuse.findFirst({
      where: {
        id: parsed.excuseId,
        schoolId,
      },
      include: {
        attendance: {
          include: {
            student: {
              include: {
                studentGuardians: {
                  include: {
                    guardian: {
                      select: {
                        userId: true,
                        givenName: true,
                        emailAddress: true,
                      },
                    },
                  },
                },
              },
            },
            class: {
              select: { name: true },
            },
          },
        },
      },
    })

    if (!excuse) {
      return { success: false, error: "Excuse not found" }
    }

    if (excuse.status !== "PENDING") {
      return { success: false, error: "This excuse has already been reviewed" }
    }

    // Update the excuse
    await db.attendanceExcuse.update({
      where: { id: excuse.id },
      data: {
        status: parsed.status,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        reviewNotes: parsed.reviewNotes,
      },
    })

    // If approved, update attendance status to EXCUSED
    if (parsed.status === "APPROVED") {
      await db.attendance.update({
        where: { id: excuse.attendanceId },
        data: { status: "EXCUSED" },
      })
    }

    // Notify the guardian who submitted the excuse
    const studentName = `${excuse.attendance.student.givenName} ${excuse.attendance.student.surname}`
    const className = excuse.attendance.class.name
    const statusTextAr =
      parsed.status === "APPROVED" ? "تمت الموافقة على" : "تم رفض"

    // Find the guardian who submitted
    const submitter = excuse.attendance.student.studentGuardians.find(
      (sg) => sg.guardian.userId === excuse.submittedBy
    )

    if (submitter?.guardian.userId) {
      await db.notification.create({
        data: {
          schoolId,
          userId: submitter.guardian.userId,
          type: "attendance_alert",
          priority: "normal",
          title: `${statusTextAr} العذر: ${studentName}`,
          body: `${statusTextAr} عذر غياب ${studentName} في ${excuse.attendance.date.toLocaleDateString("ar-SA")} (${className}).${parsed.reviewNotes ? ` ملاحظة: ${parsed.reviewNotes}` : ""}`,
          metadata: {
            excuseId: excuse.id,
            studentId: excuse.attendance.studentId,
            studentName,
            attendanceId: excuse.attendanceId,
            date: excuse.attendance.date.toISOString(),
            status: parsed.status,
            reviewNotes: parsed.reviewNotes,
          },
          channels: ["in_app", "email"],
          actorId: session.user.id,
        },
      })
    }

    revalidatePath("/attendance")
    revalidatePath("/parent-portal/attendance")

    return { success: true, data: { updated: true } }
  } catch (error) {
    console.error("[reviewExcuse] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to review excuse",
    }
  }
}

/**
 * Get excuses for a specific student (for parent portal)
 */
export async function getExcusesForStudent(studentId: string): Promise<
  ActionResponse<{
    excuses: Array<{
      id: string
      attendanceId: string
      date: string
      className: string
      reason: string
      description: string | null
      status: string
      submittedAt: string
      reviewedAt: string | null
      reviewNotes: string | null
    }>
  }>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" }
    }

    // Verify access: either guardian of the student, or staff
    const student = await db.student.findFirst({
      where: {
        id: studentId,
        schoolId,
      },
      include: {
        studentGuardians: {
          include: {
            guardian: {
              select: { userId: true },
            },
          },
        },
      },
    })

    if (!student) {
      return { success: false, error: "Student not found" }
    }

    const isGuardian = student.studentGuardians.some(
      (sg) => sg.guardian.userId === session.user.id
    )
    const isStaff =
      session.user.role === "ADMIN" || session.user.role === "TEACHER"

    if (!isGuardian && !isStaff) {
      return {
        success: false,
        error: "You are not authorized to view this student's excuses",
      }
    }

    // Get all excuses for this student's attendance records
    const excuses = await db.attendanceExcuse.findMany({
      where: {
        schoolId,
        attendance: {
          studentId,
        },
      },
      include: {
        attendance: {
          include: {
            class: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { submittedAt: "desc" },
    })

    return {
      success: true,
      data: {
        excuses: excuses.map((e) => ({
          id: e.id,
          attendanceId: e.attendanceId,
          date: e.attendance.date.toISOString(),
          className: e.attendance.class.name,
          reason: e.reason,
          description: e.description,
          status: e.status,
          submittedAt: e.submittedAt.toISOString(),
          reviewedAt: e.reviewedAt?.toISOString() || null,
          reviewNotes: e.reviewNotes,
        })),
      },
    }
  } catch (error) {
    console.error("[getExcusesForStudent] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get excuses",
    }
  }
}

/**
 * Get pending excuses for review (for teachers/admins)
 */
export async function getPendingExcuses(input?: {
  classId?: string
  limit?: number
}): Promise<
  ActionResponse<{
    excuses: Array<{
      id: string
      attendanceId: string
      studentId: string
      studentName: string
      className: string
      date: string
      reason: string
      description: string | null
      attachments: string[]
      submittedBy: string
      submitterName: string | null
      submittedAt: string
    }>
  }>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" }
    }

    // Only teachers and admins can view pending excuses
    if (session.user.role !== "ADMIN" && session.user.role !== "TEACHER") {
      return {
        success: false,
        error: "Only teachers and administrators can review excuses",
      }
    }

    const where: Prisma.AttendanceExcuseWhereInput = {
      schoolId,
      status: "PENDING",
    }

    // For teachers, optionally filter to only their assigned classes
    let teacherClassIds: string[] | null = null
    if (session.user.role === "TEACHER") {
      const teacherClasses = await db.classTeacher.findMany({
        where: {
          schoolId,
          teacher: { userId: session.user.id },
        },
        select: { classId: true },
      })
      teacherClassIds = teacherClasses.map((tc) => tc.classId)
    }

    const excuses = await db.attendanceExcuse.findMany({
      where: {
        ...where,
        ...(teacherClassIds && teacherClassIds.length > 0
          ? {
              attendance: {
                classId: { in: teacherClassIds },
              },
            }
          : {}),
        ...(input?.classId
          ? {
              attendance: {
                classId: input.classId,
              },
            }
          : {}),
      },
      include: {
        attendance: {
          include: {
            student: {
              select: { id: true, givenName: true, surname: true },
            },
            class: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { submittedAt: "desc" },
      take: input?.limit ?? 50,
    })

    // Get submitter names (use username or email as fallback)
    const submitterIds = [...new Set(excuses.map((e) => e.submittedBy))]
    const users = await db.user.findMany({
      where: { id: { in: submitterIds } },
      select: { id: true, username: true, email: true },
    })
    const userMap = new Map(
      users.map((u) => [u.id, u.username || u.email || "Unknown"])
    )

    return {
      success: true,
      data: {
        excuses: excuses.map((e) => ({
          id: e.id,
          attendanceId: e.attendanceId,
          studentId: e.attendance.studentId,
          studentName: `${e.attendance.student.givenName} ${e.attendance.student.surname}`,
          className: e.attendance.class.name,
          date: e.attendance.date.toISOString(),
          reason: e.reason,
          description: e.description,
          attachments: e.attachments,
          submittedBy: e.submittedBy,
          submitterName: userMap.get(e.submittedBy) || null,
          submittedAt: e.submittedAt.toISOString(),
        })),
      },
    }
  } catch (error) {
    console.error("[getPendingExcuses] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get pending excuses",
    }
  }
}

/**
 * Get excuse details by ID
 */
export async function getExcuseById(excuseId: string): Promise<
  ActionResponse<{
    excuse: {
      id: string
      attendanceId: string
      studentId: string
      studentName: string
      className: string
      date: string
      attendanceStatus: string
      reason: string
      description: string | null
      attachments: string[]
      status: string
      submittedBy: string
      submitterName: string | null
      submittedAt: string
      reviewedBy: string | null
      reviewerName: string | null
      reviewedAt: string | null
      reviewNotes: string | null
    }
  }>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" }
    }

    const excuse = await db.attendanceExcuse.findFirst({
      where: {
        id: excuseId,
        schoolId,
      },
      include: {
        attendance: {
          include: {
            student: {
              select: { id: true, givenName: true, surname: true },
            },
            class: {
              select: { name: true },
            },
          },
        },
      },
    })

    if (!excuse) {
      return { success: false, error: "Excuse not found" }
    }

    // Get submitter and reviewer names (use username or email as fallback)
    const userIds = [excuse.submittedBy, excuse.reviewedBy].filter(
      Boolean
    ) as string[]
    const users = await db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true, email: true },
    })
    const userMap = new Map(
      users.map((u) => [u.id, u.username || u.email || "Unknown"])
    )

    return {
      success: true,
      data: {
        excuse: {
          id: excuse.id,
          attendanceId: excuse.attendanceId,
          studentId: excuse.attendance.studentId,
          studentName: `${excuse.attendance.student.givenName} ${excuse.attendance.student.surname}`,
          className: excuse.attendance.class.name,
          date: excuse.attendance.date.toISOString(),
          attendanceStatus: excuse.attendance.status,
          reason: excuse.reason,
          description: excuse.description,
          attachments: excuse.attachments,
          status: excuse.status,
          submittedBy: excuse.submittedBy,
          submitterName: userMap.get(excuse.submittedBy) || null,
          submittedAt: excuse.submittedAt.toISOString(),
          reviewedBy: excuse.reviewedBy,
          reviewerName: excuse.reviewedBy
            ? userMap.get(excuse.reviewedBy) || null
            : null,
          reviewedAt: excuse.reviewedAt?.toISOString() || null,
          reviewNotes: excuse.reviewNotes,
        },
      },
    }
  } catch (error) {
    console.error("[getExcuseById] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get excuse details",
    }
  }
}

/**
 * Get absences that can have an excuse submitted (for parent portal)
 * Returns unexcused absences for the guardian's children
 */
export async function getUnexcusedAbsences(studentId?: string): Promise<
  ActionResponse<{
    absences: Array<{
      id: string
      studentId: string
      studentName: string
      classId: string
      className: string
      date: string
      status: string
    }>
  }>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" }
    }

    // Get guardian's children
    let studentIds: string[] = []

    if (studentId) {
      // Verify user has access to this student
      const student = await db.student.findFirst({
        where: { id: studentId, schoolId },
        include: {
          studentGuardians: {
            include: {
              guardian: { select: { userId: true } },
            },
          },
        },
      })

      if (!student) {
        return { success: false, error: "Student not found" }
      }

      const isGuardian = student.studentGuardians.some(
        (sg) => sg.guardian.userId === session.user.id
      )
      const isStaff =
        session.user.role === "ADMIN" || session.user.role === "TEACHER"

      if (!isGuardian && !isStaff) {
        return { success: false, error: "Not authorized to view this student" }
      }

      studentIds = [studentId]
    } else {
      // Get all students for this guardian
      const guardianStudents = await db.studentGuardian.findMany({
        where: {
          schoolId,
          guardian: { userId: session.user.id },
        },
        select: { studentId: true },
      })
      studentIds = guardianStudents.map((gs) => gs.studentId)
    }

    if (studentIds.length === 0) {
      return { success: true, data: { absences: [] } }
    }

    // Get absences without excuses
    const absences = await db.attendance.findMany({
      where: {
        schoolId,
        studentId: { in: studentIds },
        status: "ABSENT",
        excuse: null, // No excuse submitted yet
      },
      include: {
        student: {
          select: { id: true, givenName: true, surname: true },
        },
        class: {
          select: { id: true, name: true },
        },
      },
      orderBy: { date: "desc" },
      take: 50,
    })

    return {
      success: true,
      data: {
        absences: absences.map((a) => ({
          id: a.id,
          studentId: a.studentId,
          studentName: `${a.student.givenName} ${a.student.surname}`,
          classId: a.classId,
          className: a.class.name,
          date: a.date.toISOString(),
          status: a.status,
        })),
      },
    }
  } catch (error) {
    console.error("[getUnexcusedAbsences] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get unexcused absences",
    }
  }
}
