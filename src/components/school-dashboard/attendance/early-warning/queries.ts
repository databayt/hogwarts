// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Server-side risk computation shared by every risk surface (students list,
 * support tiers, letters, predictions baseline). Callers do their own auth;
 * this only reads.
 *
 * Attendance rows are rolled up to one outcome per student per school day
 * (period-level marking writes several rows a day): attended if any row is
 * PRESENT/LATE, else absent if any ABSENT, else excused if EXCUSED/SICK;
 * HOLIDAY-only days are dropped. Rules and thresholds: `./risk.ts`.
 */
import "server-only"

import type { Prisma } from "@prisma/client"

import { db } from "@/lib/db"

import {
  MIN_RECORDED_DAYS,
  RISK_WINDOW_DAYS,
  riskBand,
  type RiskBand,
} from "./risk"

export interface StudentRiskRow {
  studentId: string
  /** School days with a recorded outcome in the window. */
  recordedDays: number
  attendedDays: number
  lateDays: number
  absentDays: number
  excusedDays: number
  /** Attendance rate 0–100, one decimal. */
  rate: number
  /** "ok" when not at risk; meaningless when `insufficient`. */
  band: RiskBand
  /** Fewer than MIN_RECORDED_DAYS — never flagged. */
  insufficient: boolean
  trend: "improving" | "stable" | "declining"
  consecutiveAbsences: number
  lastDate: string | null
}

export function riskWindowStart(now = new Date()): Date {
  const d = new Date(now)
  d.setUTCHours(0, 0, 0, 0)
  d.setUTCDate(d.getUTCDate() - RISK_WINDOW_DAYS)
  return d
}

type DayOutcome = "attended" | "late" | "absent" | "excused"

function rate(days: DayOutcome[]): number {
  if (days.length === 0) return 100
  const ok = days.filter((d) => d === "attended" || d === "late").length
  return (ok / days.length) * 100
}

/**
 * Risk rows for active students of a school. Scope with `sectionWhere`
 * (from `sectionScopeWhere`) for teachers / a section filter, or with
 * `studentIds` for a known set. Students with no rows in the window are
 * absent from the result (they are "insufficient" by definition).
 */
export async function computeStudentRisk(
  schoolId: string,
  opts: {
    sectionWhere?: Prisma.AttendanceWhereInput
    studentIds?: string[]
  } = {}
): Promise<StudentRiskRow[]> {
  const where: Prisma.AttendanceWhereInput = {
    schoolId,
    deletedAt: null,
    date: { gte: riskWindowStart() },
    student: { status: "ACTIVE" },
    ...(opts.sectionWhere ?? {}),
    ...(opts.studentIds ? { studentId: { in: opts.studentIds } } : {}),
  }

  const groups = await db.attendance.groupBy({
    by: ["studentId", "date", "status"],
    where,
  })

  // studentId → day → statuses seen that day
  const byStudent = new Map<string, Map<string, Set<string>>>()
  for (const g of groups) {
    const day = g.date.toISOString().slice(0, 10)
    let days = byStudent.get(g.studentId)
    if (!days) byStudent.set(g.studentId, (days = new Map()))
    let set = days.get(day)
    if (!set) days.set(day, (set = new Set()))
    set.add(g.status)
  }

  const rows: StudentRiskRow[] = []
  for (const [studentId, days] of byStudent) {
    // Newest first
    const ordered = [...days.entries()].sort((a, b) => b[0].localeCompare(a[0]))
    const outcomes: DayOutcome[] = []
    let lastDate: string | null = null
    for (const [day, s] of ordered) {
      let o: DayOutcome | null = null
      if (s.has("PRESENT")) o = "attended"
      else if (s.has("LATE")) o = "late"
      else if (s.has("ABSENT")) o = "absent"
      else if (s.has("EXCUSED") || s.has("SICK")) o = "excused"
      if (!o) continue // holiday-only
      outcomes.push(o)
      lastDate ??= day
    }

    const recordedDays = outcomes.length
    const r = rate(outcomes)
    const mid = Math.floor(outcomes.length / 2)
    const recent = rate(outcomes.slice(0, mid))
    const older = rate(outcomes.slice(mid))
    let consecutiveAbsences = 0
    for (const o of outcomes) {
      if (o === "absent") consecutiveAbsences++
      else break
    }

    rows.push({
      studentId,
      recordedDays,
      attendedDays: outcomes.filter((o) => o === "attended" || o === "late")
        .length,
      lateDays: outcomes.filter((o) => o === "late").length,
      absentDays: outcomes.filter((o) => o === "absent").length,
      excusedDays: outcomes.filter((o) => o === "excused").length,
      rate: Math.round(r * 10) / 10,
      band: riskBand(r),
      insufficient: recordedDays < MIN_RECORDED_DAYS,
      trend:
        mid === 0
          ? "stable"
          : recent - older > 5
            ? "improving"
            : older - recent > 5
              ? "declining"
              : "stable",
      consecutiveAbsences,
      lastDate,
    })
  }
  return rows
}

/** Rows that count as at risk: enough data and below the moderate line. */
export function atRiskRows(rows: StudentRiskRow[]): StudentRiskRow[] {
  return rows.filter((r) => !r.insufficient && r.band !== "ok")
}
