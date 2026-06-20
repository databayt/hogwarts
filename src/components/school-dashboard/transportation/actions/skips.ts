"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Admin review of guardian "skip pickup" requests (AbsenceIntention, reason =
// TRANSPORTATION). Only APPROVED skips drop a student from the nightly run, so
// approval is the safety gate. Gated by manage_assignment (ADMIN/STAFF).
import { revalidatePath } from "next/cache"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"
import {
  reviewTransportSkipSchema,
  type ReviewTransportSkipInput,
} from "@/components/school-dashboard/transportation/validation"

import { requireContext, transportationRevalidatePath } from "./helpers"

export interface PendingTransportSkip {
  id: string
  studentId: string
  studentFirstName: string
  studentLastName: string
  dateFrom: string
  dateTo: string
  description: string | null
}

/** Pending transport skips whose window hasn't fully passed. */
export async function listPendingTransportSkips() {
  const ctx = await requireContext("manage_assignment")
  if (!ctx.ok) return ctx.response
  const { schoolId } = ctx
  try {
    const now = new Date()
    const day = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    )
    const skips = await db.absenceIntention.findMany({
      where: {
        schoolId,
        reason: "TRANSPORTATION",
        status: "PENDING",
        dateTo: { gte: day },
      },
      orderBy: { dateFrom: "asc" },
      select: {
        id: true,
        studentId: true,
        dateFrom: true,
        dateTo: true,
        description: true,
        student: { select: { firstName: true, lastName: true } },
      },
    })
    return {
      success: true as const,
      data: skips.map((s) => ({
        id: s.id,
        studentId: s.studentId,
        studentFirstName: s.student.firstName,
        studentLastName: s.student.lastName,
        dateFrom: s.dateFrom.toISOString(),
        dateTo: s.dateTo.toISOString(),
        description: s.description,
      })),
    }
  } catch {
    return actionError(ACTION_ERRORS.LOAD_FAILED)
  }
}

export async function reviewTransportSkip(input: ReviewTransportSkipInput) {
  const ctx = await requireContext("manage_assignment")
  if (!ctx.ok) return ctx.response
  const { schoolId, userId } = ctx

  const parsed = reviewTransportSkipSchema.safeParse(input)
  if (!parsed.success) {
    return actionError(ACTION_ERRORS.VALIDATION_ERROR, parsed.error.message)
  }
  const { id, decision } = parsed.data

  try {
    // Tenant-scoped write — schoolId in the predicate, only flips PENDING rows.
    const result = await db.absenceIntention.updateMany({
      where: { id, schoolId, reason: "TRANSPORTATION", status: "PENDING" },
      data: { status: decision, reviewedBy: userId, reviewedAt: new Date() },
    })
    if (result.count === 0) return actionError(ACTION_ERRORS.NOT_FOUND)
    revalidatePath(transportationRevalidatePath("trips"))
    return { success: true as const, data: { id, decision } }
  } catch {
    return actionError(ACTION_ERRORS.UPDATE_FAILED)
  }
}
