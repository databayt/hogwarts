"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  getLessonsSchema,
  lessonCreateSchema,
  lessonUpdateSchema,
} from "@/components/platform/listings/lessons/validation"

// ============================================================================
// Types
// ============================================================================

export type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

type LessonSelectResult = {
  id: string
  schoolId: string
  classId: string
  title: string
  description: string | null
  lessonDate: Date
  startTime: string
  endTime: string
  objectives: string | null
  materials: string | null
  activities: string | null
  assessment: string | null
  notes: string | null
  status: string
  createdAt: Date
  updatedAt: Date
}

type LessonListResult = {
  id: string
  title: string
  className: string
  teacherName: string
  subjectName: string
  lessonDate: string
  startTime: string
  endTime: string
  status: string
  createdAt: string
}

const LESSONS_PATH = "/lessons"

// ============================================================================
// Mutations
// ============================================================================

export async function createLesson(
  input: z.infer<typeof lessonCreateSchema>
): Promise<ActionResponse<{ id: string }>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const parsed = lessonCreateSchema.parse(input)

    const row = await db.lesson.create({
      data: {
        schoolId,
        classId: parsed.classId,
        title: parsed.title,
        description: parsed.description || null,
        lessonDate: parsed.lessonDate,
        startTime: parsed.startTime,
        endTime: parsed.endTime,
        objectives: parsed.objectives || null,
        materials: parsed.materials || null,
        activities: parsed.activities || null,
        assessment: parsed.assessment || null,
        notes: parsed.notes || null,
        status: "PLANNED",
      },
    })

    revalidatePath(LESSONS_PATH)
    return { success: true, data: { id: row.id } }
  } catch (error) {
    console.error("[createLesson] Error:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create lesson",
    }
  }
}

export async function updateLesson(
  input: z.infer<typeof lessonUpdateSchema>
): Promise<ActionResponse<void>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const parsed = lessonUpdateSchema.parse(input)
    const { id, ...rest } = parsed

    // Verify lesson exists
    const existing = await db.lesson.findFirst({
      where: { id, schoolId },
      select: { id: true },
    })

    if (!existing) {
      return { success: false, error: "Lesson not found" }
    }

    const data: Record<string, unknown> = {}
    if (typeof rest.title !== "undefined") data.title = rest.title
    if (typeof rest.description !== "undefined")
      data.description = rest.description || null
    if (typeof rest.classId !== "undefined") data.classId = rest.classId
    if (typeof rest.lessonDate !== "undefined")
      data.lessonDate = rest.lessonDate
    if (typeof rest.startTime !== "undefined") data.startTime = rest.startTime
    if (typeof rest.endTime !== "undefined") data.endTime = rest.endTime
    if (typeof rest.objectives !== "undefined")
      data.objectives = rest.objectives || null
    if (typeof rest.materials !== "undefined")
      data.materials = rest.materials || null
    if (typeof rest.activities !== "undefined")
      data.activities = rest.activities || null
    if (typeof rest.assessment !== "undefined")
      data.assessment = rest.assessment || null
    if (typeof rest.notes !== "undefined") data.notes = rest.notes || null

    await db.lesson.updateMany({ where: { id, schoolId }, data })

    revalidatePath(LESSONS_PATH)
    return { success: true, data: undefined }
  } catch (error) {
    console.error("[updateLesson] Error:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update lesson",
    }
  }
}

export async function deleteLesson(input: {
  id: string
}): Promise<ActionResponse<void>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const { id } = z.object({ id: z.string().min(1) }).parse(input)

    // Verify lesson exists
    const existing = await db.lesson.findFirst({
      where: { id, schoolId },
      select: { id: true },
    })

    if (!existing) {
      return { success: false, error: "Lesson not found" }
    }

    await db.lesson.deleteMany({ where: { id, schoolId } })

    revalidatePath(LESSONS_PATH)
    return { success: true, data: undefined }
  } catch (error) {
    console.error("[deleteLesson] Error:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete lesson",
    }
  }
}

// ============================================================================
// Queries
// ============================================================================

