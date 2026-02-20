"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  classroomCreateSchema,
  classroomUpdateSchema,
  getClassroomsSchema,
} from "./validation"

type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

const CLASSROOMS_PATH = "/classrooms"

// ============================================================================
// Queries
// ============================================================================

export async function getClassrooms(
  input: z.infer<typeof getClassroomsSchema>
) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) return { success: false as const, error: "Missing school" }

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
        classroomType: { select: { id: true, name: true } },
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

  return db.classroomType.findMany({
    where: { schoolId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })
}

export async function getClassroom(input: { id: string }) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) return null

  return db.classroom.findFirst({
    where: { id: input.id, schoolId },
    select: {
      id: true,
      roomName: true,
      capacity: true,
      typeId: true,
      classroomType: { select: { id: true, name: true } },
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

    const parsed = classroomCreateSchema.parse(input)

    const row = await db.classroom.create({
      data: {
        schoolId,
        roomName: parsed.roomName,
        typeId: parsed.typeId,
        capacity: parsed.capacity,
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

    // Check for references
    const refs = await db.class.count({
      where: { classroomId: input.id, schoolId },
    })
    if (refs > 0) {
      return {
        success: false,
        error: `Cannot delete: ${refs} class(es) are assigned to this room`,
      }
    }

    const ttRefs = await db.timetable.count({
      where: { classroomId: input.id, schoolId },
    })
    if (ttRefs > 0) {
      return {
        success: false,
        error: `Cannot delete: ${ttRefs} timetable slot(s) reference this room`,
      }
    }

    const constraintRefs = await db.roomConstraint.count({
      where: { classroomId: input.id, schoolId },
    })
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
