"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { z } from "zod"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { assertClassroomPermission, getAuthContext } from "../authorization"
import { generateClassesSchema, generateSectionsSchema } from "./validation"

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

/**
 * Bulk generate Class records for a grade based on SchoolSubjectSelection.
 * Each selection becomes a Class record (subject x grade x term).
 */
export async function generateClassesForGrade(
  input: z.infer<typeof generateClassesSchema>
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
      return { success: false, error: "Unauthorized to generate classes" }
    }

    const parsed = generateClassesSchema.parse(input)

    // Validate term exists
    const term = await db.term.findFirst({
      where: { id: parsed.termId, schoolId },
      select: { id: true },
    })
    if (!term) {
      return { success: false, error: "Term not found" }
    }

    // Find required defaults: a teacher and period range
    const [defaultTeacher, periods] = await Promise.all([
      db.teacher.findFirst({
        where: { schoolId },
        select: { id: true },
      }),
      db.period.findMany({
        where: { schoolId },
        orderBy: { startTime: "asc" },
        select: { id: true },
        take: 2,
      }),
    ])

    if (!defaultTeacher) {
      return {
        success: false,
        error:
          "No teachers found. Create at least one teacher before generating classes.",
      }
    }

    if (periods.length < 2) {
      return {
        success: false,
        error:
          "No periods found. Configure school periods before generating classes.",
      }
    }

    const startPeriodId = periods[0].id
    const endPeriodId = periods[periods.length - 1].id

    let totalCreated = 0
    const details: string[] = []

    await db.$transaction(async (tx) => {
      for (const gradeId of parsed.gradeIds) {
        const grade = await tx.academicGrade.findFirst({
          where: { id: gradeId, schoolId },
          select: { id: true, name: true, gradeNumber: true },
        })
        if (!grade) continue

        // Get subject selections for this grade (relation name is 'subject' -> CatalogSubject)
        const selections = await tx.schoolSubjectSelection.findMany({
          where: { schoolId, gradeId, isActive: true },
          include: {
            subject: {
              select: { id: true, name: true },
            },
          },
        })

        if (selections.length === 0) {
          details.push(`${grade.name}: no active subject selections found`)
          continue
        }

        // Get or create a default department for auto-generated subjects
        let defaultDept = await tx.department.findFirst({
          where: { schoolId },
          select: { id: true },
        })
        if (!defaultDept) {
          defaultDept = await tx.department.create({
            data: { schoolId, departmentName: "General" },
          })
        }

        // Get classrooms for this grade (round-robin assignment)
        const classrooms = await tx.classroom.findMany({
          where: { schoolId, gradeId },
          select: { id: true },
          orderBy: { roomName: "asc" },
        })

        let created = 0
        for (let i = 0; i < selections.length; i++) {
          const sel = selections[i]
          const catalogSubjectName =
            sel.subject?.name ?? sel.customName ?? "Unknown"

          // Find or create school-scoped Subject
          let subjectRecord = await tx.subject.findFirst({
            where: { schoolId, catalogSubjectId: sel.catalogSubjectId },
            select: { id: true },
          })

          if (!subjectRecord) {
            subjectRecord = await tx.subject.create({
              data: {
                schoolId,
                departmentId: defaultDept.id,
                subjectName: catalogSubjectName,
                catalogSubjectId: sel.catalogSubjectId,
              },
            })
          }

          const className = `${catalogSubjectName} - ${grade.name}`

          // Upsert to be idempotent
          const existing = await tx.class.findFirst({
            where: {
              schoolId,
              subjectId: subjectRecord.id,
              gradeId,
              termId: term.id,
            },
            select: { id: true },
          })

          if (!existing) {
            const roomId =
              classrooms.length > 0
                ? classrooms[i % classrooms.length].id
                : classrooms[0]?.id

            // roomId is required — if no classrooms exist, create a default one
            let assignedRoomId = roomId
            if (!assignedRoomId) {
              // Get or create default classroom type
              let defaultType = await tx.classroomType.findFirst({
                where: { schoolId },
                select: { id: true },
              })
              if (!defaultType) {
                defaultType = await tx.classroomType.create({
                  data: { schoolId, name: "Classroom" },
                })
              }

              const defaultRoom = await tx.classroom.upsert({
                where: {
                  schoolId_roomName: {
                    schoolId,
                    roomName: `${grade.name} - Default`,
                  },
                },
                create: {
                  schoolId,
                  roomName: `${grade.name} - Default`,
                  typeId: defaultType.id,
                  gradeId,
                  capacity: 30,
                },
                update: {},
              })
              assignedRoomId = defaultRoom.id
            }

            await tx.class.create({
              data: {
                schoolId,
                name: className,
                subjectId: subjectRecord.id,
                gradeId,
                termId: term.id,
                teacherId: defaultTeacher.id,
                classroomId: assignedRoomId,
                startPeriodId,
                endPeriodId,
              },
            })
            created++
            totalCreated++
          }
        }

        details.push(
          created > 0
            ? `${grade.name}: created ${created} class${created !== 1 ? "es" : ""}`
            : `${grade.name}: all classes already exist`
        )
      }
    })

    revalidatePath("/classrooms")
    revalidatePath("/classes")
    return { success: true, data: { created: totalCreated, details } }
  } catch (error) {
    console.error("[generateClassesForGrade] Error:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to generate classes",
    }
  }
}
