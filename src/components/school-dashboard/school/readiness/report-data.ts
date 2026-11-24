// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import "server-only"

import { db } from "@/lib/db"
import {
  DEFAULT_SCHOOL_TZ,
  schoolDayOfInstant,
} from "@/components/school-dashboard/live/day-window"

import { loadClassReadiness } from "./queries"
import type { ClassReportInput } from "./whatsapp-text"

export type ClassReportCardData = ClassReportInput & { sectionId: string }

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/** The school's timezone and today's calendar day in it. */
export async function schoolToday(
  schoolId: string
): Promise<{ tz: string; today: string }> {
  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: { timezone: true },
  })
  const tz = school?.timezone || DEFAULT_SCHOOL_TZ
  return { tz, today: schoolDayOfInstant(tz, new Date()) }
}

/** `?date=` when it is a real YYYY-MM-DD, else `fallback`. */
export function pickDate(raw: string | undefined, fallback: string): string {
  return raw && DATE_RE.test(raw) && !Number.isNaN(Date.parse(raw)) ? raw : fallback
}

/**
 * One report card per section with a class on `dateISO`, in grade order
 * (grade number, then section letter), shaped for the page and for the
 * WhatsApp text builder.
 */
export async function loadClassReportCards(
  schoolId: string,
  dateISO: string
): Promise<ClassReportCardData[]> {
  const classes = await loadClassReadiness(schoolId, dateISO)
  if (classes.length === 0) return []

  const order = await db.section.findMany({
    where: { schoolId, id: { in: classes.map((c) => c.sectionId) } },
    select: { id: true, letter: true, grade: { select: { gradeNumber: true } } },
  })
  const rank = new Map(
    order.map((s) => [s.id, { g: s.grade?.gradeNumber ?? 0, l: s.letter ?? "" }])
  )

  return [...classes]
    .sort((a, b) => {
      const ra = rank.get(a.sectionId)
      const rb = rank.get(b.sectionId)
      return (
        (ra?.g ?? 0) - (rb?.g ?? 0) ||
        (ra?.l ?? "").localeCompare(rb?.l ?? "") ||
        a.sectionName.localeCompare(b.sectionName)
      )
    })
    .map((c) => ({
      sectionId: c.sectionId,
      className: c.sectionName,
      supervisor: c.supervisor
        ? {
            name: c.supervisor.name,
            reasons: c.supervisor.readiness.reasons,
            canCover: c.supervisor.canCover,
          }
        : null,
      classes: c.classes.map((k) => ({
        start: k.start,
        subject: k.subject,
        teacherName: k.teacher?.name ?? null,
        reasons: k.teacher?.readiness.reasons ?? [],
      })),
      students: c.students
        .map((s) => ({ name: s.name, reasons: s.readiness.reasons }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }))
}