export async function getLesson(input: {
  id: string
}): Promise<ActionResponse<LessonSelectResult | null>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const { id } = z.object({ id: z.string().min(1) }).parse(input)

    const lesson = await db.lesson.findFirst({
      where: { id, schoolId },
      select: {
        id: true,
        schoolId: true,
        classId: true,
        title: true,
        description: true,
        lessonDate: true,
        startTime: true,
        endTime: true,
        objectives: true,
        materials: true,
        activities: true,
        assessment: true,
        notes: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return { success: true, data: lesson as LessonSelectResult | null }
  } catch (error) {
    console.error("[getLesson] Error:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch lesson",
    }
  }
}

export async function getLessons(
  input: Partial<z.infer<typeof getLessonsSchema>>
): Promise<ActionResponse<{ rows: LessonListResult[]; total: number }>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const sp = getLessonsSchema.parse(input ?? {})

    const where: any = {
      schoolId,
      ...(sp.title
        ? { title: { contains: sp.title, mode: "insensitive" } }
        : {}),
      ...(sp.classId ? { classId: sp.classId } : {}),
      ...(sp.status ? { status: sp.status } : {}),
      ...(sp.lessonDate ? { lessonDate: new Date(sp.lessonDate) } : {}),
    }

    const skip = (sp.page - 1) * sp.perPage
    const take = sp.perPage
    const orderBy =
      sp.sort && Array.isArray(sp.sort) && sp.sort.length
        ? sp.sort.map((s) => ({ [s.id]: s.desc ? "desc" : "asc" }))
        : [{ lessonDate: "desc" }, { startTime: "asc" }]

    const [rows, count] = await Promise.all([
      db.lesson.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          class: {
            select: {
              name: true,
              subject: {
                select: {
                  subjectName: true,
                },
              },
              teacher: {
                select: {
                  givenName: true,
                  surname: true,
                },
              },
            },
          },
        },
      }),
      db.lesson.count({ where }),
    ])

    const mapped: LessonListResult[] = (rows as Array<any>).map((l) => ({
      id: l.id as string,
      title: l.title as string,
      className: l.class?.name || "Unknown",
      teacherName: l.class?.teacher
        ? `${l.class.teacher.givenName} ${l.class.teacher.surname}`
        : "Unknown",
      subjectName: l.class?.subject?.subjectName || "Unknown",
      lessonDate: (l.lessonDate as Date).toISOString(),
      startTime: l.startTime as string,
      endTime: l.endTime as string,
      status: l.status as string,
      createdAt: (l.createdAt as Date).toISOString(),
    }))

    return { success: true, data: { rows: mapped, total: count } }
  } catch (error) {
    console.error("[getLessons] Error:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch lessons",
    }
  }
}

/**
 * Export lessons to CSV format
 */
export async function getLessonsCSV(
  input?: Partial<z.infer<typeof getLessonsSchema>>
): Promise<ActionResponse<string>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const sp = getLessonsSchema.parse(input ?? {})

    const where: any = {
      schoolId,
      ...(sp.title
        ? { title: { contains: sp.title, mode: "insensitive" } }
        : {}),
      ...(sp.classId ? { classId: sp.classId } : {}),
      ...(sp.status ? { status: sp.status } : {}),
    }

    const lessons = await db.lesson.findMany({
      where,
      include: {
        class: {
          select: {
            name: true,
            subject: { select: { subjectName: true } },
            teacher: { select: { givenName: true, surname: true } },
          },
        },
      },
      orderBy: [{ lessonDate: "desc" }],
    })

    const headers = [
      "ID",
      "Title",
      "Class",
      "Teacher",
      "Subject",
      "Date",
      "Start Time",
      "End Time",
      "Status",
      "Created",
    ]
    const csvRows = (lessons as Array<any>).map((l) =>
      [
        l.id,
        `"${(l.title || "").replace(/"/g, '""')}"`,
        `"${(l.class?.name || "").replace(/"/g, '""')}"`,
        `"${l.class?.teacher ? `${l.class.teacher.givenName} ${l.class.teacher.surname}` : ""}"`,
        `"${(l.class?.subject?.subjectName || "").replace(/"/g, '""')}"`,
        new Date(l.lessonDate).toISOString().split("T")[0],
        l.startTime,
        l.endTime,
        l.status,
        new Date(l.createdAt).toISOString().split("T")[0],
      ].join(",")
    )

    const csv = [headers.join(","), ...csvRows].join("\n")
    return { success: true, data: csv }
  } catch (error) {
    console.error("[getLessonsCSV] Error:", error)

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to export lessons",
    }
  }
}
