"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Holidays and closures — the school days with no classes. They are
// `ScheduleException` rows (HOLIDAY / CANCELLED), the same predicate the
// live-class sweep suppresses on and the timetable announces. The timetable
// block's create/update/delete actions existed with no screen calling them,
// so on Eid an online school still materialized classes and sent reminders.
import { auth } from "@/auth"
import { z } from "zod"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"
import { refreshPage } from "@/lib/refresh-page"
import { getTenantContext } from "@/lib/tenant-context"
import {
  DEFAULT_SCHOOL_TZ,
  schoolDayOfInstant,
  schoolDayToInstant,
} from "@/components/school-dashboard/live/day-window"

const ADMIN_ROLES = new Set(["ADMIN", "DEVELOPER"])
const DAY = /^\d{4}-\d{2}-\d{2}$/

const holidaySchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    type: z.enum(["HOLIDAY", "CANCELLED"]),
    // Calendar days, never Dates: a browser-built Date for a bare day is UTC
    // midnight, which is the PREVIOUS day for any school west of Greenwich.
    from: z.string().regex(DAY),
    until: z.string().regex(DAY),
  })
  // Zero-padded day strings compare correctly as strings.
  .refine((v) => v.until >= v.from, { path: ["until"] })

export interface HolidayRow {
  id: string
  title: string
  type: "HOLIDAY" | "CANCELLED"
  from: string
  until: string
}

async function adminContext(): Promise<
  { ok: true; schoolId: string; tz: string } | { ok: false }
> {
  const [session, { schoolId }] = await Promise.all([
    auth(),
    getTenantContext(),
  ])
  if (!schoolId || !ADMIN_ROLES.has(session?.user?.role ?? "")) {
    return { ok: false }
  }
  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: { timezone: true },
  })
  return { ok: true, schoolId, tz: school?.timezone || DEFAULT_SCHOOL_TZ }
}

/** This school's holidays and closures from 30 days ago onward. */
export async function listHolidays(): Promise<
  { success: true; data: HolidayRow[] } | { success: false; error: string }
> {
  const ctx = await adminContext()
  if (!ctx.ok) return actionError(ACTION_ERRORS.UNAUTHORIZED)
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const rows = await db.scheduleException.findMany({
    where: {
      schoolId: ctx.schoolId,
      exceptionType: { in: ["HOLIDAY", "CANCELLED"] },
      endDate: { gte: since },
    },
    orderBy: { startDate: "asc" },
    select: {
      id: true,
      title: true,
      exceptionType: true,
      startDate: true,
      endDate: true,
    },
    take: 200,
  })
  return {
    success: true,
    data: rows.map((r) => ({
      id: r.id,
      title: r.title,
      type: r.exceptionType === "CANCELLED" ? "CANCELLED" : "HOLIDAY",
      from: schoolDayOfInstant(ctx.tz, r.startDate),
      until: schoolDayOfInstant(ctx.tz, r.endDate),
    })),
  }
}

/**
 * Declare days off. Both ends are stored at NOON school time (the live
 * window's convention), so each covers its whole school-calendar day under
 * the closure check's overlap rule and survives every offset.
 */
export async function createHoliday(
  input: unknown
): Promise<
  { success: true; data: HolidayRow } | { success: false; error: string }
> {
  const ctx = await adminContext()
  if (!ctx.ok) return actionError(ACTION_ERRORS.UNAUTHORIZED)
  const parsed = holidaySchema.safeParse(input)
  if (!parsed.success) return actionError(ACTION_ERRORS.VALIDATION_ERROR)
  const { title, type, from, until } = parsed.data
  const startDate = schoolDayToInstant(ctx.tz, from)
  const endDate = schoolDayToInstant(ctx.tz, until)
  if (!startDate || !endDate) return actionError(ACTION_ERRORS.VALIDATION_ERROR)

  const row = await db.scheduleException.create({
    data: {
      schoolId: ctx.schoolId,
      termId: null,
      exceptionType: type,
      title,
      startDate,
      endDate,
      isAllDay: true,
      affectsAllClasses: true,
    },
    select: { id: true },
  })
  refreshPage("/school/configuration/holidays")
  refreshPage("/timetable")
  return { success: true, data: { id: row.id, title, type, from, until } }
}

export async function deleteHoliday(input: {
  id: string
}): Promise<{ success: true } | { success: false; error: string }> {
  const ctx = await adminContext()
  if (!ctx.ok) return actionError(ACTION_ERRORS.UNAUTHORIZED)
  if (typeof input?.id !== "string" || !input.id) {
    return actionError(ACTION_ERRORS.VALIDATION_ERROR)
  }
  const { count } = await db.scheduleException.deleteMany({
    where: {
      id: input.id,
      schoolId: ctx.schoolId,
      exceptionType: { in: ["HOLIDAY", "CANCELLED"] },
    },
  })
  if (count === 0) return actionError(ACTION_ERRORS.NOT_FOUND)
  refreshPage("/school/configuration/holidays")
  refreshPage("/timetable")
  return { success: true }
}
