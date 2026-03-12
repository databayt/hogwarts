"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  previousEducationSchema,
  type PreviousEducationFormData,
} from "./validation"

export async function getStudentPreviousEducation(
  studentId: string
): Promise<ActionResponse<PreviousEducationFormData>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const student = await db.student.findFirst({
      where: { id: studentId, schoolId },
      select: {
        previousSchoolName: true,
        previousSchoolAddress: true,
        previousGrade: true,
        transferCertificateNo: true,
        transferDate: true,
        previousAcademicRecord: true,
      },
    })

    if (!student) return { success: false, error: "Student not found" }

    return {
      success: true,
      data: {
        previousSchoolName: student.previousSchoolName ?? undefined,
        previousSchoolAddress: student.previousSchoolAddress ?? undefined,
        previousGrade: student.previousGrade ?? undefined,
        transferCertificateNo: student.transferCertificateNo ?? undefined,
        transferDate: student.transferDate ?? undefined,
        previousAcademicRecord: student.previousAcademicRecord ?? undefined,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load",
    }
  }
}

export async function updateStudentPreviousEducation(
  studentId: string,
  input: PreviousEducationFormData
): Promise<ActionResponse> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const parsed = previousEducationSchema.parse(input)

    await db.student.updateMany({
      where: { id: studentId, schoolId },
      data: {
        previousSchoolName: parsed.previousSchoolName || null,
        previousSchoolAddress: parsed.previousSchoolAddress || null,
        previousGrade: parsed.previousGrade || null,
        transferCertificateNo: parsed.transferCertificateNo || null,
        transferDate: parsed.transferDate ?? null,
        previousAcademicRecord: parsed.previousAcademicRecord || null,
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
