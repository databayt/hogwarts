"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { z } from "zod"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

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
}

export type RoomTypeOption = {
  id: string
  name: string
}

const SECTION_LETTERS = "ABCDEFGHIJ"

/**
 * Get current grade configuration: grades with existing section/room counts
 */
export async function getGradeConfiguration(): Promise<
  ActionResponse<{ grades: GradeConfig[]; roomTypes: RoomTypeOption[] }>
> {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
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
          _count: { select: { classes: true } },
        },
      }),
      db.classroomType.findMany({
        where: { schoolId },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
    ])

    // Count rooms linked to classes for each grade
    const gradeConfigs: GradeConfig[] = await Promise.all(
      grades.map(async (g) => {
        const roomCount = await db.classroom.count({
          where: {
            schoolId,
            classes: { some: { gradeId: g.id } },
          },
        })
        return {
          gradeId: g.id,
          gradeName: g.name,
          gradeNumber: g.gradeNumber,
          existingSections: g._count.classes,
          existingRooms: roomCount,
          maxStudents: g.maxStudents,
        }
      })
    )

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
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const parsed = generateSectionsSchema.parse(input)
    let totalCreated = 0
    const details: string[] = []

    // Check plan limit
    const [classCount, school] = await Promise.all([
      db.class.count({ where: { schoolId } }),
      db.school.findFirst({
        where: { id: schoolId },
        select: { maxClasses: true },
      }),
    ])

    const totalRequested = parsed.grades.reduce((sum, g) => {
      return sum + g.sections
    }, 0)

    // Count existing sections to only add what's needed
    const existingCounts = await Promise.all(
      parsed.grades.map(async (g) => {
        const count = await db.class.count({
          where: { schoolId, gradeId: g.gradeId },
        })
        return { gradeId: g.gradeId, count }
      })
    )

    const totalNew = parsed.grades.reduce((sum, g) => {
      const existing =
        existingCounts.find((e) => e.gradeId === g.gradeId)?.count ?? 0
      return sum + Math.max(0, g.sections - existing)
    }, 0)

    if (school?.maxClasses && classCount + totalNew > school.maxClasses) {
      return {
        success: false,
        error: `Would exceed class limit (${classCount + totalNew}/${school.maxClasses}). Upgrade your plan or reduce sections.`,
      }
    }

    // Get school's default subject, teacher, term for creating classes
    const [defaultSubject, defaultTeacher, defaultTerm, defaultPeriods] =
      await Promise.all([
        db.subject.findFirst({
          where: { schoolId },
          select: { id: true },
        }),
        db.teacher.findFirst({
          where: { schoolId },
          select: { id: true },
        }),
        db.term.findFirst({
          where: { schoolId },
          orderBy: { createdAt: "desc" },
          select: { id: true },
        }),
        db.period.findMany({
          where: { schoolId },
          orderBy: { startTime: "asc" },
          take: 2,
          select: { id: true },
        }),
      ])

    if (!defaultSubject || !defaultTeacher || !defaultTerm) {
      return {
        success: false,
        error:
          "Please set up at least one subject, teacher, and term before generating sections.",
      }
    }

    const startPeriodId = defaultPeriods[0]?.id
    const endPeriodId = defaultPeriods[1]?.id ?? defaultPeriods[0]?.id

    if (!startPeriodId) {
      return {
        success: false,
        error: "Please set up at least one period before generating sections.",
      }
    }

    for (const gradeConfig of parsed.grades) {
      const grade = await db.academicGrade.findFirst({
        where: { id: gradeConfig.gradeId, schoolId },
        select: { name: true, gradeNumber: true },
      })

      if (!grade) continue

      // Get existing classes for this grade
      const existingClasses = await db.class.findMany({
        where: { schoolId, gradeId: gradeConfig.gradeId },
        select: { name: true },
      })

      const existingCount = existingClasses.length
      const needed = Math.max(0, gradeConfig.sections - existingCount)

      if (needed === 0) {
        details.push(`${grade.name}: already has ${existingCount} sections`)
        continue
      }

      // Determine which section letters are already used
      const usedLetters = new Set(
        existingClasses
          .map((c) => {
            const match = c.name.match(/-([A-J])$/)
            return match ? match[1] : null
          })
          .filter(Boolean)
      )

      let created = 0
      for (let i = 0; i < SECTION_LETTERS.length && created < needed; i++) {
        const letter = SECTION_LETTERS[i]
        if (usedLetters.has(letter)) continue

        // Create Classroom
        const roomName = `Grade ${grade.gradeNumber} - Room ${letter}`

        // Check if room already exists
        const existingRoom = await db.classroom.findUnique({
          where: { schoolId_roomName: { schoolId, roomName } },
          select: { id: true },
        })

        let classroomId: string
        if (existingRoom) {
          classroomId = existingRoom.id
        } else {
          const newRoom = await db.classroom.create({
            data: {
              schoolId,
              roomName,
              typeId: gradeConfig.roomType,
              capacity: gradeConfig.capacityPerSection,
            },
          })
          classroomId = newRoom.id
        }

        // Create Class
        const className = `${grade.name}-${letter}`
        await db.class.create({
          data: {
            schoolId,
            name: className,
            gradeId: gradeConfig.gradeId,
            classroomId,
            subjectId: defaultSubject.id,
            teacherId: defaultTeacher.id,
            termId: defaultTerm.id,
            startPeriodId,
            endPeriodId,
            maxCapacity: gradeConfig.capacityPerSection,
            minCapacity: Math.max(
              1,
              Math.floor(gradeConfig.capacityPerSection * 0.5)
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
