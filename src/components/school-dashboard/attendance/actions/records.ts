"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"

import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

/**
 * How a record names where it was taken: a period mark as "period -
 * section", a day's mark as the section, and a mark kept from before
 * sections as "subject - class".
 */
function recordLabel(r: {
  periodName: string | null
  section: { name: string } | null
  class: { name: string; subject: { name: string } | null } | null
}): string | null {
  if (r.class) return `${r.class.subject?.name ?? ""} - ${r.class.name}`
  if (r.periodName) {
    return r.section ? `${r.periodName} - ${r.section.name}` : r.periodName
  }
  return r.section?.name ?? null
}

/**
 * Get attendance records for the currently logged-in student
 */
export async function getStudentOwnAttendance(): Promise<
  ActionResponse<{
    records: Array<{
      id: string
      date: Date | string
      status: string
      sectionId: string | null
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
        sectionId: true,
        notes: true,
        periodName: true,
        section: { select: { name: true } },
        class: {
          select: {
            name: true,
            subject: { select: { name: true } },
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
          sectionId: r.sectionId,
          className: recordLabel(r),
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
      /** Filter options for the records view; none in the section model. */
      classes: Array<{
        id: string
        name: string
        teacher: string
      }>
      attendances: Array<{
        id: string
        date: Date | string
        status: string
        sectionId: string | null
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
                firstName: true,
                middleName: true,
                lastName: true,
                attendances: {
                  where: { schoolId, deletedAt: null },
                  orderBy: { date: "desc" },
                  take: 500,
                  select: {
                    id: true,
                    date: true,
                    status: true,
                    sectionId: true,
                    notes: true,
                    periodName: true,
                    section: { select: { name: true } },
                    class: {
                      select: {
                        name: true,
                        subject: { select: { name: true } },
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
      name: `${sg.student.firstName}${sg.student.middleName ? ` ${sg.student.middleName}` : ""} ${sg.student.lastName}`,
      email: null as string | null,
      classes: [],
      attendances: sg.student.attendances.map((a) => ({
        id: a.id,
        date: a.date,
        status: a.status,
        sectionId: a.sectionId,
        className: recordLabel(a) ?? "",
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
