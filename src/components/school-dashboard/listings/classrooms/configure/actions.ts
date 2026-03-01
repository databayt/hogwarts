"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { z } from "zod"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { assertClassroomPermission, getAuthContext } from "../authorization"
import { generateSectionsSchema } from "./validation"

type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

export type GradeConfig = {
  gradeId: string
  gradeName: string
  gradeNumber: number
  existingSections: number
  existingRooms: number
  maxStudents: number
  existingSectionRecords: number
}

export type RoomTypeOption = {
  id: string
  name: string
}

const SECTION_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

/**
 * Get current grade configuration: grades with existing section/room counts
 */
export async function getGradeConfiguration(): Promise<
  ActionResponse<{ grades: GradeConfig[]; roomTypes: RoomTypeOption[] }>
> {
  try {
    const session = await auth()
    if (!session?.user) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const authContext = getAuthContext(session)
    if (!authContext) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    try {
      assertClassroomPermission(authContext, "read", { schoolId })
    } catch {
      return {
        success: false,
        error: "Unauthorized to view classroom configuration",
      }
    }

    const [grades, roomTypes] = await Promise.all([
      db.academicGrade.findMany({
        where: { schoolId },
        orderBy: { gradeNumber: "asc" },
        select: {
          id: true,
          name: true,
          gradeNumber: true,
          maxStudents: true,
          _count: { select: { classes: true, sections: true } },
        },
      }),
      db.classroomType.findMany({
        where: { schoolId },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
    ])

    // Count distinct classrooms per grade via sections
    const sectionsWithRooms = await db.section.findMany({
      where: {
        schoolId,
        gradeId: { in: grades.map((g) => g.id) },
        classroomId: { not: null },
      },
      select: { gradeId: true, classroomId: true },
      distinct: ["gradeId", "classroomId"],
    })

    const roomCountByGrade = new Map<string, number>()
    for (const row of sectionsWithRooms) {
      roomCountByGrade.set(
        row.gradeId,
        (roomCountByGrade.get(row.gradeId) ?? 0) + 1
      )
    }

    const gradeConfigs: GradeConfig[] = grades.map((g) => ({
      gradeId: g.id,
      gradeName: g.name,
      gradeNumber: g.gradeNumber,
      existingSections: g._count.sections,
      existingRooms: roomCountByGrade.get(g.id) ?? 0,
      maxStudents: g.maxStudents,
      existingSectionRecords: g._count.sections,
    }))

    return {
      success: true,
      data: {
        grades: gradeConfigs,
        roomTypes: roomTypes.map((t) => ({ id: t.id, name: t.name })),
      },
    }
  } catch (error) {
    console.error("[getGradeConfiguration] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to load grade configuration",
    }
  }
}

/**
 * Bulk generate sections (Class + Classroom) for one or more grades
 */
export async function generateSections(
  input: z.infer<typeof generateSectionsSchema>
): Promise<ActionResponse<{ created: number; details: string[] }>> {
  try {
    const session = await auth()
    if (!session?.user) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const authContext = getAuthContext(session)
    if (!authContext) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    try {
      assertClassroomPermission(authContext, "create", { schoolId })
    } catch {
      return { success: false, error: "Unauthorized to generate sections" }
    }

    const parsed = generateSectionsSchema.parse(input)

    // Enforce maxClasses plan limit
    const [school, existingClassroomCount] = await Promise.all([
      db.school.findUnique({
        where: { id: schoolId },
        select: { maxClasses: true },
      }),
      db.classroom.count({ where: { schoolId } }),
    ])

    if (school?.maxClasses != null) {
      const totalNewClassrooms = parsed.grades.reduce(
        (sum, g) => sum + g.sections,
        0
      )
      if (existingClassroomCount + totalNewClassrooms > school.maxClasses) {
        return {
          success: false,
          error: `Classroom limit reached. Your plan allows ${school.maxClasses} classrooms and you currently have ${existingClassroomCount}. Requested ${totalNewClassrooms} new sections would exceed the limit.`,
        }
      }
    }

    let totalCreated = 0
    const details: string[] = []

    // Count existing sections to only add what's needed
    const existingCounts = await Promise.all(
      parsed.grades.map(async (g) => {
        const count = await db.section.count({
          where: { schoolId, gradeId: g.gradeId },
        })
        return { gradeId: g.gradeId, count }
      })
    )

    // Wrap all mutations in a transaction for atomicity
    await db.$transaction(async (tx) => {
      for (const gradeConfig of parsed.grades) {
        const grade = await tx.academicGrade.findFirst({
          where: { id: gradeConfig.gradeId, schoolId },
          select: { name: true, gradeNumber: true },
        })

        if (!grade) continue

        // Get existing sections for this grade
        const existingSections = await tx.section.findMany({
          where: { schoolId, gradeId: gradeConfig.gradeId },
          select: { letter: true },
        })

        const existingCount = existingSections.length
        const needed = Math.max(0, gradeConfig.sections - existingCount)

        if (needed === 0) {
          details.push(`${grade.name}: already has ${existingCount} sections`)
          continue
        }

        // Determine which section letters are already used
        const usedLetters = new Set(existingSections.map((s) => s.letter))

        let created = 0
        for (let i = 0; i < SECTION_LETTERS.length && created < needed; i++) {
          const letter = SECTION_LETTERS[i]
          if (usedLetters.has(letter)) continue

          const roomName = `Grade ${grade.gradeNumber} - Room ${letter}`

          // Upsert classroom for the section
          const room = await tx.classroom.upsert({
            where: { schoolId_roomName: { schoolId, roomName } },
            create: {
              schoolId,
              roomName,
              typeId: gradeConfig.roomType,
              capacity: gradeConfig.capacityPerSection,
              gradeId: gradeConfig.gradeId,
            },
            update: {},
          })

          // Capacity cross-validation: section capacity must not exceed room capacity
          if (
            room.capacity != null &&
            gradeConfig.capacityPerSection > room.capacity
          ) {
            throw new Error(
              `Section capacity (${gradeConfig.capacityPerSection}) exceeds room "${roomName}" capacity (${room.capacity}). Increase room capacity or reduce section size.`
            )
          }

          const sectionName = `Grade ${grade.gradeNumber}-${letter}`
          await tx.section.create({
            data: {
              schoolId,
              gradeId: gradeConfig.gradeId,
              name: sectionName,
              letter,
              lang: "ar",
              classroomId: room.id,
              maxCapacity: Math.min(
                gradeConfig.capacityPerSection,
                room.capacity ?? gradeConfig.capacityPerSection
              ),
            },
          })

          created++
          totalCreated++
        }

        details.push(
          `${grade.name}: created ${created} new section${created !== 1 ? "s" : ""} with rooms`
        )
      }
    })

    revalidatePath("/classrooms")
    return { success: true, data: { created: totalCreated, details } }
  } catch (error) {
    console.error("[generateSections] Error:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to generate sections",
    }
  }
}
