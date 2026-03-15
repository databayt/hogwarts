"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { enrollStudentInGradeClasses } from "@/lib/enrollment-sync"
import { getTenantContext } from "@/lib/tenant-context"

import { enrollmentSchema, type EnrollmentFormData } from "./validation"

export async function getGradeOptions(): Promise<
  ActionResponse<{ value: string; label: string }[]>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const grades = await db.academicGrade.findMany({
      where: { schoolId },
      select: { id: true, name: true },
      orderBy: { gradeNumber: "asc" },
    })

    return {
      success: true,
      data: grades.map((g) => ({ value: g.id, label: g.name })),
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load grades",
    }
  }
}

export async function getSectionOptions(
  gradeId: string
): Promise<ActionResponse<{ value: string; label: string }[]>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const sections = await db.section.findMany({
      where: { schoolId, gradeId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    })

    return {
      success: true,
      data: sections.map((s) => ({ value: s.id, label: s.name })),
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load sections",
    }
  }
}

export async function getStudentEnrollment(
  studentId: string
): Promise<ActionResponse<EnrollmentFormData>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const student = await db.student.findFirst({
      where: { id: studentId, schoolId },
      select: {
        enrollmentDate: true,
        admissionNumber: true,
        status: true,
        studentType: true,
        category: true,
        academicGradeId: true,
        sectionId: true,
      },
    })

    if (!student) return { success: false, error: "Student not found" }

    return {
      success: true,
      data: {
        enrollmentDate: student.enrollmentDate ?? undefined,
        admissionNumber: student.admissionNumber ?? undefined,
        status: student.status ?? undefined,
        studentType: student.studentType ?? undefined,
        category: student.category ?? undefined,
        academicGradeId: student.academicGradeId ?? undefined,
        sectionId: student.sectionId ?? undefined,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load",
    }
  }
}

export async function updateStudentEnrollment(
  studentId: string,
  input: EnrollmentFormData
): Promise<ActionResponse> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const parsed = enrollmentSchema.parse(input)

    await db.student.updateMany({
      where: { id: studentId, schoolId },
      data: {
        enrollmentDate: parsed.enrollmentDate ?? undefined,
        admissionNumber: parsed.admissionNumber || null,
        status: parsed.status ?? undefined,
        studentType: parsed.studentType ?? undefined,
        category: parsed.category || null,
        academicGradeId: parsed.academicGradeId || null,
        sectionId: parsed.sectionId || null,
      },
    })

    // Create StudentClass records when section is assigned
    // Without this, students have empty timetables and don't appear in attendance
    if (parsed.sectionId) {
      const section = await db.section.findFirst({
        where: { id: parsed.sectionId, schoolId },
        select: { gradeId: true },
      })

      const gradeId = section?.gradeId || parsed.academicGradeId
      if (gradeId) {
        const result = await enrollStudentInGradeClasses(
          schoolId,
          studentId,
          gradeId
        )
        if (result.warning) {
          return { success: true, warning: result.warning } as ActionResponse
        }
      }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save",
    }
  }
}
