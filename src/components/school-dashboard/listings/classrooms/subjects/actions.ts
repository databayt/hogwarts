"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { getDisplayText } from "@/lib/content-display"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"

import { assertClassroomPermission, getAuthContext } from "../authorization"
import { bulkUpdateSubjectRoomsSchema } from "./validation"

export type GradeSubjectAssignment = {
  gradeId: string
  gradeName: string
  gradeNumber: number
  classes: {
    classId: string
    subjectName: string
    teacherName: string
    currentRoomId: string
    currentRoomName: string
    currentRoomType: string
    weeklyPeriods: number | null
  }[]
  availableRooms: {
    id: string
    roomName: string
    typeName: string
    isShared: boolean
    capacity: number
    assignedCount: number
  }[]
}

export async function getSubjectRoomAssignments(
  lang: Locale
): Promise<ActionResponse<GradeSubjectAssignment[]>> {
  try {
    const session = await auth()
    if (!session?.user) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)

    const authContext = getAuthContext(session)
    if (!authContext) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)

    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    try {
      assertClassroomPermission(authContext, "read", { schoolId })
    } catch {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    const grades = await db.academicGrade.findMany({
      where: { schoolId },
      orderBy: { gradeNumber: "asc" },
      select: {
        id: true,
        name: true,
        lang: true,
        gradeNumber: true,
      },
    })

    if (grades.length === 0) {
      return { success: true, data: [] }
    }

    const result: GradeSubjectAssignment[] = []

    for (const grade of grades) {
      // Get classes for this grade with subject, classroom, teacher
      const classes = await db.class.findMany({
        where: { schoolId, gradeId: grade.id },
        select: {
          id: true,
          classroomId: true,
          subject: {
            select: {
              subjectName: true,
              lang: true,
              catalogSubjectId: true,
            },
          },
          classroom: {
            select: {
              id: true,
              roomName: true,
              lang: true,
              classroomType: { select: { name: true, lang: true } },
            },
          },
          teacher: {
            select: {
              givenName: true,
              surname: true,
            },
          },
        },
        orderBy: { subject: { subjectName: "asc" } },
      })

      // Get weeklyPeriods from SchoolSubjectSelection for this grade
      const selections = await db.schoolSubjectSelection.findMany({
        where: { schoolId, gradeId: grade.id, isActive: true },
        select: {
          catalogSubjectId: true,
          weeklyPeriods: true,
        },
      })

      const weeklyPeriodsMap = new Map(
        selections.map((s) => [s.catalogSubjectId, s.weeklyPeriods])
      )

      // Get available rooms: grade-specific OR shared (gradeId IS NULL)
      const availableRooms = await db.classroom.findMany({
        where: {
          schoolId,
          OR: [{ gradeId: grade.id }, { gradeId: null }],
        },
        select: {
          id: true,
          roomName: true,
          lang: true,
          gradeId: true,
          capacity: true,
          classroomType: { select: { name: true, lang: true } },
          _count: { select: { classes: true } },
        },
        orderBy: [{ gradeId: "desc" }, { roomName: "asc" }],
      })

      // Translate everything
      const translatedClasses = await Promise.all(
        classes.map(async (c) => ({
          classId: c.id,
          subjectName: await getDisplayText(
            c.subject.subjectName,
            (c.subject.lang as "ar" | "en") || "ar",
            lang,
            schoolId
          ),
          teacherName: [c.teacher.givenName, c.teacher.surname]
            .filter(Boolean)
            .join(" "),
          currentRoomId: c.classroomId,
          currentRoomName: await getDisplayText(
            c.classroom.roomName,
            (c.classroom.lang as "ar" | "en") || "ar",
            lang,
            schoolId
          ),
          currentRoomType: await getDisplayText(
            c.classroom.classroomType.name,
            (c.classroom.classroomType.lang as "ar" | "en") || "ar",
            lang,
            schoolId
          ),
          weeklyPeriods:
            weeklyPeriodsMap.get(c.subject.catalogSubjectId ?? "") ?? null,
        }))
      )

      const translatedRooms = await Promise.all(
        availableRooms.map(async (r) => ({
          id: r.id,
          roomName: await getDisplayText(
            r.roomName,
            (r.lang as "ar" | "en") || "ar",
            lang,
            schoolId
          ),
          typeName: await getDisplayText(
            r.classroomType.name,
            (r.classroomType.lang as "ar" | "en") || "ar",
            lang,
            schoolId
          ),
          isShared: r.gradeId === null,
          capacity: r.capacity,
          assignedCount: r._count.classes,
        }))
      )

      result.push({
        gradeId: grade.id,
        gradeName: await getDisplayText(
          grade.name,
          (grade.lang as "ar" | "en") || "ar",
          lang,
          schoolId
        ),
        gradeNumber: grade.gradeNumber,
        classes: translatedClasses,
        availableRooms: translatedRooms,
      })
    }

    return { success: true, data: result }
  } catch (error) {
    console.error("getSubjectRoomAssignments error:", error)
    return actionError(ACTION_ERRORS.UNKNOWN)
  }
}

