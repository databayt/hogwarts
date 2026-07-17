"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { cookies } from "next/headers"
import { auth } from "@/auth"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { enrollStudentInGradeClasses } from "@/lib/enrollment-sync"
import { ensureStudentFeeAssignments } from "@/lib/fee-auto-assign"
import { getTenantContext } from "@/lib/tenant-context"
import {
  checkStudentPermission,
  getAuthContext,
  type AuthContext,
  type StudentAction,
} from "@/components/school-dashboard/listings/students/authorization"
import { getLabels } from "@/components/translation/person"
import type { Lang } from "@/components/translation/types"

import { academicSchema, type AcademicFormData } from "./validation"

/**
 * Shared guard — `getTenantContext()` resolves schoolId from the subdomain
 * header before the session, so these actions must assert an authenticated,
 * role-permitted session too (not schoolId alone). `updateStudentAcademic`
 * in particular enrolls the student and materializes fee assignments +
 * invoices, so an unauthenticated caller could provision billing. See the
 * matching guard in the personal wizard actions.
 */
async function authorizeWizardAction(
  action: StudentAction
): Promise<
  | { ok: true; schoolId: string; authContext: AuthContext }
  | { ok: false; response: ActionResponse }
> {
  const session = await auth()
  const authContext = getAuthContext(session)
  if (!authContext) {
    return { ok: false, response: actionError(ACTION_ERRORS.NOT_AUTHENTICATED) }
  }
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return { ok: false, response: actionError(ACTION_ERRORS.MISSING_SCHOOL) }
  }
  if (!checkStudentPermission(authContext, action, { schoolId })) {
    return { ok: false, response: actionError(ACTION_ERRORS.UNAUTHORIZED) }
  }
  return { ok: true, schoolId, authContext }
}

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

    await db.student.updateMany({
      where: { id: studentId, schoolId },
      data: {
        academicGradeId: parsed.academicGradeId || null,
        academicStreamId: parsed.academicStreamId || null,
        sectionId: parsed.sectionId || null,
        previousSchoolName: parsed.previousSchoolName || null,
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

    // Founder contract: by the time this action returns, FeeAssignment rows
    // exist for every matching active FeeStructure. Awaited + transactional;
    // re-running the wizard finalize is idempotent (no duplicate rows).
    if (parsed.academicGradeId) {
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

    return { success: true }
  } catch (error) {
    return actionError(
      ACTION_ERRORS.SAVE_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}
