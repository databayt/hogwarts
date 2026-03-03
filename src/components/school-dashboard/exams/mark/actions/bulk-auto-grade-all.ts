"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// School-wide bulk auto-grade for all pending auto-gradable submissions
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { db } from "@/lib/db"

import { isAutoGradable } from "../utils"
import { autoGradeAnswer } from "./auto-mark"
import type { ActionResponse } from "./types"

export async function bulkAutoGradeAll(): Promise<
  ActionResponse<{ graded: number; failed: number; total: number }>
> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId
    const role = session?.user?.role

    if (!schoolId) {
      return {
        success: false,
        error: "Unauthorized - No school context",
        code: "NO_SCHOOL_CONTEXT",
      }
    }

    if (!["DEVELOPER", "ADMIN", "TEACHER"].includes(role || "")) {
      return {
        success: false,
        error: "Insufficient permissions for bulk grading",
        code: "PERMISSION_DENIED",
      }
    }

    // For TEACHER, scope to their classes
    let classFilter = {}
    if (role === "TEACHER") {
      const teacher = await db.teacher.findFirst({
        where: { userId: session.user.id, schoolId },
        select: { id: true },
      })
      if (teacher) {
        const classes = await db.class.findMany({
          where: { teacherId: teacher.id, schoolId },
          select: { id: true },
        })
        classFilter = { exam: { classId: { in: classes.map((c) => c.id) } } }
      }
    }

    // Get all ungraded submissions for auto-gradable question types
    const answers = await db.studentAnswer.findMany({
      where: {
        schoolId,
        ...classFilter,
        question: {
          questionType: {
            in: ["MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_BLANK"],
          },
        },
        OR: [
          { markingResult: null },
          { markingResult: { status: { not: "COMPLETED" } } },
        ],
      },
      include: {
        question: true,
        markingResult: true,
      },
      take: 500,
    })

    let graded = 0
    let failed = 0

    for (const answer of answers) {
      if (!isAutoGradable(answer.question.questionType)) continue

      try {
        const result = await autoGradeAnswer(answer.id)
        if (result.success) {
          graded++
        } else {
          failed++
        }
      } catch {
        failed++
      }
    }

    revalidatePath("/exams/mark")

    return {
      success: true,
      data: { graded, failed, total: answers.length },
    }
  } catch (error) {
    console.error("Bulk auto-grade all error:", error)
    return {
      success: false,
      error: "Bulk auto-grading failed",
      code: "BULK_AUTO_GRADE_FAILED",
    }
  }
}
