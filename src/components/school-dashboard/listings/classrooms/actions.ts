"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { z } from "zod"

import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { assertClassroomPermission, getAuthContext } from "./authorization"
import {
  classroomCreateSchema,
  classroomUpdateSchema,
  getClassroomsSchema,
} from "./validation"

const CLASSROOMS_PATH = "/classrooms"

// ============================================================================
// Queries
// ============================================================================

export async function getClassrooms(
  input: z.infer<typeof getClassroomsSchema>
) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) return { success: false as const, error: "Missing school" }

  const session = await auth()
  const authContext = getAuthContext(session)
  if (!authContext)
    return { success: false as const, error: "Not authenticated" }
  try {
    assertClassroomPermission(authContext, "read", { schoolId })
  } catch {
    return { success: false as const, error: "Unauthorized" }
  }

  const parsed = getClassroomsSchema.parse(input)
  const { page, perPage, name, typeId, building } = parsed

  const where: Record<string, unknown> = { schoolId }
  if (typeId) where.typeId = typeId

  if (name && building) {
    where.AND = [
      { roomName: { contains: name, mode: "insensitive" } },
      { roomName: { startsWith: building, mode: "insensitive" } },
    ]
  } else if (name) {
    where.roomName = { contains: name, mode: "insensitive" }
  } else if (building) {
    where.roomName = { startsWith: building, mode: "insensitive" }
  }

  const [rows, total] = await Promise.all([
    db.classroom.findMany({
      where,
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { roomName: "asc" },
      select: {
        id: true,
        roomName: true,
        capacity: true,
        typeId: true,
        gradeId: true,
        classroomType: { select: { id: true, name: true } },
        grade: { select: { id: true, name: true } },
        _count: { select: { classes: true, timetables: true } },
        createdAt: true,
      },
    }),
    db.classroom.count({ where }),
  ])

  return {
    success: true as const,
    data: rows.map((r) => ({
      id: r.id,
      roomName: r.roomName,
      capacity: r.capacity,
      typeName: r.classroomType.name,
      typeId: r.typeId,
      gradeName: r.grade?.name ?? null,
      gradeId: r.gradeId,
      classCount: r._count.classes,
      timetableCount: r._count.timetables,
      createdAt: r.createdAt.toISOString(),
    })),
    total,
    page,
    perPage,
  }
}

export async function getClassroomTypes() {
  const { schoolId } = await getTenantContext()
  if (!schoolId) return []

  const session = await auth()
  const authContext = getAuthContext(session)
  if (!authContext) return []
  try {
    assertClassroomPermission(authContext, "read", { schoolId })
  } catch {
    return []
  }

  return db.classroomType.findMany({
    where: { schoolId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })
}

export async function getGrades() {
  const { schoolId } = await getTenantContext()
  if (!schoolId) return []

  return db.academicGrade.findMany({
    where: { schoolId },
    select: { id: true, name: true },
    orderBy: { gradeNumber: "asc" },
  })
}

export async function getClassroom(input: { id: string }) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) return null

  const session = await auth()
  const authContext = getAuthContext(session)
  if (!authContext) return null
  try {
    assertClassroomPermission(authContext, "read", { schoolId })
  } catch {
    return null
  }

  return db.classroom.findFirst({
    where: { id: input.id, schoolId },
    select: {
      id: true,
      roomName: true,
      capacity: true,
      typeId: true,
      gradeId: true,
      classroomType: { select: { id: true, name: true } },
      grade: { select: { id: true, name: true } },
    },
  })
}

// ============================================================================
// Mutations
// ============================================================================

