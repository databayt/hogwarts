"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { z } from "zod"

import { getTenantContext } from "@/lib/tenant-context"
import { markPeriodAttendance } from "@/components/school-dashboard/attendance/actions/periods"

import { loadAttendanceReview } from "../attendance-review-load"
import { rollUpDailyAttendance } from "./attendance-sync"
import { liveRevalidatePath } from "./helpers"

const overrideSchema = z.object({
  sessionId: z.string().min(1),
  studentId: z.string().min(1),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]),
})

/**
 * Correct one student's mark for this class from the class page.
 *
 * Not a second attendance writer: the period, section and date come from the
 * session (never the client), the visibility rule is the review's own (host
 * or admin), and the write is the attendance block's `markPeriodAttendance`
 * with its role, own-section and roster checks. The day row is then re-rolled
 * so the guardian summary follows the correction.
 */
export async function overrideLiveAttendance(
  input: z.infer<typeof overrideSchema>
): Promise<{ success: true } | { success: false; error: string }> {
  const parsed = overrideSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: "Invalid input" }

  const [session, tenant] = await Promise.all([auth(), getTenantContext()])
  const review = await loadAttendanceReview(parsed.data.sessionId, {
    userId: session?.user?.id,
    role: tenant.role,
    schoolId: tenant.schoolId,
  })
  if (!review || !review.canEdit || !review.periodId || !tenant.schoolId) {
    return { success: false, error: "Not allowed" }
  }
  if (!review.rows.some((r) => r.studentId === parsed.data.studentId)) {
    return { success: false, error: "Student not in this class" }
  }

  const res = await markPeriodAttendance({
    sectionId: review.sectionId,
    date: review.date,
    periodId: review.periodId,
    timetableId: review.timetableId ?? undefined,
    records: [{ studentId: parsed.data.studentId, status: parsed.data.status }],
  })
  if (!res.success) {
    return { success: false, error: res.error ?? "Failed" }
  }

  await rollUpDailyAttendance(
    tenant.schoolId,
    review.sectionId,
    new Date(review.date),
    [parsed.data.studentId]
  )
  revalidatePath(liveRevalidatePath("[id]"), "page")
  return { success: true }
}
