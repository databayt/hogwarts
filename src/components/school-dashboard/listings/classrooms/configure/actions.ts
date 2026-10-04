"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"
import { z } from "zod"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { refreshPage } from "@/lib/refresh-page"
import { getTenantContext } from "@/lib/tenant-context"
import {
  defaultRoomName,
  defaultSectionName,
  sectionLetters,
} from "@/components/catalog/room-naming"

import { assertClassroomPermission, getAuthContext } from "../authorization"
import { generateSectionsSchema } from "./validation"

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

// Sentinel thrown inside the generateSections transaction so the catch block
// can map it to the CAPACITY_EXCEEDS_ROOM code (with structured details) rather
// than leaking a hardcoded English message.
class CapacityExceedsRoomError extends Error {
  constructor(
    public details: {
      sectionCapacity: number
      roomName: string
      roomCapacity: number
    }
  ) {
    super("CAPACITY_EXCEEDS_ROOM")
  }
}

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
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
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
          _count: { select: { sections: true } },
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
    return actionError(
      ACTION_ERRORS.LOAD_FAILED,
      error instanceof Error ? error.message : undefined
    )
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
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    const parsed = generateSectionsSchema.parse(input)

    // Enforce maxClasses plan limit
    const [school, existingClassroomCount] = await Promise.all([
      db.school.findUnique({
        where: { id: schoolId },
        select: { maxClasses: true, preferredLanguage: true },
      }),
      db.classroom.count({ where: { schoolId } }),
    ])

    if (school?.maxClasses != null) {
      const totalNewClassrooms = parsed.grades.reduce(
        (sum, g) => sum + g.sections,
        0
      )
      if (existingClassroomCount + totalNewClassrooms > school.maxClasses) {
        return actionError(
          ACTION_ERRORS.CLASSROOM_LIMIT_REACHED,
          JSON.stringify({
            limit: school.maxClasses,
            current: existingClassroomCount,
            requested: totalNewClassrooms,
          })
        )
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
        const letters = sectionLetters(school?.preferredLanguage)
        for (let i = 0; i < letters.length && created < needed; i++) {
          const letter = letters[i]
          if (usedLetters.has(letter)) continue

          // e.g. Grade 1 → A01 (section A), B01 (section B); Grade 12 → A12, B12.
          const roomName = defaultRoomName(letter, grade.gradeNumber)

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
            throw new CapacityExceedsRoomError({
              sectionCapacity: gradeConfig.capacityPerSection,
              roomName,
              roomCapacity: room.capacity,
            })
          }

          const sectionName = defaultSectionName(
            school?.preferredLanguage,
            grade.gradeNumber,
            grade.name,
            letter
          )
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

    refreshPage("/classrooms")
    return { success: true, data: { created: totalCreated, details } }
  } catch (error) {
    console.error("[generateSections] Error:", error)

    if (error instanceof CapacityExceedsRoomError) {
      return actionError(
        ACTION_ERRORS.CAPACITY_EXCEEDS_ROOM,
        JSON.stringify(error.details)
      )
    }

    if (error instanceof z.ZodError) {
      return actionError(
        ACTION_ERRORS.VALIDATION_ERROR,
        error.issues.map((e) => e.message).join(", ")
      )
    }

    return actionError(
      ACTION_ERRORS.CREATE_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}