export async function createClassroom(
  input: z.infer<typeof classroomCreateSchema>
): Promise<ActionResponse<{ id: string }>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school" }

    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) return { success: false, error: "Not authenticated" }
    try {
      assertClassroomPermission(authContext, "create", { schoolId })
    } catch {
      return { success: false, error: "Unauthorized to create classrooms" }
    }

    const parsed = classroomCreateSchema.parse(input)

    // Enforce maxClasses plan limit
    const [school, existingClassroomCount] = await Promise.all([
      db.school.findUnique({
        where: { id: schoolId },
        select: { maxClasses: true },
      }),
      db.classroom.count({ where: { schoolId } }),
    ])

    if (
      school?.maxClasses != null &&
      existingClassroomCount + 1 > school.maxClasses
    ) {
      return {
        success: false,
        error: `Classroom limit reached. Your plan allows ${school.maxClasses} classrooms and you currently have ${existingClassroomCount}. Upgrade your plan to add more.`,
      }
    }

    const row = await db.classroom.create({
      data: {
        schoolId,
        roomName: parsed.roomName,
        typeId: parsed.typeId,
        capacity: parsed.capacity,
        gradeId: parsed.gradeId || null,
      },
    })

    revalidatePath(CLASSROOMS_PATH)
    return { success: true, data: { id: row.id } }
  } catch (error) {
    if ((error as any)?.code === "P2002") {
      return { success: false, error: "A room with this name already exists" }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create",
    }
  }
}

export async function updateClassroom(
  input: z.infer<typeof classroomUpdateSchema>
): Promise<ActionResponse<void>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school" }

    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) return { success: false, error: "Not authenticated" }
    try {
      assertClassroomPermission(authContext, "update", { schoolId })
    } catch {
      return { success: false, error: "Unauthorized to update classrooms" }
    }

    const parsed = classroomUpdateSchema.parse(input)
    const { id, ...rest } = parsed

    const existing = await db.classroom.findFirst({
      where: { id, schoolId },
    })
    if (!existing) return { success: false, error: "Classroom not found" }

    const data: Record<string, unknown> = {}
    if (typeof rest.roomName !== "undefined") data.roomName = rest.roomName
    if (typeof rest.typeId !== "undefined") data.typeId = rest.typeId
    if (typeof rest.capacity !== "undefined") data.capacity = rest.capacity
    if (typeof rest.gradeId !== "undefined") data.gradeId = rest.gradeId || null

    await db.classroom.updateMany({ where: { id, schoolId }, data })

    revalidatePath(CLASSROOMS_PATH)
    return { success: true, data: undefined }
  } catch (error) {
    if ((error as any)?.code === "P2002") {
      return { success: false, error: "A room with this name already exists" }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update",
    }
  }
}

export async function deleteClassroom(input: {
  id: string
}): Promise<ActionResponse<void>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school" }

    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) return { success: false, error: "Not authenticated" }
    try {
      assertClassroomPermission(authContext, "delete", { schoolId })
    } catch {
      return { success: false, error: "Unauthorized to delete classrooms" }
    }

    // Check for references (parallel for performance)
    const [refs, ttRefs, constraintRefs] = await Promise.all([
      db.class.count({ where: { classroomId: input.id, schoolId } }),
      db.timetable.count({ where: { classroomId: input.id, schoolId } }),
      db.roomConstraint.count({ where: { classroomId: input.id, schoolId } }),
    ])

    if (refs > 0) {
      return {
        success: false,
        error: `Cannot delete: ${refs} class(es) are assigned to this room`,
      }
    }
    if (ttRefs > 0) {
      return {
        success: false,
        error: `Cannot delete: ${ttRefs} timetable slot(s) reference this room`,
      }
    }
    if (constraintRefs > 0) {
      return {
        success: false,
        error: `Cannot delete: ${constraintRefs} room constraint(s) reference this room`,
      }
    }

    await db.classroom.deleteMany({ where: { id: input.id, schoolId } })

    revalidatePath(CLASSROOMS_PATH)
    return { success: true, data: undefined }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete",
    }
  }
}

// ============================================================================
// Room Detail Queries
// ============================================================================

