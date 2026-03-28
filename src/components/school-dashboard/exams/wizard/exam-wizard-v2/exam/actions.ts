"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getSchoolSubjectOptions } from "@/lib/school-subjects"
import { getTenantContext } from "@/lib/tenant-context"

import { examDetailsSchema, type ExamDetailsFormData } from "./validation"

/** Update the linked Exam record with details */
export async function updateExamDetails(
  generatedExamId: string,
  input: ExamDetailsFormData
): Promise<ActionResponse> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const parsed = examDetailsSchema.parse(input)

    // Find the generated exam to get the linked exam id
    const genExam = await db.generatedExam.findFirst({
      where: { id: generatedExamId, schoolId },
      select: { examId: true },
    })

    if (!genExam) {
      return actionError(ACTION_ERRORS.EXAM_NOT_FOUND)
    }

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
        classId: parsed.classId,
        subjectId: parsed.subjectId,
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

/** Fetch classes for the current school */
export async function getClassOptions(): Promise<
  ActionResponse<{ id: string; name: string }[]>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const classes = await db.class.findMany({
      where: { schoolId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    })

    return { success: true, data: classes }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load classes",
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