export async function bulkUpdateSubjectRooms(
  input: unknown
): Promise<ActionResponse<{ updated: number }>> {
  try {
    const session = await auth()
    if (!session?.user) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)

    const authContext = getAuthContext(session)
    if (!authContext) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)

    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    try {
      assertClassroomPermission(authContext, "update", { schoolId })
    } catch {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    const parsed = bulkUpdateSubjectRoomsSchema.safeParse(input)
    if (!parsed.success) {
      return actionError(ACTION_ERRORS.VALIDATION_ERROR, parsed.error.message)
    }

    const { assignments } = parsed.data

    // Validate all class IDs belong to this school
    const classIds = assignments.map((a) => a.classId)
    const classCount = await db.class.count({
      where: { id: { in: classIds }, schoolId },
    })
    if (classCount !== classIds.length) {
      return actionError(
        ACTION_ERRORS.UNAUTHORIZED,
        "Class not found in school"
      )
    }

    // Validate all classroom IDs belong to this school
    const roomIds = [...new Set(assignments.map((a) => a.classroomId))]
    const rooms = await db.classroom.findMany({
      where: { id: { in: roomIds }, schoolId },
      select: { id: true, gradeId: true },
    })
    if (rooms.length !== roomIds.length) {
      return actionError(
        ACTION_ERRORS.UNAUTHORIZED,
        "Classroom not found in school"
      )
    }

    // Validate each target room is either same-grade or shared
    const classGrades = await db.class.findMany({
      where: { id: { in: classIds }, schoolId },
      select: { id: true, gradeId: true },
    })
    const classGradeMap = new Map(classGrades.map((c) => [c.id, c.gradeId]))
    const roomGradeMap = new Map(rooms.map((r) => [r.id, r.gradeId]))

    for (const assignment of assignments) {
      const classGradeId = classGradeMap.get(assignment.classId)
      const roomGradeId = roomGradeMap.get(assignment.classroomId)
      // Room must be shared (null gradeId) or match the class's grade
      if (roomGradeId !== null && roomGradeId !== classGradeId) {
        return actionError(
          ACTION_ERRORS.VALIDATION_ERROR,
          "Room must be assigned to same grade or be a shared room"
        )
      }
    }

    // Batch update in transaction
    await db.$transaction(
      assignments.map((a) =>
        db.class.update({
          where: { id: a.classId },
          data: { classroomId: a.classroomId },
        })
      )
    )

    revalidatePath("/classrooms")

    return { success: true, data: { updated: assignments.length } }
  } catch (error) {
    console.error("bulkUpdateSubjectRooms error:", error)
    return actionError(ACTION_ERRORS.UNKNOWN)
  }
}