export async function getRoomDetail(input: { id: string }) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) return null

  const session = await auth()
  const authContext = getAuthContext(session)
  if (!authContext) return null
  try {
    assertClassroomPermission(authContext, "read", { schoolId })
  } catch {
    return null
  }

  return db.classroom.findFirst({
    where: { id: input.id, schoolId },
    select: {
      id: true,
      roomName: true,
      capacity: true,
      typeId: true,
      gradeId: true,
      lang: true,
      classroomType: { select: { id: true, name: true, lang: true } },
      grade: { select: { id: true, name: true, lang: true } },
    },
  })
}

export async function getRoomTimetable(input: {
  roomId: string
  termId: string
}) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) return { slots: [], workingDays: [] as number[], periods: [] }

  const session = await auth()
  const authContext = getAuthContext(session)
  if (!authContext)
    return { slots: [], workingDays: [] as number[], periods: [] }

  const [slots, weekConfig, periods] = await Promise.all([
    db.timetable.findMany({
      where: {
        schoolId,
        classroomId: input.roomId,
        termId: input.termId,
        weekOffset: 0,
      },
      select: {
        id: true,
        dayOfWeek: true,
        periodId: true,
        class: {
          select: {
            id: true,
            name: true,
            grade: { select: { id: true, name: true } },
            subject: { select: { id: true, subjectName: true } },
          },
        },
        teacher: {
          select: {
            id: true,
            givenName: true,
            surname: true,
          },
        },
      },
    }),
    db.schoolWeekConfig.findFirst({
      where: { schoolId },
      select: { workingDays: true },
    }),
    db.period.findMany({
      where: { schoolId },
      orderBy: { startTime: "asc" },
      select: { id: true, name: true, startTime: true, endTime: true },
    }),
  ])

  return {
    slots: slots.map((s) => ({
      id: s.id,
      dayOfWeek: s.dayOfWeek,
      periodId: s.periodId,
      className: s.class.name,
      classId: s.class.id,
      gradeName: s.class.grade?.name ?? null,
      gradeId: s.class.grade?.id ?? null,
      subject: s.class.subject?.subjectName ?? "",
      teacher: `${s.teacher.givenName} ${s.teacher.surname}`,
      teacherId: s.teacher.id,
    })),
    workingDays: weekConfig?.workingDays ?? [0, 1, 2, 3, 4],
    periods: periods.map((p) => ({
      id: p.id,
      name: p.name,
      startTime: p.startTime.toISOString(),
      endTime: p.endTime.toISOString(),
    })),
  }
}

export async function getRoomClasses(input: { roomId: string }) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) return []

  const session = await auth()
  const authContext = getAuthContext(session)
  if (!authContext) return []
  try {
    assertClassroomPermission(authContext, "read", { schoolId })
  } catch {
    return []
  }

  return db.class.findMany({
    where: { schoolId, classroomId: input.roomId },
    select: {
      id: true,
      name: true,
      maxCapacity: true,
      grade: { select: { id: true, name: true } },
      subject: { select: { id: true, subjectName: true } },
      teacher: {
        select: {
          id: true,
          givenName: true,
          surname: true,
        },
      },
      _count: { select: { studentClasses: true } },
    },
    orderBy: { name: "asc" },
  })
}

// ============================================================================
// Room Capacity Overview
// ============================================================================

export async function getRoomCapacityOverview() {
  const { schoolId } = await getTenantContext()
  if (!schoolId) return null

  const session = await auth()
  const authContext = getAuthContext(session)
  if (!authContext) return null
  try {
    assertClassroomPermission(authContext, "read", { schoolId })
  } catch {
    return null
  }

  const rooms = await db.classroom.findMany({
    where: { schoolId },
    select: {
      id: true,
      roomName: true,
      capacity: true,
      lang: true,
      classroomType: { select: { name: true, lang: true } },
      grade: { select: { name: true, lang: true } },
      _count: { select: { classes: true } },
    },
    orderBy: { roomName: "asc" },
  })

  return rooms
}
