"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { cookies } from "next/headers"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { enrollStudentInGradeClasses } from "@/lib/enrollment-sync"
import { ensureStudentFeeAssignments } from "@/lib/fee-auto-assign"
import { getLabels } from "@/components/translation/person"
import type { Lang } from "@/components/translation/types"

import { authorizeWizardAction } from "../authorize"
import { academicSchema, type AcademicFormData } from "./validation"

async function getDisplayLocale(schoolId: string, locale?: string) {
  let displayLang: Lang
  if (locale && (locale === "en" || locale === "ar")) {
    displayLang = locale
  } else {
    const cookieStore = await cookies()
    displayLang = (cookieStore.get("NEXT_LOCALE")?.value as Lang) || "ar"
  }
  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: { preferredLanguage: true },
  })
  const contentLang = (school?.preferredLanguage || "ar") as Lang
  return { displayLang, contentLang }
}

export async function getGradeOptions(
  locale?: string
): Promise<
  ActionResponse<{ value: string; label: string; gradeNumber: number }[]>
> {
  try {
    const authz = await authorizeWizardAction("read")
    if (!authz.ok) return authz.response
    const { schoolId } = authz

    const grades = await db.academicGrade.findMany({
      where: { schoolId },
      select: { id: true, name: true, gradeNumber: true },
      orderBy: { gradeNumber: "asc" },
    })

    const { displayLang } = await getDisplayLocale(schoolId, locale)

    // One batched, deduped resolution for all grade names (no per-row N+1)
    const labels = await getLabels(
      grades.map((g) => g.name),
      displayLang,
      schoolId
    )
    const data = grades.map((g) => ({
      value: g.id,
      label: labels.get(g.name) ?? g.name,
      gradeNumber: g.gradeNumber,
    }))

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
    const authz = await authorizeWizardAction("read")
    if (!authz.ok) return authz.response
    const { schoolId } = authz

    const streams = await db.academicStream.findMany({
      where: { schoolId, gradeId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    })

    const { displayLang } = await getDisplayLocale(schoolId, locale)

    const labels = await getLabels(
      streams.map((s) => s.name),
      displayLang,
      schoolId
    )
    const data = streams.map((s) => ({
      value: s.id,
      label: labels.get(s.name) ?? s.name,
    }))

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
    const authz = await authorizeWizardAction("read")
    if (!authz.ok) return authz.response
    const { schoolId } = authz

    const sections = await db.section.findMany({
      where: { schoolId, gradeId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    })

    const { displayLang } = await getDisplayLocale(schoolId, locale)

    const labels = await getLabels(
      sections.map((s) => s.name),
      displayLang,
      schoolId
    )
    const data = sections.map((s) => ({
      value: s.id,
      label: labels.get(s.name) ?? s.name,
    }))

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
    const authz = await authorizeWizardAction("read")
    if (!authz.ok) return authz.response
    const { schoolId } = authz

    const student = await db.student.findFirst({
      where: { id: studentId, schoolId },
      select: {
        academicGradeId: true,
        academicStreamId: true,
        sectionId: true,
        previousSchoolName: true,
      },
    })

    if (!student) return actionError(ACTION_ERRORS.STUDENT_NOT_FOUND)

    return {
      success: true,
      data: {
        academicGradeId: student.academicGradeId ?? undefined,
        academicStreamId: student.academicStreamId ?? undefined,
        sectionId: student.sectionId ?? undefined,
        previousSchoolName: student.previousSchoolName ?? undefined,
      },
    }
  } catch (error) {
    return actionError(
      ACTION_ERRORS.LOAD_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}

// Single save for the academic step. Writes only the fields the simplified
// wizard collects; enrollment bookkeeping (enrollmentDate, admissionNumber,
// status, …) keeps its DB defaults or is edited later via the profile.
// Side effects preserved: enroll into grade classes + auto-assign fees.
export async function updateStudentAcademic(
  studentId: string,
  input: AcademicFormData
): Promise<ActionResponse> {
  try {
    const authz = await authorizeWizardAction("update")
    if (!authz.ok) return authz.response
    const { schoolId } = authz

    const parsed = academicSchema.parse(input)

    // The section must be this school's — ids are global CUIDs, and the
    // write below used to take whatever id the form sent.
    const section = parsed.sectionId
      ? await db.section.findFirst({
          where: { id: parsed.sectionId, schoolId },
          select: { id: true, gradeId: true },
        })
      : null
    if (parsed.sectionId && !section) {
      return actionError(ACTION_ERRORS.NOT_FOUND)
    }

    let noTimetableWarning = false

    await db.student.updateMany({
      where: { id: studentId, schoolId },
      data: {
        academicGradeId: parsed.academicGradeId || null,
        academicStreamId: parsed.academicStreamId || null,
        sectionId: section?.id ?? null,
        previousSchoolName: parsed.previousSchoolName || null,
      },
    })

    // The section is the student's roster and timetable. Legacy grade
    // classes (being retired) are still synced for schools that have them.
    // The warning only fires when the section really has no timetable —
    // "no classes" fired for every new school, which never has classes.
    const enroll = async () => {
      if (!section) return
      const gradeId = section.gradeId || parsed.academicGradeId
      const [, slotCount] = await Promise.all([
        gradeId
          ? enrollStudentInGradeClasses(schoolId, studentId, gradeId)
          : Promise.resolve(null),
        db.timetable.count({ where: { schoolId, sectionId: section.id } }),
      ])
      noTimetableWarning = slotCount === 0
    }

    // Founder contract: by the time this action returns, FeeAssignment rows
    // exist for every matching active FeeStructure. Awaited + transactional;
    // re-running the wizard finalize is idempotent (no duplicate rows).
    const assignFees = async () => {
      if (!parsed.academicGradeId) return
      try {
        await ensureStudentFeeAssignments({
          schoolId,
          studentId,
          academicGradeId: parsed.academicGradeId,
        })
      } catch (err) {
        // Don't block the wizard — fees can be re-synced later via the Sync
        // button on /finance/fees/structures. We log loudly so production
        // monitoring catches partial setups instead of silent gaps.
        console.error(
          "[updateStudentAcademic] ensureStudentFeeAssignments failed:",
          err
        )
      }
    }

    // Independent of each other (classes vs fee rows, each given its grade):
    // run them side by side instead of paying both latencies in a row.
    await Promise.all([enroll(), assignFees()])

    // Code name predates sections; the message now says "no timetable".
    return noTimetableWarning
      ? { success: true, warning: ACTION_ERRORS.NO_CLASSES_FOR_GRADE }
      : { success: true }
  } catch (error) {
    return actionError(
      ACTION_ERRORS.SAVE_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}
