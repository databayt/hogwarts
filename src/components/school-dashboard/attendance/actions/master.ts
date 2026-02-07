"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import type { AttendanceMethod, AttendanceStatus } from "@prisma/client"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import type { ActionResponse } from "./core"

/**
 * Record master attendance (school gate entry/exit)
 * Creates or updates the MasterAttendance record for a student on a given date
 */
export async function recordMasterAttendance(input: {
  studentId: string
  date: string
  status?: AttendanceStatus
  checkInTime?: string
  checkOutTime?: string
  method?: AttendanceMethod
  deviceId?: string
  notes?: string
}): Promise<ActionResponse<{ id: string; action: "created" | "updated" }>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" }
    }

    const dateObj = new Date(input.date)

    // Upsert master attendance
    const existing = await db.masterAttendance.findUnique({
      where: {
        schoolId_studentId_date: {
          schoolId,
          studentId: input.studentId,
          date: dateObj,
        },
      },
    })

    if (existing) {
      const updated = await db.masterAttendance.update({
        where: { id: existing.id },
        data: {
          status: input.status || existing.status,
          checkInTime: input.checkInTime
            ? new Date(input.checkInTime)
            : existing.checkInTime,
          checkOutTime: input.checkOutTime
            ? new Date(input.checkOutTime)
            : existing.checkOutTime,
          method: input.method || existing.method,
          deviceId: input.deviceId || existing.deviceId,
          notes: input.notes ?? existing.notes,
        },
      })
      revalidatePath("/attendance")
      return { success: true, data: { id: updated.id, action: "updated" } }
    }

    const created = await db.masterAttendance.create({
      data: {
        schoolId,
        studentId: input.studentId,
        date: dateObj,
        status: input.status || "PRESENT",
        checkInTime: input.checkInTime
          ? new Date(input.checkInTime)
          : new Date(),
        method: input.method || "MANUAL",
        deviceId: input.deviceId,
        notes: input.notes,
      },
    })

    revalidatePath("/attendance")
    return { success: true, data: { id: created.id, action: "created" } }
  } catch (error) {
    console.error("[recordMasterAttendance] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to record master attendance",
    }
  }
}

/**
 * Get master attendance for a day (school-wide occupancy view)
 */
export async function getMasterAttendanceForDay(input: {
  date: string
}): Promise<
  ActionResponse<{
    records: Array<{
      studentId: string
      studentName: string
      status: string
      checkInTime: string | null
      checkOutTime: string | null
      method: string
    }>
    summary: {
      total: number
      present: number
      absent: number
      late: number
      checkedOut: number
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

    const dateObj = new Date(input.date)

    const records = await db.masterAttendance.findMany({
      where: {
        schoolId,
        date: dateObj,
      },
      include: {
        student: {
          select: { givenName: true, surname: true },
        },
      },
      orderBy: { checkInTime: "asc" },
    })

    const summary = {
      total: records.length,
      present: records.filter((r) => r.status === "PRESENT").length,
      absent: records.filter((r) => r.status === "ABSENT").length,
      late: records.filter((r) => r.status === "LATE").length,
      checkedOut: records.filter((r) => r.checkOutTime !== null).length,
    }

    return {
      success: true,
      data: {
        records: records.map((r) => ({
          studentId: r.studentId,
          studentName: `${r.student.givenName} ${r.student.surname}`,
          status: r.status,
          checkInTime: r.checkInTime?.toISOString() || null,
          checkOutTime: r.checkOutTime?.toISOString() || null,
          method: r.method,
        })),
        summary,
      },
    }
  } catch (error) {
    console.error("[getMasterAttendanceForDay] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get master attendance",
    }
  }
}

/**
 * Pre-fill period attendance from master attendance
 * If student is ABSENT in master, auto-mark all periods as ABSENT
 * Returns students who are present at school (for teacher to mark period attendance)
 */
export async function getPrefillFromMaster(input: {
  classId: string
  date: string
}): Promise<
  ActionResponse<{
    presentStudents: Array<{
      studentId: string
      studentName: string
      masterStatus: string
      checkInTime: string | null
    }>
    absentStudents: Array<{
      studentId: string
      studentName: string
    }>
    totalEnrolled: number
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

    const dateObj = new Date(input.date)

    // Get students enrolled in this class
    const enrolledStudents = await db.studentClass.findMany({
      where: {
        schoolId,
        classId: input.classId,
      },
      include: {
        student: {
          select: { id: true, givenName: true, surname: true },
        },
      },
    })

    // Get master attendance for these students today
    const studentIds = enrolledStudents.map((e) => e.student.id)
    const masterRecords = await db.masterAttendance.findMany({
      where: {
        schoolId,
        studentId: { in: studentIds },
        date: dateObj,
      },
    })

    const masterMap = new Map(masterRecords.map((r) => [r.studentId, r]))

    const presentStudents: Array<{
      studentId: string
      studentName: string
      masterStatus: string
      checkInTime: string | null
    }> = []

    const absentStudents: Array<{
      studentId: string
      studentName: string
    }> = []

    for (const enrolled of enrolledStudents) {
      const student = enrolled.student
      const master = masterMap.get(student.id)

      if (!master || master.status === "ABSENT") {
        absentStudents.push({
          studentId: student.id,
          studentName: `${student.givenName} ${student.surname}`,
        })
      } else {
        presentStudents.push({
          studentId: student.id,
          studentName: `${student.givenName} ${student.surname}`,
          masterStatus: master.status,
          checkInTime: master.checkInTime?.toISOString() || null,
        })
      }
    }

    return {
      success: true,
      data: {
        presentStudents,
        absentStudents,
        totalEnrolled: enrolledStudents.length,
      },
    }
  } catch (error) {
    console.error("[getPrefillFromMaster] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get prefill data",
    }
  }
}
