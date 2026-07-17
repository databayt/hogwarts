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
import {
  defaultRoomName,
  defaultSectionName,
  sectionLetters,
} from "@/components/catalog/room-naming"

import { assertClassroomPermission, getAuthContext } from "../authorization"
import {
  bulkEnrollStudentsSchema,
  generateClassesSchema,
  generateSectionsSchema,
} from "./validation"

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

    revalidatePath("/classrooms")
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

/**
 * Bulk generate Class records for a grade based on SubjectSelection.
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
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    const parsed = generateClassesSchema.parse(input)

    // Validate term exists
    const term = await db.term.findFirst({
      where: { id: parsed.termId, schoolId },
      select: { id: true },
    })
    if (!term) {
      return actionError(ACTION_ERRORS.NOT_FOUND)
    }

    // Find required defaults: all teachers, expertise map, and period range
    const [allTeachers, expertiseRecords, periods] = await Promise.all([
      db.teacher.findMany({
        where: { schoolId },
        select: { id: true },
      }),
      db.teacherSubjectExpertise.findMany({
        where: { schoolId },
        select: { subjectId: true, teacherId: true },
      }),
      db.period.findMany({
        where: { schoolId },
        orderBy: { startTime: "asc" },
        select: { id: true },
        take: 2,
      }),
    ])

    if (allTeachers.length === 0) {
      return actionError(ACTION_ERRORS.NO_TEACHERS_FOUND)
    }

    // Build expertise lookup: subjectId -> teacherId[]
    const expertiseMap = new Map<string, string[]>()
    for (const e of expertiseRecords) {
      const teachers = expertiseMap.get(e.subjectId) ?? []
      teachers.push(e.teacherId)
      expertiseMap.set(e.subjectId, teachers)
    }

    // Round-robin counters for fair distribution
    const expertiseRoundRobin = new Map<string, number>()
    let fallbackIndex = 0

    if (periods.length < 2) {
      return actionError(ACTION_ERRORS.NO_PERIODS_FOUND)
    }

    const startPeriodId = periods[0].id
    const endPeriodId = periods[periods.length - 1].id

    let totalCreated = 0
    const details: string[] = []

    // Ensure default department exists (outside per-grade loop)
    let defaultDept = await db.department.findFirst({
      where: { schoolId },
      select: { id: true },
    })
    if (!defaultDept) {
      defaultDept = await db.department.create({
        data: { schoolId, departmentName: "General" },
      })
    }

    // Process each grade in its own transaction to avoid Neon timeout
    for (const gradeId of parsed.gradeIds) {
      const grade = await db.academicGrade.findFirst({
        where: { id: gradeId, schoolId },
        select: { id: true, name: true, gradeNumber: true },
      })
      if (!grade) continue

      const selections = await db.subjectSelection.findMany({
        where: { schoolId, gradeId, isActive: true },
        include: {
          subject: { select: { id: true, name: true } },
        },
      })

      if (selections.length === 0) {
        details.push(`${grade.name}: no active subject selections found`)
        continue
      }

      // Check which classes already exist for this grade+term
      const existingClasses = await db.class.findMany({
        where: { schoolId, gradeId, termId: term.id },
        select: { subjectId: true },
      })
      const existingSubjectIds = new Set(
        existingClasses.map((c) => c.subjectId)
      )

      // Get classrooms for this grade
      const classrooms = await db.classroom.findMany({
        where: { schoolId, gradeId },
        select: { id: true },
        orderBy: { roomName: "asc" },
      })

      // Ensure at least one classroom exists for this grade
      let gradeClassrooms = classrooms
      if (gradeClassrooms.length === 0) {
        let defaultType = await db.classroomType.findFirst({
          where: { schoolId },
          select: { id: true },
        })
        if (!defaultType) {
          defaultType = await db.classroomType.create({
            data: { schoolId, name: "Classroom" },
          })
        }
        const defaultRoom = await db.classroom.upsert({
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
        gradeClassrooms = [{ id: defaultRoom.id }]
      }

      // Build batch of new classes to create
      const newClasses: {
        schoolId: string
        name: string
        subjectId: string
        gradeId: string
        termId: string
        teacherId: string
        classroomId: string
        startPeriodId: string
        endPeriodId: string
      }[] = []

      for (let i = 0; i < selections.length; i++) {
        const sel = selections[i]
        const subjectId = sel.catalogSubjectId

        if (existingSubjectIds.has(subjectId)) continue

        const catalogSubjectName =
          sel.subject?.name ?? sel.customName ?? "Unknown"
        const className = `${catalogSubjectName} - ${grade.name}`

        // Pick teacher: expertise match first, round-robin fallback
        let assignedTeacherId: string
        const matchedTeachers = expertiseMap.get(subjectId)
        if (matchedTeachers && matchedTeachers.length > 0) {
          const idx =
            (expertiseRoundRobin.get(subjectId) ?? 0) % matchedTeachers.length
          assignedTeacherId = matchedTeachers[idx]
          expertiseRoundRobin.set(subjectId, idx + 1)
        } else {
          assignedTeacherId = allTeachers[fallbackIndex % allTeachers.length].id
          fallbackIndex++
        }

        newClasses.push({
          schoolId,
          name: className,
          subjectId,
          gradeId,
          termId: term.id,
          teacherId: assignedTeacherId,
          classroomId: gradeClassrooms[i % gradeClassrooms.length].id,
          startPeriodId,
          endPeriodId,
        })
      }

      if (newClasses.length > 0) {
        await db.class.createMany({ data: newClasses })
        totalCreated += newClasses.length
        details.push(
          `${grade.name}: created ${newClasses.length} class${newClasses.length !== 1 ? "es" : ""}`
        )
      } else {
        details.push(`${grade.name}: all classes already exist`)
      }
    }

    revalidatePath("/classrooms")
    revalidatePath("/classes")
    return { success: true, data: { created: totalCreated, details } }
  } catch (error) {
    console.error("[generateClassesForGrade] Error:", error)

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

/**
 * Bulk enroll all students in their grade's classes.
 * For each grade: find students with that academicGradeId, find classes with that gradeId,
 * upsert StudentClass for each student×class pair.
 */
