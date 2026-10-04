"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getSchoolSubjectOptions } from "@/lib/school-subjects"
import { getTenantContext } from "@/lib/tenant-context"
import { resolveTeachingScope } from "@/components/school-dashboard/teaching-scope/resolve"

import { examDetailsSchema, type ExamDetailsFormData } from "./validation"

/** Update the linked Exam record with details */
export async function updateExamDetails(
  generatedExamId: string,
  input: ExamDetailsFormData
): Promise<ActionResponse> {
  try {
    const session = await auth()
    if (!session?.user) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)

    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const result = examDetailsSchema.safeParse(input)
    if (!result.success) return actionError(ACTION_ERRORS.VALIDATION_ERROR)
    const parsed = result.data

    // Find the generated exam to get the linked exam id
    const [genExam, resolved] = await Promise.all([
      db.generatedExam.findFirst({
        where: { id: generatedExamId, schoolId },
        select: { examId: true, exam: { select: { termId: true } } },
      }),
      resolveTeachingScope(schoolId, parsed),
    ])

    if (!genExam) {
      return actionError(ACTION_ERRORS.EXAM_NOT_FOUND)
    }
    if (!resolved.ok) return actionError(resolved.code)
    const { scope } = resolved

    // Calculate endTime from startTime + duration
    const [hours, minutes] = parsed.startTime.split(":").map(Number)
    const startMinutes = hours * 60 + minutes
    const endMinutes = startMinutes + parsed.duration
    const endHours = Math.floor(endMinutes / 60) % 24
    const endMins = endMinutes % 60
    const endTime = `${String(endHours).padStart(2, "0")}:${String(endMins).padStart(2, "0")}`

    await db.schoolExam.updateMany({
      where: { id: genExam.examId, schoolId },
      data: {
        title: parsed.title,
        gradeId: scope.gradeId,
        sectionId: scope.sectionId,
        subjectId: scope.subjectId,
        termId: genExam.exam.termId ?? scope.termId,
        examDate: parsed.examDate,
        startTime: parsed.startTime,
        endTime,
        duration: parsed.duration,
        totalMarks: parsed.totalMarks,
        passingMarks: parsed.passingMarks,
      },
    })

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save",
    }
  }
}

/** Fetch subjects for the current school */
export async function getSubjectOptions(): Promise<
  ActionResponse<{ id: string; name: string }[]>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const subjects = await getSchoolSubjectOptions(schoolId)

    return { success: true, data: subjects }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load subjects",
    }
  }
}
