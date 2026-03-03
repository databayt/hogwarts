"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"

import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

/**
 * Get attendance records for the currently logged-in student
 */
export async function getStudentOwnAttendance(): Promise<
  ActionResponse<{
    records: Array<{
      id: string
      date: Date | string
      status: string
      classId: string | null
      className: string | null
      notes: string | null
    }>
    stats: {
      totalDays: number
      present: number
      absent: number
      late: number
      excused: number
      attendanceRate: number
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

    // Find student record for the logged-in user
    const student = await db.student.findFirst({
      where: { userId: session.user.id, schoolId },
      select: { id: true },
    })

    if (!student) {
      return { success: false, error: "Student record not found" }
    }

    // Get active term for date range
    const activeTerm = await db.term.findFirst({
      where: { schoolId, isActive: true },
    })

    const termStart =
      activeTerm?.startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

    // Fetch attendance records (exclude soft-deleted)
    const records = await db.attendance.findMany({
      where: {
        studentId: student.id,
        schoolId,
        date: { gte: termStart },
        deletedAt: null,
      },
      orderBy: { date: "desc" },
      select: {
        id: true,
        date: true,
        status: true,
        classId: true,
        notes: true,
        class: {
          select: {
            name: true,
            subject: { select: { subjectName: true } },
          },
        },
      },
    })

    // Calculate stats
    const totalDays = records.length
    const present = records.filter((r) => r.status === "PRESENT").length
    const absent = records.filter((r) => r.status === "ABSENT").length
    const late = records.filter((r) => r.status === "LATE").length
    const excused = records.filter((r) => r.status === "EXCUSED").length
    const attendanceRate =
      totalDays > 0 ? Math.round(((present + late) / totalDays) * 100) : 0

    return {
      success: true,
      data: {
        records: records.map((r) => ({
          id: r.id,
          date: r.date,
          status: r.status,
          classId: r.classId,
          className: r.class
            ? `${r.class.subject?.subjectName ?? ""} - ${r.class.name}`
            : null,
          notes: r.notes,
        })),
        stats: { totalDays, present, absent, late, excused, attendanceRate },
      },
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch attendance records",
    }
  }
}

/**
 * Get attendance records for a guardian's children
 * Reuses the same data shape as the parent portal
 */
export async function getGuardianChildrenAttendance(): Promise<
  ActionResponse<{
    students: Array<{
      id: string
      name: string
      email: string | null
      classes: Array<{
        id: string
        name: string
        teacher: string
      }>
      attendances: Array<{
        id: string
        date: Date | string
        status: string
        classId: string | null
        className: string
        notes: string | null
      }>
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

    const guardian = await db.guardian.findFirst({
      where: { userId: session.user.id, schoolId },
      include: {
        studentGuardians: {
          include: {
            student: {
              select: {
                id: true,
                givenName: true,
                middleName: true,
                surname: true,
                studentClasses: {
                  include: {
                    class: {
                      include: {
                        subject: true,
                        teacher: {
                          select: {
                            id: true,
                            givenName: true,
                            surname: true,
                          },
                        },
                      },
                    },
                  },
                },
                attendances: {
                  where: { schoolId, deletedAt: null },
                  orderBy: { date: "desc" },
                  take: 500,
                  select: {
                    id: true,
                    date: true,
                    status: true,
                    classId: true,
                    notes: true,
                    class: {
                      select: {
                        id: true,
                        name: true,
                        subject: {
                          select: { id: true, subjectName: true },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!guardian) {
      return { success: false, error: "Guardian record not found" }
    }

    const students = guardian.studentGuardians.map((sg) => ({
      id: sg.student.id,
      name: `${sg.student.givenName}${sg.student.middleName ? ` ${sg.student.middleName}` : ""} ${sg.student.surname}`,
      email: null as string | null,
      classes: sg.student.studentClasses.map((sc) => ({
        id: sc.class.id,
        name: `${sc.class.subject.subjectName} - ${sc.class.name}`,
        teacher: sc.class.teacher
          ? `${sc.class.teacher.givenName} ${sc.class.teacher.surname}`
          : "N/A",
      })),
      attendances: sg.student.attendances.map((a) => ({
        id: a.id,
        date: a.date,
        status: a.status,
        classId: a.classId,
        className: a.class.subject.subjectName,
        notes: a.notes,
      })),
    }))

    return { success: true, data: { students } }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch children's attendance",
    }
  }
}