export async function bulkEnrollStudentsInClasses(
  input: z.infer<typeof bulkEnrollStudentsSchema>
): Promise<ActionResponse<{ enrolled: number; details: string[] }>> {
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

    const parsed = bulkEnrollStudentsSchema.safeParse(input)
    if (!parsed.success) {
      return actionError(
        ACTION_ERRORS.VALIDATION_ERROR,
        parsed.error.issues.map((e) => e.message).join(", ")
      )
    }

    let totalEnrolled = 0
    const details: string[] = []

    for (const gradeId of parsed.data.gradeIds) {
      const grade = await db.academicGrade.findFirst({
        where: { id: gradeId, schoolId },
        select: { name: true },
      })
      if (!grade) continue

      const [students, classes] = await Promise.all([
        db.student.findMany({
          where: { schoolId, academicGradeId: gradeId },
          select: { id: true },
        }),
        db.class.findMany({
          where: { schoolId, gradeId },
          select: { id: true },
        }),
      ])

      if (students.length === 0) {
        details.push(`${grade.name}: no students assigned to this grade`)
        continue
      }
      if (classes.length === 0) {
        details.push(`${grade.name}: no classes found — generate classes first`)
        continue
      }

      // Batch create all student×class pairs (skipDuplicates for idempotency)
      const pairs = students.flatMap((student) =>
        classes.map((cls) => ({
          schoolId,
          studentId: student.id,
          classId: cls.id,
        }))
      )
      const result = await db.studentClass.createMany({
        data: pairs,
        skipDuplicates: true,
      })
      const gradeEnrolled = result.count

      totalEnrolled += gradeEnrolled
      details.push(
        `${grade.name}: ${students.length} students × ${classes.length} classes = ${gradeEnrolled} enrollments`
      )
    }

    revalidatePath("/classrooms")
    revalidatePath("/students")
    return { success: true, data: { enrolled: totalEnrolled, details } }
  } catch (error) {
    console.error("[bulkEnrollStudentsInClasses] Error:", error)
    return actionError(
      ACTION_ERRORS.CREATE_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}
