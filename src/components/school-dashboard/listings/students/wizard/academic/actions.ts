"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { cookies } from "next/headers"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { getDisplayText } from "@/lib/content-display"
import { db } from "@/lib/db"
import { enrollStudentInGradeClasses } from "@/lib/enrollment-sync"
import { autoAssignFeesForStudent } from "@/lib/fee-auto-assign"
import { ensureInvoicesForAssignment } from "@/lib/fee-invoice-sync"
import { getTenantContext } from "@/lib/tenant-context"
import type { SupportedLanguage } from "@/components/translation/types"

import { academicSchema, type AcademicFormData } from "./validation"

async function getDisplayLocale(schoolId: string, locale?: string) {
  let displayLang: SupportedLanguage
  if (locale && (locale === "en" || locale === "ar")) {
    displayLang = locale
  } else {
    const cookieStore = await cookies()
    displayLang =
      (cookieStore.get("NEXT_LOCALE")?.value as SupportedLanguage) || "ar"
  }
  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: { preferredLanguage: true },
  })
  const contentLang = (school?.preferredLanguage || "ar") as SupportedLanguage
  return { displayLang, contentLang }
}

export async function getGradeOptions(
  locale?: string
): Promise<
  ActionResponse<{ value: string; label: string; gradeNumber: number }[]>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const grades = await db.academicGrade.findMany({
      where: { schoolId },
      select: { id: true, name: true, gradeNumber: true },
      orderBy: { gradeNumber: "asc" },
    })

    const { displayLang, contentLang } = await getDisplayLocale(
      schoolId,
      locale
    )

    const data = await Promise.all(
      grades.map(async (g) => ({
        value: g.id,
        label: await getDisplayText(g.name, contentLang, displayLang, schoolId),
        gradeNumber: g.gradeNumber,
      }))
    )

    return { success: true, data }
  } catch (error) {
    return actionError(
      ACTION_ERRORS.LOAD_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}

export async function getStreamOptions(
  gradeId: string,
  locale?: string
): Promise<ActionResponse<{ value: string; label: string }[]>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const streams = await db.academicStream.findMany({
      where: { schoolId, gradeId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    })

    const { displayLang, contentLang } = await getDisplayLocale(
      schoolId,
      locale
    )

    const data = await Promise.all(
      streams.map(async (s) => ({
        value: s.id,
        label: await getDisplayText(s.name, contentLang, displayLang, schoolId),
      }))
    )

    return { success: true, data }
  } catch (error) {
    return actionError(
      ACTION_ERRORS.LOAD_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}

export async function getSectionOptions(
  gradeId: string,
  locale?: string
): Promise<ActionResponse<{ value: string; label: string }[]>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const sections = await db.section.findMany({
      where: { schoolId, gradeId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    })

    const { displayLang, contentLang } = await getDisplayLocale(
      schoolId,
      locale
    )

    const data = await Promise.all(
      sections.map(async (s) => ({
        value: s.id,
        label: await getDisplayText(s.name, contentLang, displayLang, schoolId),
      }))
    )

    return { success: true, data }
  } catch (error) {
    return actionError(
      ACTION_ERRORS.LOAD_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}

export async function getStudentAcademic(
  studentId: string
): Promise<ActionResponse<AcademicFormData>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const student = await db.student.findFirst({
      where: { id: studentId, schoolId },
      select: {
        enrollmentDate: true,
        admissionNumber: true,
        status: true,
        studentType: true,
        category: true,
        academicGradeId: true,
        academicStreamId: true,
        sectionId: true,
        previousSchoolName: true,
        previousSchoolAddress: true,
        previousGrade: true,
        transferCertificateNo: true,
        transferDate: true,
        previousAcademicRecord: true,
      },
    })

    if (!student) return actionError(ACTION_ERRORS.STUDENT_NOT_FOUND)

    return {
      success: true,
      data: {
        enrollmentDate: student.enrollmentDate ?? undefined,
        admissionNumber: student.admissionNumber ?? undefined,
        status: student.status ?? undefined,
        studentType: student.studentType ?? undefined,
        category: student.category ?? undefined,
        academicGradeId: student.academicGradeId ?? undefined,
        academicStreamId: student.academicStreamId ?? undefined,
        sectionId: student.sectionId ?? undefined,
        previousSchoolName: student.previousSchoolName ?? undefined,
        previousSchoolAddress: student.previousSchoolAddress ?? undefined,
        previousGrade: student.previousGrade ?? undefined,
        transferCertificateNo: student.transferCertificateNo ?? undefined,
        transferDate: student.transferDate ?? undefined,
        previousAcademicRecord: student.previousAcademicRecord ?? undefined,
      },
    }
  } catch (error) {
    return actionError(
      ACTION_ERRORS.LOAD_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}

// Single composite save for the academic step. Merges the writes that used to
// happen across two separate server actions (updateStudentEnrollment +
// updateStudentPreviousEducation) and preserves the existing side effects:
// enrolling the student into grade classes + auto-assigning fees.
export async function updateStudentAcademic(
  studentId: string,
  input: AcademicFormData
): Promise<ActionResponse> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const parsed = academicSchema.parse(input)

    await db.student.updateMany({
      where: { id: studentId, schoolId },
      data: {
        enrollmentDate: parsed.enrollmentDate ?? undefined,
        admissionNumber: parsed.admissionNumber || null,
        status: parsed.status ?? undefined,
        studentType: parsed.studentType ?? undefined,
        category: parsed.category || null,
        academicGradeId: parsed.academicGradeId || null,
        academicStreamId: parsed.academicStreamId || null,
        sectionId: parsed.sectionId || null,
        previousSchoolName: parsed.previousSchoolName || null,
        previousSchoolAddress: parsed.previousSchoolAddress || null,
        previousGrade: parsed.previousGrade || null,
        transferCertificateNo: parsed.transferCertificateNo || null,
        transferDate: parsed.transferDate ?? null,
        previousAcademicRecord: parsed.previousAcademicRecord || null,
      },
    })

    // Without enrollStudentInGradeClasses the student has empty timetables
    // and does not appear in attendance rosters.
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

    // Auto-assign fees + generate invoices when a grade is set (parity with admission).
    if (parsed.academicGradeId) {
      autoAssignFeesForStudent(schoolId, studentId, parsed.academicGradeId)
        .then(async ({ assignedCount }) => {
          if (assignedCount === 0) return
          const assignments = await db.feeAssignment.findMany({
            where: { schoolId, studentId },
            select: { id: true },
          })
          await Promise.all(
            assignments.map((a) =>
              ensureInvoicesForAssignment(schoolId, a.id).catch((err) =>
                console.error(
                  `[updateStudentAcademic] Invoice gen failed for ${a.id}:`,
                  err
                )
              )
            )
          )
        })
        .catch((err) =>
          console.error("[updateStudentAcademic] Fee auto-assign failed:", err)
        )
    }

    return { success: true }
  } catch (error) {
    return actionError(
      ACTION_ERRORS.SAVE_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}
