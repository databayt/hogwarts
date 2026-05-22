"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Fee preview (M2-4 — read-only first pass)
//
// Computes the monthly transport fee that each student SHOULD owe based on
// their active route assignments × Route.monthlyFee. Read-only on purpose:
// actual fee record creation lives in the finance block (FeeRecord model
// requires academicYearId, dueDate, etc). This action gives finance the
// canonical input — they can call it and create FeeRecord rows in their
// own provisioning flow.
//
// One-way: transportation owns Route.monthlyFee + RouteAssignment; finance
// reads. Mirrors project_fee_auto_provisioning.md (#264) pattern.
import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"

import { requireContext } from "./helpers"

export interface StudentTransportFee {
  studentId: string
  firstName: string
  lastName: string
  monthlyTotal: number
  routes: Array<{
    routeId: string
    routeName: string
    monthlyFee: number | null
  }>
}

export interface FeePreviewResult {
  totalActiveAssignments: number
  studentsWithFees: number
  studentsWithoutFee: number
  totalMonthlyRevenue: number
  fees: StudentTransportFee[]
}

/**
 * Compute the transport fee each student should owe this month based on
 * their active route assignments. Read-only — does not write to DB.
 */
export async function previewTransportFees(): Promise<
  ReturnType<typeof actionError> | { success: true; data: FeePreviewResult }
> {
  const ctx = await requireContext("view_fees")
  if (!ctx.ok) return ctx.response
  const { schoolId } = ctx

  try {
    const activeAssignments = await db.routeAssignment.findMany({
      where: { schoolId, status: "ACTIVE", deletedAt: null },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true },
        },
        route: {
          select: { id: true, name: true, monthlyFee: true },
        },
      },
    })

    const byStudent = new Map<string, StudentTransportFee>()

    for (const a of activeAssignments) {
      if (!a.student || !a.route) continue
      const fee = a.route.monthlyFee
      const feeAmount = fee === null || fee === undefined ? 0 : Number(fee)

      const existing = byStudent.get(a.studentId)
      if (existing) {
        existing.monthlyTotal += feeAmount
        existing.routes.push({
          routeId: a.route.id,
          routeName: a.route.name,
          monthlyFee: fee === null || fee === undefined ? null : Number(fee),
        })
      } else {
        byStudent.set(a.studentId, {
          studentId: a.studentId,
          firstName: a.student.firstName,
          lastName: a.student.lastName,
          monthlyTotal: feeAmount,
          routes: [
            {
              routeId: a.route.id,
              routeName: a.route.name,
              monthlyFee:
                fee === null || fee === undefined ? null : Number(fee),
            },
          ],
        })
      }
    }

    const fees = Array.from(byStudent.values()).sort((a, b) =>
      a.lastName.localeCompare(b.lastName)
    )
    const totalMonthlyRevenue = fees.reduce((sum, f) => sum + f.monthlyTotal, 0)
    // Distinct students who owe nothing this month (no fee-bearing route).
    const studentsWithoutFee = fees.filter((f) => f.monthlyTotal === 0).length

    return {
      success: true as const,
      data: {
        totalActiveAssignments: activeAssignments.length,
        studentsWithFees: fees.length,
        studentsWithoutFee,
        totalMonthlyRevenue,
        fees,
      },
    }
  } catch {
    return actionError(ACTION_ERRORS.LOAD_FAILED)
  }
}
