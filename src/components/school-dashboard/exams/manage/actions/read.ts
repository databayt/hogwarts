"use server"

import { z } from "zod"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { getExamsSchema } from "../validation"
import type { ActionResponse, ExamListRow } from "./types"

/**
 * Get single exam details
 */
export async function getExam(input: { id: string }): Promise<{
  exam: Record<string, unknown> | null
}> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      throw new Error("Missing school context")
    }

    const { id } = z.object({ id: z.string().min(1) }).parse(input)

    const exam = await db.exam.findFirst({
      where: { id, schoolId },
      select: {
        id: true,
        schoolId: true,
        title: true,
        description: true,
        classId: true,
        subjectId: true,
        examDate: true,
        startTime: true,
        endTime: true,
        duration: true,
        totalMarks: true,
        passingMarks: true,
        examType: true,
        instructions: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return { exam: exam as Record<string, unknown> | null }
  } catch (error) {
    console.error("Error getting exam:", error)
    return { exam: null }
  }
}

/**
 * Get paginated list of exams with filters
 */
export async function getExams(
  input?: Partial<z.infer<typeof getExamsSchema>>
): Promise<{
  rows: ExamListRow[]
  total: number
}> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      throw new Error("Missing school context")
    }

    const searchParams = getExamsSchema.parse(input ?? {})

    // Build where clause
    const where: Record<string, unknown> = {
      schoolId,
      ...(searchParams.title
        ? { title: { contains: searchParams.title, mode: "insensitive" } }
        : {}),
      ...(searchParams.classId ? { classId: searchParams.classId } : {}),
      ...(searchParams.subjectId ? { subjectId: searchParams.subjectId } : {}),
      ...(searchParams.examType ? { examType: searchParams.examType } : {}),
      ...(searchParams.status ? { status: searchParams.status } : {}),
      ...(searchParams.examDate
        ? { examDate: new Date(searchParams.examDate) }
        : {}),
    }

    // Calculate pagination
    const skip = (searchParams.page - 1) * searchParams.perPage
    const take = searchParams.perPage

    // Build orderBy
    const orderBy =
      searchParams.sort &&
      Array.isArray(searchParams.sort) &&
      searchParams.sort.length
        ? searchParams.sort.map((s) => ({ [s.id]: s.desc ? "desc" : "asc" }))
        : [{ examDate: "desc" }, { startTime: "asc" }]

    // Fetch data and count in parallel
    const [rows, count] = await Promise.all([
      db.exam.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          class: {
            select: {
              name: true,
            },
          },
          subject: {
            select: {
              subjectName: true,
            },
          },
        },
      }),
      db.exam.count({ where }),
    ])

    // Map to response format
    const mapped: ExamListRow[] = rows.map((exam) => ({
      id: exam.id,
      title: exam.title,
      className: exam.class?.name || "Unknown",
      subjectName: exam.subject?.subjectName || "Unknown",
      examDate: exam.examDate.toISOString(),
      startTime: exam.startTime,
      endTime: exam.endTime,
      duration: exam.duration,
      totalMarks: exam.totalMarks,
      examType: exam.examType,
      status: exam.status,
      createdAt: exam.createdAt.toISOString(),
    }))

    return {
      rows: mapped,
      total: count,
    }
  } catch (error) {
    console.error("Error getting exams:", error)
    return {
      rows: [],
      total: 0,
    }
  }
}

/**
 * Get upcoming exams for a class or student
 */
export async function getUpcomingExams(input?: {
  classId?: string
  studentId?: string
  limit?: number
}): Promise<ActionResponse<ExamListRow[]>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return {
        success: false,
        error: "Missing school context",
        code: "NO_SCHOOL_CONTEXT",
      }
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const where: Record<string, unknown> = {
      schoolId,
      examDate: {
        gte: today,
      },
      status: {
        in: ["PLANNED", "IN_PROGRESS"],
      },
    }

    if (input?.classId) {
      where.classId = input.classId
    }

    if (input?.studentId) {
      // Get student's class
      const student = await db.student.findFirst({
        where: { id: input.studentId, schoolId },
        include: {
          studentClasses: {
            select: { classId: true },
          },
        },
      })

      if (student) {
        where.classId = {
          in: student.studentClasses.map((sc) => sc.classId),
        }
      }
    }

    const exams = await db.exam.findMany({
      where,
      orderBy: [{ examDate: "asc" }, { startTime: "asc" }],
      take: input?.limit || 10,
      include: {
        class: {
          select: { name: true },
        },
        subject: {
          select: { subjectName: true },
        },
      },
    })

    const mapped: ExamListRow[] = exams.map((exam) => ({
      id: exam.id,
      title: exam.title,
      className: exam.class?.name || "Unknown",
      subjectName: exam.subject?.subjectName || "Unknown",
      examDate: exam.examDate.toISOString(),
      startTime: exam.startTime,
      endTime: exam.endTime,
      duration: exam.duration,
      totalMarks: exam.totalMarks,
      examType: exam.examType,
      status: exam.status,
      createdAt: exam.createdAt.toISOString(),
    }))

    return {
      success: true,
      data: mapped,
    }
  } catch (error) {
    console.error("Error getting upcoming exams:", error)
    return {
      success: false,
      error: "Failed to get upcoming exams",
      code: "FETCH_FAILED",
    }
  }
}
