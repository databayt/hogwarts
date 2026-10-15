// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use server"

import { auth } from "@/auth"
import type { UserRole } from "@prisma/client"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"
import { displayName } from "@/lib/name-utils"
import { schoolNameDisplay } from "@/lib/school-name-format"
import { getTenantContext } from "@/lib/tenant-context"

import { getTeacherSectionIds, sectionScopeWhere } from "../actions/helpers"
import { isStaffRole } from "../authorization"
import { atRiskRows, computeStudentRisk } from "./queries"
import {
  bandTier,
  RISK_PAGE_SIZE,
  type AtRiskBand,
  type RiskTier,
} from "./risk"

export interface RiskListRow {
  studentId: string
  name: string
  sectionName: string | null
  rate: number
  absentDays: number
  recordedDays: number
  consecutiveAbsences: number
  trend: "improving" | "stable" | "declining"
  band: AtRiskBand
  tier: RiskTier
  hasActiveIntervention: boolean
}

export interface RiskListResult {
  rows: RiskListRow[]
  /** Rows matching band + search (the list's own total). */
  total: number
  page: number
  pageCount: number
  /** Per-band counts in scope, before band/search filters — the Segmented. */
  counts: { all: number; critical: number; high: number; moderate: number }
  /** Students in scope with too few recorded days to judge. */
  insufficient: number
}

/**
 * The students list: one ranked, paginated query. Counts and rows come from
 * the same `computeStudentRisk` pass, so the filter badges always add up to
 * what the list can show.
 */
export async function getRiskList(input: {
  band?: AtRiskBand | "all"
  search?: string
  sectionId?: string
  page?: number
}): Promise<
  { success: true; data: RiskListResult } | { success: false; error: string }
> {
  try {
    const session = await auth()
    const role = session?.user?.role as UserRole | undefined
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    if (!session?.user?.id || !role || !isStaffRole(role))
      return actionError(ACTION_ERRORS.UNAUTHORIZED)

    const teacherSectionIds =
      role === "TEACHER"
        ? await getTeacherSectionIds(schoolId, session.user.id)
        : null
    const sectionWhere = sectionScopeWhere({
      teacherSectionIds,
      sectionId: input.sectionId,
    })

    const all = await computeStudentRisk(schoolId, { sectionWhere })
    const flagged = atRiskRows(all)
    const counts = {
      all: flagged.length,
      critical: flagged.filter((r) => r.band === "critical").length,
      high: flagged.filter((r) => r.band === "high").length,
      moderate: flagged.filter((r) => r.band === "moderate").length,
    }
    const insufficient = all.filter((r) => r.insufficient).length

    const band = input.band ?? "all"
    let rows = band === "all" ? flagged : flagged.filter((r) => r.band === band)

    // Names for the flagged set only (small), so search can match any
    // display form, Arabic or Latin.
    const students = await db.student.findMany({
      where: { schoolId, id: { in: rows.map((r) => r.studentId) } },
      select: {
        id: true,
        firstName: true,
        middleName: true,
        lastName: true,
        section: { select: { name: true } },
      },
    })
    const nameDisplay = await schoolNameDisplay(schoolId)
    const info = new Map(
      students.map((s) => [
        s.id,
        { name: displayName(s, nameDisplay), section: s.section?.name ?? null },
      ])
    )

    const q = input.search?.trim().toLowerCase()
    if (q) {
      rows = rows.filter((r) => {
        const i = info.get(r.studentId)
        return (
          i?.name.toLowerCase().includes(q) ||
          i?.section?.toLowerCase().includes(q)
        )
      })
    }

    // Ranked: lowest rate first, then longest current absence streak.
    rows.sort(
      (a, b) => a.rate - b.rate || b.consecutiveAbsences - a.consecutiveAbsences
    )

    const total = rows.length
    const pageCount = Math.max(1, Math.ceil(total / RISK_PAGE_SIZE))
    const page = Math.min(Math.max(1, input.page ?? 1), pageCount)
    const slice = rows.slice((page - 1) * RISK_PAGE_SIZE, page * RISK_PAGE_SIZE)

    const active = await db.attendanceIntervention.findMany({
      where: {
        schoolId,
        studentId: { in: slice.map((r) => r.studentId) },
        status: { in: ["SCHEDULED", "IN_PROGRESS", "ESCALATED"] },
      },
      select: { studentId: true },
      distinct: ["studentId"],
    })
    const withActive = new Set(active.map((a) => a.studentId))

    return {
      success: true,
      data: {
        rows: slice.map((r) => {
          const b = r.band as AtRiskBand
          return {
            studentId: r.studentId,
            name: info.get(r.studentId)?.name ?? "",
            sectionName: info.get(r.studentId)?.section ?? null,
            rate: r.rate,
            absentDays: r.absentDays,
            recordedDays: r.recordedDays,
            consecutiveAbsences: r.consecutiveAbsences,
            trend: r.trend,
            band: b,
            tier: bandTier(b),
            hasActiveIntervention: withActive.has(r.studentId),
          }
        }),
        total,
        page,
        pageCount,
        counts,
        insufficient,
      },
    }
  } catch (error) {
    console.error("[getRiskList] Error:", error)
    return actionError(ACTION_ERRORS.ATTENDANCE_NOT_FOUND)
  }
}
